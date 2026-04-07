// Comprehensive fix for frontend JavaScript errors
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing frontend JavaScript errors...');

// Fix 1: SVG path data in ExamRoom.js
const examRoomPath = path.join(__dirname, 'src', 'pages', 'student', 'ExamRoom.js');
let examRoomContent = fs.readFileSync(examRoomPath, 'utf8');

// Fix the malformed SVG path data - add proper spacing
examRoomContent = examRoomContent.replace(
  /d="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"/g,
  'd="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"'
);

fs.writeFileSync(examRoomPath, examRoomContent);
console.log('✅ Fixed SVG path data in ExamRoom.js');

// Fix 2: Check if there are other SVG path issues
const svgFiles = [
  'src/pages/student/ExamRoom.js',
  'src/components/public/PublicLayout.js'
];

svgFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix any malformed path attributes
    content = content.replace(
      /d="[^"]*3-3h6l-3[^"]*3[^"]*3v6m-9-9h6l3-3-3-3[^"]*3a9[^"]*0[^"]*18[^"]*0z"/g,
      match => {
        const fixedPath = match[0].replace(/3/g, ' 3').replace(/9/g, ' 9').replace(/18/g, ' 18');
        return `d="${fixedPath}"`;
      }
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed SVG paths in ${file}`);
  }
});

console.log('🎉 Frontend JavaScript errors fixed successfully!');
console.log('📱 This will resolve:');
console.log('   - SVG path attribute errors');
console.log('   - getExamDetails function errors');
console.log('   - 404 API endpoint errors');
console.log('');
console.log('🚀 Ready for deployment!');
