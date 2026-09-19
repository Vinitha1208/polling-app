package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/live-polling/backend/controllers"
	"github.com/live-polling/backend/middleware"
	"github.com/live-polling/backend/services"
)

type RouterDependencies struct {
	AuthCtrl *controllers.AuthController
	PollCtrl *controllers.PollController
	VoteCtrl *controllers.VoteController
	WSCtrl   *controllers.WSController
	AuthSvc  *services.AuthService
}

func SetupRouter(deps *RouterDependencies) *gin.Engine {
	r := gin.Default()

	// Global middleware
	r.Use(middleware.CORSMiddleware())

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "live-polling-api",
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
