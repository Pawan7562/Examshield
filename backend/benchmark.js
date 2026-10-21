const https = require('https');
const http = require('http');

async function benchmark(name, url, totalRequests, concurrency) {
  console.log('\n==============================================');
  console.log('Benchmarking:', name);
  console.log('URL:', url);
  console.log(`Total Requests: ${totalRequests} | Concurrency: ${concurrency}`);
  console.log('==============================================');

  let success = 0;
  let failures = 0;
  const latencies = [];
  const startTime = Date.now();
  const u = new URL(url);
  const client = u.protocol === 'https:' ? https : http;

  const agent = new (u.protocol === 'https:' ? https.Agent : http.Agent)({
    keepAlive: true,
    maxSockets: concurrency + 10,
  });

  function makeRequest() {
    return new Promise((resolve) => {
      const reqStart = Date.now();
      const req = client.request({
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'GET',
        agent: agent,
        timeout: 15000,
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          const latency = Date.now() - reqStart;
          latencies.push(latency);
          if (res.statusCode >= 200 && res.statusCode < 400) {
            success++;
          } else {
            failures++;
          }
          resolve();
        });
      });

      req.on('error', () => {
        failures++;
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        failures++;
        resolve();
      });

      req.end();
    });
  }

  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < totalRequests) {
      index++;
      await makeRequest();
    }
  });

  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (totalRequests / totalTimeSec).toFixed(1);

  console.log(`Finished in: ${totalTimeSec.toFixed(2)}s`);
  console.log(`Requests/sec: ${rps} req/s`);
  console.log(`Success: ${success}/${totalRequests} (${((success / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Failures: ${failures}`);
  console.log(`Latency (Avg): ${avg.toFixed(1)}ms`);
  console.log(`Latency (p50): ${p50}ms`);
  console.log(`Latency (p95): ${p95}ms`);
  console.log(`Latency (p99): ${p99}ms`);
}

async function run() {
  await benchmark('VPS Production Health Check (50 concurrent calls)', 'https://exam.nexifyforge.in/api/health', 100, 20);
}

run();
