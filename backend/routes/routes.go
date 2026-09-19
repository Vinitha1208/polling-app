package routes

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/live-polling/backend/controllers"
	"github.com/live-polling/backend/middleware"
	"github.com/live-polling/backend/services"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
)

type RouterDependencies struct {
	AuthCtrl *controllers.AuthController
	PollCtrl *controllers.PollController
	VoteCtrl *controllers.VoteController
	WSCtrl   *controllers.WSController
	AuthSvc  *services.AuthService
	DB       *mongo.Database
	Redis    *redis.Client
}

func SetupRouter(deps *RouterDependencies) *gin.Engine {
	r := gin.Default()

	// Global middleware
	r.Use(middleware.CORSMiddleware())

	// Root confirmation endpoint
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service":      "PollPulse Live Polling Backend API",
			"status":       "running",
			"health_check": "/api/health",
			"frontend_url": "http://localhost:5173",
			"message":      "Backend is active and connected to Redis and MongoDB!",
		})
	})

	// Health check with active Redis and MongoDB ping
	r.GET("/api/health", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		redisStatus := "connected"
		var redisLatencyMs float64
		if deps.Redis != nil {
			start := time.Now()
			if err := deps.Redis.Ping(ctx).Err(); err != nil {
				redisStatus = "error: " + err.Error()
			} else {
				redisLatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
			}
		} else {
			redisStatus = "not configured"
		}

		mongoStatus := "connected"
		var mongoLatencyMs float64
		if deps.DB != nil {
			start := time.Now()
			if err := deps.DB.Client().Ping(ctx, nil); err != nil {
				mongoStatus = "error: " + err.Error()
			} else {
				mongoLatencyMs = float64(time.Since(start).Microseconds()) / 1000.0
			}
		} else {
			mongoStatus = "not configured"
		}

		isHealthy := redisStatus == "connected" && mongoStatus == "connected"
		statusText := "healthy"
		if !isHealthy {
			statusText = "degraded"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  statusText,
			"service": "live-polling-api",
			"redis": gin.H{
				"status":     redisStatus,
				"latency_ms": redisLatencyMs,
			},
			"mongodb": gin.H{
				"status":     mongoStatus,
				"latency_ms": mongoLatencyMs,
			},
		})
	})

	api := r.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/signup", deps.AuthCtrl.Signup)
			auth.POST("/login", deps.AuthCtrl.Login)

			// Protected auth
			auth.GET("/me", middleware.AuthMiddleware(deps.AuthSvc), deps.AuthCtrl.GetMe)
		}

		// Polls routes
		polls := api.Group("/polls")
		{
			// Public poll endpoints
			polls.GET("/:id", deps.PollCtrl.GetPollByID)
			polls.GET("/share/:shareCode", deps.PollCtrl.GetPollByShareCode)
			polls.GET("/:id/results", deps.PollCtrl.GetPollResults)

			// Voting endpoint
			polls.POST("/:id/vote", deps.VoteCtrl.CastVote)

			// Live WebSocket endpoint
			polls.GET("/:id/live", deps.WSCtrl.HandleLivePoll)

			// Protected poll management routes
			protected := polls.Group("")
			protected.Use(middleware.AuthMiddleware(deps.AuthSvc))
			{
				protected.POST("", deps.PollCtrl.CreatePoll)
				protected.GET("/my", deps.PollCtrl.GetMyPolls)
				protected.POST("/:id/close", deps.PollCtrl.ClosePoll)
				protected.DELETE("/:id", deps.PollCtrl.DeletePoll)
			}
		}
	}

	return r
}
