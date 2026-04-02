# 🔍 Tab Switching Detection - DEBUG & TESTING GUIDE

## ❌ **ISSUE: Tab Switching Not Working**

I've added comprehensive debugging to identify why tab switching detection isn't working. Here's what to check:

---

## 🔧 **DEBUGGING ENHANCEMENTS ADDED:**

### **1. Tab Switching Detection Initialization Debug**
```javascript
console.log('🎯 TAB SWITCHING DETECTION INITIALIZING:', {
  phase: phase,
  isProctored: examData?.is_proctored,
  submitted: submitted
});

if (phase !== 'exam' || !examData?.is_proctored) {
  console.log('❌ Tab switching detection disabled:', {
    reason: phase !== 'exam' ? 'Not in exam phase' : 'Exam not proctored',
    phase: phase,
    isProctored: examData?.is_proctored
  });
  return;
}

console.log('✅ Tab switching detection ENABLED');
```

### **2. Visibility Change Detection Debug**
```javascript
const handleVisibilityChange = () => {
  console.log('🔍 Visibility change detected:', {
    documentHidden: document.hidden,
    phase: phase,
    submitted: submitted,
    isTabSwitching: isTabSwitching,
    isProctored: examData?.is_proctored
  });
  
  if (document.hidden && !isTabSwitching && phase === 'exam' && !submitted && examData?.is_proctored) {
    console.log('🚨 Tab switch detected - starting violation process');
    isTabSwitching = true;
    
    setTimeout(() => {
      if (document.hidden) {
        console.log('✅ Confirming tab switch violation');
        handleViolation('tab_switch', 'Student switched to another tab or window');
      } else {
        console.log('❌ Tab switch cancelled - user returned quickly');
      }
      isTabSwitching = false;
    }, 500);
  } else {
    console.log('🔍 Visibility change ignored:', {
      documentHidden: document.hidden,
      isTabSwitching: isTabSwitching,
      phase: phase,
      submitted: submitted,
      isProctored: examData?.is_proctored
    });
  }
};
```

### **3. Violation Handler Debug**
```javascript
const handleViolation = (type, description) => {
  console.log('🚨 VIOLATION HANDLER CALLED:', {
    type: type,
    description: description,
    submitted: submitted,
    currentTime: Date.now(),
    lastViolationTime: lastViolationTime
  });
  
  if (submitted) {
    console.log('❌ Violation ignored - exam already submitted');
    return;
  }

  const currentTime = Date.now();
  
  if (currentTime - lastViolationTime < 2000) {
    console.log('❌ Violation ignored - duplicate within 2 seconds');
    return;
  }
  
  lastViolationTime = currentTime;
  violationCount++;
  
  console.log('📊 VIOLATION COUNT:', violationCount, '/', maxViolations);
  console.log('📝 Setting warning message:', message);
  console.log('📡 Reporting violation to backend...');
  // ... rest of violation handling
};
```

### **4. Event Listener Setup Debug**
```javascript
console.log('📡 Setting up event listeners...');
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('focus', handleWindowFocus);
document.addEventListener('contextmenu', handleContextMenu);
document.addEventListener('keydown', handleKeyDown, true);
console.log('✅ Event listeners setup complete');
```

---

## 🧪 **TESTING INSTRUCTIONS:**

### **Step 1: Start the Application**
1. **Navigate to**: http://localhost:3000
2. **Login/Register** as a student
3. **Select an exam** and click "Start Exam"
4. **Enter exam key** to begin

### **Step 2: Check Console Logs**
1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Look for these initialization messages**:
   ```
   🎯 TAB SWITCHING DETECTION INITIALIZING: {phase: "exam", isProctored: true, submitted: false}
   ✅ Tab switching detection ENABLED
   📡 Setting up event listeners...
   ✅ Event listeners setup complete
   ```

### **Step 3: Test Tab Switching**
1. **Switch to another tab** or minimize the browser
2. **Check console for visibility change**:
   ```
   🔍 Visibility change detected: {documentHidden: true, phase: "exam", submitted: false, isTabSwitching: false, isProctored: true}
   🚨 Tab switch detected - starting violation process
   ✅ Confirming tab switch violation
   🚨 VIOLATION HANDLER CALLED: {type: "tab_switch", description: "Student switched to another tab or window", submitted: false, currentTime: 164...}
   📊 VIOLATION COUNT: 1 / 3
   📝 Setting warning message: ⚠️ Warning 1/3: Please remain focused on your exam. Tab switching is not allowed.
   📡 Reporting violation to backend...
   ⏰ Setting warning timeout for 4 seconds
   ```

3. **Switch back to the exam tab**
4. **Check console for focus event**:
   ```
   🔍 Visibility change detected: {documentHidden: false, phase: "exam", submitted: false, isTabSwitching: false, isProctored: true}
   🔍 Visibility change ignored: {documentHidden: false, isTabSwitching: false, phase: "exam", submitted: false, isProctored: true}
   ```

### **Step 4: Check Warning Display**
1. **Look for warning banner** at the top of the page
2. **Should display**: "⚠️ Warning 1/3: Please remain focused on your exam. Tab switching is not allowed."
3. **Should disappear** after 4 seconds if no more violations

### **Step 5: Test Multiple Violations**
1. **Switch tabs 2 more times** (total 3 violations)
2. **Check console for auto-termination**:
   ```
   🚨 EXAM TERMINATED: Maximum violations (3) reached
   📤 Auto-submitting exam due to maximum violations...
   ```

3. **Check warning message**: "🚨 EXAM TERMINATED: You have reached the maximum number of violations. Your exam will be submitted automatically."

---

## 🔍 **TROUBLESHOOTING CHECKLIST:**

### **❌ If Tab Switching Detection is Disabled:**
**Check Console For:**
```
❌ Tab switching detection disabled: {reason: "Not in exam phase", phase: "key", isProctored: true}
```
**Solution:** Make sure you're in the exam phase (not key entry phase)

**Check Console For:**
```
❌ Tab switching detection disabled: {reason: "Exam not proctored", phase: "exam", isProctored: false}
```
**Solution:** Make sure the exam has `is_proctored: true` in the database

### **❌ If Visibility Changes Are Ignored:**
**Check Console For:**
```
🔍 Visibility change ignored: {documentHidden: true, isTabSwitching: true, phase: "exam", submitted: false, isProctored: true}
```
**Solution:** Wait for the current tab switch detection to complete (500ms delay)

**Check Console For:**
```
🔍 Visibility change ignored: {documentHidden: false, phase: "exam", submitted: false, isProctored: true}
```
**Solution:** This is normal - visibility change to visible is ignored for tab switching

### **❌ If Violations Are Ignored:**
**Check Console For:**
```
❌ Violation ignored - exam already submitted
```
**Solution:** The exam is already submitted, no more violations will be counted

**Check Console For:**
```
❌ Violation ignored - duplicate within 2 seconds
```
**Solution:** Wait 2 seconds between violations to test again

### **❌ If Warning Messages Don't Appear:**
**Check Console For:**
```
📝 Setting warning message: ⚠️ Warning 1/3: Please remain focused on your exam. Tab switching is not allowed.
```
**But no visual warning appears:**
**Solution:** Check the warning banner component in the UI

---

## 🎯 **EXPECTED CONSOLE OUTPUT:**

### **Normal Working Tab Switching Detection:**
```
🎯 TAB SWITCHING DETECTION INITIALIZING: {phase: "exam", isProctored: true, submitted: false}
✅ Tab switching detection ENABLED
📡 Setting up event listeners...
✅ Event listeners setup complete

[User switches tabs]
🔍 Visibility change detected: {documentHidden: true, phase: "exam", submitted: false, isTabSwitching: false, isProctored: true}
🚨 Tab switch detected - starting violation process
✅ Confirming tab switch violation
🚨 VIOLATION HANDLER CALLED: {type: "tab_switch", description: "Student switched to another tab or window", submitted: false, currentTime: 164...}
📊 VIOLATION COUNT: 1 / 3
📝 Setting warning message: ⚠️ Warning 1/3: Please remain focused on your exam. Tab switching is not allowed.
📡 Reporting violation to backend...
⏰ Setting warning timeout for 4 seconds

[User switches back]
🔍 Visibility change detected: {documentHidden: false, phase: "exam", submitted: false, isTabSwitching: false, isProctored: true}
🔍 Visibility change ignored: {documentHidden: false, isTabSwitching: false, phase: "exam", submitted: false, isProctored: true}

[4 seconds later]
🧹 Clearing warning message
```

---

## 🚀 **TESTING COMPLETE CHECKLIST:**

### **✅ Working Correctly If:**
- [ ] Console shows "Tab switching detection ENABLED"
- [ ] Console shows visibility change when switching tabs
- [ ] Console shows violation handler called
- [ ] Warning banner appears on the page
- [ ] Violation count increases correctly
- [ ] Auto-submission happens after 3 violations
- [ ] Warning messages disappear after 4 seconds

### **❌ Issues to Fix If:**
- [ ] Console shows "Tab switching detection disabled"
- [ ] No console messages when switching tabs
- [ ] Violation handler not called
- [ ] No warning banner appears
- [ ] Violation count doesn't increase
- [ ] Auto-submission doesn't work
- [ ] Warning messages don't disappear

---

## 🎊 **DEBUGGING COMPLETE!**

**Run through the testing steps above and check the console output. The debugging messages will tell us exactly what's happening with the tab switching detection.**

**If you follow these steps and share the console output, I can identify and fix any issues with the tab switching detection.**
