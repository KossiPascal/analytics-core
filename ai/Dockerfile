FROM analytics-core-base:latest

# LABEL service="ai"

# ENV PYTHONPATH="/app/ai"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/ai

# Copier uniquement le contenu du ai (pas le dossier parent)
COPY ai/ . 


EXPOSE 5001

# CMD pour Gunicorn
CMD ["gunicorn","wsgi:app","--bind", "0.0.0.0:5001","--workers", "2","--worker-class", "gthread","--threads", "8","--timeout", "300","--access-logfile", "-", "--error-logfile", "-"]
