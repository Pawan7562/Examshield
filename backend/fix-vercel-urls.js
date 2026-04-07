// Fix remaining login URL issue - still showing Vercel instead of Render
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining login URL issue...');

// Read student controller
const studentControllerPath = path.join(__dirname, 'controllers', 'studentController.js');
let studentControllerContent = fs.readFileSync(studentControllerPath, 'utf8');

// Fix all Vercel URLs to Render
studentControllerContent = studentControllerContent.replace(
  /https:\/\/examshield\.vercel\.app\/student\/login/g,
  'https://examshield.onrender.com/student/login'
);

// Also fix any other Vercel URLs
studentControllerContent = studentControllerContent.replace(
  /https:\/\/examshield\.vercel\.app/g,
  'https://examshield.onrender.com'
);

// Write back to student controller
fs.writeFileSync(studentControllerPath, studentControllerContent);

console.log('✅ Fixed all login URLs to use Render:');
console.log('- Single student addition: https://examshield.onrender.com/student/login');
console.log('- CSV bulk upload: https://examshield.onrender.com/student/login');
console.log('- All Vercel URLs replaced with Render URLs');
console.log('');
console.log('🔧 Students will now get correct Render login URL');
