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

type PollRepository struct {
	collection *mongo.Collection
}

func NewPollRepository(db *mongo.Database) *PollRepository {
	repo := &PollRepository{
		collection: db.Collection("polls"),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Unique index on share_code
	indexShareCode := mongo.IndexModel{
		Keys:    bson.D{{Key: "share_code", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	_, _ = repo.collection.Indexes().CreateOne(ctx, indexShareCode)

	// Index on creator_id
	indexCreator := mongo.IndexModel{
		Keys: bson.D{{Key: "creator_id", Value: 1}},
	}
	_, _ = repo.collection.Indexes().CreateOne(ctx, indexCreator)

	return repo
}

func (r *PollRepository) Create(ctx context.Context, poll *models.Poll) error {
	poll.CreatedAt = time.Now()
	result, err := r.collection.InsertOne(ctx, poll)
	if err != nil {
		return err
	}
	poll.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *PollRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Poll, error) {
	var poll models.Poll
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&poll)
	if err != nil {
		return nil, err
	}
	return &poll, nil
}

func (r *PollRepository) FindByShareCode(ctx context.Context, shareCode string) (*models.Poll, error) {
	var poll models.Poll
	err := r.collection.FindOne(ctx, bson.M{"share_code": shareCode}).Decode(&poll)
	if err != nil {
		return nil, err
	}
	return &poll, nil
}

func (r *PollRepository) FindByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]models.Poll, error) {
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{"creator_id": creatorID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err := cursor.All(ctx, &polls); err != nil {
		return nil, err
	}
	return polls, nil
}

func (r *PollRepository) UpdateStatus(ctx context.Context, id primitive.ObjectID, status models.PollStatus) error {
	filter := bson.M{"_id": id}
	update := bson.M{"$set": bson.M{"status": status}}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *PollRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
