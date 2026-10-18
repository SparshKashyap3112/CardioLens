"""
Model Loader for CardioLens HeartSoundCNN
Loads the trained PyTorch CNN weights safely on CPU or CUDA.
"""

import os
import sys
import logging
import torch
import torch.nn as nn

logger = logging.getLogger("cardiolens.model_loader")

# Import HeartSoundCNN from model.py in the project root if available
try:
    from model import HeartSoundCNN
except ImportError:
    # Ensure current directory / parent directory is in path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    from model import HeartSoundCNN

# Global singleton instance
_model_instance = None
_model_device = None
_model_metadata = {
    "name": "CardioLens HeartSoundCNN",
    "architecture": "HeartSoundCNN (3-Stage 2D CNN with Global Average Pooling)",
    "input_shape": [1, 1, 128, 20],
    "sample_rate": 2000,
    "target_duration_seconds": 5.0,
    "classes": ["Normal", "Murmur Present"],
    "class_indices": {0: "Normal", 1: "Murmur Present"},
    "n_mels": 128,
    "fmax": 1000,
    "hop_length": 512,
    "n_fft": 2048,
    "device": "cpu",
    "weights_path": ""
}

def get_device() -> torch.device:
    """Select appropriate device: CUDA if available, CPU fallback."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")

def load_cardiolens_model(weights_path: str = None) -> tuple[HeartSoundCNN, dict]:
    """
    Loads and caches the trained HeartSoundCNN model once.
    Ensures model is in eval mode with gradients disabled.
    """
    global _model_instance, _model_device, _model_metadata

    if _model_instance is not None:
        return _model_instance, _model_metadata

    device = get_device()
    _model_device = device
    _model_metadata["device"] = str(device)

    # Search paths for model weights if not explicitly provided
    if not weights_path:
        env_path = os.environ.get("MODEL_WEIGHTS_PATH")
        if env_path and os.path.isfile(env_path):
            weights_path = env_path
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            candidate_paths = [
                os.path.join(base_dir, "cardiolens_model.pth"),
                os.path.join(base_dir, "models", "cardiolens_model.pth"),
                os.path.join(os.getcwd(), "cardiolens_model.pth"),
                os.path.join(os.getcwd(), "models", "cardiolens_model.pth"),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), "cardiolens_model.pth"),
                "cardiolens_model.pth"
            ]
            for cp in candidate_paths:
                if os.path.isfile(cp):
                    weights_path = cp
                    break

    if not weights_path or not os.path.isfile(weights_path):
        raise FileNotFoundError(
            f"Trained model checkpoint 'cardiolens_model.pth' not found in candidate paths: {candidate_paths}"
        )

    logger.info(f"Loading trained CardioLens CNN weights from: {weights_path} onto {device}")
    
    # Initialize the exact architecture
    model = HeartSoundCNN()
    
    # Load state_dict
    state_dict = torch.load(weights_path, map_location=device)
    model.load_state_dict(state_dict)
    
    # Move to device and set evaluation mode
    model.to(device)
    model.eval()

    # Freeze all parameters
    for param in model.parameters():
        param.requires_grad = False

    _model_instance = model
    _model_metadata["weights_path"] = os.path.abspath(weights_path)
    _model_metadata["loaded"] = True

    logger.info("CardioLens HeartSoundCNN loaded successfully into evaluation mode.")
    return _model_instance, _model_metadata

def get_model_metadata() -> dict:
    """Return safe public information about the model."""
    meta = _model_metadata.copy()
    # Strip local server paths from public metadata
    meta["weights_loaded"] = _model_instance is not None
    if "weights_path" in meta:
        meta["weights_file"] = os.path.basename(meta["weights_path"]) if meta["weights_path"] else "cardiolens_model.pth"
        del meta["weights_path"]
    return meta
