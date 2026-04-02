// test-fixed-subscription.js - Test the fixed subscription endpoint
const { supabase } = require('./config/supabase-clean');

async function testFixedSubscription() {
  console.log('🔍 TESTING FIXED SUBSCRIPTION ENDPOINT');
  console.log('=====================================');

  try {
    // Test the fixed subscription query
    console.log('\n📊 Testing fixed subscription query...');
    
    // Use a sample college_id from the colleges table we found
    const collegeId = '749e5e00-413a-40d7-b867-279d3b8670dc';
    
    console.log(`Testing with college_id: ${collegeId}`);
    
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Fixed subscription query result:', {
      error: subError,
      data: subscription,
      success: !subError
    });

    // Test students query
    console.log('\n📊 Testing students query...');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('college_id', collegeId)
      .eq('is_active', true);

    console.log('Students query result:', {
      error: studentError,
      data: students,
      success: !studentError,
      count: students?.length || 0
    });

    // Simulate the complete response
    console.log('\n📊 Complete subscription response:');
    const response = {
      success: true,
      data: {
        subscription: subscription,
        studentCount: students?.length || 0,
        hasSubscription: !!subscription,
        plan: subscription?.plan || 'free'
      }
    };
    
    console.log('Response:', JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testFixedSubscription();
