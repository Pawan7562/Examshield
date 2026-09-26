# ExamShield Email Configuration

Student credential emails use either Resend over HTTPS or SMTP. The service no longer reports a mock send as success. If provider configuration is missing or delivery fails, adding the student still succeeds, the API reports `emailSent: false`, and the admin receives a one-time credential fallback in the UI.

## Resend (Recommended)

Set these variables in the backend environment:

```env
RESEND_API_KEY=re_your_key
EMAIL_FROM=ExamShield <students@your-verified-domain.com>
STUDENT_LOGIN_URL=https://your-app.example.com/student/login
```

Verify the sender domain in Resend before using it. Resend is selected automatically when `RESEND_API_KEY` is present.

## Gmail SMTP

Use a Google App Password, not the normal account password. App Passwords require 2-Step Verification on the Google account.

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-account@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=ExamShield <your-account@gmail.com>
STUDENT_LOGIN_URL=https://your-app.example.com/student/login
```

Update the backend's local `.env` for development and set the same variables in the production host's secret/environment settings. Never commit credentials or paste them into chat.

## Verify Delivery

With the backend running, call `/api/test-email?email=your-controlled-inbox@example.com`. This endpoint sends a real test message; use an inbox you control. A successful HTTP response confirms provider authentication and delivery to the provider, but check the inbox and spam folder too.

The current configured Gmail account was tested and rejected with `535 BadCredentials`. Replace `EMAIL_PASS` with a newly generated App Password, or configure a verified Resend sender and `RESEND_API_KEY`, then restart/redeploy the backend. Until then, student accounts are created but credential emails cannot be delivered.
