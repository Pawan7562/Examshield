const { pool } = require('./config/database');

async function createTable() {
  const sql = `
  CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    message TEXT NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    admin_reply TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `;
  await pool.query(sql);
  console.log('support_tickets table created successfully in Neon Postgres!');
  process.exit(0);
}

createTable().catch(e => {
  console.error(e);
  process.exit(1);
});
