package queue

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeAnalyzeFirmware = "analyze:firmware"
)

// Client wraps asynq.Client for job queuing
type Client struct {
	client *asynq.Client
}

// NewClient creates a new queue client
func NewClient(redisURL string) (*Client, error) {
	client := asynq.NewClient(asynq.RedisClientOpt{Addr: redisURL})
	return &Client{client: client}, nil
}

// Close closes the queue client
func (c *Client) Close() error {
	return c.client.Close()
}

// AnalyzeFirmwarePayload represents the payload for firmware analysis task
type AnalyzeFirmwarePayload struct {
	JobID     string `json:"job_id"`
	ProjectID string `json:"project_id"`
	FilePath  string `json:"file_path"`
	Filename  string `json:"filename"`
}

// EnqueueAnalyzeFirmware queues a firmware analysis task
func (c *Client) EnqueueAnalyzeFirmware(payload AnalyzeFirmwarePayload) (*asynq.TaskInfo, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	task := asynq.NewTask(TypeAnalyzeFirmware, data)
	
	// Enqueue with options
	info, err := c.client.Enqueue(task, 
		asynq.Queue("default"),
		asynq.MaxRetry(3),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to enqueue task: %w", err)
	}

	return info, nil
}
