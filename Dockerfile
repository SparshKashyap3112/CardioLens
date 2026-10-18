# =========================================================================
# STAGE 1: Frontend Build (Node.js)
# =========================================================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# =========================================================================
# STAGE 2: Production Container (Python 3.11)
# =========================================================================
FROM python:3.11-slim AS runner

WORKDIR /app

# Install system dependencies needed for audio processing (libsndfile, ffmpeg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements with CPU-optimized PyTorch
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy model artifacts, backend code, and datasets
COPY model.py cardiolens_model.pth cardiolens_model.pkl ./
COPY backend/ ./backend/
COPY training_data/ ./training_data/

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set production environment variables
ENV PORT=5000 \
    FLASK_ENV=production \
    PYTHONUNBUFFERED=1 \
    MODEL_WEIGHTS_PATH=/app/cardiolens_model.pth

EXPOSE 5000

# Health check to ensure model is responsive
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start production WSGI server
CMD ["gunicorn", "--workers=2", "--threads=2", "--timeout=120", "--bind=0.0.0.0:5000", "backend.app:app"]
