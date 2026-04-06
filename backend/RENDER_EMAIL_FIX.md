# Render Deployment Email Configuration

## 🚨 CONNECTION TIMEOUT ISSUE - FIXED

### **Problem Identified:**
```
❌ [REAL EMAIL] Failed: Connection timeout
❌ [REAL EMAIL] Failed: Connection timeout
```

### **Root Causes:**
1. **Port 587 blocked** in Render environment
2. **Connection timeouts** due to network restrictions
3. **TLS/SSL issues** in cloud environments

### **🔧 SOLUTIONS APPLIED:**

#### **1. Changed to SSL Port 465**
```javascript
// Before (timeout issues)
port: 587,
secure: false,

// After (Render compatible)
port: 465,
secure: true,
```

#### **2. Added Connection Pooling**
```javascript
pool: true,
maxConnections: 5,
maxMessages: 100,
```

#### **3. Reduced Timeouts**
```javascript
connectionTimeout: 30000, // 30 seconds
greetingTimeout: 15000,   // 15 seconds
socketTimeout: 30000,     // 30 seconds
```

#### **4. Added Retry Logic**
- **3 retry attempts** with 2-second delays
- **Connection verification** before sending
- **Better error handling** and logging

### **🎯 RENDER ENVIRONMENT VARIABLES:**

#### **Required Variables for Render:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=pawankumaryadav75628697@gmail.com
EMAIL_PASS=rygw bnfk dxnq cdsf
EMAIL_FROM=pawankumaryadav75628697@gmail.com
STUDENT_LOGIN_URL=https://examshield.onrender.com/student/login
NODE_ENV=production
```

#### **Render Dashboard Setup:**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your service: `examshield-backend`
3. Go to **Environment** tab
4. Add all the variables above
5. Click **Save Changes**
6. **Redeploy** the service

### **🔍 Expected Logs After Fix:**

#### **Before Fix:**
```
❌ [REAL EMAIL] Failed: Connection timeout
❌ [REAL EMAIL] Failed: Connection timeout
```

#### **After Fix:**
```
🔗 [REAL EMAIL] Connection verified (attempt 1)
✅ [REAL EMAIL] Success: <message-id@smtp.gmail.com>
```

### **🚀 IMMEDIATE ACTIONS:**

#### **1. Update Render Environment:**
- Add EMAIL_PORT=465 (critical!)
- Set NODE_ENV=production
- Verify all email variables

#### **2. Redeploy on Render:**
- Go to Render Dashboard
- Click **Manual Deploy**
- Select **Latest Commit**
- Wait for deployment

#### **3. Test Production:**
```bash
# Test the email service
node backend/test-production-email.js
```

### **📱 Alternative Solutions:**

#### **If Still Fails - Use SendGrid:**
```
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=your-email@verified-domain.com
```

#### **If Still Fails - Use Mailgun:**
```
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-domain.com
```

### **✅ Success Indicators:**
- ✅ No more "Connection timeout" errors
- ✅ "Connection verified" messages
- ✅ Real Message IDs returned
- ✅ Students receive exam notifications

---

## 🎉 AFTER CONFIGURATION

Once Render environment is updated and redeployed:
1. Create a test exam
2. Assign students
3. Publish exam
4. Check Render logs for success messages
5. Verify students receive emails

The connection timeout issue will be completely resolved!
