#!/bin/bash
#Run: chmod +x backup-with-thumbnails.sh
# A script to create backups of the PostgreSQL database and thumbnails running in Docker.

# --- Configuration ---

# The name of the Docker containers (from your docker-compose.yml)
DB_CONTAINER_NAME="db"
BACK_CONTAINER_NAME="back"

# The path to your .env file, relative to the script's location.
# Since this script is in /db, the .env file is in the same directory.
ENV_FILE="$(dirname "$0")/../db/.env"

# Source the .env file to load database credentials
if [ -f "$ENV_FILE" ]; then
  export $(cat "$ENV_FILE" | sed 's/#.*//g' | xargs)
else
  echo "Error: .env file not found at ${ENV_FILE}"
  exit 1
fi

# The directory on your VPS where you want to store backups.
# Make sure this directory exists! You can create it with: mkdir -p /home/moondog/db_backups
BACKUP_DIR="/home/moondog/db_backups"

# The number of days to keep old backups.
RETENTION_DAYS=7

# Path to the thumbnails directory inside the Docker container
CONTAINER_THUMBNAILS_DIR="/app/thumbnails"

# --- End of Configuration ---

# Create a timestamp in the format YYYY-MM-DD_HH-MM-SS
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Define the full path and filename for the backup
DB_BACKUP_FILE="${BACKUP_DIR}/db-backup-${TIMESTAMP}.sql.gz"
THUMBNAILS_BACKUP_FILE="${BACKUP_DIR}/thumbnails-backup-${TIMESTAMP}.tar.gz"
COMBINED_BACKUP_FILE="${BACKUP_DIR}/full-backup-${TIMESTAMP}.tar.gz"

# Ensure the backup directory exists
mkdir -p "${BACKUP_DIR}"

# --- Database Backup Command ---

echo "Starting database backup for '${POSTGRES_DB}'..."

# Execute pg_dump inside the container and compress the output on the fly.
docker exec -t "${DB_CONTAINER_NAME}" pg_dump --clean --if-exists -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" | gzip > "${DB_BACKUP_FILE}"

# Check if the backup command was successful
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "Error: Database backup failed."
  # Optional: remove the failed (and likely empty) backup file
  rm -f "${DB_BACKUP_FILE}"
  exit 1
fi

echo "Database backup successful: ${DB_BACKUP_FILE}"

# --- Thumbnails Backup Command ---

echo "Starting thumbnails backup..."

# Check if the back container is running
if docker ps | grep -q ${BACK_CONTAINER_NAME}; then
  # Create a temporary directory to store the thumbnails
  TEMP_DIR=$(mktemp -d)
  
  # Check if thumbnails directory exists in the container
  if docker exec ${BACK_CONTAINER_NAME} test -d ${CONTAINER_THUMBNAILS_DIR}; then
    echo "Copying thumbnails from Docker container..."
    
    # Copy thumbnails from container to temporary directory
    docker cp ${BACK_CONTAINER_NAME}:${CONTAINER_THUMBNAILS_DIR} ${TEMP_DIR}/
    
    if [ $? -ne 0 ]; then
      echo "Error: Failed to copy thumbnails from container."
      rm -rf ${TEMP_DIR}
      # Continue with database backup only
    else
      # Create a tar.gz archive of the thumbnails directory
      tar -czf "${THUMBNAILS_BACKUP_FILE}" -C ${TEMP_DIR} "thumbnails"
      
      if [ $? -ne 0 ]; then
        echo "Error: Thumbnails backup failed."
        rm -f "${THUMBNAILS_BACKUP_FILE}"
      else
        echo "Thumbnails backup successful: ${THUMBNAILS_BACKUP_FILE}"
        
        # Create a combined backup file containing both database and thumbnails
        echo "Creating combined backup..."
        tar -czf "${COMBINED_BACKUP_FILE}" -C "${BACKUP_DIR}" "$(basename "${DB_BACKUP_FILE}")" "$(basename "${THUMBNAILS_BACKUP_FILE}")"
        
        if [ $? -ne 0 ]; then
          echo "Error: Combined backup failed."
          rm -f "${COMBINED_BACKUP_FILE}"
        else
          echo "Combined backup successful: ${COMBINED_BACKUP_FILE}"
          # Remove individual backup files as they're now in the combined file
          rm -f "${DB_BACKUP_FILE}" "${THUMBNAILS_BACKUP_FILE}"
        fi
      fi
    fi
    
    # Clean up temporary directory
    rm -rf ${TEMP_DIR}
  else
    echo "Warning: Thumbnails directory not found in container at ${CONTAINER_THUMBNAILS_DIR}."
    echo "This could mean no thumbnails have been generated yet."
    # Rename the DB backup to combined backup for consistency
    mv "${DB_BACKUP_FILE}" "${COMBINED_BACKUP_FILE}"
  fi
else
  echo "Warning: Back container (${BACK_CONTAINER_NAME}) is not running. Skipping thumbnails backup."
  # Rename the DB backup to combined backup for consistency
  mv "${DB_BACKUP_FILE}" "${COMBINED_BACKUP_FILE}"
fi

# --- Cleanup Old Backups ---

echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."

# Find and delete files in the backup directory that are older than the retention period.
find "${BACKUP_DIR}" -type f -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Cleanup complete."

exit 0
