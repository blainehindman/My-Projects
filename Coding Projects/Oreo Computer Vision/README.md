# Oreo Computer Vision

Oreo Computer Vision is a real-time object detection project designed to detect specific objects (e.g., an **OreoContainer**) using a custom-trained YOLOv5 model and OpenCV. This project demonstrates the integration of computer vision, model training, and real-time processing for targeted object detection tasks.

---

## Features

- **Custom YOLOv5 Model Training**: Train a YOLOv5 model on your dataset using PyTorch.
- **Real-Time Object Detection**: Use OpenCV to capture live video and detect objects in real-time.
- **Confidence-Based Filtering**: Filter detections based on confidence levels for accuracy.
- **Automated Responses**: Automatically take action when the target object is detected.

---

## Project Workflow

### 1. Dataset Preparation

- Collect images of your target object (e.g., OreoContainer).
- Label the dataset using tools like [LabelImg](https://github.com/tzutalin/labelImg).
- Save the labeled dataset in YOLO format, specifying classes in a `.yaml` file (e.g., `oreo.yaml`).

Example `oreo.yaml`:

```yaml
train: ../datasets/train
val: ../datasets/val
nc: 1
names: ["OreoContainer"]
```

### 2. Training the YOLOv5 Model

Train the YOLOv5 model on your dataset using the following command:

```bash
python train.py --img 640 --batch 2 --epochs 50 --data ../oreo.yaml --weights yolov5s.pt
```

- `--img`: Image size for training (e.g., 640x640).
- `--batch`: Number of samples per batch (adjust based on GPU memory).
- `--epochs`: Number of training epochs.
- `--data`: Path to the `.yaml` file containing dataset details.
- `--weights`: Pre-trained weights to start the training process (e.g., `yolov5s.pt`).

Training outputs will be saved in `yolov5/runs/train/exp`.

### 3. Real-Time Detection

- Load the trained model using PyTorch and YOLOv5.
- Use OpenCV to capture live video from a connected camera.
- Detect and filter objects based on confidence levels.
- Highlight detected objects in the video feed.

---

## Code Overview

### Importing Required Libraries

The project uses the following libraries:

- `torch`: For loading and running YOLOv5 models.
- `cv2` (OpenCV): For capturing and processing video frames.
- `warnings`: To suppress non-critical warnings.

### Key Sections of the Code

- **Model Loading**:

  ```python
  model = torch.hub.load('ultralytics/yolov5', 'custom', path='yolov5/runs/train/exp6/weights/best.pt')
  ```

- **Video Capture**:

  ```python
  cap = cv2.VideoCapture(0)
  ```

- **Detection Logic**:

  ```python
  results = model(frame)
  detected_objects = results.pandas().xyxy[0]
  detected_objects = detected_objects[detected_objects['confidence'] >= 0.25]
  ```

- **Target Action**:
  ```python
  if row['name'] == 'OreoContainer':
      print("Oreo detected!")
      cap.release()
      cv2.destroyAllWindows()
      exit(0)
  ```

---

## Project Structure

```
Oreo-Computer-Vision/
├── oreo_computer_vision.py   # Main script for object detection
├── datasets/
│   ├── train/                # Training dataset
│   └── val/                  # Validation dataset
├── yolov5/
│   ├── runs/
│   │   └── train/
│   │       └── exp6/
│   │           └── weights/
│   │               └── best.pt   # Trained model weights
│   └── train.py                 # YOLOv5 training script
├── oreo.yaml                   # Dataset configuration
└── README.md                   # Project documentation
```

---

## Output Example

During detection, the following is displayed in the terminal:

```
Objects detected:
       xmin   ymin   xmax   ymax  confidence       name
0    102.5  189.0  390.5  570.0       0.87  OreoContainer
Oreo detected!
```

Bounding boxes and class labels are drawn directly on the live video feed.

---

## Future Improvements

- **Multi-Object Detection**: Extend to detect multiple classes simultaneously.
- **Edge Device Optimization**: Optimize performance for Raspberry Pi or Jetson Nano.
- **Enhanced UI**: Add a GUI for easier interaction and visualization.

---

## Acknowledgments

This project leverages:

- **[YOLOv5](https://github.com/ultralytics/yolov5)** for object detection.
- **[OpenCV](https://opencv.org/)** for video processing.
- **[PyTorch](https://pytorch.org/)** for deep learning model integration.
