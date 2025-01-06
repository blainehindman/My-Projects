import cv2
import torch
import warnings
import os
warnings.filterwarnings("ignore", category=FutureWarning, module="torch.cuda.amp")

weights_path = 'yolov5/runs/train/exp5/weights/best.pt'
print("Checking file path:", weights_path)
print("File exists:", os.path.exists(weights_path))
print("Current working directory:", os.getcwd())


# Load the trained YOLOv5 model
model = torch.hub.load('ultralytics/yolov5', 'custom', path='yolov5/runs/train/exp6/weights/best.pt')
 
# Initialize the camera (default camera is 0)
cap = cv2.VideoCapture(0)

print("Starting video stream. Press 'q' to quit manually.")

try:
    while True:
        # Capture frame from the camera
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame from camera. Exiting...")
            break

        # Perform detection
        results = model(frame)

        # Parse detection results
        detected_objects = results.pandas().xyxy[0]  # Get detections as a DataFrame

        # Filter detections with confidence less than 0.25
        detected_objects = detected_objects[detected_objects['confidence'] >= 0.25]

        if detected_objects.empty:
            print("No objects detected in this frame.")
        else:
            print("Objects detected:")
            print(detected_objects)  # Print the entire DataFrame of detections

        # Parse detection results
        detected_objects = results.pandas().xyxy[0]  # Pandas DataFrame with detections
        for index, row in detected_objects.iterrows():
            if row['name'] == 'OreoContainer':  # Replace with your class name
                print("Oreo detected!")
                cap.release()
                cv2.destroyAllWindows()
                exit(0)

        # Show the live camera feed with detection boxes
        results.render()  # Draw bounding boxes on the frame
        cv2.imwrite("output_frame.jpg", results.ims[0])



        # Exit on pressing 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("Exiting...")

# Release resources
cap.release()
cv2.destroyAllWindows()
