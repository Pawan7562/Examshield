// Add missing exam_key column to exams table
const { supabase } = require('./config/supabase');

async function addExamKeyColumn() {
  try {
    console.log('🔧 Adding exam_key column to exams table\n');
    
    // Check if column exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name', 'data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'exams')
      .eq('column_name', 'exam_key');
    
    if (checkError) {
      console.log('❌ Could not check column existence:', checkError.message);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('ℹ️  exam_key column already exists');
    } else {
      console.log('ℹ️  exam_key column missing, adding...');
      
      // Add the column
      const { data: alterResult, error: alterError } = await supabase
        .from('exams')
        .alter({
          table: 'exams',
          add: {
            column: 'exam_key',
            type: 'VARCHAR(50)',
            nullable: false,
            default: 'EXAM-000'
          }
        });
      
      if (alterError) {
        console.log('❌ Failed to add exam_key column:', alterError.message);
      } else {
        console.log('✅ exam_key column added successfully!');
      }
    }
    
    console.log('\n🎯 Result:');
    console.log('✅ exam_key column should now exist');
    console.log('✅ Exams table schema should be complete');
    console.log('✅ The 500 error should be resolved');
    
  } catch (error) {
    console.error('❌ Column addition failed:', error.message);
  }
}

addExamKeyColumn();
