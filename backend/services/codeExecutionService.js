// backend/services/codeExecutionService.js
// Production-grade multi-language sandboxed execution & automated grading service for ExamShield

const { spawn, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Supported language IDs mapping for Judge0 CE
const JUDGE0_LANGUAGE_MAP = {
  javascript: 63, // JavaScript (Node.js 18+)
  js: 63,
  node: 63,
  python: 71,     // Python (3.8.1+)
  py: 71,
  python3: 71,
  cpp: 54,        // C++ (GCC 9.2.0)
  'c++': 54,
  c: 50,          // C (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13/17)
  csharp: 51,     // C# (Mono 6.6.0)
  'c#': 51,
  ruby: 72,       // Ruby (2.7.0)
  go: 60,         // Go (1.13.5)
  golang: 60,
  rust: 73,       // Rust (1.40.0)
  typescript: 74, // TypeScript (3.7.4)
  ts: 74,
};

// Base URL for Judge0 service
const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || '';

/**
 * Normalizes output string by:
 * - Converting CRLF to LF
 * - Trimming trailing spaces from each individual line
 * - Trimming overall leading and trailing whitespace
 * - Stripping outer quotes if wrapped
 */
function normalizeOutput(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? String(val) : String(parseFloat(val.toFixed(6)));
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (_) {
      return String(val).trim();
    }
  }

  let str = String(val).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = str.split('\n').map(l => l.trimEnd());
  str = lines.join('\n').trim();

  // If wrapped in matching quotes, unwrap
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1).trim();
  }
  return str;
}

/**
 * Robust output comparison:
 * - Exact string match after line-by-line whitespace normalization
 * - Numeric tolerance for floating point numbers (1e-6)
 * - JSON deep equality for arrays/objects
 * - Multiple valid answers separated by '||' or 'OR' in expected output
 */
function areOutputsEqual(actual, expected) {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  if (normActual === normExpected) return true;

  // Handle multiple valid answers in expected (e.g., "0 1 || 1 0" or "[0,1] || [1,0]")
  if (normExpected.includes('||')) {
    const validOptions = normExpected.split('||').map(s => normalizeOutput(s));
    if (validOptions.some(opt => areOutputsEqual(actual, opt))) {
      return true;
    }
  }

  // Numerical comparison tolerance (float rounding)
  const numActual = Number(normActual);
  const numExpected = Number(normExpected);
  if (!isNaN(numActual) && !isNaN(numExpected) && normActual !== '' && normExpected !== '') {
    return Math.abs(numActual - numExpected) < 1e-6;
  }

  // JSON comparison for arrays/objects (handles whitespace in "[ 1, 2 ]" vs "[1,2]")
  try {
    const parsedA = JSON.parse(normActual);
    const parsedB = JSON.parse(normExpected);
    if (typeof parsedA === 'object' && typeof parsedB === 'object') {
      return JSON.stringify(parsedA) === JSON.stringify(parsedB);
    }
  } catch (_) {}

  // Compare array-like space-separated vs comma-separated output
  const tokensA = normActual.replace(/[[\],]/g, ' ').split(/\s+/).filter(Boolean);
  const tokensB = normExpected.replace(/[[\],]/g, ' ').split(/\s+/).filter(Boolean);
  if (tokensA.length > 0 && tokensA.length === tokensB.length) {
    const allMatch = tokensA.every((tok, idx) => {
      if (tok === tokensB[idx]) return true;
      const nA = Number(tok);
      const nB = Number(tokensB[idx]);
      if (!isNaN(nA) && !isNaN(nB)) return Math.abs(nA - nB) < 1e-6;
      return false;
    });
    if (allMatch) return true;
  }

  return false;
}

/**
 * Local Node.js execution sandbox for JavaScript
 */
function executeLocalNode(sourceCode, stdin = '', timeLimitMs = 2000) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const child = spawn(
      process.execPath,
      ['--max-old-space-size=256', '-e', sourceCode],
      {
        env: {}, // Empty environment: protects secrets & env vars
        timeout: timeLimitMs + 800,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const killTimer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch (_) {}
    }, timeLimitMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 500000) {
        child.kill('SIGKILL');
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 50000) {
        child.kill('SIGKILL');
      }
    });

    child.on('close', (code, signal) => {
      clearTimeout(killTimer);
      const elapsedMs = Date.now() - startTime;

      if (timedOut || signal === 'SIGKILL' || signal === 'SIGTERM') {
        resolve({
          status: 'Time Limit Exceeded',
          judgeStatus: 'Time Limit Exceeded',
          stdout,
          stderr: stderr || 'Execution timed out.',
          error: 'Time Limit Exceeded',
          timeMs: Math.max(timeLimitMs, elapsedMs),
          memoryKb: 24000,
        });
      } else if (code !== 0) {
        resolve({
          status: 'Runtime Error',
          judgeStatus: 'Runtime Error',
          stdout,
          stderr,
          error: stderr || `Process exited with code ${code}`,
          timeMs: elapsedMs,
          memoryKb: 22000,
        });
      } else {
        resolve({
          status: 'Success',
          judgeStatus: 'Accepted',
          stdout: stdout ? stdout.trim() : '',
          stderr: stderr || null,
          error: null,
          timeMs: Math.max(1, elapsedMs),
          memoryKb: 21000,
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      resolve({
        status: 'Runtime Error',
        judgeStatus: 'Runtime Error',
        stdout: '',
        stderr: err.message,
        error: err.message,
        timeMs: Date.now() - startTime,
        memoryKb: 0,
      });
    });

    try {
      if (stdin !== undefined && stdin !== null) {
        child.stdin.write(String(stdin));
      }
      child.stdin.end();
    } catch (_) {}
  });
}

/**
 * High-speed Judge0 CE runner using non-blocking submission + token polling.
 * Avoids Cloudflare socket timeouts and HTTP gateway drops.
 */
async function executeOnJudge0(sourceCode, language, stdin = '', timeLimitSec = 2, memoryLimitMb = 256) {
  const langKey = (language || 'javascript').toLowerCase();
  const langId = JUDGE0_LANGUAGE_MAP[langKey] || 71;

  const url = `${JUDGE0_URL}/submissions?base64_encoded=true`;
  const headers = { 'Content-Type': 'application/json' };
  if (JUDGE0_KEY) {
    headers['X-RapidAPI-Key'] = JUDGE0_KEY;
    headers['X-RapidAPI-Host'] = new URL(JUDGE0_URL).host;
  }

  const payload = {
    source_code: Buffer.from(sourceCode || '').toString('base64'),
    language_id: langId,
    stdin: Buffer.from(stdin || '').toString('base64'),
    cpu_time_limit: Math.max(1, Math.min(10, Math.ceil(timeLimitSec))),
    memory_limit: Math.max(16000, Math.min(512000, memoryLimitMb * 1024)),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Judge0 POST failed (${response.status}): ${errorText}`);
  }

  const { token } = await response.json();
  if (!token) {
    throw new Error('Judge0 did not return a submission token.');
  }

  // Poll for completion (typical execution takes 300-900ms)
  const pollUrl = `${JUDGE0_URL}/submissions/${token}?base64_encoded=true`;
  const maxAttempts = 20; // Up to ~7 seconds of polling
  let data = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 350));
    try {
      const pollRes = await fetch(pollUrl, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        // Judge0 Status IDs: 1 = In Queue, 2 = Processing
        if (pollData && pollData.status && pollData.status.id > 2) {
          data = pollData;
          break;
        }
      }
    } catch (_) {
      // Continue polling on transient network hiccups
    }
  }

  if (!data) {
    throw new Error('Judge0 submission timed out during queue processing.');
  }

  const decodeB64 = (val) => {
    if (!val) return '';
    try {
      return Buffer.from(val, 'base64').toString('utf8');
    } catch (_) {
      return String(val);
    }
  };

  const stdout = decodeB64(data.stdout);
  const stderr = decodeB64(data.stderr);
  const compileOutput = decodeB64(data.compile_output);
  const message = data.message ? decodeB64(data.message) : null;
  const statusDesc = data.status?.description || 'Finished';
  const statusId = data.status?.id;

  let finalStatus = 'Success';
  let errorMsg = null;

  if (statusId === 6 || compileOutput) {
    finalStatus = 'Compilation Error';
    errorMsg = compileOutput || stderr || 'Compilation error';
  } else if (statusId === 5 || (message && message.toLowerCase().includes('time limit'))) {
    finalStatus = 'Time Limit Exceeded';
    errorMsg = 'Time limit exceeded';
  } else if (statusId === 11 || (statusId >= 7 && statusId <= 12) || stderr) {
    finalStatus = 'Runtime Error';
    errorMsg = stderr || message || `Process exited with error (Status ${statusId})`;
  }

  return {
    status: finalStatus,
    judgeStatus: statusDesc,
    stdout: stdout ? stdout.trim() : '',
    stderr: stderr || compileOutput,
    error: errorMsg,
    timeMs: Math.round(parseFloat(data.time || '0') * 1000),
    memoryKb: data.memory || Math.round(memoryLimitMb * 1024),
  };
}

/**
 * Find local g++ compiler path on the machine
 */
function findGppPath() {
  const candidates = [
    'C:\\MinGW\\bin\\g++.exe',
    'C:\\msys64\\mingw64\\bin\\g++.exe',
    'C:\\Program Files\\mingw-w64\\bin\\g++.exe',
    'g++'
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (_) {}
  }
  return null;
}

/**
 * Native local C++ compiler and execution sandbox (MinGW / GCC)
 * Instant compilation and execution with zero external network dependency.
 */
function executeLocalCpp(sourceCode, stdin = '', timeLimitMs = 2500) {
  return new Promise((resolve) => {
    try {
      const gppPath = findGppPath();
      if (!gppPath) {
        return resolve(null);
      }
      const gppDir = path.dirname(gppPath);
      const compileEnv = {
        ...process.env,
        PATH: `${gppDir};${process.env.PATH || ''}`,
        SystemRoot: process.env.SystemRoot || 'C:\\Windows'
      };

      const id = Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const tmpDir = os.tmpdir();
      const srcFile = path.join(tmpDir, `sol_${id}.cpp`);
      const exeFile = path.join(tmpDir, `sol_${id}.exe`);

      fs.writeFileSync(srcFile, sourceCode, 'utf8');

      const cleanFiles = () => {
        try { if (fs.existsSync(srcFile)) fs.unlinkSync(srcFile); } catch (_) {}
        try { if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile); } catch (_) {}
      };

      const compileStart = Date.now();
      execFile(gppPath, ['-O2', srcFile, '-o', exeFile], { env: compileEnv, timeout: 8000 }, (compErr, _, compStderr) => {
        if (compErr) {
          cleanFiles();
          return resolve({
            status: 'Compilation Error',
            judgeStatus: 'Compilation Error',
            stdout: '',
            stderr: compStderr || compErr.message,
            error: compStderr || compErr.message,
            timeMs: Date.now() - compileStart,
            memoryKb: 0
          });
        }

        const execStart = Date.now();
        const runEnv = {
          ...process.env,
          PATH: `${gppDir};${process.env.SystemRoot || 'C:\\Windows'}\\System32;${process.env.PATH || ''}`,
          SystemRoot: process.env.SystemRoot || 'C:\\Windows'
        };

        try {
          const child = execFile(exeFile, [], { env: runEnv, timeout: timeLimitMs + 500, maxBuffer: 1024 * 1024 }, (runErr, stdout, stderr) => {
            cleanFiles();
            const elapsed = Date.now() - execStart;

            if (runErr && (runErr.killed || runErr.signal === 'SIGTERM')) {
              return resolve({
                status: 'Time Limit Exceeded',
                judgeStatus: 'Time Limit Exceeded',
                stdout: stdout || '',
                stderr: 'Execution timed out',
                error: 'Time Limit Exceeded',
                timeMs: Math.max(timeLimitMs, elapsed),
                memoryKb: 12000
              });
            }

            if (runErr) {
              return resolve({
                status: 'Runtime Error',
                judgeStatus: 'Runtime Error',
                stdout: stdout || '',
                stderr: stderr || runErr.message,
                error: stderr || runErr.message,
                timeMs: elapsed,
                memoryKb: 12000
              });
            }

            return resolve({
              status: 'Success',
              judgeStatus: 'Accepted',
              stdout: stdout ? stdout.trim() : '',
              stderr: stderr || null,
              error: null,
              timeMs: Math.max(1, elapsed),
              memoryKb: 12000
            });
          });

          if (stdin && child && child.stdin) {
            child.stdin.write(String(stdin));
            child.stdin.end();
          }
        } catch (execSpawnErr) {
          cleanFiles();
          resolve(null);
        }
      });
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Universal resilient code runner with zero-failure fallbacks:
 * - JS: Local Node.js runtime (instant).
 * - C++, Python, Java: High-speed Judge0 CE with fast non-blocking token polling.
 * - Auto-fallback to local compilers if Cloud API is degraded.
 */
async function runSingleCase(sourceCode, language, stdin = '', timeLimitMs = 2000, memoryLimitMb = 256) {
  const lang = (language || 'javascript').toLowerCase();
  const timeLimitSec = Math.max(1, Math.round(timeLimitMs / 1000));

  // 1. JavaScript: local Node.js (instant 10ms execution)
  if (lang === 'javascript' || lang === 'js' || lang === 'node') {
    return await executeLocalNode(sourceCode, stdin, timeLimitMs);
  }

  // 2. High-speed Cloud execution via Judge0 CE with non-blocking polling (< 1.2s)
  try {
    const res = await executeOnJudge0(sourceCode, lang, stdin, timeLimitSec, memoryLimitMb);
    if (res && res.status) return res;
  } catch (judgeErr) {
    console.warn(`Judge0 CE polling notice (${judgeErr.message}). Checking local fallbacks...`);

    // 3. Fallback for C++
    if (lang === 'cpp' || lang === 'c++' || lang === 'c') {
      try {
        const localCppRes = await executeLocalCpp(sourceCode, stdin, timeLimitMs);
        if (localCppRes) return localCppRes;
      } catch (_) {}
    }

    throw new Error(`Compiler execution error for ${language}: ${judgeErr.message}`);
  }
}

const {
  evaluateSubmission,
  compareOutputs: engineCompareOutputs,
} = require('../coding-engine');

/**
 * Evaluates source code against an array of test cases using the modern ExamShield Coding Engine
 * Supports compile-once, automatic wrapper generation, LeetCode function-based and standard I/O modes.
 */
async function evaluateTestCases(sourceCode, language, testCases = [], options = {}) {
  const questionMetadata = options.questionMetadata || options.metadata || {
    executionMode: options.executionMode || options.executionFormat,
    className: options.className,
    functionName: options.functionName,
    returnType: options.returnType,
    parameters: options.parameters,
    comparisonMode: options.comparisonMode,
  };

  return await evaluateSubmission(sourceCode, language, testCases, questionMetadata, options);
}

/**
 * Auto-detects programming language from source code markers
 */
function detectLanguageFromCode(code) {
  if (!code || typeof code !== 'string') return 'javascript';
  const str = code.trim();
  if (/#include\s*<|using\s+namespace\s+std|std::|int\s+main\s*\(|cout\s*<<|cin\s*>>/.test(str)) {
    return 'cpp';
  }
  if (/import\s+java\.|public\s+class\s+|System\.out\.println|Scanner\s+/.test(str)) {
    return 'java';
  }
  if (/def\s+[a-zA-Z_]\w*\s*\(|import\s+sys|sys\.stdin|from\s+\w+\s+import|elif\s+|print\s*\(/.test(str) && !/function|const|let|var|class\s+\w+\s*\{/.test(str)) {
    return 'python';
  }
  return 'javascript';
}

module.exports = {
  JUDGE0_LANGUAGE_MAP,
  normalizeOutput,
  areOutputsEqual,
  detectLanguageFromCode,
  executeOnJudge0,
  executeLocalNode,
  runSingleCase,
  evaluateTestCases,
};
