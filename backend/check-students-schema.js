// Check actual students table schema
const { supabase } = require('./config/supabase');

async function checkStudentsSchema() {
  try {
    console.log('🔍 Checking students table schema...\n');
    
    // Check what columns actually exist
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Students table error:', error.message);
      return;
    }
    
    if (students && students.length > 0) {
      console.log('✅ Students table columns found:');
      Object.keys(students[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof students[0][key]}`);
      });
    } else {
      console.log('ℹ️ No students in table, checking schema...');
      
      // Try to get column info from information_schema
      const { data: columns, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'students')
        .eq('table_schema', 'public')
        .order('ordinal_position');
      
      if (schemaError) {
        console.log('❌ Schema check failed:', schemaError.message);
      } else {
        console.log('✅ Students table schema:');
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
      }
    }
    
    console.log('\n🔧 Fix needed: Remove non-existent column filters from adminController.js');
    console.log('   - Remove department filter');
    console.log('   - Remove batch filter');
    console.log('   - Keep only existing columns: id, college_id, student_id, name, email, password, roll_no, is_active, last_login, created_at, updated_at');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkStudentsSchema();
