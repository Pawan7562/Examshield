// debug-subscription-error.js - Debug subscription API error
const { supabase } = require('./config/supabase-clean');

async function debugSubscriptionError() {
  console.log('🔍 DEBUGGING SUBSCRIPTION API ERROR');
  console.log('=====================================');

  try {
    // Check if subscriptions table exists
    console.log('\n📊 Checking subscriptions table...');
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    console.log('Subscriptions table check:', {
      error: subError,
      data: subscriptions,
      exists: !subError || subError.code !== 'PGRST116'
    });

    // Check if colleges table exists
    console.log('\n📊 Checking colleges table...');
    const { data: colleges, error: collegeError } = await supabase
      .from('colleges')
      .select('*')
      .limit(1);

    console.log('Colleges table check:', {
      error: collegeError,
      data: colleges,
      exists: !collegeError || collegeError.code !== 'PGRST116'
    });

    // Check if students table exists
    console.log('\n📊 Checking students table...');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    console.log('Students table check:', {
      error: studentError,
      data: students,
      exists: !studentError || studentError.code !== 'PGRST116'
    });

    // List all tables
    console.log('\n📋 Listing all tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.log('Error listing tables:', tablesError);
    } else {
      console.log('Available tables:');
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug script
debugSubscriptionError();
