#!/bin/bash
#
# A script to restore the PostgreSQL database from a backup file.

# --- WARNING ---
# This script will overwrite the current database with the contents of the backup file.
# Any data added since the backup was created WILL BE LOST.
# --- WARNING ---

# --- Configuration ---

# The name of the Docker container running PostgreSQL
CONTAINER_NAME="db"

# The path to your .env file
ENV_FILE="$(dirname "$0")/../db/.env"

# --- Script Logic ---

# Check if a backup file was provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/your/backup-file.sql.gz"
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

# Confirmation prompt
read -p "Are you sure you want to restore from '$BACKUP_FILE'? This will overwrite all current data. (y/n) " -n 1 -r
echo # Move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Restore cancelled."
    exit 1
fi

# --- Restore Command ---

echo "Starting database restore from '${BACKUP_FILE}'..."

# Decompress the backup and pipe it to psql inside the container.
# The 'psql' command will execute the SQL script from the backup.
# Decompress the backup and pipe it to psql inside the container.
# Decompress the backup and pipe it to psql inside the container.
# We run this as the POSTGRES_USER from the .env file, which is the
# superuser for this database instance and has the necessary permissions.
gunzip < "$BACKUP_FILE" | docker exec -i "${CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

# Check if the restore command was successful
if [ ${PIPESTATUS[1]} -ne 0 ]; then
  echo "Error: Database restore failed."
  exit 1
fi

echo "Database restore completed successfully."

exit 0
