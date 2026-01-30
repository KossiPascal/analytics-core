#!/bin/bash
set -e

# Chemin source
SOURCE_DIR="${1:-/path/to/certs}"
# Chemin destination
DEST_DIR="${2:-../configs/nginx/certs/default}"

mkdir -p "$DEST_DIR"

cp "$SOURCE_DIR/fullchain.pem" "$DEST_DIR/fullchain.pem"
cp "$SOURCE_DIR/privkey.pem" "$DEST_DIR/privkey.pem"

echo "✅ Certificat copié dans $DEST_DIR"
