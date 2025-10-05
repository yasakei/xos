#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to kill all background processes on exit
cleanup() {
    echo "Shutting down..."
    # Kill all jobs in the current session
    jobs -p | xargs -r kill 2>/dev/null || true
    exit
}

# Trap script exit and call cleanup
trap cleanup EXIT INT TERM

# Install all dependencies for the monorepo
echo "Installing dependencies..."
pnpm install

# Start backend
echo "Starting backend (integrated server)..."
(cd packages/backend && pnpm dev) &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
(cd packages/frontend && pnpm dev) &
FRONTEND_PID=$!

echo "Services started:"
echo "  Frontend PID: $FRONTEND_PID (Port: 5173)"
echo "  Backend PID: $BACKEND_PID (Port: 3001)"
echo "Use Ctrl+C to stop all services"

# Wait for all background processes to finish
wait
