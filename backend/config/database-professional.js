// config/database-professional.js - Professional persistent database
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '..', 'data', 'examshield.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory');
}

// Load database from file
let database = {};
if (fs.existsSync(DB_FILE)) {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    database = JSON.parse(data);
    console.log('📊 Database loaded from file');
  } catch (error) {
    console.error('❌ Error loading database:', error);
    database = {};
  }
} else {
  console.log('📊 Creating new database file');
}

// Save database to file
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
    console.log('💾 Database saved to file');
  } catch (error) {
    console.error('❌ Error saving database:', error);
  }
}

// Professional query function
const query = async (text, params) => {
  const start = Date.now();
  console.log('🔍 Executing query:', text, params);
  
  try {
    let result = { rows: [], rowCount: 0 };
    
    // Handle SELECT queries
    if (text.includes('SELECT') && text.includes('colleges')) {
      if (text.includes('WHERE email')) {
        const email = params[0];
        const colleges = database.colleges || [];
        const found = colleges.filter(col => col.email === email);
        result.rows = found;
        result.rowCount = found.length;
      } else {
        const colleges = database.colleges || [];
        result.rows = colleges;
        result.rowCount = colleges.length;
      }
    }
    
    // Handle INSERT queries for colleges
    else if (text.includes('INSERT INTO colleges')) {
      if (!database.colleges) database.colleges = [];
      
      // Extract actual data from parameters
      const [collegeName, email, hashedPassword, phone, address, website, subscriptionPlan, subscriptionExpiry] = params;
      
      const newCollege = {
        id: database.colleges.length + 1,
        name: collegeName || 'Unknown',
        email: email || 'unknown@example.com',
        password: hashedPassword || '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm',
        phone: phone || '',
        address: address || '',
        website: website || '',
        subscription_plan: subscriptionPlan || 'basic',
        subscription_expiry: subscriptionExpiry,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      database.colleges.push(newCollege);
      saveDatabase();
      
      result.rows = [newCollege];
      result.rowCount = 1;
      console.log('✅ College created:', newCollege);
    }
    
    // Handle INSERT queries for subscriptions
    else if (text.includes('INSERT INTO subscriptions')) {
      if (!database.subscriptions) database.subscriptions = [];
      
      const newSubscription = {
        id: database.subscriptions.length + 1,
        college_id: 1, // Link to first college
        plan: 'basic',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        status: 'active',
        amount: 0,
        max_students: 50,
        max_exams: 10,
        created_at: new Date().toISOString()
      };
      
      database.subscriptions.push(newSubscription);
      saveDatabase();
      
      result.rows = [newSubscription];
      result.rowCount = 1;
      console.log('✅ Subscription created:', newSubscription);
    }
    
    console.log(`✅ Query executed in ${Date.now() - start}ms`);
    return result;
    
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
};

// Professional transaction function
const transaction = async (callback) => {
  console.log('🔄 Starting transaction...');
  try {
    await callback();
    saveDatabase();
    console.log('✅ Transaction completed');
  } catch (error) {
    console.error('❌ Transaction error:', error);
    throw error;
  }
};

// Initialize with default data if empty
function initializeDatabase() {
  if (!database.colleges || database.colleges.length === 0) {
    console.log('🏗 Initializing database with default data...');
    
    database.colleges = [];
    database.super_admins = [{
      id: 1,
      name: 'Super Admin',
      email: 'admin@examshield.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm',
      role: 'super_admin',
      created_at: new Date().toISOString()
    }];
    
    database.subscriptions = [];
    database.students = [];
    database.exams = [];
    
    saveDatabase();
    console.log('✅ Database initialized with default admin');
  }
}

// Initialize database
initializeDatabase();

module.exports = { query, transaction, database, saveDatabase };
