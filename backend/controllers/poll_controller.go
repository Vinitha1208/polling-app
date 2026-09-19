package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/live-polling/backend/models"
	"github.com/live-polling/backend/services"
)

type PollController struct {
	pollService *services.PollService
}

func NewPollController(pollService *services.PollService) *PollController {
	return &PollController{pollService: pollService}
}

func (ctrl *PollController) CreatePoll(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.CreatePollInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	poll, err := ctrl.pollService.CreatePoll(c.Request.Context(), userID.(string), input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, poll)
}

func (ctrl *PollController) GetMyPolls(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	polls, err := ctrl.pollService.GetMyPolls(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"polls": polls})
}

func (ctrl *PollController) GetPollByID(c *gin.Context) {
	id := c.Param("id")
	poll, err := ctrl.pollService.GetPollByID(c.Request.Context(), id)
	if err != nil {
		if err == services.ErrPollNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, poll)
}

func (ctrl *PollController) GetPollByShareCode(c *gin.Context) {
	shareCode := c.Param("shareCode")
	poll, err := ctrl.pollService.GetPollByShareCode(c.Request.Context(), shareCode)
	if err != nil {
		if err == services.ErrPollNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found for share code: " + shareCode})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, poll)
}

func (ctrl *PollController) GetPollResults(c *gin.Context) {
	id := c.Param("id")
	results, err := ctrl.pollService.GetPollResults(c.Request.Context(), id)
	if err != nil {
		if err == services.ErrPollNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

func (ctrl *PollController) ClosePoll(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	err := ctrl.pollService.ClosePoll(c.Request.Context(), id, userID.(string))
	if err != nil {
		if err == services.ErrPollNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrUnauthorizedPoll {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Poll closed successfully"})
}

func (ctrl *PollController) DeletePoll(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	err := ctrl.pollService.DeletePoll(c.Request.Context(), id, userID.(string))
	if err != nil {
		if err == services.ErrPollNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == services.ErrUnauthorizedPoll {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Poll deleted successfully"})
}
