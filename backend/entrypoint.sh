#!/bin/sh
set -e

cd /app/backend  # important : Flask doit être dans le bon répertoire

echo "⏳ Waiting for Postgres..."
until pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  sleep 2
done

FLAG_FILE="/app/backend/migrations/.migrations_initialized"

# -----------------------------
# Initialisation des migrations
# -----------------------------
if [ ! -f /app/backend/migrations/env.py ]; then
  echo "📦 Migrations not found. Initializing..."
  flask db init
  flask db migrate -m "Initial migration"
  touch "$FLAG_FILE"
  echo "✅ Migrations initialized."
else
  echo "✅ Migrations already exist, skipping initialization."
  echo "Applying migrations..."
  flask db upgrade
  touch "$FLAG_FILE"
fi

# -----------------------------
# Pause pour que Docker healthcheck passe
# -----------------------------
sleep 5

echo "🚀 Migrations initialization complete."

# -----------------------------
# Lancer Gunicorn
# -----------------------------
exec gunicorn wsgi:app \
  --bind 0.0.0.0:5000 \
  --workers 4 \
  --worker-class gthread \
  --threads 4 \
  --timeout 120 \
  --graceful-timeout 30 \
  --access-logfile - \
  --error-logfile -
