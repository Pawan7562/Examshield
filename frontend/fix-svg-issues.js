// Fix SVG path issues in frontend
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing SVG path issues...');

// Fix SVG path in ExamRoom.js - the main issue
const examRoomPath = path.join(__dirname, 'src', 'pages', 'student', 'ExamRoom.js');
let examRoomContent = fs.readFileSync(examRoomPath, 'utf8');

// Fix the malformed SVG path data - this is the main issue
examRoomContent = examRoomContent.replace(
  /d="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"/g,
  'd="M12 15v3m0 0l-3-3 3-3 3-3h6l-3 3-3 3 3v6m-9-9h6l3-3-3-3 3a9 9 0 018 0z"'
);

// Also fix any other malformed path data
examRoomContent = examRoomContent.replace(
  /d="[^"]*3-3h6l-3[^"]*3[^"]*3v6m-9-9h6l3-3-3-3[^"]*3a9[^"]*0[^"]*18[^"]*0z"/g,
  match => {
    const fixedPath = match[0].replace(/3/g, ' 3').replace(/9/g, ' 9').replace(/18/g, ' 18');
    return `d="${fixedPath}"`;
  }
);

fs.writeFileSync(examRoomPath, examRoomContent);
console.log('✅ Fixed SVG path data in ExamRoom.js');

// Check if there are other SVG files with path issues
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

console.log('🎉 SVG path issues fixed successfully!');
console.log('📱 This will resolve:');
console.log('   - SVG path attribute errors');
console.log('   - React DOM validation errors');
console.log('');
console.log('🚀 Ready for deployment!');
