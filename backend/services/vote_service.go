package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/live-polling/backend/models"
	"github.com/live-polling/backend/repository"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrAlreadyVoted  = errors.New("you have already voted in this poll")
	ErrInvalidOption = errors.New("invalid option selected for this poll")
)

type VoteService struct {
	pollRepo    *repository.PollRepository
	voteRepo    *repository.VoteRepository
	pollService *PollService
	redis       *redis.Client
}

func NewVoteService(
	pollRepo *repository.PollRepository,
	voteRepo *repository.VoteRepository,
	pollService *PollService,
	rdb *redis.Client,
) *VoteService {
	return &VoteService{
		pollRepo:    pollRepo,
		voteRepo:    voteRepo,
		pollService: pollService,
		redis:       rdb,
	}
}

func (s *VoteService) CastVote(ctx context.Context, pollIDStr string, input models.VoteInput, clientIP, userAgent string) (*models.PollResultsResponse, error) {
	objID, err := primitive.ObjectIDFromHex(pollIDStr)
	if err != nil {
		return nil, ErrPollNotFound
	}

	poll, err := s.pollRepo.FindByID(ctx, objID)
	if err != nil {
		return nil, ErrPollNotFound
	}

	// 1. Check if poll is active
	s.pollService.checkAndAutoClose(ctx, poll)
	if poll.Status == models.PollStatusClosed {
		return nil, ErrPollClosed
	}

	// 2. Validate option belongs to poll
	var validOption bool
	for _, opt := range poll.Options {
		if opt.ID == input.OptionID {
			validOption = true
			break
		}
	}
	if !validOption {
		return nil, ErrInvalidOption
	}

	// 3. Voter Identifier generation
	voterID := input.VoterID
	if voterID == "" {
		// Fallback to fingerprint of IP + UserAgent
		voterID = fmt.Sprintf("%s|%s", clientIP, userAgent)
	}

	// 4. Redis Set Deduplication check
	votersKey := fmt.Sprintf("poll:%s:voters", pollIDStr)
	added, err := s.redis.SAdd(ctx, votersKey, voterID).Result()
	if err != nil {
		log.Printf("Redis SAdd warning: %v, falling back to Mongo check", err)
	} else if added == 0 {
		// Voter was already present in Redis set!
		return nil, ErrAlreadyVoted
	}

	// Check MongoDB for double-safety
	hasVoted, err := s.voteRepo.HasVoted(ctx, objID, voterID)
	if err == nil && hasVoted {
		return nil, ErrAlreadyVoted
	}

	// 5. Store Persistent Vote in MongoDB
	vote := &models.Vote{
		PollID:   objID,
		OptionID: input.OptionID,
		VoterID:  voterID,
	}
	if err := s.voteRepo.Create(ctx, vote); err != nil {
		// If MongoDB unique index catches duplicate
		return nil, ErrAlreadyVoted
	}

	// 6. Redis Hash Counter Update (O(1) atomic increment)
	votesKey := fmt.Sprintf("poll:%s:votes", pollIDStr)
	_, err = s.redis.HIncrBy(ctx, votesKey, input.OptionID, 1).Result()
	if err != nil {
		log.Printf("Redis HIncrBy error: %v", err)
	}

	// 7. Get fresh results
	results, err := s.pollService.GetPollResults(ctx, pollIDStr)
	if err != nil {
		return nil, err
	}

	// 8. Publish real-time event via Redis Pub/Sub
	pubSubChannel := fmt.Sprintf("poll:%s:updates", pollIDStr)
	eventMsg := models.LiveUpdateMessage{
		Event:      "VOTE_UPDATED",
		PollID:     pollIDStr,
		Status:     results.Status,
		TotalVotes: results.TotalVotes,
		Options:    results.Options,
		UpdatedAt:  time.Now(),
	}

	eventData, err := json.Marshal(eventMsg)
	if err == nil {
		err = s.redis.Publish(ctx, pubSubChannel, eventData).Err()
		if err != nil {
			log.Printf("Redis Publish error on %s: %v", pubSubChannel, err)
		} else {
			log.Printf("Redis Pub/Sub: Published VOTE_UPDATED on %s (Total: %d votes)", pubSubChannel, results.TotalVotes)
		}
	}

	return results, nil
}
