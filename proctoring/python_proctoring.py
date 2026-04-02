#!/usr/bin/env python3
"""
Professional Proctoring System - Python Implementation
Features: Face Detection, Tab Switching Detection, Camera Monitoring
"""

import cv2
import numpy as np
import time
import threading
import queue
import json
import logging
from datetime import datetime
import psutil
import pygetwindow as gw
import mss
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('proctoring.log'),
        logging.StreamHandler()
    ]
)

class ProctoringSystem:
    def __init__(self):
        self.camera = None
        self.face_cascade = None
        self.running = False
        self.violation_queue = queue.Queue()
        self.face_count = 0
        self.last_face_count = 0
        self.violation_count = 0
        self.active_window = None
        self.last_active_window = None
        self.tab_switch_count = 0
        self.camera_status = "checking"
        self.frame_count = 0
        
        # Load face cascade classifier
        self.load_face_detector()
        
        # Initialize violation tracking
        self.violations = {
            'tab_switch': 0,
            'multiple_faces': 0,
            'camera_off': 0,
            'window_blur': 0,
            'no_face_detected': 0
        }
        
        logging.info("🎥 Proctoring System Initialized")
        logging.info("✅ Face Detection: Ready")
        logging.info("✅ Tab Switching Detection: Ready")
        logging.info("✅ Camera Monitoring: Ready")

    def load_face_detector(self):
        """Load OpenCV face detection cascade"""
        try:
            # Try to load Haar cascade classifier
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            if self.face_cascade.empty():
                logging.warning("⚠️ Face cascade classifier failed to load")
                return False
            
            logging.info("✅ Face detection cascade loaded successfully")
            return True
            
        except Exception as e:
            logging.error(f"❌ Error loading face detector: {e}")
            return False

    def initialize_camera(self, camera_id=0):
        """Initialize camera for proctoring"""
        try:
            self.camera = cv2.VideoCapture(camera_id)
            
            if not self.camera.isOpened():
                logging.error("❌ Failed to open camera")
                return False
            
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            
            # Test camera
            ret, frame = self.camera.read()
            if not ret:
                logging.error("❌ Cannot read from camera")
                return False
            
            self.camera_status = "active"
            logging.info("✅ Camera initialized successfully")
            return True
            
        except Exception as e:
            logging.error(f"❌ Camera initialization error: {e}")
            self.camera_status = "error"
            return False

    def detect_faces(self, frame):
        """Detect faces in frame using OpenCV"""
        if self.face_cascade is None or self.face_cascade.empty():
            return 0
        
        try:
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                maxSize=(300, 300)
            )
            
            face_count = len(faces)
            
            # Draw rectangles around detected faces
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(frame, f"Face {len(faces)}", (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            return face_count, frame
            
        except Exception as e:
            logging.error(f"❌ Face detection error: {e}")
            return 0, frame

    def monitor_active_window(self):
        """Monitor active window for tab switching detection"""
        try:
            current_window = gw.getActiveWindow()
            
            if current_window is None:
                return None
            
            current_title = current_window.title.lower()
            
            # Check if this is a browser window
            browser_keywords = ['chrome', 'firefox', 'edge', 'safari', 'opera']
            is_browser = any(keyword in current_title for keyword in browser_keywords)
            
            if is_browser:
                # Check for tab switching indicators
                tab_indicators = ['new tab', 'untitled', 'blank page']
                is_new_tab = any(indicator in current_title for indicator in tab_indicators)
                
                if self.last_active_window:
                    # Check if window changed significantly
                    if current_title != self.last_active_window:
                        if not is_new_tab:
                            self.tab_switch_count += 1
                            self.violations['tab_switch'] += 1
                            self.violation_count += 1
                            
                            violation_data = {
                                'type': 'tab_switch',
                                'timestamp': datetime.now().isoformat(),
                                'message': f'Tab switch detected: {current_title}',
                                'count': self.tab_switch_count
                            }
                            
                            self.violation_queue.put(violation_data)
                            logging.warning(f"⚠️ Tab switch detected: {current_title}")
                            
                            # Check if should terminate
                            if self.tab_switch_count >= 5:
                                self.handle_termination('tab_switch_exceeded')
                
                self.last_active_window = current_title
                self.active_window = current_title
                
                return {
                    'window_title': current_title,
                    'is_browser': is_browser,
                    'is_new_tab': is_new_tab
                }
            
            return None
            
        except Exception as e:
            logging.error(f"❌ Window monitoring error: {e}")
            return None

    def check_camera_status(self, frame):
        """Check camera status and detect issues"""
        try:
            if frame is None:
                self.camera_status = "off"
                return False
            
            # Check if frame is black (camera off/covered)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            mean_brightness = np.mean(gray)
            
            if mean_brightness < 10:  # Very dark/black frame
                if self.camera_status != "off":
                    self.violations['camera_off'] += 1
                    self.violation_count += 1
                    
                    violation_data = {
                        'type': 'camera_off',
                        'timestamp': datetime.now().isoformat(),
                        'message': 'Camera appears to be off or covered',
                        'brightness': mean_brightness
                    }
                    
                    self.violation_queue.put(violation_data)
                    logging.warning(f"⚠️ Camera off detected (brightness: {mean_brightness})")
                
                self.camera_status = "off"
                return False
            
            self.camera_status = "active"
            return True
            
        except Exception as e:
            logging.error(f"❌ Camera status check error: {e}")
            return False

    def handle_violation(self, violation_type, message, severity="warning"):
        """Handle violation with appropriate action"""
        self.violations[violation_type] = self.violations.get(violation_type, 0) + 1
        self.violation_count += 1
        
        violation_data = {
            'type': violation_type,
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'severity': severity,
            'total_violations': self.violation_count
        }
        
        self.violation_queue.put(violation_data)
        logging.warning(f"⚠️ {violation_type}: {message}")
        
        # Check termination conditions
        if violation_type == 'multiple_faces' and self.violations['multiple_faces'] >= 2:
            self.handle_termination('multiple_faces_detected')
        elif self.violation_count >= 8:
            self.handle_termination('max_violations_exceeded')

    def handle_termination(self, reason):
        """Handle exam termination"""
        termination_data = {
            'type': 'termination',
            'timestamp': datetime.now().isoformat(),
            'reason': reason,
            'total_violations': self.violation_count,
            'violation_breakdown': self.violations.copy()
        }
        
        self.violation_queue.put(termination_data)
        logging.error(f"🚨 EXAM TERMINATED: {reason}")
        logging.error(f"📊 Total violations: {self.violation_count}")
        logging.error(f"📋 Violation breakdown: {json.dumps(self.violations, indent=2)}")
        
        self.running = False

    def start_proctoring(self):
        """Start the proctoring system"""
        if not self.initialize_camera():
            logging.error("❌ Cannot start proctoring without camera")
            return False
        
        self.running = True
        logging.info("🎥 Proctoring started")
        
        try:
            while self.running:
                # Read frame from camera
                ret, frame = self.camera.read()
                
                if not ret:
                    logging.warning("⚠️ Cannot read from camera")
                    time.sleep(1)
                    continue
                
                self.frame_count += 1
                
                # Check camera status
                camera_ok = self.check_camera_status(frame)
                
                if camera_ok:
                    # Detect faces
                    face_count, processed_frame = self.detect_faces(frame)
                    
                    # Handle face count changes
                    if face_count != self.last_face_count:
                        if face_count == 0:
                            self.handle_violation('no_face_detected', 'No face detected in camera')
                        elif face_count > 1:
                            self.handle_violation('multiple_faces', f'Multiple faces detected: {face_count}')
                        
                        self.last_face_count = face_count
                        self.face_count = face_count
                
                # Monitor active window
                window_info = self.monitor_active_window()
                
                # Display proctoring info
                self.display_proctoring_info(processed_frame, face_count)
                
                # Process violations from queue
                self.process_violation_queue()
                
                # Small delay to prevent high CPU usage
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            logging.info("🛑 Proctoring stopped by user")
        except Exception as e:
            logging.error(f"❌ Proctoring error: {e}")
        finally:
            self.cleanup()

    def display_proctoring_info(self, frame, face_count):
        """Display proctoring information on frame"""
        try:
            # Create overlay text
            height, width = frame.shape[:2]
            
            # Status text
            status_color = (0, 255, 0) if self.camera_status == "active" else (0, 0, 255)
            cv2.putText(frame, f"Camera: {self.camera_status}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)
            
            # Face count
            face_color = (0, 255, 0) if face_count == 1 else (0, 0, 255)
            cv2.putText(frame, f"Faces: {face_count}", (10, 60), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, face_color, 2)
            
            # Violation count
            cv2.putText(frame, f"Violations: {self.violation_count}", (10, 90), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            # Active window
            if self.active_window:
                window_text = self.active_window[:30] + "..." if len(self.active_window) > 30 else self.active_window
                cv2.putText(frame, f"Window: {window_text}", (10, 120), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Timestamp
            timestamp = datetime.now().strftime("%H:%M:%S")
            cv2.putText(frame, timestamp, (width - 100, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
        except Exception as e:
            logging.error(f"❌ Display error: {e}")

    def process_violation_queue(self):
        """Process violations from queue"""
        try:
            while not self.violation_queue.empty():
                violation = self.violation_queue.get_nowait()
                
                # Here you would send violation to backend/API
                logging.info(f"📤 Violation queued: {json.dumps(violation, indent=2)}")
                
        except queue.Empty:
            pass
        except Exception as e:
            logging.error(f"❌ Queue processing error: {e}")

    def cleanup(self):
        """Cleanup resources"""
        if self.camera:
            self.camera.release()
            logging.info("✅ Camera released")
        
        cv2.destroyAllWindows()
        logging.info("✅ Proctoring system stopped")

    def get_violation_report(self):
        """Get current violation report"""
        return {
            'total_violations': self.violation_count,
            'violation_breakdown': self.violations,
            'camera_status': self.camera_status,
            'face_count': self.face_count,
            'tab_switch_count': self.tab_switch_count,
            'frames_processed': self.frame_count
        }

def main():
    """Main function to run proctoring system"""
    print("🎥 Professional Proctoring System - Python")
    print("=" * 50)
    print("Features:")
    print("✅ Real-time Face Detection")
    print("✅ Tab Switching Detection")
    print("✅ Camera Status Monitoring")
    print("✅ Violation Tracking")
    print("✅ Automatic Termination")
    print("=" * 50)
    
    # Initialize proctoring system
    proctor = ProctoringSystem()
    
    try:
        # Start proctoring
        proctor.start_proctoring()
        
    except KeyboardInterrupt:
        print("\n🛑 Proctoring stopped by user")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
    finally:
        # Print final report
        report = proctor.get_violation_report()
        print("\n" + "=" * 50)
        print("📊 FINAL PROCTORING REPORT")
        print("=" * 50)
        print(json.dumps(report, indent=2))
        print("=" * 50)

if __name__ == "__main__":
    main()
