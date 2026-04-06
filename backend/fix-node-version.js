// Update package.json for Node.js 20+ requirement
const fs = require('fs');
const path = require('path');

// Read current package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add Node.js engine requirement
packageJson.engines = {
  node: '>=20.0.0',
  npm: '>=8.0.0'
};

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Updated package.json with Node.js 20+ requirement');
console.log('- Added engines.node: ">=20.0.0"');
console.log('- Added engines.npm: ">=8.0.0"');
console.log('');
console.log('🔧 This will fix Supabase deprecation warning');
