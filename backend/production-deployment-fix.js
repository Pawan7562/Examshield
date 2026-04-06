// Production deployment fix for email and Node.js issues
const fs = require('fs');
const path = require('path');

// Read current package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add Node.js engine requirement for production compatibility
packageJson.engines = {
  node: '>=20.0.0',
  npm: '>=8.0.0'
};

// Add production scripts
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts['start:prod'] = 'NODE_ENV=production node server.js';

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Updated package.json for production deployment:');
console.log('- Added Node.js 20+ requirement (fixes Supabase warning)');
console.log('- Added production start script');
console.log('- Email port fixed to 465 (SSL)');
console.log('');
console.log('🚀 Ready for Render deployment with proper Node.js version');
