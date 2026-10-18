import torch
from torch.utils.data import DataLoader
from dataset import HeartSoundDataset

print("Initializing dataset...")
# Pointing to the CSV and folder from your unzipped files
dataset = HeartSoundDataset(csv_path="training_data.csv", audio_dir="training_data")

print(f"Total valid samples loaded: {len(dataset)}")

# Wrap in a DataLoader
dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

# Fetch just one batch to test the audio processing pipeline
print("Fetching a test batch (this will convert the first few .wav files into Mel-Spectrogram tensors)...")
for batch_idx, (spectrograms, labels) in enumerate(dataloader):
    print("\n Success! Batch loaded correctly.")
    print(f"Spectrogram batch shape: {spectrograms.shape}")  # Expected: [4, 1, 128, time_frames]
    print(f"Labels batch shape: {labels.shape}")              # Expected: [4]
    print(f"Sample labels (0 = Normal, 1 = Murmur): {labels}")
    break