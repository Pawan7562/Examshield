#!/usr/bin/env python3
"""
Professional Exam Proctoring System - Production Ready
Features: Tab Switching Detection, Face Detection, Full Screen Mode, Auto-Termination
"""

import cv2
import numpy as np
import time
import threading
import queue
import json
import logging
import os
import sys
from datetime import datetime
import tkinter as tk
from tkinter import messagebox, font
import pyautogui
import psutil
import webbrowser
from PIL import Image, ImageTk, ImageDraw, ImageFont
import requests
from dataclasses import dataclass
from typing import Optional, Dict, List
import sqlite3

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('exam_proctoring.log'),
        logging.StreamHandler()
    ]
)

@dataclass
class Violation:
    type: str
    timestamp: datetime
    message: str
    severity: str = "warning"

class ExamProctoringSystem:
    def __init__(self, exam_id: str, student_id: str, backend_url: str = "http://localhost:5000"):
        self.exam_id = exam_id
        self.student_id = student_id
        self.backend_url = backend_url
        
        # Proctoring state
        self.running = False
        self.exam_terminated = False
        self.full_screen_active = False
        
        # Camera and face detection
        self.camera = None
        self.face_cascade = None
        self.face_count = 0
        self.last_face_count = 0
        self.camera_status = "checking"
        self.frame_count = 0
        
        # Violation tracking (3 warnings = termination)
        self.warning_count = 0
        self.max_warnings = 3
        self.violations: List[Violation] = []
        self.violation_types = {
            'tab_switch': 0,
            'camera_off': 0,
            'no_face_detected': 0,
            'multiple_faces': 0,
            'window_blur': 0
        }
        
        # Tab switching detection
        self.active_window = None
        self.last_active_window = None
        self.tab_switch_count = 0
        self.allowed_windows = ['exam', 'proctoring']
        
        # GUI components
        self.root = None
        self.proctoring_window = None
        self.camera_label = None
        self.status_label = None
        self.violation_label = None
        
        # Database for local logging
        self.init_database()
        
        # Load face detection
        self.setup_face_detection()
        
        logging.info(f"🎥 Proctoring System Initialized for Exam {exam_id}")
        logging.info(f"👤 Student ID: {student_id}")
        logging.info("✅ All systems ready")

    def init_database(self):
        """Initialize SQLite database for local logging"""
        try:
            self.conn = sqlite3.connect('proctoring.db')
            cursor = self.conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS violations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    exam_id TEXT,
                    student_id TEXT,
                    violation_type TEXT,
                    timestamp TEXT,
                    message TEXT,
                    severity TEXT
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS exam_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    exam_id TEXT,
                    student_id TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    status TEXT,
                    total_violations INTEGER,
                    termination_reason TEXT
                )
            ''')
            
            self.conn.commit()
            logging.info("✅ Database initialized")
            
        except Exception as e:
            logging.error(f"❌ Database initialization error: {e}")

    def setup_face_detection(self):
        """Setup OpenCV face detection"""
        try:
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            if self.face_cascade.empty():
                logging.warning("⚠️ Face cascade classifier not loaded")
                return False
            
            logging.info("✅ Face detection loaded successfully")
            return True
            
        except Exception as e:
            logging.error(f"❌ Face detection setup error: {e}")
            return False

    def initialize_camera(self):
        """Initialize camera for proctoring"""
        try:
            self.camera = cv2.VideoCapture(0)
            
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
        """Detect faces in frame"""
        if self.face_cascade is None:
            return 0, frame
        
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                maxSize=(300, 300)
            )
            
            face_count = len(faces)
            
            # Draw rectangles around faces
            for (x, y, w, h) in faces:
                color = (0, 255, 0) if face_count == 1 else (0, 0, 255)
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                
                # Add face label
                label = f"Person {len(faces)}"
                cv2.putText(frame, label, (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            return face_count, frame
            
        except Exception as e:
            logging.error(f"❌ Face detection error: {e}")
            return 0, frame

    def monitor_tab_switching(self):
        """Monitor for tab switching using window focus"""
        try:
            # Get current active window
            current_window = self.get_active_window_info()
            
            if current_window:
                window_title = current_window.get('title', '').lower()
                
                # Check if this is a tab switch
                if self.last_active_window and window_title != self.last_active_window:
                    # Check if it's not the exam window
                    if not any(keyword in window_title for keyword in self.allowed_windows):
                        self.handle_violation('tab_switch', 'Tab switching detected')
                        self.tab_switch_count += 1
                
                self.last_active_window = window_title
                
        except Exception as e:
            logging.error(f"❌ Tab monitoring error: {e}")

    def get_active_window_info(self):
        """Get active window information"""
        try:
            if sys.platform == "win32":
                import win32gui
                window_handle = win32gui.GetForegroundWindow()
                window_title = win32gui.GetWindowText(window_handle)
                return {'title': window_title, 'handle': window_handle}
            else:
                # For other platforms, use a simplified approach
                return {'title': 'unknown', 'handle': None}
        except ImportError:
            logging.warning("⚠️ Window monitoring not available on this platform")
            return None
        except Exception as e:
            logging.error(f"❌ Window info error: {e}")
            return None

    def check_camera_status(self, frame):
        """Check if camera is active and working"""
        try:
            if frame is None:
                if self.camera_status != "off":
                    self.handle_violation('camera_off', 'Camera is not available')
                self.camera_status = "off"
                return False
            
            # Check if frame is black (camera off/covered)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            mean_brightness = np.mean(gray)
            
            if mean_brightness < 10:
                if self.camera_status != "off":
                    self.handle_violation('camera_off', 'Camera appears to be off or covered')
                self.camera_status = "off"
                return False
            
            self.camera_status = "active"
            return True
            
        except Exception as e:
            logging.error(f"❌ Camera status check error: {e}")
            return False

    def handle_violation(self, violation_type: str, message: str):
        """Handle violation with warning system"""
        if self.exam_terminated:
            return
        
        # Create violation
        violation = Violation(
            type=violation_type,
            timestamp=datetime.now(),
            message=message,
            severity="warning"
        )
        
        self.violations.append(violation)
        self.violation_types[violation_type] += 1
        self.warning_count += 1
        
        # Log to database
        self.log_violation_to_db(violation)
        
        # Send to backend
        self.send_violation_to_backend(violation)
        
        # Update GUI
        self.update_violation_display()
        
        logging.warning(f"⚠️ WARNING {self.warning_count}/3: {message}")
        
        # Check if should terminate (3 warnings)
        if self.warning_count >= self.max_warnings:
            self.terminate_exam(f"Maximum warnings reached ({self.max_warnings})")

    def log_violation_to_db(self, violation: Violation):
        """Log violation to local database"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO violations (exam_id, student_id, violation_type, timestamp, message, severity)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (self.exam_id, self.student_id, violation.type, 
                  violation.timestamp.isoformat(), violation.message, violation.severity))
            self.conn.commit()
        except Exception as e:
            logging.error(f"❌ Database logging error: {e}")

    def send_violation_to_backend(self, violation: Violation):
        """Send violation to backend API"""
        try:
            data = {
                'examId': self.exam_id,
                'studentId': self.student_id,
                'type': violation.type,
                'description': violation.message,
                'timestamp': violation.timestamp.isoformat()
            }
            
            response = requests.post(f"{self.backend_url}/api/student/violations", 
                                   json=data, timeout=5)
            
            if response.status_code == 200:
                logging.info(f"✅ Violation reported to backend: {violation.type}")
            else:
                logging.warning(f"⚠️ Backend response: {response.status_code}")
                
        except Exception as e:
            logging.error(f"❌ Backend communication error: {e}")

    def create_proctoring_gui(self):
        """Create professional proctoring GUI"""
        try:
            self.root = tk.Tk()
            self.root.title("Exam Proctoring System")
            self.root.geometry("800x600")
            self.root.configure(bg='#1a1a2e')
            
            # Make window always on top
            self.root.attributes('-topmost', True)
            
            # Custom fonts
            title_font = font.Font(family="Arial", size=16, weight="bold")
            status_font = font.Font(family="Arial", size=12)
            
            # Title
            title_label = tk.Label(
                self.root, 
                text="🎥 EXAM PROCTORING SYSTEM", 
                font=title_font,
                bg='#1a1a2e',
                fg='#00ff00'
            )
            title_label.pack(pady=10)
            
            # Camera display
            self.camera_label = tk.Label(
                self.root,
                text="Initializing Camera...",
                font=status_font,
                bg='#1a1a2e',
                fg='#ffff00'
            )
            self.camera_label.pack(pady=10)
            
            # Status display
            status_frame = tk.Frame(self.root, bg='#1a1a2e')
            status_frame.pack(pady=20)
            
            self.status_label = tk.Label(
                status_frame,
                text="Status: Checking...",
                font=status_font,
                bg='#1a1a2e',
                fg='#00ffff'
            )
            self.status_label.pack()
            
            # Violation display
            self.violation_label = tk.Label(
                status_frame,
                text="Warnings: 0/3",
                font=status_font,
                bg='#1a1a2e',
                fg='#ffff00'
            )
            self.violation_label.pack()
            
            # Instructions
            instructions = tk.Label(
                self.root,
                text="• Keep your face visible at all times\n• Do not switch tabs or windows\n• Keep camera ON throughout the exam",
                font=status_font,
                bg='#1a1a2e',
                fg='#ffffff',
                justify=tk.LEFT
            )
            instructions.pack(pady=20)
            
            # Termination button (for testing)
            terminate_btn = tk.Button(
                self.root,
                text="Terminate Exam (Testing)",
                command=self.terminate_exam,
                bg='#ff0000',
                fg='#ffffff',
                font=status_font
            )
            terminate_btn.pack(pady=10)
            
            logging.info("✅ Proctoring GUI created")
            
        except Exception as e:
            logging.error(f"❌ GUI creation error: {e}")

    def update_violation_display(self):
        """Update violation display in GUI"""
        try:
            if self.violation_label:
                color = '#ff0000' if self.warning_count >= 2 else '#ffff00' if self.warning_count >= 1 else '#00ff00'
                self.violation_label.config(
                    text=f"Warnings: {self.warning_count}/3",
                    fg=color
                )
        except Exception as e:
            logging.error(f"❌ Display update error: {e}")

    def update_camera_display(self, frame):
        """Update camera display in GUI"""
        try:
            if self.camera_label and frame is not None:
                # Convert OpenCV frame to PIL Image
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(frame_rgb)
                img = img.resize((400, 300), Image.Resampling.LANCZOS)
                
                # Convert to PhotoImage
                photo = ImageTk.PhotoImage(image=img)
                
                # Update label
                self.camera_label.config(image=photo)
                self.camera_label.image = photo  # Keep reference
                
        except Exception as e:
            logging.error(f"❌ Camera display error: {e}")

    def update_status_display(self):
        """Update status display"""
        try:
            if self.status_label:
                status_text = f"Camera: {self.camera_status} | Faces: {self.face_count} | Time: {datetime.now().strftime('%H:%M:%S')}"
                color = '#00ff00' if self.camera_status == 'active' else '#ff0000'
                self.status_label.config(text=status_text, fg=color)
        except Exception as e:
            logging.error(f"❌ Status update error: {e}")

    def start_full_screen_exam(self):
        """Start exam in full screen mode"""
        try:
            logging.info("🖥️ Starting full screen exam mode")
            
            # Create proctoring window
            self.create_proctoring_gui()
            
            # Set full screen
            self.root.attributes('-fullscreen', True)
            self.full_screen_active = True
            
            # Bind escape key to prevent exit
            self.root.bind('<Escape>', lambda e: None)
            self.root.bind('<F11>', lambda e: None)
            self.root.bind('<Alt-F4>', lambda e: None)
            
            # Start proctoring threads
            self.start_proctoring_threads()
            
            # Start GUI update loop
            self.update_gui_loop()
            
            # Start main loop
            self.root.mainloop()
            
        except Exception as e:
            logging.error(f"❌ Full screen setup error: {e}")

    def start_proctoring_threads(self):
        """Start proctoring monitoring threads"""
        try:
            # Camera monitoring thread
            camera_thread = threading.Thread(target=self.camera_monitoring_loop, daemon=True)
            camera_thread.start()
            
            # Tab monitoring thread
            tab_thread = threading.Thread(target=self.tab_monitoring_loop, daemon=True)
            tab_thread.start()
            
            logging.info("✅ Proctoring threads started")
            
        except Exception as e:
            logging.error(f"❌ Thread start error: {e}")

    def camera_monitoring_loop(self):
        """Camera monitoring loop"""
        while self.running and not self.exam_terminated:
            try:
                if self.camera and self.camera.isOpened():
                    ret, frame = self.camera.read()
                    
                    if ret:
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
                            
                            # Update display (in main thread)
                            self.root.after(0, self.update_camera_display, processed_frame)
                    
                time.sleep(0.1)  # 10 FPS
                
            except Exception as e:
                logging.error(f"❌ Camera monitoring error: {e}")
                time.sleep(1)

    def tab_monitoring_loop(self):
        """Tab switching monitoring loop"""
        while self.running and not self.exam_terminated:
            try:
                self.monitor_tab_switching()
                time.sleep(1)  # Check every second
            except Exception as e:
                logging.error(f"❌ Tab monitoring error: {e}")
                time.sleep(1)

    def update_gui_loop(self):
        """Update GUI elements"""
        try:
            if not self.exam_terminated:
                self.update_status_display()
                self.root.after(1000, self.update_gui_loop)  # Update every second
        except Exception as e:
            logging.error(f"❌ GUI update error: {e}")

    def terminate_exam(self, reason: str = "Manual termination"):
        """Terminate exam and auto-submit"""
        if self.exam_terminated:
            return
        
        self.exam_terminated = True
        self.running = False
        
        logging.error(f"🚨 EXAM TERMINATED: {reason}")
        logging.error(f"📊 Total violations: {self.warning_count}")
        logging.error(f"📋 Violation breakdown: {self.violation_types}")
        
        # Update database
        self.update_exam_session_status(termination_reason=reason)
        
        # Send termination to backend
        self.send_termination_to_backend(reason)
        
        # Show termination message
        self.show_termination_message(reason)
        
        # Auto-submit exam answers
        self.auto_submit_exam()

    def update_exam_session_status(self, termination_reason: str):
        """Update exam session status in database"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO exam_sessions (exam_id, student_id, start_time, end_time, status, total_violations, termination_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (self.exam_id, self.student_id, datetime.now().isoformat(), 
                  datetime.now().isoformat(), 'terminated', self.warning_count, termination_reason))
            self.conn.commit()
        except Exception as e:
            logging.error(f"❌ Session status update error: {e}")

    def send_termination_to_backend(self, reason: str):
        """Send termination to backend"""
        try:
            data = {
                'examId': self.exam_id,
                'studentId': self.student_id,
                'reason': reason,
                'totalViolations': self.warning_count,
                'violationBreakdown': self.violation_types,
                'timestamp': datetime.now().isoformat()
            }
            
            response = requests.post(f"{self.backend_url}/api/student/terminate", 
                                   json=data, timeout=10)
            
            if response.status_code == 200:
                logging.info("✅ Termination sent to backend")
            else:
                logging.warning(f"⚠️ Backend termination response: {response.status_code}")
                
        except Exception as e:
            logging.error(f"❌ Termination backend error: {e}")

    def show_termination_message(self, reason: str):
        """Show termination message to student"""
        try:
            if self.root:
                # Create termination dialog
                dialog = tk.Toplevel(self.root)
                dialog.title("Exam Terminated")
                dialog.geometry("500x300")
                dialog.configure(bg='#1a1a2e')
                
                # Make dialog modal
                dialog.transient(self.root)
                dialog.grab_set()
                
                # Termination message
                message = f"""
🚨 EXAM TERMINATED 🚨

Reason: {reason}
Total Warnings: {self.warning_count}/3

Your exam has been automatically terminated.
Your answers will be submitted automatically.

Please contact your instructor if you believe this is an error.
                """
                
                message_label = tk.Label(
                    dialog,
                    text=message,
                    font=("Arial", 12),
                    bg='#1a1a2e',
                    fg='#ffffff',
                    justify=tk.CENTER
                )
                message_label.pack(pady=50)
                
                # OK button
                ok_btn = tk.Button(
                    dialog,
                    text="OK",
                    command=lambda: self.close_application(dialog),
                    bg='#ff0000',
                    fg='#ffffff',
                    font=("Arial", 12)
                )
                ok_btn.pack(pady=20)
                
        except Exception as e:
            logging.error(f"❌ Termination dialog error: {e}")

    def auto_submit_exam(self):
        """Auto-submit exam answers"""
        try:
            logging.info("📤 Auto-submitting exam answers...")
            
            # Here you would implement the actual exam submission
            # For now, we'll just log it
            submission_data = {
                'examId': self.exam_id,
                'studentId': self.student_id,
                'submissionTime': datetime.now().isoformat(),
                'terminationReason': 'proctoring_violations',
                'totalViolations': self.warning_count
            }
            
            # Send to backend
            response = requests.post(f"{self.backend_url}/api/student/submit", 
                                   json=submission_data, timeout=10)
            
            if response.status_code == 200:
                logging.info("✅ Exam auto-submitted successfully")
            else:
                logging.warning(f"⚠️ Submission response: {response.status_code}")
                
        except Exception as e:
            logging.error(f"❌ Auto-submission error: {e}")

    def close_application(self, dialog=None):
        """Close application"""
        try:
            if dialog:
                dialog.destroy()
            
            if self.root:
                self.root.quit()
                self.root.destroy()
            
            # Cleanup camera
            if self.camera:
                self.camera.release()
            
            # Cleanup database
            if self.conn:
                self.conn.close()
            
            logging.info("✅ Application closed")
            
        except Exception as e:
            logging.error(f"❌ Application close error: {e}")

    def start_exam(self):
        """Start the complete exam proctoring system"""
        try:
            logging.info("🚀 Starting Exam Proctoring System")
            
            # Initialize camera
            if not self.initialize_camera():
                messagebox.showerror("Error", "Failed to initialize camera. Exam cannot start.")
                return
            
            # Create exam session record
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO exam_sessions (exam_id, student_id, start_time, status, total_violations)
                VALUES (?, ?, ?, ?, ?)
            ''', (self.exam_id, self.student_id, datetime.now().isoformat(), 'started', 0))
            self.conn.commit()
            
            # Set running state
            self.running = True
            
            # Start full screen exam
            self.start_full_screen_exam()
            
        except Exception as e:
            logging.error(f"❌ Exam start error: {e}")
            messagebox.showerror("Error", f"Failed to start exam: {e}")

def main():
    """Main function to run the proctoring system"""
    try:
        print("🎥 Professional Exam Proctoring System")
        print("=" * 50)
        print("Features:")
        print("✅ Tab Switching Detection")
        print("✅ Face Detection")
        print("✅ Camera Monitoring")
        print("✅ Full Screen Mode")
        print("✅ Auto-Termination (3 warnings)")
        print("✅ Auto-Submission")
        print("=" * 50)
        
        # Get exam details (in real app, these would come from login/exam selection)
        exam_id = input("Enter Exam ID: ").strip()
        student_id = input("Enter Student ID: ").strip()
        backend_url = input("Enter Backend URL (default: http://localhost:5000): ").strip()
        
        if not backend_url:
            backend_url = "http://localhost:5000"
        
        if not exam_id or not student_id:
            print("❌ Exam ID and Student ID are required")
            return
        
        # Create and start proctoring system
        proctor = ExamProctoringSystem(exam_id, student_id, backend_url)
        proctor.start_exam()
        
    except KeyboardInterrupt:
        print("\n🛑 Proctoring system interrupted")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        logging.error(f"❌ Fatal error: {e}")

if __name__ == "__main__":
    main()
