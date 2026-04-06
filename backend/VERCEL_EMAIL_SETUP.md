# Vercel Deployment Email Configuration Guide

## 🌍 Production Email Setup

### **Problem Identified:**
Emails work locally but not in production (Vercel deployment).

### **Root Cause:**
Environment variables are not properly configured in Vercel dashboard.

### **🔧 SOLUTION - Configure Vercel Environment Variables:**

#### **Step 1: Go to Vercel Dashboard**
1. Login to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `examshield`
3. Go to **Settings** → **Environment Variables**

#### **Step 2: Add Required Environment Variables**

Add these exact variables in Vercel:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=pawankumaryadav75628697@gmail.com
EMAIL_PASS=rygw bnfk dxnq cdsf
STUDENT_LOGIN_URL=https://examshield.vercel.app/student/login
NODE_ENV=production
```

#### **Step 3: Deploy Again**
1. Push latest changes to GitHub
2. Trigger new deployment in Vercel
3. Wait for deployment to complete

#### **Step 4: Test Production Emails**
Run the production test:
```bash
node backend/test-production-email.js
```

### **🚨 Important Notes:**

#### **Email Password:**
- Use the exact app password: `rygw bnfk dxnq cdsf`
- No spaces or special characters in the password field
- This is a Gmail App Password, not regular password

#### **Environment Variable Format:**
- **Key:** EMAIL_HOST
- **Value:** smtp.gmail.com
- **Environment:** Production, Preview, Development (select all)

#### **Verification:**
After deployment, check Vercel logs for:
```
✅ Email configured - creating professional Gmail transporter
📧 Using Gmail SMTP: smtp.gmail.com
📧 Environment: production
```

### **🎯 Expected Result:**
- ✅ Students receive exam notifications in production
- ✅ Email system works in deployed app
- ✅ No more mock email mode

### **🔍 Debugging:**
If emails still don't work:

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Functions → server.js → View Logs
   - Look for email configuration messages

2. **Verify Environment Variables:**
   - Ensure all variables are set in Vercel dashboard
   - Check for typos in variable names

3. **Test with Production Script:**
   ```bash
   node backend/test-production-email.js
   ```

### **📱 Alternative: Use Email Service**
If Gmail still has issues, consider:
- SendGrid
- Mailgun
- AWS SES

### **✅ Success Indicators:**
- Email configuration shows "✅ Email configured"
- No "⚠️ EMAIL NOT CONFIGURED" messages
- Real Message ID returned (not 'mock' status)
- Students receive emails with exam keys

---

## 🎉 After Configuration

Once environment variables are set in Vercel:
1. Redeploy the application
2. Create a test exam in production
3. Assign students and publish exam
4. Verify students receive email notifications

The email system will work exactly like it does locally!
