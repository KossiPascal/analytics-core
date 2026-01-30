#!/bin/bash
set -e

# Chemin où seront stockés les certificats
CERT_DIR="${1:-../configs/nginx/certs/default}"

# Nom du certificat (CN)
COMMON_NAME="${2:-localhost}"

# Durée de validité en jours
DAYS_VALID="${3:-365}"

# Créer le dossier si nécessaire
mkdir -p "$CERT_DIR"

# Génération du certificat self-signed
openssl req -x509 -nodes -days "$DAYS_VALID" \
  -subj "/CN=$COMMON_NAME" \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem"

echo "✅ Certificat généré dans $CERT_DIR"
echo "CN=$COMMON_NAME, valide pour $DAYS_VALID jours"
