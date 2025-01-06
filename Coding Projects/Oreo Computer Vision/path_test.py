import torch

weights_path = r"G:\Other computers\My Computer\My Documents\My Projects\Coding Projects\Oreo Computer Vision\runs\train\exp5\weights\best.pt"

try:
    model = torch.load(weights_path, map_location="cpu")
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
