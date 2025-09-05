#!/bin/bash

# Odin Firmware Intelligence Server Startup Script

echo "🚀 Starting Odin Firmware Intelligence Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running the server!"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /tmp/odin/uploads
mkdir -p /tmp/odin/work

# Start services
echo "🗄️  Starting database and Redis with Docker Compose..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations (if using Alembic)
echo "🔄 Running database migrations..."
# alembic upgrade head

# Start FastAPI server
echo "🌐 Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
