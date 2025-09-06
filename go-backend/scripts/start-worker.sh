#!/bin/bash

# Start Odin Go Backend Worker

set -e

echo "Starting Odin Go Backend Worker..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Using default configuration."
    echo "Copy .env.example to .env and configure as needed."
fi

# Build the worker if binary doesn't exist
if [ ! -f ./build/worker ]; then
    echo "Building worker..."
    make build-worker
fi

# Start the worker
echo "Starting background worker..."
./build/worker
