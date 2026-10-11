require('dotenv').config({ path: './backend/.env' });
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('Adding credentials_sent_at column to students table...');
    await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL');
    console.log('✅ Column added successfully.');

    // Read students_received_email.csv
    const receivedPath = path.resolve(__dirname, '../../students_received_email.csv');
    if (fs.existsSync(receivedPath)) {
      const receivedContent = fs.readFileSync(receivedPath, 'utf-8');
      const lines = receivedContent.split('\n').filter(l => l.trim().length > 0).slice(1);
      const emails = lines.map(l => {
        const parts = l.split(',');
        return (parts[2] || '').replace(/^"|"$/g, '').trim().toLowerCase();
      }).filter(Boolean);

      console.log(`Backfilling ${emails.length} already delivered students...`);
      const res = await pool.query('UPDATE students SET credentials_sent_at = created_at WHERE LOWER(email) = ANY($1)', [emails]);
      console.log(`✅ Updated rows: ${res.rowCount}`);
    }

    const pendingCount = await pool.query('SELECT COUNT(*) FROM students WHERE credentials_sent_at IS NULL');
    const sentCount = await pool.query('SELECT COUNT(*) FROM students WHERE credentials_sent_at IS NOT NULL');
    console.log(`📊 Sent students in DB: ${sentCount.rows[0].count}`);
    console.log(`📊 Pending students in DB: ${pendingCount.rows[0].count}`);
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
