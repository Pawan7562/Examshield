// Check backend logs for detailed error information
console.log('🔍 Checking Backend Logs for 500 Error\n');

console.log('📋 What to Look For:');
console.log('1. Exact error message when accessing /api/admin/exams');
console.log('2. Database schema issues');
console.log('3. College ID authentication problems');
console.log('4. Missing required fields in request');
console.log('5. RLS (Row Level Security) policy violations');
console.log('');

console.log('🔧 Steps to Diagnose:');
console.log('1. Go to frontend and try to access exams page');
console.log('2. Watch backend console for error messages');
console.log('3. Check Network tab in browser DevTools');
console.log('4. Look for the exact 500 error details');
console.log('5. Screenshot the error if needed');
console.log('');

console.log('🎯 Common 500 Error Causes:');
console.log('A. Exams table does not exist');
console.log('B. exam_key column missing');
console.log('C. Invalid college_id in JWT token');
console.log('D. RLS policies blocking access');
console.log('E. Database connection issues');
console.log('F. Missing required fields in request');
console.log('G. Server configuration issues');
console.log('');

console.log('🚀 Immediate Actions:');
console.log('1. Check backend console RIGHT NOW');
console.log('2. Look for error messages containing "exams"');
console.log('3. Share the exact error message');
console.log('4. Try accessing /api/admin/exams directly via API test');
console.log('5. The error message will tell us exactly what to fix');
console.log('');

console.log('📊 Error Message Patterns:');
console.log('Pattern 1: "relation \\"exams\\" does not exist" → Table missing');
console.log('Pattern 2: "column \\"exam_key\\" does not exist" → Column missing');
console.log('Pattern 3: "null value in column \\"exam_key\\"" → Schema issue');
console.log('Pattern 4: "JWT malformed" → Authentication issue');
console.log('Pattern 5: "permission denied" → RLS policy issue');
console.log('');

console.log('🔧 Once You Have the Error Message:');
console.log('Match it to the patterns above to identify the exact cause.');
console.log('The error message will tell us exactly what needs to be fixed.');
console.log('Share the error message and I can provide the precise fix.');
