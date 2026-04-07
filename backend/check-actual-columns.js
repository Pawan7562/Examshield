const { supabase } = require('./config/supabase-clean');

async function checkActualQuestionsColumns() {
  console.log('🔍 Checking ACTUAL questions table columns...');
  
  try {
    // Get the actual column names directly
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error checking questions table:', error);
      return;
    }

    if (data && data.length > 0) {
      const sample = data[0];
      console.log('✅ ACTUAL questions table columns:');
      Object.keys(sample).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[key]} (${Array.isArray(sample[key]) ? 'array' : 'value'})`);
      });
      
      // Show what columns actually exist
      console.log('\n📋 Available columns for SELECT query:');
      const availableColumns = Object.keys(sample).join(', ');
      console.log(availableColumns);
      
    } else {
      console.log('⚠️ No questions found in table');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkActualQuestionsColumns().then(() => {
  console.log('\n🏁 Column verification completed');
  process.exit(0);
});
