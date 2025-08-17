#!/bin/bash
#
# A script to restore the PostgreSQL database and thumbnails from a backup file.

# --- WARNING ---
# This script will overwrite the current database with the contents of the backup file.
# Any data added since the backup was created WILL BE LOST.
# --- WARNING ---

# --- Configuration ---

# The name of the Docker containers
DB_CONTAINER_NAME="db"
BACK_CONTAINER_NAME="back"

# The path to your .env file
ENV_FILE="$(dirname "$0")/../db/.env"

# Path to the thumbnails directory inside the Docker container
CONTAINER_THUMBNAILS_DIR="/app/thumbnails"

# --- Script Logic ---

# Check if a backup file was provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/your/full-backup-file.tar.gz"
  exit 1
fi

BACKUP_FILE=$1

# Check if the provided backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found at '$BACKUP_FILE'"
  exit 1
fi

# Source the .env file to load database credentials
if [ -f "$ENV_FILE" ]; then
  export $(cat "$ENV_FILE" | sed 's/#.*//g' | xargs)
else
  echo "Error: .env file not found at ${ENV_FILE}"
  exit 1
fi

# Create a temporary directory for extraction
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: ${TEMP_DIR}"

# Confirmation prompt
read -p "Are you sure you want to restore from '$BACKUP_FILE'? This will overwrite all current data. (y/n) " -n 1 -r
echo # Move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Restore cancelled."
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# --- Extract the backup file ---
echo "Extracting backup file..."
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

if [ $? -ne 0 ]; then
  echo "Error: Failed to extract backup file."
  rm -rf "${TEMP_DIR}"
  exit 1
fi

# Find the database backup file
DB_BACKUP=$(find "${TEMP_DIR}" -name "db-backup-*.sql.gz" -o -name "backup-*.sql.gz" | head -n 1)

if [ -z "${DB_BACKUP}" ]; then
  echo "Error: Could not find database backup file in the archive."
  rm -rf "${TEMP_DIR}"
  exit 1
fi

echo "Found database backup: ${DB_BACKUP}"

# Find the thumbnails backup file
THUMBNAILS_BACKUP=$(find "${TEMP_DIR}" -name "thumbnails-backup-*.tar.gz" | head -n 1)

# --- Restore Database ---
echo "Starting database restore from '${DB_BACKUP}'..."

# Decompress the backup and pipe it to psql inside the container
gunzip < "${DB_BACKUP}" | docker exec -i "${DB_CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

# Check if the restore command was successful
if [ ${PIPESTATUS[1]} -ne 0 ]; then
  echo "Error: Database restore failed."
  rm -rf "${TEMP_DIR}"
  exit 1
fi

echo "Database restore completed successfully."

# --- Restore Thumbnails ---
if [ -n "${THUMBNAILS_BACKUP}" ]; then
  echo "Found thumbnails backup: ${THUMBNAILS_BACKUP}"
  echo "Restoring thumbnails..."
  
  # Check if the back container is running
  if docker ps | grep -q ${BACK_CONTAINER_NAME}; then
    # Create a temporary directory for extraction
    THUMBNAILS_TEMP_DIR=$(mktemp -d)
    
    # Extract thumbnails to the temporary directory
    tar -xzf "${THUMBNAILS_BACKUP}" -C "${THUMBNAILS_TEMP_DIR}"
    
    if [ $? -ne 0 ]; then
      echo "Warning: Failed to extract thumbnails backup."
      rm -rf "${THUMBNAILS_TEMP_DIR}"
    else
      # Copy thumbnails to the Docker container
      echo "Copying thumbnails to Docker container..."
      docker cp "${THUMBNAILS_TEMP_DIR}/thumbnails" ${BACK_CONTAINER_NAME}:${CONTAINER_THUMBNAILS_DIR%/*}/
      
      if [ $? -ne 0 ]; then
        echo "Warning: Failed to copy thumbnails to container. They will be regenerated as needed."
      else
        echo "Thumbnails restore completed successfully."
      fi
      
      # Clean up temporary directory
      rm -rf "${THUMBNAILS_TEMP_DIR}"
    fi
  else
    echo "Warning: Back container (${BACK_CONTAINER_NAME}) is not running. Cannot restore thumbnails."
    echo "Start the container and run this script again to restore thumbnails."
  fi
else
  echo "No thumbnails backup found. Thumbnails will be regenerated as needed."
fi

# Clean up
echo "Cleaning up temporary files..."
rm -rf "${TEMP_DIR}"

echo "Restore process completed."

exit 0
