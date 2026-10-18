"""
Unit and Integration Tests for CardioLens Backend API
Tests real model inference, audio preprocessing, error handling, and PDF generation.
"""

import os
import sys
import io
import unittest

# Ensure project root is in path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import app

class CardioLensApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_health_check(self):
        """Test GET /api/health returns 200 with model ready."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["model_loaded"])
        self.assertIn("device", data)

    def test_model_info(self):
        """Test GET /api/model-info returns valid technical configuration."""
        response = self.client.get("/api/model-info")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("model", data)
        self.assertEqual(data["model"]["name"], "CardioLens HeartSoundCNN")
        self.assertEqual(len(data["classes"]), 2)
        self.assertIn(".wav", data["constraints"]["allowed_extensions"])

    def test_sample_audio_list(self):
        """Test GET /api/sample-audio returns available demo files."""
        response = self.client.get("/api/sample-audio")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("samples", data)
        self.assertGreater(len(data["samples"]), 0)

    def test_sample_audio_stream(self):
        """Test GET /api/sample-audio/<id> streams wav file."""
        response = self.client.get("/api/sample-audio/sample-normal-1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content_type, "audio/wav")
        self.assertGreater(len(response.data), 1000)

    def test_predict_real_audio(self):
        """Test POST /api/predict with real heart sound recording from dataset."""
        sample_path = os.path.join(BASE_DIR, "training_data", "training_data", "14241_AV.wav")
        self.assertTrue(os.path.exists(sample_path), f"Sample file {sample_path} must exist.")

        with open(sample_path, "rb") as f:
            audio_bytes = f.read()

        response = self.client.post(
            "/api/predict",
            data={"audio": (io.BytesIO(audio_bytes), "14241_AV.wav")},
            content_type="multipart/form-data"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn(data["prediction"]["label"], ["Normal", "Murmur Present"])
        self.assertIn("confidence", data["prediction"])
        self.assertIn("probabilities", data["prediction"])
        self.assertIn("waveform", data["audio"])
        self.assertEqual(len(data["audio"]["waveform"]), 120)

    def test_predict_missing_file(self):
        """Test POST /api/predict rejects requests with no audio file."""
        response = self.client.post("/api/predict", data={})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])

    def test_predict_unsupported_format(self):
        """Test POST /api/predict rejects unsupported extensions."""
        dummy_file = io.BytesIO(b"dummy text content")
        response = self.client.post(
            "/api/predict",
            data={"audio": (dummy_file, "invalid.txt")},
            content_type="multipart/form-data"
        )
        self.assertEqual(response.status_code, 415)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertIn("Unsupported audio format", data["error"])

    def test_generate_pdf_report(self):
        """Test POST /api/generate-report generates a valid PDF."""
        payload = {
            "analysis_id": "CL-TEST-1234",
            "timestamp": "2026-10-18T12:00:00Z",
            "processing_time_ms": 45.2,
            "prediction": {
                "label": "Murmur Present",
                "badge": "Heart Murmur Detected",
                "severity": "alert",
                "confidence": 0.88,
                "confidence_percentage": 88.0,
                "probabilities": {"normal": 0.12, "murmur_present": 0.88},
                "clinical_summary": "Test murmur explanation."
            },
            "audio": {
                "filename": "test_heart_sound.wav",
                "original_duration_seconds": 5.0,
                "processed_duration_seconds": 5.0,
                "sample_rate_hz": 2000,
                "rms_energy": 0.045,
                "peak_amplitude": 0.35
            },
            "model": {
                "name": "CardioLens CNN",
                "architecture": "HeartSoundCNN",
                "device": "cpu"
            }
        }
        response = self.client.post("/api/generate-report", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content_type, "application/pdf")
        # PDF files begin with %PDF-
        self.assertTrue(response.data.startswith(b"%PDF-"))

if __name__ == "__main__":
    unittest.main()
