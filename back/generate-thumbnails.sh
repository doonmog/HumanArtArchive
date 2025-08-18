#!/bin/bash

#Run with: docker exec -it back node utils/generate-all-thumbnails.js
# Script to generate all thumbnails for the Human Art Archive
# This wrapper makes it easy to run the thumbnail generation script

# Check if Docker is running and containers are up
if ! docker ps &>/dev/null; then
  echo "Error: Docker is not running or you don't have permission to use it."
  exit 1
fi

# Check if the back container is running
if ! docker ps | grep -q "back"; then
  echo "Error: The 'back' container is not running."
  echo "Please start the containers first with: docker compose -f docker-compose.prod.yml up -d"
  exit 1
fi

# Check if we're running in Docker or locally
if [ -f "/.dockerenv" ]; then
  echo "Running inside Docker container"
  # We're inside a Docker container, run directly
  node utils/generate-all-thumbnails.js
else
  echo "Running on host machine, executing inside Docker container..."
  # We're on the host, run inside the Docker container
  docker exec -it back node utils/generate-all-thumbnails.js
  
  # Check exit status
  if [ $? -ne 0 ]; then
    echo "\nError: Thumbnail generation failed."
    echo "Make sure the database container is running and accessible from the back container."
  fi
fi
