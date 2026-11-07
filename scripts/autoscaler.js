/**
 * ExamShield Intelligent Auto-Scaler & Self-Healing Daemon
 * 
 * Automatically scales backend cluster instances (between 6 and 16 nodes)
 * based on real-time CPU load, active exam sessions in Redis, and HTTP traffic.
 * Also provides continuous self-healing by restarting any unhealthy containers.
 */

const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const Redis = require('redis');

const CONFIG = {
  minInstances: 6,
  maxInstances: 16,
  checkIntervalMs: 10000,        // Check metrics every 10 seconds
  cooldownPeriodMs: 300000,      // 5 minutes cooldown before scale-down
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  
  // Scaling thresholds
  loadHigh: 1.5,                 // 1-minute load average > 1.5 triggers scale-up
  loadModerate: 0.8,             // 1-minute load average > 0.8 triggers moderate scale
  activeStudentsModerate: 100,   // > 100 concurrent students triggers 10 nodes
  activeStudentsHigh: 300,       // > 300 concurrent students triggers 16 nodes
};

let currentTargetInstances = 6;
let lastScaleUpTime = Date.now();
let lastScaleDownTime = 0;
let isScaling = false;

// Connect to Redis for live exam telemetry
const redisClient = Redis.createClient({ url: CONFIG.redisUrl });
redisClient.on('error', (err) => {
  // Non-fatal, fallback to system load metrics if Redis is temporarily unreachable
});
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
    // Count active session keys in Redis
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
  return stdout.split('\n').filter(Boolean);
}

async function setTargetScale(target) {
  if (isScaling || target === currentTargetInstances) return;
  isScaling = true;

  try {
    const running = await getRunningBackendInstances();
    console.log(`[AUTOSCALER] Scaling event: Current running count = ${running.length}, New target = ${target}`);

    if (target > running.length) {
      // Scale UP: start containers from running.length + 1 up to target
      console.log(`[AUTOSCALER] 🚀 SCALING UP: Starting nodes ${running.length + 1} to ${target}...`);
      for (let i = running.length + 1; i <= target; i++) {
        const containerName = `examshield-backend-${i}`;
        await runCommand(`cd /var/www/Examshield && docker compose -f docker-compose.prod.yml up -d backend_${i}`);
      }
      lastScaleUpTime = Date.now();
      console.log(`[AUTOSCALER] ✅ Scale-up complete. Target ${target} active.`);
    } else if (target < running.length) {
      // Check cooldown
      const now = Date.now();
      if (now - lastScaleUpTime < CONFIG.cooldownPeriodMs) {
        console.log(`[AUTOSCALER] ⏳ In scale-down cooldown (${Math.round((CONFIG.cooldownPeriodMs - (now - lastScaleUpTime)) / 1000)}s remaining).`);
        isScaling = false;
        return;
      }

      console.log(`[AUTOSCALER] 📉 SCALING DOWN: Gracefully stopping nodes ${target + 1} to ${running.length}...`);
      for (let i = running.length; i > target; i--) {
        const containerName = `examshield-backend-${i}`;
        await runCommand(`docker stop -t 10 ${containerName}`);
      }
      lastScaleDownTime = Date.now();
      console.log(`[AUTOSCALER] ✅ Scale-down complete. Target ${target} active.`);
    }

    currentTargetInstances = target;
  } catch (err) {
    console.error('[AUTOSCALER] Scale error:', err);
  } finally {
    isScaling = false;
  }
}

async function selfHealingHealthCheck() {
  try {
    const running = await getRunningBackendInstances();
    // Verify each running instance is responding
    for (const name of running) {
      const { stdout, error } = await runCommand(`docker inspect ${name} --format '{{.State.Status}}'`);
      if (error || stdout !== 'running') {
        console.warn(`[AUTOSCALER] ⚠️ Container ${name} in bad state (${stdout}). Triggering auto-restart...`);
        await runCommand(`docker restart ${name}`);
      }
    }
  } catch (err) {
    console.error('[AUTOSCALER] Self-healing error:', err);
  }
}

async function monitorAndScale() {
  try {
    const loadAvg = os.loadavg()[0]; // 1-minute load average
    const memUsage = 1 - (os.freemem() / os.totalmem());
    const activeStudents = await getActiveStudentsCount();

    console.log(
      `[AUTOSCALER-METRICS] Time: ${new Date().toISOString()} | LoadAvg(1m): ${loadAvg.toFixed(2)} | ` +
      `RAM: ${(memUsage * 100).toFixed(1)}% | Active Sessions: ${activeStudents} | Target Nodes: ${currentTargetInstances}`
    );

    // Decision Logic
    let desiredNodes = CONFIG.minInstances; // Default 6

    if (loadAvg >= CONFIG.loadHigh || activeStudents >= CONFIG.activeStudentsHigh) {
      desiredNodes = CONFIG.maxInstances; // Peak 16 nodes
    } else if (loadAvg >= CONFIG.loadModerate || activeStudents >= CONFIG.activeStudentsModerate) {
      desiredNodes = 10;                  // Moderate 10 nodes
    }

    if (desiredNodes !== currentTargetInstances) {
      await setTargetScale(desiredNodes);
    }

    // Run self-healing check on all running nodes
    await selfHealingHealthCheck();
  } catch (err) {
    console.error('[AUTOSCALER] Evaluation loop error:', err);
  }
}

console.log('=====================================================');
console.log('🚀 ExamShield Intelligent Auto-Scaler Daemon Started');
console.log(`Baseline Nodes: ${CONFIG.minInstances} | Max Peak Nodes: ${CONFIG.maxInstances}`);
console.log('=====================================================');

// Initial baseline bootstrap
setTargetScale(CONFIG.minInstances).then(() => {
  setInterval(monitorAndScale, CONFIG.checkIntervalMs);
});

