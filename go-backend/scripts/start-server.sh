#!/bin/bash

# Start Odin Go Backend Server

set -e

echo "Starting Odin Go Backend Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Using default configuration."
    echo "Copy .env.example to .env and configure as needed."
fi

# Build the server if binary doesn't exist
if [ ! -f ./build/server ]; then
    echo "Building server..."
    make build-server
fi

# Start the server
echo "Starting API server on port 8080..."
./build/server
