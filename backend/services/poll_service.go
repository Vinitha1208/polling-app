package services

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/live-polling/backend/models"
	"github.com/live-polling/backend/repository"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var (
	ErrPollNotFound      = errors.New("poll not found")
	ErrPollExpired       = errors.New("poll has expired")
	ErrPollClosed        = errors.New("poll is closed")
	ErrUnauthorizedPoll  = errors.New("you are not authorized to modify this poll")
	ErrInvalidOptionList = errors.New("options must contain between 2 and 10 distinct, non-empty items")
)

type PollService struct {
	pollRepo *repository.PollRepository
	voteRepo *repository.VoteRepository
	redis    *redis.Client
}

func NewPollService(pollRepo *repository.PollRepository, voteRepo *repository.VoteRepository, rdb *redis.Client) *PollService {
	return &PollService{
		pollRepo: pollRepo,
		voteRepo: voteRepo,
		redis:    rdb,
	}
}

func generateShareCode(length int) (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Exclude confusing chars (I, O, 0, 1)
	code := make([]byte, length)
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		code[i] = charset[num.Int64()]
	}
	return string(code), nil
}

func (s *PollService) CreatePoll(ctx context.Context, creatorIDStr string, input models.CreatePollInput) (*models.Poll, error) {
	creatorID, err := primitive.ObjectIDFromHex(creatorIDStr)
	if err != nil {
		return nil, errors.New("invalid creator id")
	}

	// Validate options
	cleanOptions := make([]models.PollOption, 0)
	seen := make(map[string]bool)
	for i, opt := range input.Options {
		trimmed := strings.TrimSpace(opt)
		if trimmed == "" {
			continue
		}
		lower := strings.ToLower(trimmed)
		if seen[lower] {
			return nil, fmt.Errorf("duplicate option: '%s'", trimmed)
		}
		seen[lower] = true
		cleanOptions = append(cleanOptions, models.PollOption{
			ID:   fmt.Sprintf("opt_%d", i+1),
			Text: trimmed,
		})
	}

	if len(cleanOptions) < 2 || len(cleanOptions) > 10 {
		return nil, ErrInvalidOptionList
	}

	// Calculate expiration
	var expiresAt *time.Time
	now := time.Now()
	switch input.ExpirationType {
	case "1h":
		exp := now.Add(1 * time.Hour)
		expiresAt = &exp
	case "24h", "1d":
		exp := now.Add(24 * time.Hour)
		expiresAt = &exp
	case "7d":
		exp := now.Add(7 * 24 * time.Hour)
		expiresAt = &exp
	default:
		expiresAt = nil // never expires
	}

	// Generate unique share code
	var shareCode string
	for attempt := 0; attempt < 5; attempt++ {
		code, err := generateShareCode(6)
		if err != nil {
			return nil, err
		}
		existing, err := s.pollRepo.FindByShareCode(ctx, code)
		if err == mongo.ErrNoDocuments || existing == nil {
			shareCode = code
			break
		}
	}
	if shareCode == "" {
		return nil, errors.New("could not generate unique share code")
	}

	poll := &models.Poll{
		ShareCode: shareCode,
		Question:  strings.TrimSpace(input.Question),
		Options:   cleanOptions,
		CreatorID: creatorID,
		Status:    models.PollStatusActive,
		ExpiresAt: expiresAt,
	}

	if err := s.pollRepo.Create(ctx, poll); err != nil {
		return nil, err
	}

	// Initialize Redis Hash for fast O(1) vote counters
	redisKey := fmt.Sprintf("poll:%s:votes", poll.ID.Hex())
	pipe := s.redis.Pipeline()
	for _, opt := range poll.Options {
		pipe.HSet(ctx, redisKey, opt.ID, 0)
	}
	_, _ = pipe.Exec(ctx)

	return poll, nil
}

func (s *PollService) GetPollByID(ctx context.Context, idStr string) (*models.Poll, error) {
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return nil, ErrPollNotFound
	}

	poll, err := s.pollRepo.FindByID(ctx, objID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPollNotFound
		}
		return nil, err
	}

	// Check if expired
	s.checkAndAutoClose(ctx, poll)
	return poll, nil
}

func (s *PollService) GetPollByShareCode(ctx context.Context, shareCode string) (*models.Poll, error) {
	poll, err := s.pollRepo.FindByShareCode(ctx, strings.ToUpper(strings.TrimSpace(shareCode)))
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPollNotFound
		}
		return nil, err
	}

	s.checkAndAutoClose(ctx, poll)
	return poll, nil
}

func (s *PollService) GetMyPolls(ctx context.Context, creatorIDStr string) ([]models.PollResultsResponse, error) {
	creatorID, err := primitive.ObjectIDFromHex(creatorIDStr)
	if err != nil {
		return nil, errors.New("invalid creator id")
	}

	polls, err := s.pollRepo.FindByCreatorID(ctx, creatorID)
	if err != nil {
		return nil, err
	}

	results := make([]models.PollResultsResponse, 0, len(polls))
	for _, poll := range polls {
		s.checkAndAutoClose(ctx, &poll)
		res, err := s.GetPollResults(ctx, poll.ID.Hex())
		if err == nil && res != nil {
			results = append(results, *res)
		}
	}

	return results, nil
}

func (s *PollService) ClosePoll(ctx context.Context, idStr, creatorIDStr string) error {
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return ErrPollNotFound
	}
	creatorID, err := primitive.ObjectIDFromHex(creatorIDStr)
	if err != nil {
		return ErrUnauthorizedPoll
	}

	poll, err := s.pollRepo.FindByID(ctx, objID)
	if err != nil {
		return ErrPollNotFound
	}
	if poll.CreatorID != creatorID {
		return ErrUnauthorizedPoll
	}

	if err := s.pollRepo.UpdateStatus(ctx, objID, models.PollStatusClosed); err != nil {
		return err
	}

	// Broadcast status change via Redis Pub/Sub
	results, err := s.GetPollResults(ctx, idStr)
	if err == nil {
		msg := models.LiveUpdateMessage{
			Event:      "POLL_STATUS_CHANGED",
			PollID:     idStr,
			Status:     models.PollStatusClosed,
			TotalVotes: results.TotalVotes,
			Options:    results.Options,
			UpdatedAt:  time.Now(),
		}
		data, _ := json.Marshal(msg)
		s.redis.Publish(ctx, fmt.Sprintf("poll:%s:updates", idStr), data)
	}

	return nil
}

func (s *PollService) DeletePoll(ctx context.Context, idStr, creatorIDStr string) error {
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return ErrPollNotFound
	}
	creatorID, err := primitive.ObjectIDFromHex(creatorIDStr)
	if err != nil {
		return ErrUnauthorizedPoll
	}

	poll, err := s.pollRepo.FindByID(ctx, objID)
	if err != nil {
		return ErrPollNotFound
	}
	if poll.CreatorID != creatorID {
		return ErrUnauthorizedPoll
	}

	// Clean up Redis keys
	s.redis.Del(ctx, fmt.Sprintf("poll:%s:votes", idStr), fmt.Sprintf("poll:%s:voters", idStr))

	return s.pollRepo.Delete(ctx, objID)
}

func (s *PollService) GetPollResults(ctx context.Context, idStr string) (*models.PollResultsResponse, error) {
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return nil, ErrPollNotFound
	}

	poll, err := s.pollRepo.FindByID(ctx, objID)
	if err != nil {
		return nil, ErrPollNotFound
	}

	s.checkAndAutoClose(ctx, poll)

	// Attempt reading from Redis Hash first for instant live response
	redisKey := fmt.Sprintf("poll:%s:votes", idStr)
	redisCounts, err := s.redis.HGetAll(ctx, redisKey).Result()

	optionVotes := make(map[string]int64)
	var totalVotes int64 = 0

	if err == nil && len(redisCounts) > 0 {
		// Redis has warm counts
		for optID, countStr := range redisCounts {
			var count int64
			fmt.Sscanf(countStr, "%d", &count)
			optionVotes[optID] = count
			totalVotes += count
		}
	} else {
		// Fallback to MongoDB aggregation and populate Redis
		mongoCounts, total, mErr := s.voteRepo.CountByOption(ctx, objID)
		if mErr == nil {
			optionVotes = mongoCounts
			totalVotes = total

			// Populate Redis
			pipe := s.redis.Pipeline()
			for _, opt := range poll.Options {
				cnt := mongoCounts[opt.ID]
				pipe.HSet(ctx, redisKey, opt.ID, cnt)
			}
			_, _ = pipe.Exec(ctx)
		}
	}

	// Build result options
	resultOptions := make([]models.PollResultOption, len(poll.Options))
	for i, opt := range poll.Options {
		votes := optionVotes[opt.ID]
		var pct float64 = 0
		if totalVotes > 0 {
			pct = (float64(votes) / float64(totalVotes)) * 100.0
		}
		resultOptions[i] = models.PollResultOption{
			ID:         opt.ID,
			Text:       opt.Text,
			Votes:      votes,
			Percentage: pct,
		}
	}

	isExpired := poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt)

	return &models.PollResultsResponse{
		PollID:     poll.ID.Hex(),
		ShareCode:  poll.ShareCode,
		Question:   poll.Question,
		Status:     poll.Status,
		ExpiresAt:  poll.ExpiresAt,
		IsExpired:  isExpired,
		TotalVotes: totalVotes,
		Options:    resultOptions,
	}, nil
}

func (s *PollService) checkAndAutoClose(ctx context.Context, poll *models.Poll) {
	if poll.Status == models.PollStatusActive && poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt) {
		poll.Status = models.PollStatusClosed
		_ = s.pollRepo.UpdateStatus(ctx, poll.ID, models.PollStatusClosed)
	}
}
