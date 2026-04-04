const { supabase } = require('./config/supabase-clean');
require('dotenv').config();

async function checkColumns() {
  const tables = ['exams', 'questions', 'exam_sessions', 'answers', 'results'];
  
  for (const table of tables) {
    console.log(`\n--- Checking ${table} Table ---`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
       console.error(`Error fetching ${table}:`, error.message);
       if (error.message.includes('not find')) {
         console.log(`⚠️ Table ${table} does NOT exist!`);
       }
    } else if (data && data.length > 0) {
       console.log(`${table} columns:`, Object.keys(data[0]));
    } else {
       console.log(`${table} table is empty`);
    }
  }
}

checkColumns();
