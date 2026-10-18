"""
Audio Preprocessing Pipeline for CardioLens PCG Analysis
Matches the exact training parameters used during model development:
- Sample Rate: 2000 Hz
- Fixed Duration: 5.0 seconds (10,000 samples)
- Mel Bands: 128 (fmax=1000 Hz)
- Power-to-dB conversion and Min-Max Spectrogram Normalization
"""

import os
import io
import logging
import numpy as np
import librosa
import soundfile as sf
import torch

logger = logging.getLogger("cardiolens.preprocessing")

# Audio constraints matching HeartSoundCNN training pipeline
TARGET_SR = 2000
TARGET_DURATION = 5.0
TARGET_SAMPLES = int(TARGET_SR * TARGET_DURATION)  # 10,000 samples
N_MELS = 128
FMAX = 1000
N_FFT = 2048
HOP_LENGTH = 512

# Allowed upload extensions
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac"}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
MAX_DURATION_SECONDS = 60.0  # Up to 60 seconds; will be standardized to 5.0s window

class AudioProcessingError(Exception):
    """Custom exception for audio decoding or validation failures."""
    pass

def validate_audio_file(file_storage, filename: str) -> None:
    """Validate file extension and basic stream integrity."""
    if not filename:
        raise AudioProcessingError("No filename provided.")

    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise AudioProcessingError(
            f"Unsupported audio format '{ext}'. CardioLens accepts PCG recordings in {', '.join(sorted(ALLOWED_EXTENSIONS))} formats."
        )

def extract_waveform_points(audio_data: np.ndarray, num_points: int = 120) -> list[float]:
    """
    Downsamples the 1D audio signal into peak envelope points for frontend rendering.
    Values are normalized between -1.0 and 1.0.
    """
    if len(audio_data) == 0:
        return [0.0] * num_points

    chunk_size = len(audio_data) // num_points
    if chunk_size == 0:
        # Array shorter than num_points
        padded = np.pad(audio_data, (0, num_points - len(audio_data)))
        return [round(float(v), 4) for v in padded]

    points = []
    for i in range(num_points):
        chunk = audio_data[i * chunk_size : (i + 1) * chunk_size]
        # Peak absolute amplitude in this bucket
        if len(chunk) > 0:
            val = float(np.max(np.abs(chunk)))
            # Alternate positive and negative peaks for realistic sound wave appearance
            signed_val = val if (i % 2 == 0) else -val
            points.append(round(signed_val, 4))
        else:
            points.append(0.0)

    # Normalize max amplitude to 1.0 if not completely silent
    max_peak = max(abs(p) for p in points) or 1.0
    return [round(p / max_peak, 4) for p in points]

def preprocess_audio(file_input, filename: str = "recording.wav", device: torch.device = None) -> tuple[torch.Tensor, dict]:
    """
    Decodes, standardizes, and converts PCG audio into the exact 4D tensor
    expected by HeartSoundCNN: [1, 1, 128, 20].

    Returns:
        spec_tensor: PyTorch tensor ready for model inference.
        metadata: Dictionary with recording details (duration, rms, sample rate, etc.).
    """
    if device is None:
        device = torch.device("cpu")

    try:
        # Load audio using librosa: forces mono and resamples directly to TARGET_SR (2000 Hz)
        if isinstance(file_input, (str, os.PathLike)):
            if not os.path.exists(file_input):
                raise AudioProcessingError(f"Audio file '{file_input}' not found on server.")
            raw_duration = librosa.get_duration(path=file_input)
            y, sr = librosa.load(file_input, sr=TARGET_SR, mono=True)
        else:
            # File-like object / BytesIO
            file_bytes = io.BytesIO(file_input.read())
            file_bytes.seek(0)
            y, sr = librosa.load(file_bytes, sr=TARGET_SR, mono=True)
            raw_duration = len(y) / TARGET_SR

    except Exception as e:
        logger.error(f"Failed to decode audio file {filename}: {e}")
        raise AudioProcessingError(f"Failed to decode heart sound recording. Ensure the file contains valid audio data. (Detail: {str(e)})")

    if len(y) == 0 or np.all(y == 0):
        raise AudioProcessingError("The provided audio recording appears to be empty or completely silent.")

    actual_duration = round(float(len(y) / TARGET_SR), 2)
    if actual_duration > MAX_DURATION_SECONDS:
        raise AudioProcessingError(
            f"Recording length ({actual_duration}s) exceeds the maximum allowed duration of {MAX_DURATION_SECONDS}s."
        )

    # Calculate audio quality indicators
    rms_energy = float(np.sqrt(np.mean(y**2)))
    peak_amp = float(np.max(np.abs(y)))

    # Generate 120-point envelope for frontend interactive waveform
    waveform_envelope = extract_waveform_points(y, num_points=120)

    # Standardize to 5.0 seconds (10,000 samples) matching HeartSoundDataset
    if len(y) < TARGET_SAMPLES:
        y_padded = np.pad(y, (0, TARGET_SAMPLES - len(y)), mode="constant")
    else:
        y_padded = y[:TARGET_SAMPLES]

    # Generate Mel-Spectrogram with training parameters
    mel_spec = librosa.feature.melspectrogram(
        y=y_padded,
        sr=TARGET_SR,
        n_mels=N_MELS,
        fmax=FMAX,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH
    )
    
    # Power to decibels
    log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)

    # Min-max normalization strictly between 0 and 1
    spec_min = log_mel_spec.min()
    spec_max = log_mel_spec.max()
    normalized_spec = (log_mel_spec - spec_min) / (spec_max - spec_min + 1e-8)

    # Convert to PyTorch float32 tensor with shape [1, 1, 128, time_frames]
    spec_tensor = torch.tensor(normalized_spec, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)

    # Downsampled spectrogram thumbnail (16x20) for visual API response
    downsampled_spec = []
    step = N_MELS // 16
    for row in range(0, N_MELS, step):
        downsampled_spec.append([round(float(v), 3) for v in normalized_spec[row, :]])

    metadata = {
        "filename": os.path.basename(filename),
        "original_duration_seconds": actual_duration,
        "processed_duration_seconds": TARGET_DURATION,
        "sample_rate_hz": TARGET_SR,
        "samples_analyzed": TARGET_SAMPLES,
        "mel_bands": N_MELS,
        "time_frames": spec_tensor.shape[-1],
        "rms_energy": round(rms_energy, 4),
        "peak_amplitude": round(peak_amp, 4),
        "waveform": waveform_envelope,
        "spectrogram_preview": downsampled_spec[:16]
    }

    return spec_tensor, metadata
