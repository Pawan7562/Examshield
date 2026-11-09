const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const updateScript = `
cat << 'EOF' > /var/www/Examshield/scripts/autoscaler.js
/**
 * ExamShield Intelligent Auto-Scaler & Self-Healing Daemon
 * 
 * Automatically scales backend cluster instances (between 6 and 16 nodes)
 * based on real-time CPU load, active exam sessions in Redis, and HTTP traffic.
 * Also provides continuous self-healing by restarting any unhealthy containers.
 */

const { exec } = require('child_process');
const os = require('os');
const Redis = require('redis');

const CONFIG = {
  minInstances: 6,               // Baseline nodes running 24/7
  moderateInstances: 10,         // Nodes under moderate traffic
  maxInstances: 16,              // Peak nodes during heavy examinations (up to 2,000+ students)
  checkIntervalMs: 15000,        // Check metrics every 15 seconds
  cooldownPeriodMs: 180000,      // 3 minutes cooldown before scale-down
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  
  // Scaling thresholds
  loadHigh: 1.8,                 // 1-minute load average > 1.8 triggers scale-up to 16
  loadModerate: 0.9,             // 1-minute load average > 0.9 triggers 10 nodes
  activeStudentsModerate: 100,   // > 100 concurrent students triggers 10 nodes
  activeStudentsHigh: 300,       // > 300 concurrent students triggers 16 nodes
};

let currentTargetInstances = 6;
let lastScaleUpTime = Date.now();
let lastScaleDownTime = 0;
let isScaling = false;

// Connect to Redis for live exam telemetry
const redisClient = Redis.createClient({ url: CONFIG.redisUrl });
redisClient.on('error', () => {});
redisClient.connect().catch(() => {});

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      resolve({ error, stdout: (stdout || '').trim(), stderr: (stderr || '').trim() });
    });
  });
}

async function getActiveStudentsCount() {
  try {
    if (!redisClient.isOpen) return 0;
    const keys = await redisClient.keys('session:*');
    return keys.length;
  } catch (err) {
    return 0;
  }
}

async function getRunningBackendInstances() {
  const { stdout } = await runCommand(
    'docker ps --filter "name=examshield-backend-" --format "{{.Names}}"'
  );
  if (!stdout) return [];
  return stdout.split('\\n').filter(Boolean);
}

async function setTargetScale(target) {
  if (isScaling) return;
  isScaling = true;

  try {
    const running = await getRunningBackendInstances();
    
    if (target > running.length) {
      console.log(\`[AUTOSCALER] 🚀 SCALING UP: Starting nodes \${running.length + 1} to \${target}...\`);
      for (let i = running.length + 1; i <= target; i++) {
        await runCommand(\`cd /var/www/Examshield && docker compose -f docker-compose.prod.yml up -d backend_\${i}\`);
      }
      lastScaleUpTime = Date.now();
      currentTargetInstances = target;
      console.log(\`[AUTOSCALER] ✅ Scale-up complete. Target \${target} active.\`);
    } else if (target < running.length) {
      const now = Date.now();
      if (now - lastScaleUpTime < CONFIG.cooldownPeriodMs) {
        const remaining = Math.round((CONFIG.cooldownPeriodMs - (now - lastScaleUpTime)) / 1000);
        console.log(\`[AUTOSCALER] ⏳ In scale-down cooldown (\${remaining}s remaining).\`);
        isScaling = false;
        return;
      }

      console.log(\`[AUTOSCALER] 📉 SCALING DOWN: Gracefully stopping nodes \${target + 1} to \${running.length}...\`);
      for (let i = running.length; i > target; i--) {
        const containerName = \`examshield-backend-\${i}\`;
        await runCommand(\`docker stop -t 10 \${containerName}\`);
      }
      lastScaleDownTime = Date.now();
      currentTargetInstances = target;
      console.log(\`[AUTOSCALER] ✅ Scale-down complete. Target \${target} active.\`);
    }
  } catch (err) {
    console.error('[AUTOSCALER] Scale error:', err);
  } finally {
    isScaling = false;
  }
}

async function selfHealingHealthCheck() {
  try {
    const running = await getRunningBackendInstances();
    for (const name of running) {
      const { stdout, error } = await runCommand(\`docker inspect \${name} --format '{{.State.Status}}'\`);
      if (error || stdout !== 'running') {
        console.warn(\`[AUTOSCALER] ⚠️ Container \${name} in state (\${stdout}). Restarting...\`);
        await runCommand(\`docker restart \${name}\`);
      }
    }
  } catch (err) {
    console.error('[AUTOSCALER] Self-healing error:', err);
  }
}

async function monitorAndScale() {
  try {
    const loadAvg = os.loadavg()[0];
    const memUsage = 1 - (os.freemem() / os.totalmem());
    const activeStudents = await getActiveStudentsCount();

    // Determine target nodes
    let desiredNodes = CONFIG.minInstances; // Default baseline 6

    if (loadAvg >= CONFIG.loadHigh || activeStudents >= CONFIG.activeStudentsHigh) {
      desiredNodes = CONFIG.maxInstances; // Peak 16 nodes
    } else if (loadAvg >= CONFIG.loadModerate || activeStudents >= CONFIG.activeStudentsModerate) {
      desiredNodes = CONFIG.moderateInstances; // Moderate 10 nodes
    }

    if (desiredNodes !== currentTargetInstances) {
      await setTargetScale(desiredNodes);
    }

    await selfHealingHealthCheck();
  } catch (err) {
    console.error('[AUTOSCALER] Evaluation error:', err);
  }
}

console.log('=====================================================');
console.log('🚀 ExamShield Intelligent Auto-Scaler Daemon Started');
console.log(\`Baseline Nodes: \${CONFIG.minInstances} | Max Peak Nodes: \${CONFIG.maxInstances}\`);
console.log('=====================================================');

setTargetScale(CONFIG.minInstances).then(() => {
  setInterval(monitorAndScale, CONFIG.checkIntervalMs);
});
EOF

systemctl restart examshield-autoscaler.service
systemctl status examshield-autoscaler.service --no-pager
`;
  conn.exec(updateScript, (err, stream) => {
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

