const { pool } = require('./config/database');

async function seed() {
  try {
    const { rows } = await pool.query('SELECT count(*) FROM subscriptions');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('Seeding initial subscriptions...');
      await pool.query(`
        INSERT INTO subscriptions (college_id, plan, start_date, end_date, amount, currency, payment_id, payment_gateway, status, max_students, max_exams)
        VALUES 
          ('69ec2a7e-f3ed-4087-88fd-beee7dfa2c4f', 'standard', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 2999.00, 'INR', 'pay_live_cgc001', 'razorpay', 'active', 200, 50),
          ('e8464577-8d59-41ee-ab13-3d9b69b06d07', 'basic', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 999.00, 'INR', 'pay_live_cgc002', 'razorpay', 'active', 50, 10);
        UPDATE colleges SET subscription_plan = 'standard' WHERE id = '69ec2a7e-f3ed-4087-88fd-beee7dfa2c4f';
      `);
      console.log('Seeded initial subscriptions successfully!');
    } else {
      console.log('Subscriptions already exist:', rows[0].count);
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await pool.end();
  }
}

seed();
