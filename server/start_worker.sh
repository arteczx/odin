#!/bin/bash

# Odin Firmware Intelligence Celery Worker Startup Script

echo "🔧 Starting Odin Celery Worker..."

# Activate virtual environment
if [ -d "venv" ]; then
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found! Please create it from .env.example"
    exit 1
fi

# Start Celery worker
echo "⚙️  Starting Celery worker..."
celery -A app.services.celery_app worker --loglevel=info --concurrency=2
