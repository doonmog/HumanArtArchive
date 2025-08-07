#!/bin/bash
#Run: chmod +x backup.sh
# A script to create backups of the PostgreSQL database running in Docker.

# --- Configuration ---

# The name of the Docker container running PostgreSQL (from your docker-compose.yml)
CONTAINER_NAME="db"

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

# --- End of Configuration ---

# Create a timestamp in the format YYYY-MM-DD_HH-MM-SS
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Define the full path and filename for the backup
BACKUP_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.sql.gz"

# Ensure the backup directory exists
mkdir -p "${BACKUP_DIR}"

# --- Backup Command ---

echo "Starting database backup for '${POSTGRES_DB}'..."

# Execute pg_dump inside the container and compress the output on the fly.
# The command is executed as the 'postgres' user inside the container,
# which has the necessary permissions.
# Note: This does not require the password because of the default trust
# authentication for local connections within the container.
docker exec -t "${CONTAINER_NAME}" pg_dump --clean --if-exists -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

# Check if the backup command was successful
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "Error: Database backup failed."
  # Optional: remove the failed (and likely empty) backup file
  rm -f "${BACKUP_FILE}"
  exit 1
fi

echo "Backup successful: ${BACKUP_FILE}"

# --- Cleanup Old Backups ---

echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."

# Find and delete files in the backup directory that are older than the retention period.
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Cleanup complete."

exit 0
