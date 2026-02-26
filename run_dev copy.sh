#!/usr/bin/env bash
set -e

echo "🚀 Starting analytics platform (dev mode)"

PIDS=()

cleanup() {
  echo "🛑 Stopping all services..."
  for pid in "${PIDS[@]}"; do
    kill -TERM "$pid" 2>/dev/null || true
  done
  wait
  echo "👋 All services stopped"
}

trap cleanup SIGINT SIGTERM

# ============================
# Init Database FIRST
# ============================
echo "📦 Initializing database..."

python - <<END
from backend.wsgi import app
from backend.src.server import init_database
init_database(app)
END

# ============================
# Backend (Flask / Gunicorn)
# ============================
echo "🌐 Starting Flask API..."
gunicorn -w 2 -b 127.0.0.1:8000 backend.wsgi:app &

PIDS+=($!)

# ============================
# Workers
# ============================
echo "🔄 Starting CouchDB workers..."
# python -m workers.wsgi &
python -m workers.couchdb.sync_worker &
# python -m workers.couchdb.metrics_worker &
# python -m workers.couchdb.cleanup_worker &
PIDS+=($!)

# ============================
# Wait
# ============================
wait
