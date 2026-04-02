// setup-env.js - Setup environment variables for Supabase
const fs = require('fs');
const path = require('path');

const envContent = `# Supabase Configuration
SUPABASE_URL=https://jzxvxxgsfbzqhrirnqfm.supabase.co
SUPABASE_SERVICE_KEY=sb_publishable_Y3eNbkdEjC59m67N0GiY4Q_1rOveLyL

# JWT Configuration
JWT_SECRET=examshield_jwt_secret_key_change_in_production_123456
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=examshield_refresh_secret_key_change_in_production_123456
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Configuration
PORT=5000
NODE_ENV=development`;

const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, envContent);

console.log('✅ .env file created successfully!');
console.log('📁 Location:', envPath);
console.log('🔑 Supabase URL configured');
console.log('🔑 Supabase Service Key configured');
console.log('🔐 JWT secrets configured');

console.log('\n🚀 Next steps:');
console.log('1. Restart your backend server');
console.log('2. Go to: https://jzxvxxgsfbzqhrirnqfm.supabase.co');
console.log('3. Create tables using SQL Editor');
console.log('4. Migrate your data to Supabase');
