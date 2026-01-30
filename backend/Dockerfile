# ============================
# Base
# ============================
FROM analytics-core-base:latest
# FROM python:3.11.8-slim


# ============================
# Variables d'environnement
# ============================
ENV PYTHONPATH=/app/backend
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=wsgi.py
ENV APP_ENV=production

# ============================
# Répertoire de travail
# ============================
WORKDIR /app/backend

# ============================
# Installer les dépendances
# ============================
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ============================
# Dossiers nécessaires
# ============================
RUN mkdir -p /app/backend/migrations
RUN mkdir -p /app/backend/logs

# ============================
# Créer un utilisateur non-root
# ============================
# USER root
# RUN useradd -u 1000 -m runner || true

# ============================
# Copier le code backend
# ============================
# COPY --chown=runner:runner --chmod=755 backend/ ./
COPY backend/ ./


# Donner les droits à l'utilisateur
# RUN chown -R 1000:1000 /app/backend

# # Passer à l'utilisateur non-root
# USER 1000:1000
# USER runner

# ============================
# Permissions & Entrypoint
# ============================
# RUN chmod +x entrypoint.sh

EXPOSE 5000

# Commande de démarrage
CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--worker-class", "gthread", "--threads", "4", "--timeout", "120", "--graceful-timeout", "30", "--access-logfile", "-", "--error-logfile", "-"]
# ENTRYPOINT ["./entrypoint.sh"]
