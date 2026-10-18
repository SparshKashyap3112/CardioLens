#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "============================================================"
echo " Starting CardioLens Production Build on Render"
echo "============================================================"

# 1. Install Python dependencies
echo "[1/3] Installing Python dependencies..."
pip install --upgrade pip setuptools wheel
# Use CPU-only PyTorch index to stay under Render free-tier RAM & disk limits
pip install --no-cache-dir torch --extra-index-url https://download.pytorch.org/whl/cpu || pip install -r backend/requirements.txt
pip install -r backend/requirements.txt

# 2. Build React Vite Frontend
echo "[2/3] Building React Vite Frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. Verify Build Artifacts
echo "[3/3] Verifying deployment assets..."
if [ -f "frontend/dist/index.html" ]; then
    echo "Frontend build successfully generated at frontend/dist/"
else
    echo "Warning: frontend/dist/index.html was not found!"
fi

if [ -f "cardiolens_model.pth" ]; then
    echo "Trained PyTorch model 'cardiolens_model.pth' verified!"
else
    echo "Warning: 'cardiolens_model.pth' was not found in root directory!"
fi

echo "============================================================"
echo " CardioLens Build Complete and Ready to Launch!"
echo "============================================================"
