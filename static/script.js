document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultCanvas = document.getElementById('resultCanvas');
    const noduleCount = document.getElementById('noduleCount');
    const confidenceLevel = document.getElementById('confidenceLevel');
    const noduleDetails = document.getElementById('noduleDetails');
    const newScanBtn = document.getElementById('newScanBtn');

    // Original image dimensions
    let originalWidth = 0;
    let originalHeight = 0;
    let uploadedImage = null;

    // Event listeners for drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('dragover');
    }

    function unhighlight() {
        dropArea.classList.remove('dragover');
    }

    // Handle file drop
    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            handleFiles(files);
        }
    }

    // Handle file input change
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFiles(this.files);
        }
    });

    // Click on drop area to trigger file input
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle new scan button
    newScanBtn.addEventListener('click', resetUI);

    function resetUI() {
        resultsContainer.style.display = 'none';
        dropArea.style.display = 'block';
        fileInput.value = '';
        noduleDetails.innerHTML = '<p>No nodules detected</p>';
        noduleCount.textContent = '0';
        confidenceLevel.textContent = 'N/A';
        const ctx = resultCanvas.getContext('2d');
        ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
    }

    function handleFiles(files) {
        const file = files[0];
        if (!file.type.match('image.*')) {
            alert('Please upload an image file');
            return;
        }

        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        dropArea.style.display = 'none';

        // Read the file and send to API
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage = new Image();
            uploadedImage.onload = function() {
                originalWidth = uploadedImage.width;
                originalHeight = uploadedImage.height;
                sendImageToAPI(file);
            };
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async function sendImageToAPI(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/predict/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing the image. Please try again.');
            loadingIndicator.style.display = 'none';
            dropArea.style.display = 'block';
        }
    }

    function displayResults(data) {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Show results container
        resultsContainer.style.display = 'block';

        // Set canvas dimensions to match the image
        const ctx = resultCanvas.getContext('2d');
        const maxWidth = 600; // Maximum width for display
        let displayWidth, displayHeight;

        if (originalWidth > maxWidth) {
            const ratio = maxWidth / originalWidth;
            displayWidth = maxWidth;
            displayHeight = originalHeight * ratio;
        } else {
            displayWidth = originalWidth;
            displayHeight = originalHeight;
        }

        resultCanvas.width = displayWidth;
        resultCanvas.height = displayHeight;

        // Draw the image on canvas
        ctx.drawImage(uploadedImage, 0, 0, displayWidth, displayHeight);

        // Update nodule count
        const predictions = data.predictions || [];
        noduleCount.textContent = predictions.length;

        // Calculate average confidence if nodules are detected
        if (predictions.length > 0) {
            const avgConfidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length;
            confidenceLevel.textContent = `${(avgConfidence * 100).toFixed(1)}%`;

            // Draw bounding boxes and update nodule details
            noduleDetails.innerHTML = '';
            predictions.forEach((pred, index) => {
                // Draw bounding box
                const [x, y, w, h] = pred.box;
                const boxX = (x - w/2) * (displayWidth / originalWidth);
                const boxY = (y - h/2) * (displayHeight / originalHeight);
                const boxWidth = w * (displayWidth / originalWidth);
                const boxHeight = h * (displayHeight / originalHeight);

                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 2;
                ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

                // Add label
                ctx.fillStyle = '#3498db';
                ctx.fillRect(boxX, boxY - 20, 70, 20);
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.fillText(`Nodule ${index + 1}`, boxX + 5, boxY - 5);

                // Add nodule details
                const noduleItem = document.createElement('div');
                noduleItem.className = 'nodule-item';
                noduleItem.innerHTML = `
                    <p><strong>Nodule ${index + 1}</strong></p>
                    <p>Confidence: ${(pred.confidence * 100).toFixed(1)}%</p>
                    <p>Size: ${Math.round(w)} x ${Math.round(h)} pixels</p>
                    <div class="confidence-bar">
                        <div class="confidence-level" style="width: ${pred.confidence * 100}%"></div>
                    </div>
                `;
                noduleDetails.appendChild(noduleItem);
            });
        } else {
            confidenceLevel.textContent = 'N/A';
            noduleDetails.innerHTML = '<p>No nodules detected</p>';
        }
    }
});
