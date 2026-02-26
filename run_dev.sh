#!/usr/bin/env bash
set -Eeuo pipefail

APP_HOST="127.0.0.1"
APP_PORT="8000"
GUNICORN_WORKERS=2
PID_FILE=".dev_pids"

echo "🚀 Starting analytics platform (dev mode)"

# ============================
# Cleanup function
# ============================
cleanup() {
  echo ""
  echo "🛑 Stopping all services..."

  if [ -f "$PID_FILE" ]; then
    while read -r pid; do
      if kill -0 "$pid" 2>/dev/null; then
        echo "   ➜ Killing PID $pid"
        kill -TERM "$pid" 2>/dev/null || true
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  echo "👋 All services stopped"
}

trap cleanup SIGINT SIGTERM EXIT

# ============================
# Kill old processes
# ============================
echo "🧹 Cleaning old processes..."

pkill -f "gunicorn.*backend.wsgi:app" 2>/dev/null || true
pkill -f "workers.couchdb.sync_worker" 2>/dev/null || true

sleep 1

# ============================
# Check if port is free
# ============================
if lsof -i :"$APP_PORT" >/dev/null 2>&1; then
  echo "❌ Port $APP_PORT is already in use."
  echo "👉 Run: lsof -i :$APP_PORT"
  exit 1
fi

# ============================
# Init Database FIRST
# ============================
echo "📦 Initializing database..."

python - <<END
from backend.wsgi import app
from backend.src.server import init_database
init_database(app)
END

echo "✅ Database ready"

# ============================
# Start Gunicorn
# ============================
echo "🌐 Starting Flask API on http://$APP_HOST:$APP_PORT"

# gunicorn -w "$GUNICORN_WORKERS" -b "$APP_HOST:$APP_PORT" backend.wsgi:app &

# gunicorn -w "$GUNICORN_WORKERS" -b "$APP_HOST:$APP_PORT" backend.wsgi:app --log-level warning

gunicorn -w "$GUNICORN_WORKERS" -b "$APP_HOST:$APP_PORT" backend.wsgi:app --access-logfile logs/access.log --error-logfile logs/error.log

  


GUNICORN_PID=$!
echo "$GUNICORN_PID" >> "$PID_FILE"

# ============================
# Start Workers
# ============================
echo "🔄 Starting CouchDB workers..."

python -m workers.couchdb.sync_worker &
WORKER_PID=$!
echo "$WORKER_PID" >> "$PID_FILE"

echo ""
echo "🎉 All services started successfully"
echo "📡 API: http://$APP_HOST:$APP_PORT"
echo ""

wait
