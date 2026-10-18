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

# 2. Build or Verify React Frontend
echo "[2/3] Checking Frontend assets..."
if command -v npm >/dev/null 2>&1; then
    echo "Node.js & npm detected. Building latest frontend bundle..."
    cd frontend
    npm install
    npm run build
    cd ..
    # Synchronize to root dist
    mkdir -p dist
    cp -r frontend/dist/* dist/
elif [ -f "dist/index.html" ] || [ -f "frontend/dist/index.html" ]; then
    echo "Pre-built production bundle found in dist/. Skipping npm step."
    if [ ! -d "dist" ] && [ -d "frontend/dist" ]; then
        cp -r frontend/dist dist
    elif [ ! -d "frontend/dist" ] && [ -d "dist" ]; then
        mkdir -p frontend/dist
        cp -r dist/* frontend/dist/
    fi
else
    echo "Error: Neither npm nor pre-built dist folder was found!"
    exit 1
fi

# 3. Verify Deployment Assets
echo "[3/3] Verifying deployment assets..."
if [ -f "dist/index.html" ] || [ -f "frontend/dist/index.html" ]; then
    echo "Frontend build successfully verified!"
else
    echo "Warning: index.html was not found in dist!"
fi

if [ -f "cardiolens_model.pth" ]; then
    echo "Trained PyTorch model 'cardiolens_model.pth' verified!"
else
    echo "Warning: 'cardiolens_model.pth' was not found in root directory!"
fi

echo "============================================================"
echo " CardioLens Build Complete and Ready to Launch!"
echo "============================================================"
