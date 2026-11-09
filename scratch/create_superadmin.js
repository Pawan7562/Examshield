const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    docker exec examshield-backend-1 node -e "
      const bcrypt = require('bcryptjs');
      const { pool } = require('./config/database');
      async function createSuperAdmin() {
        try {
          const email = 'pawankumaryadav75628697@gmail.com';
          const plain = 'Qwerty@9934';
          const name = 'Pawan Kumar';
          const hash = await bcrypt.hash(plain, 12);

          // Check if exists
          const existing = await pool.query('SELECT id FROM super_admins WHERE LOWER(email) = LOWER(\\$1)', [email]);
          if (existing.rows.length > 0) {
            await pool.query('UPDATE super_admins SET password = \\$1, is_active = true, updated_at = NOW() WHERE LOWER(email) = LOWER(\\$2)', [hash, email]);
            console.log('Super Admin updated successfully.');
          } else {
            await pool.query('INSERT INTO super_admins (name, email, password, is_active) VALUES (\\$1, \\$2, \\$3, true)', [name, email, hash]);
            console.log('Super Admin created successfully.');
          }

          const verify = await pool.query('SELECT id, name, email, is_active, created_at FROM super_admins WHERE LOWER(email) = LOWER(\\$1)', [email]);
          console.log('Super admin record:', verify.rows);
          process.exit(0);
        } catch (err) {
          console.error('Error creating super admin:', err);
          process.exit(1);
        }
      }
      createSuperAdmin();
    "
  `;

  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '147.93.19.252',
  port: 22,
  username: 'root',
  password: 'a?2n,rVia15/Qqih'
});
