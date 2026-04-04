const { supabase } = require('./config/supabase-clean');

async function checkRLS() {
  console.log('--- Checking RLS Policies ---');
  
  // We can query pg_policies using an RPC or a raw query if we had one, 
  // but we only have the supabase client.
  // We can try to see if we can read from tables while authenticated (simulated).
  
  const tables = ['exam_sessions', 'answers', 'results', 'questions'];
  
  for (const table of tables) {
    console.log(`\nTesting table: ${table}`);
    const { data, error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`❌ Error reading ${table}:`, error.message);
      if (error.message.includes('policy')) {
        console.log(`⚠️ RLS Policy block detected for ${table}`);
      }
    } else {
      console.log(`✅ Can read ${table} metadata`);
    }
  }
}

checkRLS();
