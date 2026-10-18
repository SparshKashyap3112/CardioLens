import os
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset
import librosa

class HeartSoundDataset(Dataset):
    def __init__(self, csv_path, audio_dir, sr=2000, duration=5.0):
        self.df = pd.read_csv(csv_path)
        self.audio_dir = audio_dir
        self.sr = sr
        self.duration = duration
        self.target_length = int(sr * duration)
        
        # Clean up dataframe: map patient IDs and target labels (e.g., Murmur Present vs Absent)
        # We will look for the 'Murmur' column
        self.id_col = 'Patient ID' if 'Patient ID' in self.df.columns else self.df.columns[0]
        
        # Filter out rows where Murmur label might be missing if needed, 
        # or map them to numerical classes (e.g., Present = 1, Absent = 0)
        self.df = self.df.dropna(subset=['Murmur'])
        
    def __len__(self):
        return len(self.df)
        
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        patient_id = row[self.id_col]
        
        # Find the first available audio recording for this patient in the folder
        # (CirCor usually has multiple recording locations like AV, MV, etc. We'll pick the first match)
        patient_files = [f for f in os.listdir(self.audio_dir) if f.startswith(str(patient_id)) and f.endswith('.wav')]
        
        if not patient_files:
            # Fallback tensor if file is missing
            spec_tensor = torch.zeros((1, 128, int(np.ceil(self.sr * self.duration / 512))))
            label = 0
            return spec_tensor, label
            
        audio_path = os.path.join(self.audio_dir, patient_files[0])
        
        # 1. Load audio using librosa
        y, _ = librosa.load(audio_path, sr=self.sr)
        
        # 2. Pad or truncate to fixed length
        if len(y) < self.target_length:
            y = np.pad(y, (0, self.target_length - len(y)), 'constant')
        else:
            y = y[:self.target_length]
            
        # 3. Generate Mel-Spectrogram
        mel_spec = librosa.feature.melspectrogram(y=y, sr=self.sr, n_mels=128, fmax=1000)
        log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
        
        # Normalize spectrogram values between 0 and 1 (good for CNN stability)
        log_mel_spec = (log_mel_spec - log_mel_spec.min()) / (log_mel_spec.max() - log_mel_spec.min() + 1e-8)
        
        # Convert to PyTorch tensor with channel dimension -> Shape: (1, 128, time_frames)
        spec_tensor = torch.tensor(log_mel_spec, dtype=torch.float32).unsqueeze(0)
        
        # 4. Extract label (e.g., Present = 1, Absent/Else = 0)
        murmur_label = str(row['Murmur']).strip()
        label = 1 if murmur_label.lower() == 'present' else 0
        
        return spec_tensor, torch.tensor(label, dtype=torch.long)