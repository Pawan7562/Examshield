const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
    BEGIN;

    -- 1. Remove admin@collegeexam.com from super_admins
    DELETE FROM super_admins WHERE LOWER(email) = 'admin@collegeexam.com';

    -- 2. Remove college cu@gmail.com (and any cascade references)
    DELETE FROM colleges WHERE LOWER(email) = 'cu@gmail.com';

    COMMIT;

    -- Verification
    SELECT '=== REMAINING SUPER ADMINS ===' AS section;
    SELECT id, name, email, is_active FROM super_admins;

    SELECT '=== REMAINING COLLEGES ===' AS section;
    SELECT id, name, email, created_at FROM colleges ORDER BY created_at ASC;

    SELECT '=== TOTAL REMAINING STUDENTS ===' AS section;
    SELECT count(*) AS total_students FROM students;
  `;

  conn.exec(`docker exec -i examshield_postgres psql -U examshield_admin -d examshield_prod -c "${sql}"`, (err, stream) => {
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

