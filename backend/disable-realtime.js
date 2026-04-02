// disable-realtime.js - Disable realtime for all Supabase tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzxvxxgsfbzqhrirnqfm.supabase.co';
const supabaseKey = 'sb_publishable_y3eNbkdEjC59m67N0GiY4Q_1rOveLyL';

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRealtime() {
  console.log('🔧 Disabling realtime for Supabase tables...');
  
  const tables = [
    'colleges',
    'super_admins', 
    'subscriptions',
    'students',
    'exams'
  ];
  
  for (const tableName of tables) {
    try {
      console.log(`📊 Processing ${tableName}...`);
      
      // Method 1: Try to disable realtime via RLS policy
      const { error } = await supabase.rpc('disable_realtime', {
        table_name: tableName
      });
      
      if (error) {
        console.log(`⚠️ RPC method failed for ${tableName}:`, error.message);
      } else {
        console.log(`✅ Realtime disabled for ${tableName}`);
      }
      
    } catch (err) {
      console.error(`❌ Error processing ${tableName}:`, err.message);
    }
  }
  
  console.log('\n🎯 Alternative Method: SQL Commands');
  console.log('If the above doesn\'t work, run these SQL commands in Supabase SQL Editor:');
  
  tables.forEach(tableName => {
    console.log(`ALTER TABLE ${tableName} SET (realtime = false);`);
  });
  
  console.log('\n📝 Or use the Supabase Dashboard method:');
  console.log('1. Go to Database → Tables');
  console.log('2. Click on each table');
  console.log('3. Go to Settings tab');
  console.log('4. Toggle "Enable Realtime" to OFF');
}

disableRealtime();
