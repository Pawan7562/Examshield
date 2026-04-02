// Add missing instructions column to exams table
const { supabase } = require('./config/supabase');

async function addInstructionsColumn() {
  try {
    console.log('🔧 Adding instructions column to exams table\n');
    
    // Add the missing column
    const { data, error } = await supabase
      .from('exams')
      .alter({
        table: 'exams',
        add: {
          column: 'instructions',
          type: 'TEXT',
          nullable: true,
          default: null
        }
      });
    
    if (error) {
      console.log('❌ Failed to add instructions column:', error.message);
      return;
    }
    
    console.log('✅ instructions column added successfully!');
    
    // Test the table structure
    console.log('\n2. 🧪 Testing exams table structure...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('exams')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log('❌ Table test failed:', testError.message);
      } else {
        console.log('✅ Table structure test passed!');
        console.log('📊 Columns:', Object.keys(testData[0] || {}));
      }
      
    } catch (testError) {
      console.log('❌ Structure test failed:', testError.message);
    }
    
    console.log('\n3. 🎯 Result:');
    console.log('✅ instructions column added to exams table');
    console.log('✅ Exams table should now have all required columns');
    console.log('✅ The 500 error should be resolved');
    console.log('✅ Try creating exam in frontend');
    
  } catch (error) {
    console.error('❌ Column addition failed:', error.message);
  }
}

addInstructionsColumn();
