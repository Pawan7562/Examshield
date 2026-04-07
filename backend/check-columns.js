const { supabase } = require('./config/supabase-clean');

async function checkQuestionsTable() {
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'questions')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Error checking columns:', error);
      return;
    }

    console.log('Questions table columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkQuestionsTable().then(() => {
  console.log('🏁 Column check completed');
  process.exit(0);
});
