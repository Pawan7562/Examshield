const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { 
  resolveStudentLoginUrl, 
  resolvePortalBaseUrl 
} = require('../services/emailService');

async function verify() {
  console.log('--- EMAIL VERIFICATION & AUDIT ---');
  
  // 1. Verify URL resolution
  const testUrl = resolveStudentLoginUrl('https://www.exam.nexifyforge.in/student/login');
  console.log('Resolved Student Login URL:', testUrl);
  
  if (testUrl.includes('www.exam.nexifyforge.in')) {
    throw new Error('FAIL: www.exam.nexifyforge.in was not sanitized!');
  }
  
  // Test HTTP status of target URL
  console.log(`Checking connectivity to: ${testUrl}...`);
  try {
    const res = await fetch(testUrl);
    console.log(`HTTP Status: ${res.status} ${res.statusText}`);
    if (res.status === 200) {
      console.log('✅ Portal URL opens with HTTP 200 OK!');
    } else {
      console.warn('⚠️ Portal URL returned non-200 status:', res.status);
    }
  } catch (err) {
    console.error('❌ Failed to fetch portal URL:', err.message);
  }

  // 2. Audit .env and config for personal email leak
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  const personalRegex = /pawankumar[^\s\n"']*/gi;
  const matches = envContent.match(personalRegex) || [];
  
  console.log('Personal email matches in backend/.env:');
  if (matches.length > 0) {
    console.warn('Found matches:', matches);
  } else {
    console.log('✅ ZERO personal email addresses in backend/.env');
  }

  console.log('\n--- EMAIL SERVICE AUDIT COMPLETE ---');
}

verify().catch(console.error);
