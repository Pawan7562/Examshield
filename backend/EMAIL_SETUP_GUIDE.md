# Email Setup Guide for ExamShield

## Problem: Students not receiving exam emails

## Solution: Configure Email Settings

### Step 1: Set up Email Environment Variables

Create or update your `.env` file in the backend directory with the following email settings:

```env
# Email Configuration (Required for real emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=ExamShield <noreply@examshield.com>
```

### Step 2: Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Create an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Create a new app password for "ExamShield"
   - Use this app password in `EMAIL_PASS`

3. **Alternative Email Providers**:
   ```env
   # Outlook/Hotmail
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   
   # Yahoo
   EMAIL_HOST=smtp.mail.yahoo.com
   EMAIL_PORT=587
   
   # SendGrid (for production)
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   ```

### Step 3: Test Email Configuration

After setting up the environment variables, restart the backend server and check the console logs:

```bash
cd backend
npm run dev
```

Look for these log messages:
- `✅ Email notification sent to student@email.com` (Success)
- `Mock email sent` (Using mock transporter - configure EMAIL variables)
- `❌ Failed to send email` (Check credentials)

### Step 4: Common Issues & Solutions

#### Issue 1: "Mock email sent" in logs
**Cause**: Email environment variables not configured
**Solution**: Add EMAIL_HOST, EMAIL_USER, EMAIL_PASS to .env file

#### Issue 2: Authentication failed
**Cause**: Incorrect email credentials
**Solution**: 
- Use App Password for Gmail (not regular password)
- Check email and password are correct
- Ensure 2FA is enabled for Gmail

#### Issue 3: Connection timeout
**Cause**: Firewall or network issues
**Solution**: 
- Check port 587 is open
- Try different SMTP server
- Check internet connection

#### Issue 4: Emails going to spam
**Cause**: Email configuration issues
**Solution**:
- Use proper domain in EMAIL_FROM
- Set up SPF/DKIM records for production
- Use reputable SMTP service (SendGrid, AWS SES)

### Step 5: Production Email Services

For production use, consider these email services:

#### SendGrid (Recommended)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your_aws_access_key
EMAIL_PASS=your_aws_secret_key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.com
EMAIL_PASS=your_mailgun_password
```

### Step 6: Testing Email Functionality

Create a test endpoint to verify email sending:

```javascript
// Add to routes/index.js
admin.post('/test-email', async (req, res) => {
  try {
    const { sendExamNotification } = require('../services/emailService');
    await sendExamNotification({
      name: 'Test Student',
      email: 'your_test_email@gmail.com',
      examName: 'Test Exam',
      examDate: new Date(),
      examDuration: 60,
      examKey: 'TEST123',
      subject: 'Test Subject',
      type: 'coding',
      loginUrl: 'http://localhost:3000/student/login'
    });
    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Test with: `POST http://localhost:5000/api/admin/test-email`

### Step 7: Debugging Email Issues

Check the backend console for detailed email logs:
- Email sending attempts
- Success/failure messages
- Error details

### Quick Fix Summary

1. **Add email credentials to .env file**
2. **Use Gmail App Password (not regular password)**
3. **Restart backend server**
4. **Check console logs for email status**
5. **Test with new exam creation**

### Important Notes

- **Never commit actual email credentials to git**
- **Use app-specific passwords, not regular passwords**
- **Test with a small group of students first**
- **Monitor email sending logs regularly**
- **Consider using a professional email service for production**

## Current Status

✅ Email notifications are now included in the async exam processing
✅ Students will receive emails when exams are created
✅ Detailed logging for troubleshooting
⚠️ Requires email configuration in .env file

The email system will work once you configure the environment variables properly!
