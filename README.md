# Pulmonary Nodule Detection Web Application

This web application allows users to upload chest X-ray images and detect pulmonary nodules using a trained YOLOv8 model.

## Features

- Modern and responsive user interface
- Drag and drop file upload
- Real-time nodule detection
- Visual display of detected nodules with bounding boxes
- Confidence scores and nodule details

## Project Structure

```
├── app.py                # FastAPI backend application
├── models/              # Directory containing the trained model
│   └── best_model.pt    # YOLOv8 trained model
├── static/              # Frontend assets
│   ├── index.html       # Main HTML page
│   ├── styles.css       # CSS styles
│   └── script.js        # JavaScript functionality
└── requirements.txt     # Python dependencies
```

## Setup and Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Run the application:

```bash
python app.py
```

3. Open your browser and navigate to `http://localhost:8000`

## Usage

1. Upload a chest X-ray image by dragging and dropping it onto the upload area or by clicking the "Browse Files" button.
2. Wait for the model to process the image and detect any pulmonary nodules.
3. View the results, including the number of detected nodules, confidence levels, and bounding boxes highlighting the nodules in the image.
4. Click "New Scan" to upload another image.

## Model Information

The application uses a YOLOv8 model trained on chest X-ray images to detect pulmonary nodules. The model was trained using the Ultralytics framework and is optimized for detecting small nodules in X-ray images.

## Requirements

- Python 3.8 or higher
- PyTorch
- FastAPI
- Ultralytics YOLOv8
- Modern web browser with JavaScript enabled
