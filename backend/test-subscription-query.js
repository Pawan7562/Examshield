// test-subscription-query.js - Test the actual subscription query
const { supabase } = require('./config/supabase-clean');

async function testSubscriptionQuery() {
  console.log('🔍 TESTING SUBSCRIPTION QUERY');
  console.log('============================');

  try {
    // Test the exact query from getCurrentSubscription
    console.log('\n📊 Testing subscription query with college join...');
    
    // Use a sample college_id from the colleges table we found
    const collegeId = '749e5e00-413a-40d7-b867-279d3b8670dc';
    
    console.log(`Testing with college_id: ${collegeId}`);
    
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        colleges!inner(name)
      `)
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Subscription query result:', {
      error: subError,
      data: subscription,
      success: !subError
    });

    if (subError) {
      console.log('❌ Subscription query failed:', subError.message);
      console.log('Error details:', subError);
    }

    // Test a simpler query without the join
    console.log('\n📊 Testing simpler subscription query...');
    const { data: simpleSub, error: simpleError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('Simple subscription query result:', {
      error: simpleError,
      data: simpleSub,
      success: !simpleError
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

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testSubscriptionQuery();
