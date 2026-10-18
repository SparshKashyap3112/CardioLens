# CardioLens — AI-Powered Heart Murmur Detection Platform

[![GitHub Repository](https://img.shields.io/badge/GitHub-SparshKashyap3112%2FCardioLens-E85B3F?logo=github)](https://github.com/SparshKashyap3112/CardioLens)
[![Python Version](https://img.shields.io/badge/Python-3.10%20%7C%203.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Render Deployable](https://img.shields.io/badge/Render-Deploy%20Ready-46E3B7?logo=render&logoColor=black)](https://render.com/)

CardioLens is an investigational, clinical-grade full-stack web application designed for screening and identifying heart murmurs from phonocardiogram (PCG) audio recordings. The platform combines a hospital-inspired glassmorphism web interface with a Python Flask REST API powered by a trained deep learning Convolutional Neural Network (`HeartSoundCNN`) developed in PyTorch.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Visual Design & Aesthetic](#visual-design--aesthetic)
3. [Model Architecture & Audio Preprocessing](#model-architecture--audio-preprocessing)
4. [System Architecture](#system-architecture)
5. [API Reference](#api-reference)
6. [Local Setup & Execution](#local-setup--execution)
7. [Testing & Validation](#testing--validation)
8. [Deployment Guide](#deployment-guide)
9. [Clinical Responsibility & Disclaimer](#clinical-responsibility--disclaimer)

---

## 1. Key Features

- **Genuine Neural Network Inference**: Directly integrates your trained `HeartSoundCNN` PyTorch model (`cardiolens_model.pth` and `cardiolens_model.pkl`). No mock data or fabricated outputs.
- **ECG-Style Signal Monitor Visualizer**: Medanta-inspired hospital telemetry panel featuring a dark CRT monitoring display (`#0B0F17`), subtle medical grid lines, and a luminous phosphor-green waveform. Connects to real analysis lifecycle states (`Standby`, `Uploading Audio`, `Analysis in Progress`, `Processing Complete`, `Analysis Error`).
- **2000 Hz Standardized Audio Preprocessing**: Recreates the training pipeline using Librosa (mono conversion, 5.0-second fixed duration padding/truncation, 128 Mel-frequency bands, power-to-dB conversion, and 0-to-1 min-max scaling).
- **Interactive Audio Waveform Visualizer**: Allows users to preview uploaded heart sounds, play/pause, scrub/seek, and visualize actual acoustic amplitude envelopes.
- **One-Click Clinical Demo Samples**: Includes pre-loaded PCG recordings from the PhysioNet CirCor DigiScope dataset (Normal and Murmur Present cases) for instant testing without needing audio files on hand.
- **Explainable Screening Outcome**: Delivers predicted classes (`Normal` vs `Murmur Present`) alongside calibrated Softmax probabilities, inference latency (approx. 20ms on CPU), and acoustic energy metrics.
- **Downloadable PDF Clinical Screening Reports**: Generates hospital-styled PDF reports via ReportLab with screening IDs, recording metadata, neural network details, and clinical limitations.
- **Session-Persistent History**: Stores recent screenings in the local browser session for rapid review without permanently exposing raw patient audio.
- **Zero-Friction Cloud Deployment**: Comes with pre-compiled production `dist/` bundles and `render.yaml` for instant 1-click deployment on Render without needing Node.js during cloud build time.

---

## 2. Visual Design & Aesthetic

Inspired by premier healthcare web architectures (such as the Medanta hospital digital portal), CardioLens uses a **Hospital Glassmorphism** design language:

| Design Token | Value | Clinical Intent |
| :--- | :--- | :--- |
| **Primary Coral** | `#E85B3F` | Main call-to-action buttons, active waveforms, highlights |
| **Deep Coral** | `#D9432B` | Gradient end, hover states, cardiac focus |
| **Main Background** | `#F5F6F8` | Clean, calm medical light-gray canvas |
| **Glass Surface** | `rgba(255, 255, 255, 0.82)` | Semi-transparent cards with `backdrop-filter: blur(16px)` |
| **Glass Borders** | `rgba(35, 45, 55, 0.10)` | Refined, hairline structural dividers |
| **Monitor Screen** | `#0B0F17` | Dark obsidian CRT canvas with subtle green medical grid |
| **Monitor Phosphor**| `#10B981` / `#34D399` | Soft luminous green cardiac tracing with bloom glow |
| **Primary Text** | `#202124` | High-contrast, readable medical slate |
| **Muted Text** | `#686D75` | Clinical metadata and subtitles |
| **Normal Status** | `#21865B` | Calibrated emerald for negative murmur screenings |
| **Murmur Alert** | `#D97706` / `#E85B3F` | Soft amber/coral for murmur present (avoids frightening neon red) |

---

## 3. Model Architecture & Audio Preprocessing

### Convolutional Neural Network (`HeartSoundCNN`)
Defined in `model.py`, the network features 3 convolutional feature extraction blocks followed by adaptive global pooling and a dense classification head:

```
Input: [Batch, 1, 128, 20] (Log-Mel Spectrogram)
  ├── ConvBlock 1: Conv2d(1 -> 32, k=3, s=1, p=1) -> BatchNorm2d -> ReLU -> MaxPool2d(2, 2)
  ├── ConvBlock 2: Conv2d(32 -> 64, k=3, s=1, p=1) -> BatchNorm2d -> ReLU -> MaxPool2d(2, 2)
  ├── ConvBlock 3: Conv2d(64 -> 128, k=3, s=1, p=1) -> BatchNorm2d -> ReLU -> MaxPool2d(2, 2)
  ├── Global Average Pooling: AdaptiveAvgPool2d((1, 1))
  └── Fully Connected Head: Flatten -> Linear(128, 64) -> ReLU -> Dropout(0.5) -> Linear(64, 2)
Output: [Batch, 2] Raw Logits (Class 0: Normal, Class 1: Murmur Present)
```

### Preprocessing Specifications
- **Sampling Rate ($F_s$)**: 2000 Hz
- **Standard Duration**: 5.0 seconds ($10,000$ samples)
- **Zero-Padding / Truncation**: Inputs $< 10,000$ samples are zero-padded; longer recordings are standardized to the first $5.0$ seconds.
- **Mel Filterbanks ($N_{mels}$)**: 128 bands with $f_{max} = 1000\text{ Hz}$
- **FFT & Hop Length**: $N_{fft} = 2048$, $\text{hop\_length} = 512$
- **Log Scaling**: $10 \cdot \log_{10}(\text{Mel} / \max(\text{Mel}))$
- **Spectrogram Normalization**:
  $$\hat{S} = \frac{S - S_{min}}{S_{max} - S_{min} + 10^{-8}} \in [0.0, 1.0]$$

---

## 4. System Architecture

```
CardioLens/
├── backend/
│   ├── app.py                     # Flask REST API server & static dist serving
│   ├── model_loader.py            # Singleton model weights loader (CPU/CUDA)
│   ├── inference.py               # Evaluation forward pass & confidence calculation
│   ├── audio_preprocessing.py     # Librosa decode, resample, & spectrogram generator
│   ├── report_generator.py        # ReportLab PDF clinical report engine
│   ├── requirements.txt           # Python dependency specifications
│   ├── .env.example               # Example environment configuration
│   ├── demo_samples/              # CirCor clinical demonstration recordings (.wav)
│   └── tests/
│       └── test_api.py            # Automated test suite (8 test cases, 100% passing)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ECGMonitor.jsx     # Medical CRT telemetry monitor with scrolling Canvas
│   │   │   ├── ECGMonitor.css     # Hospital-grade monitor styling & glowing phosphor trace
│   │   │   ├── Navbar.jsx         # Sticky glass header with health indicator
│   │   │   ├── Footer.jsx         # Medical disclaimers, modals, & legal text
│   │   │   └── WaveformVisualizer.jsx # HTML5 audio player & seekable waveform
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page with hero & workflow timeline
│   │   │   └── Analyze.jsx        # Analysis workspace with drag-drop, ECG monitor, & results
│   │   ├── services/
│   │   │   └── api.js             # Axios client for backend REST communication
│   │   ├── App.jsx                # React router & navigation
│   │   ├── index.css              # Glassmorphism tokens & Tailwind imports
│   │   └── main.jsx               # React entry point
│   ├── public/
│   │   ├── favicon.svg            # Heart-waveform SVG icon
│   │   └── images/                # High-res hospital photography assets
│   ├── dist/                      # Pre-compiled production React distribution
│   ├── package.json
│   └── vite.config.js             # Vite dev server with /api proxy to Flask
├── dist/                          # Root pre-compiled static bundle for zero-build deployment
├── cardiolens_model.pth           # Trained PyTorch CNN checkpoint
├── cardiolens_model.pkl           # Model metadata dictionary
├── model.py                       # HeartSoundCNN model definition
├── dataset.py                     # Training dataset loader
├── train.py                       # CNN training loop
├── evaluate.py                    # Model evaluation script
├── build.sh                       # Production build script for cloud platforms
├── Dockerfile                     # Multi-stage production container
├── render.yaml                    # 1-Click Render Blueprint specification
├── RENDER_DEPLOYMENT.md           # Step-by-step Render deployment guide
└── README.md
```

---

## 5. API Reference

### `GET /api/health`
Verifies backend service operational status and model readiness.
```json
{
  "status": "healthy",
  "service": "CardioLens AI Heart Sound Screening API",
  "version": "1.0.0",
  "model_loaded": true,
  "device": "cpu",
  "timestamp": "2026-10-18T09:08:19.054735+00:00"
}
```

### `GET /api/model-info`
Provides safe public parameters, input constraints, and class indices.
```json
{
  "model": {
    "name": "CardioLens HeartSoundCNN",
    "architecture": "HeartSoundCNN (3-Stage 2D CNN with Global Average Pooling)",
    "sample_rate": 2000,
    "target_duration_seconds": 5.0,
    "classes": ["Normal", "Murmur Present"]
  },
  "constraints": {
    "max_file_size_mb": 25,
    "max_duration_seconds": 60,
    "allowed_extensions": [".aac", ".flac", ".m4a", ".mp3", ".ogg", ".wav"]
  }
}
```

### `POST /api/predict`
Accepts `multipart/form-data` with an audio file under key `audio`.
```json
{
  "success": true,
  "analysis_id": "CL-20261018091055-75DC",
  "timestamp": "2026-10-18T09:10:55.342110+00:00",
  "processing_time_ms": 20.12,
  "prediction": {
    "class_index": 1,
    "label": "Murmur Present",
    "badge": "Heart Murmur Detected",
    "severity": "alert",
    "confidence": 0.7037,
    "confidence_percentage": 70.4,
    "probabilities": {
      "normal": 0.2963,
      "murmur_present": 0.7037
    },
    "clinical_summary": "Your recording was classified as potentially containing a heart murmur by the AI model. This result does not confirm a diagnosis. Please consult a qualified healthcare professional for interpretation.",
    "clinical_recommendation": "Schedule an in-person clinical auscultation or echocardiogram with a certified physician or cardiologist for differential diagnosis."
  },
  "audio": {
    "filename": "13918_AV.wav",
    "original_duration_seconds": 5.0,
    "processed_duration_seconds": 5.0,
    "sample_rate_hz": 2000,
    "rms_energy": 0.0511,
    "peak_amplitude": 1.0373,
    "waveform": [ ... 120 amplitude values ... ],
    "spectrogram_preview": [ ... 16x20 matrix ... ]
  },
  "disclaimer": "CardioLens is an AI-powered screening and clinical educational support system..."
}
```

### `GET /api/sample-audio`
Returns the list of curated demo audio recordings.

### `GET /api/sample-audio/<sample_id>`
Streams the requested `.wav` sample file with `Content-Type: audio/wav`.

### `POST /api/generate-report`
Accepts the analysis result JSON and returns a binary PDF stream with `Content-Disposition: attachment; filename="CardioLens_Report_...pdf"`.

---

## 6. Local Setup & Execution

### Prerequisites
- Python 3.10+ (PyTorch, Librosa, Flask, ReportLab)
- Node.js 18+ and npm

### 1. Start the Flask Backend Server
In the project root directory:
```bash
# Install Python dependencies if needed
pip install -r backend/requirements.txt

# Run the Flask API server (starts on http://127.0.0.1:5000)
python backend/app.py
```

### 2. Start the React Frontend Application
In a separate terminal window:
```bash
cd frontend

# Install Node dependencies (if not already installed)
npm install

# Start Vite development server with proxy to Flask
npm run dev
```
Open **`http://localhost:5173`** in any modern web browser.

---

## 7. Testing & Validation

Run the automated backend test suite:
```bash
python -m unittest backend/tests/test_api.py
```
This tests:
1. `GET /api/health` status and model loading.
2. `GET /api/model-info` parameter schema.
3. `GET /api/sample-audio` sample list.
4. `GET /api/sample-audio/<id>` binary WAV streaming.
5. `POST /api/predict` with real CirCor PCG audio files.
6. Empty file validation (400 rejection).
7. Unsupported extension validation (415 rejection).
8. PDF report generation (`%PDF-` header validation).

To verify the end-to-end proxy from the frontend to the backend:
```bash
python test_e2e.py
```

---

## 8. Deployment Guide

### Deploying to Render (1-Click Blueprint or Docker)
CardioLens is pre-configured for deployment on **Render**:

- **Option A (Recommended: Unified Web Service)**: Deploys both the React Vite frontend and Flask REST API on a single service.
  - Connect your GitHub repo to Render and choose **"New Blueprint"** $\rightarrow$ select [`render.yaml`](render.yaml).
  - Or create a **"Web Service"** with:
    - **Build Command**: `./build.sh`
    - **Start Command**: `gunicorn --workers=2 --threads=2 --timeout=120 --bind=0.0.0.0:$PORT backend.app:app`
- **Option B (Docker Container)**: Uses the multi-stage [`Dockerfile`](Dockerfile) with CPU-optimized PyTorch.
- **Detailed Step-by-Step Instructions**: See [**`RENDER_DEPLOYMENT.md`**](RENDER_DEPLOYMENT.md) for full walkthroughs, environment variables, and troubleshooting.

### Deploying Separately (Vercel / Netlify Frontend + Cloud Backend)
1. **Frontend (Vercel / Netlify / Cloudflare Pages)**:
   ```bash
   cd frontend
   npm run build
   ```
   Publish directory: `frontend/dist/`. Set `VITE_API_BASE_URL` to your live API domain.
2. **Backend (Gunicorn / WSGI)**:
   ```bash
   gunicorn -w 2 -b 0.0.0.0:5000 backend.app:app
   ```
   Hardware recommendation: Minimum 512MB RAM (CPU-only PyTorch) to 2GB RAM.

---

## 9. Clinical Responsibility & Disclaimer

> [!IMPORTANT]
> **CardioLens is an auxiliary artificial intelligence screening and clinical educational support tool.** It is not an FDA, CE, or CDSCO-approved autonomous medical device. Predictions generated by this system represent acoustic pattern matching probabilities and do **not** constitute clinical diagnoses. A "Normal" screening does not rule out underlying cardiovascular conditions (such as coronary artery disease or cardiac arrhythmias). Concerning symptoms such as chest pain, dyspnea, syncope, or palpitations require immediate medical evaluation by a licensed healthcare professional.
