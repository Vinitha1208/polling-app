package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Vote struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID    primitive.ObjectID `bson:"poll_id" json:"poll_id"`
	OptionID  string             `bson:"option_id" json:"option_id"`
	VoterID   string             `bson:"voter_id" json:"voter_id"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type VoteInput struct {
	OptionID string `json:"option_id" binding:"required"`
	VoterID  string `json:"voter_id"` // client session identifier or fingerprint
}

type LiveUpdateMessage struct {
	Event      string              `json:"event"` // e.g. "VOTE_UPDATED", "POLL_STATUS_CHANGED"
	PollID     string              `json:"poll_id"`
	Status     PollStatus          `json:"status"`
	TotalVotes int64               `json:"total_votes"`
	Options    []PollResultOption  `json:"options"`
	UpdatedAt  time.Time           `json:"updated_at"`
}
