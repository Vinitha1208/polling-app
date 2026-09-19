package main

import (
	"log"

	"github.com/live-polling/backend/config"
	"github.com/live-polling/backend/controllers"
	"github.com/live-polling/backend/repository"
	"github.com/live-polling/backend/routes"
	"github.com/live-polling/backend/services"
	"github.com/live-polling/backend/websocket"
)

func main() {
	log.Println("Starting Live Polling API Server...")

	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Initialize Database & Redis
	db := config.InitMongo(cfg)
	rdb := config.InitRedis(cfg)

	// 3. Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	pollRepo := repository.NewPollRepository(db)
	voteRepo := repository.NewVoteRepository(db)

	// 4. Initialize WebSocket Hub
	hub := websocket.NewHub(rdb)
	go hub.Run()
	log.Println("WebSocket Hub initialized and running.")

	// 5. Initialize Services
	authService := services.NewAuthService(userRepo, cfg)
	pollService := services.NewPollService(pollRepo, voteRepo, rdb)
	voteService := services.NewVoteService(pollRepo, voteRepo, pollService, rdb)

	// 6. Initialize Controllers
	authCtrl := controllers.NewAuthController(authService)
	pollCtrl := controllers.NewPollController(pollService)
	voteCtrl := controllers.NewVoteController(voteService)
	wsCtrl := controllers.NewWSController(hub, pollService)

	// 7. Setup Router
	r := routes.SetupRouter(&routes.RouterDependencies{
		AuthCtrl: authCtrl,
		PollCtrl: pollCtrl,
		VoteCtrl: voteCtrl,
		WSCtrl:   wsCtrl,
		AuthSvc:  authService,
		DB:       db,
		Redis:    rdb,
	})

	// 8. Start HTTP Server
	log.Printf("Server listening on port :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}
