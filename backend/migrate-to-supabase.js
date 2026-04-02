// migrate-to-supabase.js - Migrate local data to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load local data
const DB_FILE = path.join(__dirname, 'data', 'examshield.json');
let localData = {};
if (fs.existsSync(DB_FILE)) {
  localData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Supabase configuration
const supabaseUrl = 'https://jzxvxxgsfbzqhrirnqfm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Must be service role key

if (!supabaseKey) {
  console.log('❌ Please set SUPABASE_SERVICE_KEY environment variable');
  console.log('📝 Get it from: https://jzxvxxgsfbzqhrirnqfm.supabase.co → Settings → API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('🚀 Migrating data to Supabase...');
  
  try {
    // Migrate colleges
    if (localData.colleges && localData.colleges.length > 0) {
      console.log('\n📊 Migrating colleges...');
      for (const college of localData.colleges) {
        const { data, error } = await supabase
          .from('colleges')
          .insert([{
            name: college.name,
            email: college.email,
            password: college.password,
            phone: college.phone,
            address: college.address,
            website: college.website,
            subscription_plan: college.subscription_plan,
            subscription_expiry: college.subscription_expiry,
            is_active: college.is_active,
            created_at: college.created_at
          }])
          .select();
        
        if (error) {
          console.error(`❌ Error migrating ${college.email}:`, error);
        } else {
          console.log(`✅ Migrated: ${college.name} (${college.email})`);
        }
      }
    }
    
    // Migrate super admins
    if (localData.super_admins && localData.super_admins.length > 0) {
      console.log('\n👑 Migrating super admins...');
      for (const admin of localData.super_admins) {
        const { data, error } = await supabase
          .from('super_admins')
          .insert([{
            name: admin.name,
            email: admin.email,
            password: admin.password,
            role: admin.role,
            created_at: admin.created_at
          }])
          .select();
        
        if (error) {
          console.error(`❌ Error migrating admin ${admin.email}:`, error);
        } else {
          console.log(`✅ Migrated: ${admin.name} (${admin.email})`);
        }
      }
    }
    
    // Migrate subscriptions
    if (localData.subscriptions && localData.subscriptions.length > 0) {
      console.log('\n📋 Migrating subscriptions...');
      for (const subscription of localData.subscriptions) {
        const { data, error } = await supabase
          .from('subscriptions')
          .insert([{
            college_id: subscription.college_id,
            plan: subscription.plan,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            status: subscription.status,
            amount: subscription.amount,
            max_students: subscription.max_students,
            max_exams: subscription.max_exams,
            created_at: subscription.created_at
          }])
          .select();
        
        if (error) {
          console.error(`❌ Error migrating subscription:`, error);
        } else {
          console.log(`✅ Migrated subscription for college ${subscription.college_id}`);
        }
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('🌐 View data at: https://jzxvxxgsfbzqhrirnqfm.supabase.co');
    console.log('📊 Go to: Database → Tables to view your data');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

migrateData();
