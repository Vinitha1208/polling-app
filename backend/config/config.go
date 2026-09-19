package config

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	Port        string
	MongoURI    string
	DBName      string
	RedisURL    string
	JWTSecret   string
	FrontendURL string
}

type AppEnv struct {
	Config *Config
	DB     *mongo.Database
	Redis  *redis.Client
}

func LoadConfig() *Config {
	_ = godotenv.Load() // Load from .env if present

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://127.0.0.1:27017"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "livepolling"
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "127.0.0.1:6379"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super-secret-jwt-key-for-live-polling-dev"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	return &Config{
		Port:        port,
		MongoURI:    mongoURI,
		DBName:      dbName,
		RedisURL:    redisURL,
		JWTSecret:   jwtSecret,
		FrontendURL: frontendURL,
	}
}

func InitMongo(cfg *Config) *mongo.Database {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(cfg.MongoURI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("MongoDB ping failed: %v", err)
	}

	log.Printf("Connected to MongoDB at %s (Database: %s)", cfg.MongoURI, cfg.DBName)
	return client.Database(cfg.DBName)
}

func InitRedis(cfg *Config) *redis.Client {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisURL,
		Password: "", // no password by default
		DB:       0,  // default DB
	})

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis at %s: %v", cfg.RedisURL, err)
	}

	log.Printf("Connected to Redis at %s", cfg.RedisURL)
	return rdb
}
