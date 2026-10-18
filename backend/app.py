"""
CardioLens Flask REST API Server
Production-quality backend integrating the trained PyTorch HeartSoundCNN model.
"""

import os
import sys
import logging
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Ensure parent directory is in Python path for model import
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.model_loader import load_cardiolens_model, get_model_metadata
from backend.audio_preprocessing import validate_audio_file, AudioProcessingError, ALLOWED_EXTENSIONS
from backend.inference import analyze_heart_sound
from backend.report_generator import generate_pdf_report

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cardiolens.api")

app = Flask(__name__)
# Enable CORS for frontend applications
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Upload constraints
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 25 MB max request size

DEMO_SAMPLES = [
    {
        "id": "sample-normal-1",
        "title": "Normal Heart Sound (Patient 14241)",
        "description": "Clear S1/S2 heart sound with no significant murmur acoustics.",
        "expected_class": "Normal",
        "filename": "14241_AV.wav"
    },
    {
        "id": "sample-murmur-1",
        "title": "Systolic Murmur (Patient 13918)",
        "description": "Phonocardiogram exhibiting audible high-frequency systolic murmur turbulence.",
        "expected_class": "Murmur Present",
        "filename": "13918_AV.wav"
    },
    {
        "id": "sample-murmur-2",
        "title": "Systolic Murmur (Patient 9979)",
        "description": "Murmur recording from pulmonary valve listening location.",
        "expected_class": "Murmur Present",
        "filename": "9979_AV.wav"
    },
    {
        "id": "sample-murmur-3",
        "title": "Holosystolic Murmur (Patient 2530)",
        "description": "Aortic listening post PCG exhibiting turbulent systolic frequency spikes.",
        "expected_class": "Murmur Present",
        "filename": "2530_AV.wav"
    }
]

def find_sample_file_path(filename: str) -> str:
    """Locate sample audio file across demo_samples, training_data, or root."""
    candidate_locations = [
        os.path.join(BASE_DIR, "backend", "demo_samples", filename),
        os.path.join(BASE_DIR, "demo_samples", filename),
        os.path.join(BASE_DIR, "training_data", "training_data", filename),
        os.path.join(BASE_DIR, "training_data", filename),
        os.path.join(os.getcwd(), "backend", "demo_samples", filename),
        os.path.join(os.getcwd(), "training_data", "training_data", filename)
    ]
    for path in candidate_locations:
        if os.path.isfile(path):
            return path
    return None

# Eagerly load the model at startup
try:
    load_cardiolens_model()
    logger.info("CardioLens model loaded eagerly at server initialization.")
except Exception as e:
    logger.warning(f"Could not load model eagerly during startup: {e}. Model will load on first request.")


# -------------------------------------------------------------------------
# API ROUTES
# -------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    """Returns server operational status and model readiness without leaking paths."""
    model_ready = False
    try:
        _, meta = load_cardiolens_model()
        model_ready = meta.get("loaded", False)
    except Exception as e:
        logger.error(f"Health check model load error: {e}")

    return jsonify({
        "status": "healthy",
        "service": "CardioLens AI Heart Sound Screening API",
        "version": "1.0.0",
        "model_loaded": model_ready,
        "device": meta.get("device", "cpu") if model_ready else "unknown",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200


@app.route("/api/model-info", methods=["GET"])
def model_info():
    """Returns safe, public technical parameters and input constraints."""
    meta = get_model_metadata()
    return jsonify({
        "model": meta,
        "constraints": {
            "max_file_size_mb": 25,
            "max_duration_seconds": 60,
            "standard_analysis_duration": 5.0,
            "sample_rate_hz": 2000,
            "allowed_extensions": sorted(list(ALLOWED_EXTENSIONS))
        },
        "classes": [
            {"index": 0, "name": "Normal", "description": "Absence of detectable pathological murmur patterns"},
            {"index": 1, "name": "Murmur Present", "description": "Detection of turbulent acoustic systolic/diastolic murmur signals"}
        ]
    }), 200


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Accepts multipart/form-data containing an audio file.
    Validates, standardizes, runs inference using HeartSoundCNN, and returns result.
    """
    if "audio" not in request.files:
        return jsonify({
            "success": False,
            "error": "Missing audio file in request. Provide an audio file with key 'audio'."
        }), 400

    file_obj = request.files["audio"]
    if not file_obj or file_obj.filename == "":
        return jsonify({
            "success": False,
            "error": "No file selected. Please select a valid heart sound recording."
        }), 400

    filename = secure_filename(file_obj.filename)
    try:
        validate_audio_file(file_obj, filename)
    except AudioProcessingError as e:
        return jsonify({"success": False, "error": str(e)}), 415

    try:
        result = analyze_heart_sound(file_obj, filename=filename)
        return jsonify(result), 200
    except AudioProcessingError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.exception(f"Unexpected error during inference for {filename}: {e}")
        return jsonify({
            "success": False,
            "error": "An internal error occurred while analyzing the audio file. Please ensure the recording is a valid heart sound."
        }), 500


@app.route("/api/sample-audio", methods=["GET"])
def list_sample_audios():
    """Returns metadata for pre-packaged clinical demo heart sound recordings."""
    available_samples = []
    for s in DEMO_SAMPLES:
        full_path = find_sample_file_path(s["filename"])
        if full_path and os.path.isfile(full_path):
            available_samples.append({
                "id": s["id"],
                "title": s["title"],
                "description": s["description"],
                "expected_class": s["expected_class"],
                "filename": s["filename"],
                "stream_url": f"/api/sample-audio/{s['id']}"
            })
    return jsonify({"samples": available_samples}), 200


@app.route("/api/sample-audio/<sample_id>", methods=["GET"])
def stream_sample_audio(sample_id):
    """Streams a sample audio recording for preview and analysis."""
    match = next((s for s in DEMO_SAMPLES if s["id"] == sample_id), None)
    if not match:
        return jsonify({"error": f"Sample '{sample_id}' not found."}), 404

    full_path = find_sample_file_path(match["filename"])
    if not full_path or not os.path.isfile(full_path):
        return jsonify({"error": "Sample file not found on disk."}), 404

    return send_file(full_path, mimetype="audio/wav", as_attachment=False)


@app.route("/api/generate-report", methods=["POST"])
def generate_report():
    """Generates and returns a downloadable PDF screening report."""
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid request. JSON analysis data required."}), 400

    try:
        pdf_stream = generate_pdf_report(data)
        analysis_id = data.get("analysis_id", "report")
        filename = f"CardioLens_Screening_{analysis_id}.pdf"
        
        return Response(
            pdf_stream.getvalue(),
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        logger.exception(f"Error generating PDF report: {e}")
        return jsonify({"error": f"Failed to generate PDF report: {str(e)}"}), 500


# -------------------------------------------------------------------------
# FRONTEND STATIC FILES SERVING (Unified Web Service on Render / Cloud)
# -------------------------------------------------------------------------
# Look for pre-built frontend distribution in frontend/dist or root dist
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
if not os.path.isdir(FRONTEND_DIST) and os.path.isdir(os.path.join(BASE_DIR, "dist")):
    FRONTEND_DIST = os.path.join(BASE_DIR, "dist")
elif not os.path.isdir(FRONTEND_DIST) and os.path.isdir(os.path.join(os.getcwd(), "dist")):
    FRONTEND_DIST = os.path.join(os.getcwd(), "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    # Do not intercept API requests
    if path.startswith("api"):
        return jsonify({"error": f"API endpoint '/{path}' not found."}), 404

    requested_path = os.path.join(FRONTEND_DIST, path)
    if path != "" and os.path.isfile(requested_path):
        return send_file(requested_path)

    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.isfile(index_file):
        return send_file(index_file)

    return jsonify({
        "status": "online",
        "service": "CardioLens AI Heart Sound Screening API",
        "health_check": "/api/health",
        "model_info": "/api/model-info",
        "notice": "Frontend static bundle not found at frontend/dist. For standalone API usage, consult /api/model-info."
    }), 200


# -------------------------------------------------------------------------
# ERROR HANDLERS
# -------------------------------------------------------------------------

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "success": False,
        "error": "The uploaded audio file exceeds the 25 MB file size limit."
    }), 413

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found."}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error occurred."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting CardioLens Flask API on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
