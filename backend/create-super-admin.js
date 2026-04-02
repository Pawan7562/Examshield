// create-super-admin.js - Create super admin with known password
const { database } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  console.log('👑 Creating Super Admin with Known Password...');
  
  try {
    // Hash the admin password
    const adminPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    console.log('🔑 Admin password:', adminPassword);
    console.log('🔑 Hashed password:', hashedPassword);
    
    // Update or create super admin
    if (!database.super_admins) database.super_admins = [];
    
    // Remove existing admin if any
    database.super_admins = database.super_admins.filter(admin => admin.email !== 'admin@examshield.com');
    
    // Add new super admin
    const superAdmin = {
      id: 1,
      name: 'Super Admin',
      email: 'admin@examshield.com',
      password: hashedPassword,
      role: 'super_admin',
      created_at: new Date().toISOString()
    };
    
    database.super_admins.push(superAdmin);
    
    // Save database
    const fs = require('fs');
    const path = require('path');
    const DB_FILE = path.join(__dirname, 'data', 'examshield.json');
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
    
    console.log('✅ Super admin created:', superAdmin);
    
    console.log('\n🎉 SUPER ADMIN CREDENTIALS:');
    console.log('📧 Email: admin@examshield.com');
    console.log('🔑 Password: Admin@123');
    console.log('🌐 Login URL: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSuperAdmin();
