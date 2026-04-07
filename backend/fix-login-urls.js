// Fix login URLs to use Render instead of Vercel
const fs = require('fs');
const path = require('path');

// Read student controller
const studentControllerPath = path.join(__dirname, 'controllers', 'studentController.js');
let studentControllerContent = fs.readFileSync(studentControllerPath, 'utf8');

// Fix login URLs to use Render
studentControllerContent = studentControllerContent.replace(
  /https:\/\/examshield\.vercel\.app\/student\/login/g,
  'https://examshield.onrender.com/student/login'
);

// Write back to student controller
fs.writeFileSync(studentControllerPath, studentControllerContent);

console.log('✅ Fixed login URLs to use Render:');
console.log('- Single student addition: https://examshield.onrender.com/student/login');
console.log('- CSV bulk upload: https://examshield.onrender.com/student/login');
console.log('- Students will get correct production login URL');
