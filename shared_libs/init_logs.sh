#!/bin/sh
# init_logs.sh
# Usage: ./init_logs.sh <folder> <command...>
set -e

LOG_FOLDER=$1
shift

# Create log folder inside container
mkdir -p /logs/$LOG_FOLDER
chmod -R 777 /logs/$LOG_FOLDER

echo "✅ Log folder /logs/$LOG_FOLDER ready"

# Run the command (python app, worker, ai, etc.)
exec "$@"
