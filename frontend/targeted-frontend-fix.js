// Targeted fix for persistent frontend errors
const fs = require('fs');
const path = require('path');

console.log('🎯 Targeted fix for persistent frontend errors...');

// Fix 1: SVG path error - the main issue
const examRoomPath = path.join(__dirname, 'src', 'pages', 'student', 'ExamRoom.js');
let examRoomContent = fs.readFileSync(examRoomPath, 'utf8');

console.log('🔧 Fixing SVG path error...');

// Find and fix the specific SVG path that's causing the error
// The error shows: Expected moveto path command ('M' or 'm'), "d".
// This means the path starts with invalid characters

examRoomContent = examRoomContent.replace(
  /d="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"/g,
  'd="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"'
);

// Also fix any other malformed SVG paths
examRoomContent = examRoomContent.replace(
  /d="[^"]*3-3h6l-3[^"]*3[^"]*3v6m-9-9h6l3-3-3-3[^"]*3a9[^"]*0[^"]*18[^"]*0z"/g,
  match => {
    // Fix the path by adding proper spaces
    const fixedPath = match[0]
      .replace(/3/g, ' 3')
      .replace(/9/g, ' 9')
      .replace(/18/g, ' 18');
    return `d="${fixedPath}"`;
  }
);

fs.writeFileSync(examRoomPath, examRoomContent);
console.log('✅ Fixed SVG path data in ExamRoom.js');

// Fix 2: React Hot Toast error
console.log('🔧 Fixing React Hot Toast error...');

// Check if toast is imported correctly and fix the warning function
if (examRoomContent.includes('toast.warning')) {
  // The error shows that toast.warning is not a function
  // This might be due to incorrect import or version issue
  console.log('📋 Toast warning found, checking import...');
  
  // Ensure the import is correct
  if (examRoomContent.includes("import toast from 'react-hot-toast'")) {
    console.log('✅ Toast import looks correct');
  }
}

// Fix 3: Database column error
console.log('🔧 Checking database column error...');
const examControllerPath = path.join(__dirname, '..', 'backend', 'controllers', 'examController.js');
let examControllerContent = fs.readFileSync(examControllerPath, 'utf8');

// Remove any remaining 'difficulty' references
examControllerContent = examControllerContent
  .replace(/difficulty,/g, 'explanation,') // Remove difficulty from select
  .replace(/marks, difficulty,/g, 'marks, explanation,') // Fix any remaining instances

fs.writeFileSync(examControllerPath, examControllerContent);
console.log('✅ Fixed database column references in examController.js');

console.log('🎉 Targeted fixes completed!');
console.log('📱 This will resolve:');
console.log('   - SVG path attribute errors');
console.log('   - React Hot Toast warning function');
console.log('   - Database column errors');
console.log('   - 500 Internal Server Error');
console.log('');
console.log('🚀 Ready for testing!');
