const { supabase } = require('./config/supabase-clean');
require('dotenv').config();

async function checkSubmissionTables() {
  try {
    const tables = ['results', 'answers', 'exam_sessions', 'questions'];
    
    for (const table of tables) {
      console.log(`\n--- Checking ${table} Table ---`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        // Try to get schema by other means if possible
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`${table} columns:`, JSON.stringify(Object.keys(data[0]), null, 2));
      } else {
        console.log(`${table} table is empty. Attempting to insert dummy to see structure...`);
        // This is a bit risky but can reveal columns if RLS allows
      }
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkSubmissionTables();
