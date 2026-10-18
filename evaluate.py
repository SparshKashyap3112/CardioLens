import torch
from torch.utils.data import DataLoader, random_split
from dataset import HeartSoundDataset
from model import HeartSoundCNN

def evaluate_model():
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Load dataset and recreate the exact same validation split
    dataset = HeartSoundDataset(csv_path="training_data.csv", audio_dir="training_data")
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    _, val_dataset = random_split(dataset, [train_size, val_size])
    val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False)

    # Load trained model weights
    model = HeartSoundCNN().to(DEVICE)
    model.load_state_dict(torch.load("cardiolens_model.pth", map_location=DEVICE))
    model.eval()

    all_preds = []
    all_labels = []

    with torch.no_grad():
        for spectrograms, labels in val_loader:
            spectrograms, labels = spectrograms.to(DEVICE), labels.to(DEVICE)
            outputs = model(spectrograms)
            _, predicted = torch.max(outputs, 1)
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    # Count predictions vs actual labels
    from collections import Counter
    print("Actual Label Distribution in Validation Set:", Counter(all_labels))
    print("Model Predictions in Validation Set:", Counter(all_preds))

    # Calculate basic accuracy
    correct = sum(p == l for p, l in zip(all_preds, all_labels))
    acc = (correct / len(all_labels)) * 100
    print(f"\nTrue Validation Accuracy: {acc:.2f}%")

if __name__ == "__main__":
    evaluate_model()