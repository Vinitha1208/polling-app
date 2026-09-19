package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollStatus string

const (
	PollStatusActive PollStatus = "active"
	PollStatusClosed PollStatus = "closed"
)

type PollOption struct {
	ID   string `bson:"id" json:"id"`
	Text string `bson:"text" json:"text" binding:"required"`
}

type Poll struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ShareCode string             `bson:"share_code" json:"share_code"`
	Question  string             `bson:"question" json:"question" binding:"required"`
	Options   []PollOption       `bson:"options" json:"options" binding:"required,min=2,max=10"`
	CreatorID primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Status    PollStatus         `bson:"status" json:"status"`
	ExpiresAt *time.Time         `bson:"expires_at,omitempty" json:"expires_at,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type CreatePollInput struct {
	Question       string   `json:"question" binding:"required,min=5,max=300"`
	Options        []string `json:"options" binding:"required,min=2,max=10"`
	ExpirationType string   `json:"expiration_type"` // "1h", "24h", "7d", "never"
}

type PollResultOption struct {
	ID         string  `json:"id"`
	Text       string  `json:"text"`
	Votes      int64   `json:"votes"`
	Percentage float64 `json:"percentage"`
}

type PollResultsResponse struct {
	PollID     string             `json:"poll_id"`
	ShareCode  string             `json:"share_code"`
	Question   string             `json:"question"`
	Status     PollStatus         `json:"status"`
	ExpiresAt  *time.Time         `json:"expires_at,omitempty"`
	IsExpired  bool               `json:"is_expired"`
	TotalVotes int64              `json:"total_votes"`
	Options    []PollResultOption `json:"options"`
}
