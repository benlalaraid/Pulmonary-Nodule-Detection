import os
import io
import torch
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pulmonary Nodule Detection API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load the model if available
model_path = os.path.join(os.path.dirname(__file__), "models", "best_model.pt")
model = None
try:
    from ultralytics import YOLO
    if os.path.exists(model_path):
        model = YOLO(model_path)
        logger.info(f"Model loaded successfully from {model_path}")
    else:
        logger.warning(f"Model file not found at {model_path}")
        logger.warning("Running in demo mode without model inference")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    logger.warning("Running in demo mode without model inference")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open(os.path.join("static", "index.html"), "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Perform prediction if model is available
        result_data = []
        if model is not None:
            results = model(image)
            
            # Process results
            for i, result in enumerate(results):
                boxes = result.boxes
                for box in boxes:
                    # Get box coordinates (normalized xywh format)
                    x, y, w, h = box.xywh[0].tolist()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    
                    result_data.append({
                        "box": [x, y, w, h],
                        "confidence": conf,
                        "class": cls,
                        "class_name": "nodule"
                    })
        else:
            # Demo mode - return dummy data
            logger.info("Using demo mode for prediction")
            result_data = [{
                "box": [100, 100, 50, 50],
                "confidence": 0.85,
                "class": 0,
                "class_name": "nodule"
            }]
        
        return JSONResponse(content={
            "success": True,
            "predictions": result_data,
            "message": f"Found {len(result_data)} nodules"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
