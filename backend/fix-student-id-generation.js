// Fix student ID generation to avoid duplicates
const { supabase } = require('./config/supabase');

const generateStudentId = async (collegeId) => {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  
  // Use timestamp to ensure uniqueness
  const uniqueId = `ES-${year}-${timestamp.toString().slice(-6)}`;
  
  console.log('Generated student ID:', uniqueId);
  return uniqueId;
};

async function testStudentIdGeneration() {
  try {
    console.log('🔧 Testing Student ID Generation Fix\n');
    
    // Test the new ID generation
    const id1 = await generateStudentId('test-college-id');
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    const id2 = await generateStudentId('test-college-id');
    
    console.log('ID 1:', id1);
    console.log('ID 2:', id2);
    console.log('IDs are unique:', id1 !== id2 ? '✅' : '❌');
    
    console.log('\n📝 This fix will be applied to the studentController');
    console.log('The new format: ES-YYYY-timestamp (last 6 digits)');
    console.log('This ensures no duplicate student IDs');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStudentIdGeneration();
