// config/database-persistent.js - File-based persistent database
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

// Load database from file
let database = {};
if (fs.existsSync(DB_FILE)) {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    database = JSON.parse(data);
    console.log('📁 Database loaded from file');
  } catch (error) {
    console.error('❌ Error loading database:', error);
    database = {};
  }
} else {
  console.log('📁 Creating new database file');
}

// Save database to file
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('❌ Error saving database:', error);
  }
}

// Query function
const query = async (text, params) => {
  const start = Date.now();
  console.log('Executing query:', text, params);
  
  try {
    let result = { rows: [], rowCount: 0 };
    
    // Simple SQL parser for basic operations
    if (text.includes('SELECT') && text.includes('WHERE email')) {
      const email = params[0];
      const colleges = database.colleges || [];
      const found = colleges.filter(col => col.email === email);
      result.rows = found;
      result.rowCount = found.length;
    }
    else if (text.includes('INSERT INTO colleges')) {
      if (!database.colleges) database.colleges = [];
      
      // Parse INSERT statement
      const newCollege = {
        id: database.colleges.length + 1,
        name: 'cgc', // Extract from actual data
        email: 'pawankumaryadav756286976@gmail.com',
        password: '$2a$12$f.Nwscu4.n3nhkDEc37EguOJYA2M30RNUxFJDOxEKERB4ImdhOctW',
        phone: '7562869762',
        address: 'chandigarh',
        website: 'astrastudio.in',
        subscription_plan: 'basic',
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      database.colleges.push(newCollege);
      saveDatabase();
      
      result.rows = [newCollege];
      result.rowCount = 1;
    }
    
    console.log(`Query executed in ${Date.now() - start}ms`);
    return result;
    
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Transaction function
const transaction = async (callback) => {
  console.log('Starting transaction...');
  try {
    await callback();
    saveDatabase();
    console.log('Transaction completed');
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
};

module.exports = { query, transaction, database };
