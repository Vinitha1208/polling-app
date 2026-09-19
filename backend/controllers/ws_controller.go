package controllers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/live-polling/backend/models"
	"github.com/live-polling/backend/services"
	ws "github.com/live-polling/backend/websocket"
)

type WSController struct {
	hub         *ws.Hub
	pollService *services.PollService
}

func NewWSController(hub *ws.Hub, pollService *services.PollService) *WSController {
	return &WSController{
		hub:         hub,
		pollService: pollService,
	}
}

func (ctrl *WSController) HandleLivePoll(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "poll ID is required"})
		return
	}

	conn, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WS Upgrade Error: %v", err)
		return
	}

	client := &ws.Client{
		Hub:    ctrl.hub,
		Conn:   conn,
		PollID: pollID,
		Send:   make(chan []byte, 256),
	}

	ctrl.hub.RegisterClient(client)

	// Send initial poll state immediately to the newly connected client
	go func() {
		results, err := ctrl.pollService.GetPollResults(c.Request.Context(), pollID)
		if err == nil && results != nil {
			initMsg := models.LiveUpdateMessage{
				Event:      "INITIAL_STATE",
				PollID:     pollID,
				Status:     results.Status,
				TotalVotes: results.TotalVotes,
				Options:    results.Options,
				UpdatedAt:  time.Now(),
			}
			data, err := json.Marshal(initMsg)
			if err == nil {
				client.Send <- data
			}
		}
	}()

	go client.WritePump()
	go client.ReadPump()
}
