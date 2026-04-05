# Email Configuration Guide for CollegeExam

## 🚨 ISSUE IDENTIFIED: Students Not Receiving Exam Emails

### Root Cause:
Email environment variables are **NOT CONFIGURED** in the backend `.env` file, causing the email service to fall back to **mock mode**.

---

## 🔧 SOLUTION: Configure Email Environment Variables

### Step 1: Create/Update `.env` File
The `.env` file is currently ignored by Git (for security), so you need to create it manually:

```bash
# In the backend directory
cd backend
```

Create `.env` file with the following content:

```env
# Email Configuration for Student Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM=CollegeExam <your-gmail-address@gmail.com>

# Application Configuration
NODE_ENV=development
STUDENT_LOGIN_URL=http://localhost:3002/student/login
```

### Step 2: Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Go to Google Account Settings** → Security
3. **Generate App Password**:
   - Select "App" from app options
   - Give it a name like "CollegeExam"
   - Copy the 16-character password generated

### Step 3: Update Configuration

Replace the placeholder values in the `.env` file:
- `your-gmail-address@gmail.com` → Your actual Gmail address
- `your-app-password-here` → The 16-character app password

---

## 📧 Email Service Configuration Check

The email service checks for these environment variables:
- ✅ `EMAIL_HOST` - SMTP server (e.g., smtp.gmail.com)
- ✅ `EMAIL_USER` - Gmail address
- ✅ `EMAIL_PASS` - App password (NOT regular password)
- ✅ `EMAIL_FROM` - From address for emails

---

## 🧪 Test Email Configuration

After setting up the `.env` file, test the configuration:

```bash
cd backend
node test-email-notification.js
```

Expected output:
```
✅ Email configured - creating professional Gmail transporter
📧 Email Service: Sending exam notification...
✅ Email Service: Exam notification sent successfully
```

---

## 🚨 Current Status

**Without Configuration:**
- Mock mode activated
- No actual emails sent
- Students don't receive exam keys

**With Configuration:**
- Professional Gmail transporter
- Real emails sent to students
- Students receive exam keys properly

---

## 📱 Production Deployment

For Vercel deployment, set these environment variables in Vercel Dashboard:
- `EMAIL_HOST`
- `EMAIL_USER` 
- `EMAIL_PASS`
- `EMAIL_FROM`
- `STUDENT_LOGIN_URL`

---

## 🔒 Security Notes

1. **Never commit `.env` file to Git**
2. **Use App Passwords**, not regular Gmail passwords
3. **Keep credentials secure** and separate from code
4. **Update passwords regularly**

---

## 🎯 Quick Fix Summary

1. Create `.env` file with email configuration
2. Test with `node test-email-notification.js`
3. Verify emails are sent successfully
4. Deploy with proper environment variables

This will resolve the student email notification issue completely.
