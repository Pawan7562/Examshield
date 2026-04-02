// config/database-simple.js - Simple in-memory database for development
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// Simple in-memory database for development
const memoryDB = {
  colleges: [],
  super_admins: [
    {
      id: 1,
      name: 'Super Admin',
      email: 'admin@examshield.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // SuperAdmin@123
      role: 'super_admin'
    }
  ],
  students: [],
  exams: [],
  results: [],
  subscriptions: []
};

let nextId = 1;

/**
 * Execute a query (simplified for development)
 */
const query = async (text, params) => {
  const start = Date.now();
  
  try {
    let result = { rows: [], rowCount: 0 };
    
    // Simple query parsing for basic operations
    if (text.includes('SELECT') && text.includes('colleges')) {
      if (text.includes('WHERE email =')) {
        const email = params[0];
        result.rows = memoryDB.colleges.filter(college => college.email === email);
      } else if (text.includes('WHERE id =')) {
        const id = parseInt(params[0]);
        result.rows = memoryDB.colleges.filter(college => college.id === id);
      } else {
        result.rows = memoryDB.colleges;
      }
    }
    
    if (text.includes('SELECT') && text.includes('super_admins')) {
      if (text.includes('WHERE email =')) {
        const email = params[0];
        result.rows = memoryDB.super_admins.filter(admin => admin.email === email);
      } else {
        result.rows = memoryDB.super_admins;
      }
    }
    
    if (text.includes('INSERT') && text.includes('colleges')) {
      const newCollege = {
        id: nextId++,
        name: params[0], // collegeName
        email: params[1],
        password: params[2],
        phone: params[3] || '',
        address: params[4] || '',
        website: params[5] || '',
        subscription_plan: params[6] || 'basic',
        subscription_expiry: params[7],
        created_at: new Date()
      };
      
      memoryDB.colleges.push(newCollege);
      result.rows = [newCollege];
    }
    
    if (text.includes('INSERT') && text.includes('subscriptions')) {
      const newSubscription = {
        id: nextId++,
        college_id: params[0],
        plan: params[1],
        start_date: params[2],
        end_date: params[3],
        status: params[4],
        amount: params[5],
        max_students: params[6],
        max_exams: params[7],
        created_at: new Date()
      };
      
      memoryDB.subscriptions.push(newSubscription);
    }
    
    result.rowCount = result.rows.length;
    
    const duration = Date.now() - start;
    logger.info('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
    
    return result;
  } catch (error) {
    logger.error('Query error', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

/**
 * Execute a transaction (simplified)
 */
const transaction = async (callback) => {
  try {
    const result = await callback({ query });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = { query, getClient: () => {}, transaction, pool: { end: () => {} } };
