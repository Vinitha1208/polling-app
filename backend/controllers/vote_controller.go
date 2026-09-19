package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/live-polling/backend/models"
	"github.com/live-polling/backend/services"
)

type VoteController struct {
	voteService *services.VoteService
}

func NewVoteController(voteService *services.VoteService) *VoteController {
	return &VoteController{voteService: voteService}
}

func (ctrl *VoteController) CastVote(c *gin.Context) {
	pollID := c.Param("id")

	var input models.VoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vote data: " + err.Error()})
		return
	}

	// Voter ID can also come from header X-Voter-ID
	if input.VoterID == "" {
		input.VoterID = c.GetHeader("X-Voter-ID")
	}

	clientIP := c.ClientIP()
	userAgent := c.Request.UserAgent()

	results, err := ctrl.voteService.CastVote(c.Request.Context(), pollID, input, clientIP, userAgent)
	if err != nil {
		if err == services.ErrAlreadyVoted {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "already_voted": true})
			return
		}
		if err == services.ErrPollNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrPollClosed || err == services.ErrPollExpired {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "is_closed": true})
			return
		}
		if err == services.ErrInvalidOption {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vote cast successfully",
		"results": results,
	})
}
