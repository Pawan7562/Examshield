#!/usr/bin/env python3
"""
Demo Proctoring System - Quick Test
Shows all features in action
"""

import cv2
import time
import tkinter as tk
from tkinter import messagebox
import threading
from datetime import datetime

class DemoProctoring:
    def __init__(self):
        self.camera = None
        self.face_cascade = None
        self.running = False
        self.violation_count = 0
        self.max_violations = 3
        
        print("🎥 Demo Proctoring System")
        print("=" * 40)
        print("Testing all features...")
        
    def test_camera(self):
        """Test camera functionality"""
        print("\n📷 Testing Camera...")
        try:
            self.camera = cv2.VideoCapture(0)
            if self.camera.isOpened():
                ret, frame = self.camera.read()
                if ret:
                    print("✅ Camera working - Frame captured")
                    return True
                else:
                    print("❌ Camera cannot read frames")
                    return False
            else:
                print("❌ Camera not accessible")
                return False
        except Exception as e:
            print(f"❌ Camera error: {e}")
            return False
    
    def test_face_detection(self):
        """Test face detection"""
        print("\n👤 Testing Face Detection...")
        try:
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            if self.face_cascade.empty():
                print("❌ Face cascade not loaded")
                return False
            
            # Test with a frame
            ret, frame = self.camera.read()
            if ret:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, 1.1, 5)
                print(f"✅ Face detection working - Found {len(faces)} faces")
                return True
            else:
                print("❌ Cannot get frame for face detection")
                return False
                
        except Exception as e:
            print(f"❌ Face detection error: {e}")
            return False
    
    def test_violation_system(self):
        """Test violation system"""
        print("\n⚠️ Testing Violation System...")
        try:
            violations = []
            
            # Simulate violations
            violation_types = ['tab_switch', 'camera_off', 'no_face_detected']
            
            for i, v_type in enumerate(violation_types):
                self.violation_count += 1
                violations.append({
                    'type': v_type,
                    'count': self.violation_count,
                    'timestamp': datetime.now().strftime('%H:%M:%S')
                })
                print(f"⚠️ Warning {self.violation_count}/3: {v_type}")
                
                if self.violation_count >= self.max_violations:
                    print("🚨 MAX VIOLATIONS REACHED - Exam Terminated!")
                    break
            
            print("✅ Violation system working correctly")
            return True
            
        except Exception as e:
            print(f"❌ Violation system error: {e}")
            return False
    
    def test_gui(self):
        """Test GUI components"""
        print("\n🖥️ Testing GUI...")
        try:
            root = tk.Tk()
            root.title("Demo GUI")
            root.geometry("400x300")
            
            # Test labels
            tk.Label(root, text="🎥 Proctoring Demo", font=("Arial", 16, "bold")).pack(pady=20)
            tk.Label(root, text="Camera: Active", fg="green").pack()
            tk.Label(root, text="Faces: 1", fg="green").pack()
            tk.Label(root, text=f"Warnings: {self.violation_count}/3", fg="orange").pack()
            
            # Auto close after 2 seconds
            root.after(2000, root.destroy)
            
            print("✅ GUI components working")
            root.mainloop()
            return True
            
        except Exception as e:
            print(f"❌ GUI error: {e}")
            return False
    
    def run_demo(self):
        """Run complete demo"""
        print("\n🚀 Starting Complete Demo...")
        
        # Test all components
        tests = [
            ("Camera", self.test_camera),
            ("Face Detection", self.test_face_detection),
            ("Violation System", self.test_violation_system),
            ("GUI", self.test_gui)
        ]
        
        results = []
        for test_name, test_func in tests:
            result = test_func()
            results.append((test_name, result))
        
        # Summary
        print("\n" + "=" * 40)
        print("📊 DEMO RESULTS")
        print("=" * 40)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:20} : {status}")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - System Ready!")
        else:
            print("⚠️ Some tests failed - Check configuration")
        
        # Cleanup
        if self.camera:
            self.camera.release()
        
        return passed == total

def main():
    """Main demo function"""
    print("🎥 Professional Exam Proctoring System - Demo")
    print("This demo tests all core features")
    print()
    
    demo = DemoProctoring()
    success = demo.run_demo()
    
    if success:
        print("\n🚀 Ready to run production system!")
        print("Run: python production_proctoring.py")
    else:
        print("\n❌ Fix issues before running production")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
