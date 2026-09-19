package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/live-polling/backend/models"
	"github.com/redis/go-redis/v9"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 1024
)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev/prod flexibility
	},
}

type Client struct {
	Hub    *Hub
	Conn   *websocket.Conn
	PollID string
	Send   chan []byte
}

type Hub struct {
	// Rooms maps pollID -> set of Clients
	rooms      map[string]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan *models.LiveUpdateMessage
	redis      *redis.Client
	mu         sync.RWMutex
}

func NewHub(rdb *redis.Client) *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *models.LiveUpdateMessage),
		redis:      rdb,
	}
}

func (h *Hub) Run() {
	// Start background Redis Pub/Sub subscriber
	go h.listenToRedisPubSub()

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.rooms[client.PollID]; !ok {
				h.rooms[client.PollID] = make(map[*Client]bool)
			}
			h.rooms[client.PollID][client] = true
			totalInRoom := len(h.rooms[client.PollID])
			h.mu.Unlock()
			log.Printf("WS: Client connected to poll %s (Active viewers: %d)", client.PollID, totalInRoom)

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.rooms[client.PollID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.rooms, client.PollID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("WS: Client disconnected from poll %s", client.PollID)

		case update := <-h.broadcast:
			h.broadcastToRoom(update)
		}
	}
}

func (h *Hub) broadcastToRoom(update *models.LiveUpdateMessage) {
	data, err := json.Marshal(update)
	if err != nil {
		log.Printf("WS: Error marshaling update: %v", err)
		return
	}

	h.mu.RLock()
	clients, ok := h.rooms[update.PollID]
	if !ok || len(clients) == 0 {
		h.mu.RUnlock()
		return
	}

	for client := range clients {
		select {
		case client.Send <- data:
		default:
			// Buffer full, close connection
			close(client.Send)
			delete(clients, client)
		}
	}
	h.mu.RUnlock()
}

func (h *Hub) listenToRedisPubSub() {
	pubsub := h.redis.PSubscribe(context.Background(), "poll:*:updates")
	defer pubsub.Close()

	ch := pubsub.Channel()
	log.Printf("Hub: Subscribed to Redis Pub/Sub pattern: poll:*:updates")

	for msg := range ch {
		// msg.Channel is "poll:<poll_id>:updates"
		var update models.LiveUpdateMessage
		err := json.Unmarshal([]byte(msg.Payload), &update)
		if err != nil {
			log.Printf("Hub: Failed to parse Redis Pub/Sub message from channel %s: %v", msg.Channel, err)
			continue
		}

		if update.PollID == "" {
			// Extract from channel name if not in payload
			parts := strings.Split(msg.Channel, ":")
			if len(parts) >= 2 {
				update.PollID = parts[1]
			}
		}

		// Broadcast to connected WebSocket clients in this poll room
		h.broadcast <- &update
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WS Read Error: %v", err)
			}
			break
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			// Add any queued messages to the current frame
			n := len(c.Send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte{'\n'})
				_, _ = w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *Hub) RegisterClient(client *Client) {
	h.register <- client
}
