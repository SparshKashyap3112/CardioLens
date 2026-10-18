# CardioLens — Render Deployment Guide

This guide provides instructions for deploying **CardioLens** to [Render](https://render.com/).

CardioLens is pre-configured with two deployment options:
1. **Option 1 (Recommended)**: **Single Unified Web Service** — Serves both the React Vite frontend and the Python Flask REST API from a single service on Render. This avoids CORS issues and operates on Render's free tier.
2. **Option 2**: **Separate Services** — A Static Site for the React frontend (`frontend/dist`) and a Web Service for the Flask backend API.
3. **Option 3**: **Docker Container** — Using the provided multi-stage `Dockerfile`.

---

## Prerequisites

1. A [GitHub](https://github.com/) or [GitLab](https://gitlab.com/) account.
2. A free [Render.com](https://render.com/) account.
3. Your CardioLens repository pushed to GitHub or GitLab.

> [!NOTE]
> Ensure that `cardiolens_model.pth` (approx. 416 KB) is committed to your repository so Render can load the trained PyTorch model.

---

## Option 1: 1-Click Blueprint Deployment (Recommended)

CardioLens includes a pre-configured [`render.yaml`](render.yaml) blueprint.

1. Push your project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial CardioLens commit with Render config"
   git branch -M main
   git remote add origin https://github.com/<your-username>/CardioLens.git
   git push -u origin main
   ```
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **"New +"** in the top navigation bar and select **"Blueprint"**.
4. Connect your GitHub/GitLab repository.
5. Render will detect `render.yaml` automatically and display the `cardiolens` service configuration.
6. Click **"Apply"**.
7. Render will execute `./build.sh` (compiling the React frontend and installing PyTorch/dependencies) and launch Gunicorn.
8. Once deployment finishes, your service will be live at `https://cardiolens.onrender.com` (or your assigned subdomain).

---

## Option 2: Manual Web Service Setup (Unified Service)

If you prefer to configure the service manually through the Render dashboard:

1. Click **"New +"** $\rightarrow$ **"Web Service"**.
2. Select your repository.
3. Fill in the following settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `cardiolens` |
| **Region** | Oregon (US West) or your preferred region |
| **Branch** | `main` |
| **Runtime** | `Python 3` |
> [!TIP]
> **Zero-Friction Static Serving:** The production frontend bundle is now pre-built and tracked in `dist/` and `frontend/dist/`. This means Render's Python runtime can serve the full React interface immediately without requiring Node.js/npm during cloud build time.

**Build Command**:
```bash
./build.sh
```
*(or simple Python install command)*:
```bash
pip install --upgrade pip && pip install torch --extra-index-url https://download.pytorch.org/whl/cpu && pip install -r backend/requirements.txt
```


### Environment Variables
Under the **"Environment"** tab, add:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python runtime |
| `NODE_VERSION` | `20.12.0` | Required for building React Vite app |
| `FLASK_ENV` | `production` | Production mode |
| `MODEL_WEIGHTS_PATH` | `cardiolens_model.pth` | Checkpoint location |

4. Click **"Create Web Service"**.

---

## Option 3: Separate Services (Static Site + Web Service)

If you wish to host the frontend and backend on distinct Render services:

### 1. Deploy the Backend Web Service
- **Name**: `cardiolens-api`
- **Runtime**: `Python 3`
- **Build Command**:
  ```bash
  pip install --upgrade pip && pip install torch --extra-index-url https://download.pytorch.org/whl/cpu && pip install -r backend/requirements.txt
  ```
- **Start Command**:
  ```bash
  gunicorn --workers=2 --threads=2 --timeout=120 --bind=0.0.0.0:$PORT backend.app:app
  ```
- Note down your backend URL: e.g., `https://cardiolens-api.onrender.com`.

### 2. Deploy the Frontend Static Site
- **Name**: `cardiolens-web`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL` = `https://cardiolens-api.onrender.com/api`
- **Redirects / Rewrites** (under "Redirects/Rewrites" tab):
  - **Source**: `/*`
  - **Destination**: `/index.html`
  - **Action**: `Rewrite` (ensures React Router SPA navigation works on refresh).

---

## Option 4: Docker Container Deployment

If you prefer containerized deployment:

1. Click **"New +"** $\rightarrow$ **"Web Service"**.
2. Select your repository.
3. Select **"Docker"** as the Environment.
4. Render will detect the `Dockerfile` at the root of the repository.
5. Click **"Create Web Service"**.

The multi-stage `Dockerfile` will:
- Build the React assets using Node 20.
- Copy artifacts to a Python 3.11 slim image with `libsndfile1` and `ffmpeg`.
- Install CPU-only PyTorch (keeping the image size small).
- Run Gunicorn on port `5000`.

---

## Post-Deployment Verification Checklist

Once the deployment status shows **Live**:

1. **Verify Backend Health**:
   Open in your browser:
   `https://<your-render-url>.onrender.com/api/health`
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "CardioLens AI Heart Sound Screening API",
     "model_loaded": true,
     "device": "cpu"
   }
   ```

2. **Verify Frontend Interface**:
   Open:
   `https://<your-render-url>.onrender.com/`
   - Check that the navigation bar, hero section, waveform visualizer, and clinical gallery load cleanly.

3. **Verify Inference Workspace**:
   Open `/analyze` or click **"Analyze Heart Sound"**:
   - Click one of the pre-loaded clinical demo samples (e.g. *Patient 14241* or *Patient 13918*).
   - Press **"Analyze Heart Sound"**.
   - Verify that the model returns the classification result, probability distribution, and acoustic metrics.

4. **Verify PDF Report Generation**:
   - In the results card, click **"Download PDF Report"**.
   - Ensure the downloaded PDF opens with the CardioLens medical report layout.

---

## Performance & Optimization Notes

- **Render Free Tier Spin-Down**: Render's free web services automatically spin down after 15 minutes of inactivity. When a new request arrives, it may take 30–50 seconds for the service to wake up. Subsequent requests respond in **~20 ms**.
- **PyTorch Memory Consumption**: By utilizing CPU-only wheels (`https://download.pytorch.org/whl/cpu`), memory usage is capped at ~220 MB, well within Render's 512 MB free tier memory ceiling.
- **Audio File Size**: Uploads are restricted to 25 MB max to protect server memory.
