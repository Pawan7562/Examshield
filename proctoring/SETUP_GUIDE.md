# Python Proctoring System - Setup Guide

## 🎥 Features Implemented

### ✅ Face Detection
- Real-time face detection using OpenCV
- Multiple face detection
- Face counting and tracking
- Visual face indicators

### ✅ Tab Switching Detection  
- Window monitoring system
- Browser tab tracking
- Switch detection alerts
- Violation counting

### ✅ Camera Monitoring
- Camera status checking
- Frame validation
- Camera error handling
- Automatic reconnection

### ✅ Violation System
- Smart violation thresholds
- Professional violation messages
- Automatic termination logic
- Comprehensive logging

## 🚀 Quick Start

### 1. Install Requirements
```bash
pip install -r requirements.txt
```

### 2. Run Simple Proctoring
```bash
python simple_proctoring.py
```

### 3. Run Advanced Proctoring
```bash
python python_proctoring.py
```

## 📋 System Requirements

### Minimum Requirements
- Python 3.7+
- OpenCV 4.0+
- Webcam camera
- 4GB RAM
- Modern processor

### Optional Requirements
- For tab detection: Windows OS
- For advanced features: TensorFlow
- For browser integration: Browser extensions

## 🔧 Configuration Options

### Face Detection Settings
```python
# Adjust sensitivity
face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.1,  # Adjust for sensitivity
    minNeighbors=5,     # Adjust for accuracy
    minSize=(30, 30)   # Minimum face size
)
```

### Violation Thresholds
```python
# Current thresholds
MAX_FACES = 1              # Max allowed faces
MAX_VIOLATIONS = 5           # Max violations before termination
TAB_SWITCH_LIMIT = 5          # Max tab switches
```

## 🎯 Integration with Web Application

### API Integration
```python
# Send violations to backend
import requests

def send_violation(violation_data):
    url = "http://localhost:5000/api/student/violations"
    response = requests.post(url, json=violation_data)
    return response.json()
```

### Real-time Communication
```python
# WebSocket integration for real-time updates
import socketio

sio = socketio.Client()

@sio.event
def connect():
    print("Connected to exam server")

@sio.event
def violation_report(data):
    sio.emit('proctoring_violation', data)
```

## 📊 Output and Logging

### Console Output
```
🎥 Simple Proctoring System
========================================
Features:
• Face Detection
• Tab Switching Detection  
• Camera Status Monitoring
• Violation Tracking
• Real-time Display
========================================
✅ Face detector loaded successfully
✅ Camera initialized
🎥 Proctoring started...
Press 'q' to quit
```

### Log Files
- `proctoring.log` - Detailed logging
- Console output - Real-time status
- Violation reports - JSON format

## 🛠️ Troubleshooting

### Common Issues

#### Camera Not Working
```bash
# Check camera permissions
python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"

# List available cameras
python -c "import cv2; print(cv2.VideoCapture.getBackendName())"
```

#### Face Detection Not Working
```bash
# Check cascade file
python -c "import cv2; print(cv2.data.haarcascades)"
```

#### Tab Detection Not Working
- Requires Windows OS
- Check pygetwindow installation
- Verify browser permissions

## 🎨 Customization Options

### Add New Violation Types
```python
def detect_custom_violation(self, frame):
    # Add your custom detection logic
    if your_condition:
        self.handle_violation('custom_type', 'Custom violation message')
```

### Modify Thresholds
```python
# Edit violation limits
MAX_VIOLATIONS = 8  # Increase to 8
TAB_SWITCH_LIMIT = 10  # Increase to 10
```

### Change UI Colors
```python
# Modify display colors
status_color = (0, 255, 0)  # Green for active
warning_color = (0, 0, 255)  # Red for warnings
```

## 🚀 Production Deployment

### Docker Support
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY *.py .
CMD ["python", "python_proctoring.py"]
```

### System Service
```bash
# Install as system service (Linux)
sudo cp python_proctoring.py /usr/local/bin/
sudo chmod +x /usr/local/bin/python_proctoring.py
```

## 📞 Support

### Error Codes
- `❌` - Error messages
- `⚠️` - Warning messages  
- `✅` - Success messages
- `🎥` - Camera/proctoring messages
- `🚨` - Termination messages

### Getting Help
```bash
# Check logs
tail -f proctoring.log

# Test components
python -c "import cv2; print('OpenCV:', cv2.__version__)"
python -c "import numpy; print('NumPy:', numpy.__version__)"
```

## 🎯 Next Steps

1. ✅ Test basic functionality
2. ✅ Integrate with web application
3. ✅ Add real-time communication
4. ✅ Implement database logging
5. ✅ Deploy to production

---

**🎥 Professional Proctoring System - Ready for Integration!**
