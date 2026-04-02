// transfer-data-to-supabase.js - Transfer all local data to Supabase
const fs = require('fs');
const path = require('path');

// Load local data
const DB_FILE = path.join(__dirname, 'data', 'examshield.json');
let localData = {};
if (fs.existsSync(DB_FILE)) {
  localData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  console.log('📊 Loaded local data:', Object.keys(localData));
} else {
  console.log('❌ No local data found');
  process.exit(1);
}

// Use the fixed Supabase config
const { supabase } = require('./config/supabase');

async function transferAllData() {
  console.log('🚀 Starting Data Transfer to Supabase...');
  
  try {
    // Step 1: Transfer colleges
    if (localData.colleges && localData.colleges.length > 0) {
      console.log('\n📊 Transferring colleges...');
      for (const college of localData.colleges) {
        console.log(`🏫 Transferring: ${college.name} (${college.email})`);
        
        const { data, error } = await supabase
          .from('colleges')
          .upsert([{
            name: college.name,
            email: college.email,
            password: college.password,
            phone: college.phone || '',
            address: college.address || '',
            website: college.website || '',
            subscription_plan: college.subscription_plan || 'basic',
            subscription_expiry: college.subscription_expiry,
            is_active: college.is_active !== false,
            created_at: college.created_at || new Date().toISOString()
          }])
          .select();
        
        if (error) {
          console.error(`❌ Error transferring ${college.email}:`, error);
        } else {
          console.log(`✅ Transferred: ${college.name}`);
        }
      }
    }
    
    // Step 2: Transfer super admins
    if (localData.super_admins && localData.super_admins.length > 0) {
      console.log('\n👑 Transferring super admins...');
      for (const admin of localData.super_admins) {
        console.log(`👤 Transferring: ${admin.name} (${admin.email})`);
        
        const { data, error } = await supabase
          .from('super_admins')
          .upsert([{
            name: admin.name,
            email: admin.email,
            password: admin.password,
            role: admin.role || 'super_admin',
            created_at: admin.created_at || new Date().toISOString()
          }])
          .select();
        
        if (error) {
          console.error(`❌ Error transferring admin ${admin.email}:`, error);
        } else {
          console.log(`✅ Transferred: ${admin.name}`);
        }
      }
    }
    
    // Step 3: Transfer subscriptions
    if (localData.subscriptions && localData.subscriptions.length > 0) {
      console.log('\n📋 Transferring subscriptions...');
      for (const subscription of localData.subscriptions) {
        console.log(`📄 Transferring subscription for college ${subscription.college_id}`);
        
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert([{
            college_id: subscription.college_id,
            plan: subscription.plan,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            status: subscription.status || 'active',
            amount: subscription.amount || 0,
            max_students: subscription.max_students || 50,
            max_exams: subscription.max_exams || 10,
            created_at: subscription.created_at || new Date().toISOString()
          }])
          .select();
        
        if (error) {
          console.error(`❌ Error transferring subscription:`, error);
        } else {
          console.log(`✅ Transferred subscription`);
        }
      }
    }
    
    // Step 4: Verify transfer
    console.log('\n🔍 Verifying data transfer...');
    
    const { data: colleges, error: collegesError } = await supabase
      .from('colleges')
      .select('*');
    
    if (collegesError) {
      console.error('❌ Error verifying colleges:', collegesError);
    } else {
      console.log(`✅ Colleges in Supabase: ${colleges.length}`);
      colleges.forEach(college => {
        console.log(`  🏫 ${college.name} - ${college.email}`);
      });
    }
    
    const { data: admins, error: adminsError } = await supabase
      .from('super_admins')
      .select('*');
    
    if (adminsError) {
      console.error('❌ Error verifying admins:', adminsError);
    } else {
      console.log(`✅ Super admins in Supabase: ${admins.length}`);
      admins.forEach(admin => {
        console.log(`  👑 ${admin.name} - ${admin.email}`);
      });
    }
    
    console.log('\n🎉 Data transfer completed!');
    console.log('🌐 View your data at: https://jzxvxxgsfbzqhrirnqfm.supabase.co');
    console.log('📊 Go to: Database → Tables to see your data');
    
  } catch (error) {
    console.error('❌ Transfer error:', error);
  }
}

transferAllData();
