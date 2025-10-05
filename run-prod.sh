#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to kill all background processes on exit
cleanup() {
    echo "Shutting down..."
    kill $(jobs -p) 2>/dev/null || true
    exit
}

# Trap script exit and call cleanup
trap cleanup EXIT INT TERM

# Install all dependencies for the monorepo
echo "Installing dependencies..."
pnpm install

# Build both frontend and backend
echo "Building backend..."
(cd packages/backend && pnpm build)

echo "Building frontend..."
(cd packages/frontend && pnpm build)

# Start backend
echo "Starting backend..."
(cd packages/backend && pnpm start) &

# Serve frontend (using a simple HTTP server)
echo "Serving frontend..."
npx serve -s packages/frontend/dist -l 8080 &

echo "Application is running!"
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:3001"

# Wait for all background processes to finish
wait