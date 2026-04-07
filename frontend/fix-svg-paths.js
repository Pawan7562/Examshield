// Fix SVG path data errors in frontend
const fs = require('fs');
const path = require('path');

// Read the ExamRoom.js file
const examRoomPath = path.join(__dirname, 'src', 'pages', 'student', 'ExamRoom.js');
let content = fs.readFileSync(examRoomPath, 'utf8');

// Fix the malformed SVG path data
content = content.replace(
  /d="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"/g,
  'd="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"'
);

// Write back to file
fs.writeFileSync(examRoomPath, content);

console.log('✅ Fixed SVG path data in ExamRoom.js');
console.log('🔧 Corrected malformed path attribute');
console.log('📱 This will fix the "Expected number" error');
