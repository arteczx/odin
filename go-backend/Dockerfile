# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the applications
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o worker ./cmd/worker

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests and sudo for EMBA
RUN apk --no-cache add ca-certificates sudo

WORKDIR /root/

# Copy the binaries from builder stage
COPY --from=builder /app/server .
COPY --from=builder /app/worker .

# Create directories for uploads and logs
RUN mkdir -p /tmp/odin/uploads /tmp/odin/work /tmp/emba_logs

# Expose port
EXPOSE 8080

# Default command (can be overridden)
CMD ["./server"]
