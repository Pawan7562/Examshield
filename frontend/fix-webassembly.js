const fs = require('fs');

// Create .env file with Node options to fix WebAssembly issue
fs.writeFileSync('.env', 'NODE_OPTIONS=--openssl-legacy-provider\n');

console.log('✅ Created .env file with WebAssembly fix');
