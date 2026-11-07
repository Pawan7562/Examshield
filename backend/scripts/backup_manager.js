// backend/scripts/backup_manager.js
// Enterprise Automated Database Backup & Disaster Recovery Manager for ExamShield

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = process.env.BACKUP_DIR || '/var/backups/examshield';
const CONTAINER_NAME = process.env.POSTGRES_CONTAINER || 'examshield_postgres';
const DB_NAME = process.env.DB_NAME || 'examshield_prod';
const DB_USER = process.env.DB_USER || 'examshield_admin';

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout || err.message));
      resolve(stdout.trim());
    });
  });
}

/**
 * Creates an immediate verified database backup
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const fileName = `examshield_db_${timestamp}.sql.gz`;
  const filePath = path.join(BACKUP_DIR, fileName);
  const latestLink = path.join(BACKUP_DIR, 'latest.sql.gz');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
  }

  console.log(`[BACKUP] Starting database snapshot to: ${filePath}...`);
  const startTime = Date.now();

  const dumpCmd = `docker exec ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} --clean --if-exists --no-owner --no-privileges | gzip -9 > "${filePath}"`;
  await runCmd(dumpCmd);

  // Verification
  await runCmd(`gzip -t "${filePath}"`);
  const stats = fs.statSync(filePath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  // Update latest symlink
  try {
    if (fs.existsSync(latestLink)) fs.unlinkSync(latestLink);
    fs.symlinkSync(filePath, latestLink);
  } catch (_) {}

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[BACKUP SUCCESS] Verified backup created in ${durationSec}s (${sizeMb} MB) -> ${fileName}`);

  return {
    success: true,
    file: fileName,
    path: filePath,
    sizeBytes: stats.size,
    sizeMb,
    durationSec,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Lists all existing database backups
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('examshield_db_') && f.endsWith('.sql.gz'))
    .map((f) => {
      const p = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(p);
      return {
        filename: f,
        path: p,
        sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
        sizeBytes: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return files;
}

if (require.main === module) {
  const action = process.argv[2] || 'list';

  if (action === 'backup') {
    createBackup()
      .then((res) => {
        console.log(JSON.stringify(res, null, 2));
        process.exit(0);
      })
      .catch((err) => {
        console.error('Backup error:', err.message);
        process.exit(1);
      });
  } else if (action === 'list') {
    const list = listBackups();
    console.log(`Found ${list.length} backups in ${BACKUP_DIR}:`);
    console.table(list);
  } else {
    console.log('Usage: node backup_manager.js [backup|list]');
  }
}

module.exports = {
  createBackup,
  listBackups,
};
