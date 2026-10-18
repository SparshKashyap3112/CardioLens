import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from dataset import HeartSoundDataset
from model import HeartSoundCNN

def train_model():
    # 1. Hyperparameters & Setup
    BATCH_SIZE = 16
    EPOCHS = 10
    LEARNING_RATE = 0.001
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {DEVICE}")

    # 2. Load Dataset
    dataset = HeartSoundDataset(csv_path="training_data.csv", audio_dir="training_data")
    
    # Split into Train (80%) and Validation (20%) sets
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    print(f"Training samples: {train_size} | Validation samples: {val_size}")

    # 3. Initialize Model, Loss Function, and Optimizer
    model = HeartSoundCNN().to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # 4. Training Loop
    for epoch in range(EPOCHS):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for spectrograms, labels in train_loader:
            spectrograms, labels = spectrograms.to(DEVICE), labels.to(DEVICE)

            # Zero gradients
            optimizer.zero_grad()

            # Forward pass
            outputs = model(spectrograms)
            loss = criterion(outputs, labels)

            # Backward pass & optimize
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * spectrograms.size(0)
            _, predicted = torch.max(outputs.data, 1)
            total_train += labels.size(0)
            correct_train += (predicted == labels).sum().item()

        epoch_loss = running_loss / train_size
        epoch_acc = 100 * correct_train / total_train

        # Validation step
        model.eval()
        correct_val = 0
        total_val = 0
        with torch.no_grad():
            for spectrograms, labels in val_loader:
                spectrograms, labels = spectrograms.to(DEVICE), labels.to(DEVICE)
                outputs = model(spectrograms)
                _, predicted = torch.max(outputs.data, 1)
                total_val += labels.size(0)
                correct_val += (predicted == labels).sum().item()

        val_acc = 100 * correct_val / total_val if total_val > 0 else 0

        print(f"Epoch [{epoch+1}/{EPOCHS}] | "
              f"Train Loss: {epoch_loss:.4f} | "
              f"Train Acc: {epoch_acc:.2f}% | "
              f"Val Acc: {val_acc:.2f}%")

    # Save trained model weights
    torch.save(model.state_dict(), "cardiolens_model.pth")
    print("\nTraining complete! Model saved as 'cardiolens_model.pth'.")

if __name__ == "__main__":
    train_model()