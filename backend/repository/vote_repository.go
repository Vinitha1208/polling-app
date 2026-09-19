package repository

import (
	"context"
	"time"

	"github.com/live-polling/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type VoteRepository struct {
	collection *mongo.Collection
}

func NewVoteRepository(db *mongo.Database) *VoteRepository {
	repo := &VoteRepository{
		collection: db.Collection("votes"),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Compound unique index on poll_id and voter_id
	indexModel := mongo.IndexModel{
		Keys: bson.D{
			{Key: "poll_id", Value: 1},
			{Key: "voter_id", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	}
	_, _ = repo.collection.Indexes().CreateOne(ctx, indexModel)

	// Index on poll_id for fast counting/retrieval
	indexPoll := mongo.IndexModel{
		Keys: bson.D{{Key: "poll_id", Value: 1}},
	}
	_, _ = repo.collection.Indexes().CreateOne(ctx, indexPoll)

	return repo
}

func (r *VoteRepository) Create(ctx context.Context, vote *models.Vote) error {
	vote.CreatedAt = time.Now()
	result, err := r.collection.InsertOne(ctx, vote)
	if err != nil {
		return err
	}
	vote.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *VoteRepository) HasVoted(ctx context.Context, pollID primitive.ObjectID, voterID string) (bool, error) {
	count, err := r.collection.CountDocuments(ctx, bson.M{
		"poll_id":  pollID,
		"voter_id": voterID,
	})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *VoteRepository) CountByOption(ctx context.Context, pollID primitive.ObjectID) (map[string]int64, int64, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"poll_id": pollID}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$option_id",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	type OptionCount struct {
		OptionID string `bson:"_id"`
		Count    int64  `bson:"count"`
	}

	var results []OptionCount
	if err := cursor.All(ctx, &results); err != nil {
		return nil, 0, err
	}

	counts := make(map[string]int64)
	var total int64 = 0
	for _, r := range results {
		counts[r.OptionID] = r.Count
		total += r.Count
	}

	return counts, total, nil
}
