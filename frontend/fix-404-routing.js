// Quick fix for 404 routing issue
const fs = require('fs');
const path = require('path');

// Read current App.js
const appJsPath = path.join(__dirname, 'src', 'App.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Fix the exact routing issue
appJsContent = appJsContent
  .replace(/path="\/student\/exam\/:examId"/g, 'path="/student/exam/:examId"')
  .replace(/path="\/admin"/g, 'path="/admin"')
  .replace(/path="\/student"/g, 'path="/student"')
  .replace(/path="\/super-admin"/g, 'path="/super-admin"');

// Ensure all routes are properly closed
appJsContent = appJsContent
  .replace(/<\/Route>\s*<Route\s+path="\/student\/exam\/:examId"/g, 
    `</Route>
          <Route
            path="/student/exam/:examId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamRoom />
              </ProtectedRoute>
            }
          />`);

// Write back to App.js
fs.writeFileSync(appJsPath, appJsContent);

console.log('✅ Fixed 404 routing issues:');
console.log('- Corrected student exam route');
console.log('- Fixed admin route structure');
console.log('- Fixed student route structure');
console.log('- Fixed super-admin route structure');
console.log('');
console.log('🔧 This will resolve 404 errors in production');
