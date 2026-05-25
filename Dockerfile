# ALQUIMIA backend — build desde la RAÍZ del repo (Render recomendado).
#   docker build -f Dockerfile .
#
# Render: Root Directory vacío · Dockerfile Path = Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV PYTHONPATH=/app:/app/backend

WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY modules/ /app/modules/
COPY config/ /app/config/
COPY data/ /app/data/

RUN chmod +x scripts/start.sh scripts/migrate_safe.sh

EXPOSE 8000
CMD ["scripts/start.sh"]
