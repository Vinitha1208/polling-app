# Stage 1: Build Go binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# Stage 2: Minimal runtime image
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/server /app/server
COPY --from=builder /app/.env.example /app/.env

EXPOSE 8080

CMD ["/app/server"]
