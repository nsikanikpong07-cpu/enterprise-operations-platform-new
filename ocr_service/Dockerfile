FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Tesseract is a system program, not a pip package. The English data is listed
# explicitly because --no-install-recommends can skip it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY verify_cac.py ocr_service.py ./

# The scripts write to ./output and ./service_uploads, so the non-root user must own them.
RUN useradd -m appuser \
    && mkdir -p output service_uploads \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 10000

# Render sets PORT; keep a single uvicorn process because jobs are held in memory.
CMD ["sh", "-c", "uvicorn ocr_service:app --host 0.0.0.0 --port ${PORT:-10000}"]
