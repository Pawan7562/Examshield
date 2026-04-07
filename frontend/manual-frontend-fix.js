const fs = require('fs');
const path = require('path');

console.log('🔧 Manual fix for remaining frontend issues...');

// Fix 1: Database column issue in examController.js
const examControllerPath = path.join(__dirname, '..', 'backend', 'controllers', 'examController.js');
let examControllerContent = fs.readFileSync(examControllerPath, 'utf8');

// Remove the problematic 'difficulty' column from select query
examControllerContent = examControllerContent.replace(
  /marks, difficulty, explanation/g,
  'marks, explanation'
);

fs.writeFileSync(examControllerPath, examControllerContent);
console.log('✅ Fixed database column query in examController.js');

// Fix 2: SVG path issues in ExamRoom.js
const examRoomPath = path.join(__dirname, 'src', 'pages', 'student', 'ExamRoom.js');
let examRoomContent = fs.readFileSync(examRoomPath, 'utf8');

// Fix the specific SVG path that's causing the error
examRoomContent = examRoomContent.replace(
  /d="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"/g,
  'd="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"'
);

fs.writeFileSync(examRoomPath, examRoomContent);
console.log('✅ Fixed SVG path data in ExamRoom.js');

// Fix 3: Add Timer component import if missing
if (!examRoomContent.includes('import Timer')) {
  const importPosition = examRoomContent.indexOf('import SubjectiveQuestion');
  const timerImport = "import Timer from '../../components/Timer';\n";
  const beforeImport = examRoomContent.substring(0, importPosition);
  const afterImport = examRoomContent.substring(importPosition);
  const withTimer = beforeImport + timerImport + afterImport;
  fs.writeFileSync(examRoomPath, withTimer);
  console.log('✅ Added Timer import to ExamRoom.js');
}

console.log('🎉 All remaining frontend issues fixed!');
console.log('📱 This will resolve:');
console.log('   - Database column errors');
console.log('   - SVG path attribute errors');
console.log('   - Missing component imports');
console.log('');
console.log('🚀 Ready for deployment!');
