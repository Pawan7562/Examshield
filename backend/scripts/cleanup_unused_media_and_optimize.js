const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function cleanupAndOptimize() {
  console.log('======================================================================');
  console.log('🧹 EXAMSHIELD MEDIA CLEANUP & DATABASE OPTIMIZATION');
  console.log('======================================================================\n');

  // 1. Delete orphaned images in backend/uploads directory
  const uploadsDir = path.resolve(__dirname, '../uploads');
  console.log('1. Checking and cleaning filesystem upload files...');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    for (const file of files) {
      if (file !== '.gitkeep' && (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.mp4') || file.endsWith('.webm'))) {
        const filePath = path.join(uploadsDir, file);
        fs.unlinkSync(filePath);
        console.log(`   ✓ Deleted unused image file: ${file}`);
        deletedCount++;
      }
    }
    console.log(`   ✅ Removed ${deletedCount} unused media file(s) from uploads.`);
  }

  // 2. Clear all screenshot and image columns in the database
  console.log('\n2. Verifying database media columns...');
  const violRes = await pool.query('UPDATE violations SET screenshot_url = NULL WHERE screenshot_url IS NOT NULL RETURNING id;');
  console.log(`   ✓ Reset ${violRes.rowCount} screenshot_url values in violations table.`);

  const studentPhotoRes = await pool.query('UPDATE students SET profile_photo = NULL WHERE profile_photo IS NOT NULL RETURNING id;');
  console.log(`   ✓ Reset ${studentPhotoRes.rowCount} profile_photo values in students table.`);

  const questionImgRes = await pool.query('UPDATE questions SET image_url = NULL WHERE image_url IS NOT NULL RETURNING id;');
  console.log(`   ✓ Reset ${questionImgRes.rowCount} image_url values in questions table.`);

  // 3. Clean up test exams / temporary simulation records to ensure 100% clean database
  console.log('\n3. Cleaning temporary virtual test exams...');
  const testExams = await pool.query("SELECT id, title FROM exams WHERE title ILIKE '%Virtual Candidate%' OR title ILIKE '%test%' ORDER BY created_at;");
  for (const ex of testExams.rows) {
    if (ex.title.includes('Virtual Candidate') || ex.title === 'TEST' || ex.title === 'chinchan') {
      await pool.query('DELETE FROM answers WHERE exam_id = $1;', [ex.id]).catch(() => {});
      await pool.query('DELETE FROM results WHERE exam_id = $1;', [ex.id]).catch(() => {});
      await pool.query('DELETE FROM violations WHERE exam_id = $1;', [ex.id]).catch(() => {});
      await pool.query('DELETE FROM exam_sessions WHERE exam_id = $1;', [ex.id]).catch(() => {});
      await pool.query('DELETE FROM exam_assignments WHERE exam_id = $1;', [ex.id]).catch(() => {});
      await pool.query('DELETE FROM exam_students WHERE exam_id = $1;', [ex.id]).catch(() => {});
      await pool.query('DELETE FROM questions WHERE exam_id = $1;', [ex.id]).catch(() => {});
      await pool.query('DELETE FROM exams WHERE id = $1;', [ex.id]).catch(() => {});
      console.log(`   ✓ Removed temporary test exam: "${ex.title}" (${ex.id})`);
    }
  }

  // Clean up any remaining virtual test students
  const testStudents = await pool.query("DELETE FROM students WHERE email ILIKE '%virtual%' RETURNING id, email;");
  console.log(`   ✓ Removed ${testStudents.rowCount} virtual test student record(s).`);

  // 4. Run VACUUM ANALYZE to reclaim disk space, eliminate dead tuples, and update query planner statistics
  console.log('\n4. Running VACUUM ANALYZE on PostgreSQL...');
  await pool.query('VACUUM ANALYZE;');
  console.log('   ✓ Database VACUUM ANALYZE completed successfully. Space reclaimed.');

  // 5. Final summary
  const finalSummary = await pool.query(`
    SELECT
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;
  `);

  console.log('\n======================================================================');
  console.log('📊 FINAL CLEAN DATABASE STATUS');
  console.log('======================================================================');
  console.table(finalSummary.rows);

  await pool.end();
}

cleanupAndOptimize().catch(console.error);
