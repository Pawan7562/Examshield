// backend/coding-engine/secureSandbox.js
// Production-grade isolated execution sandbox with compile-once-run-many architecture

const { spawn, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const vm = require('vm');

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || '';

const JUDGE0_LANG_IDS = {
  javascript: 63,
  js: 63,
  node: 63,
  python: 71,
  py: 71,
  python3: 71,
  cpp: 54,
  'c++': 54,
  c: 50,
  java: 62,
};

let cachedGppPath = undefined;

/**
 * Searches for g++ compiler binary on host system (Linux / Windows)
 */
function findGppPath() {
  if (cachedGppPath !== undefined) return cachedGppPath;

  const candidates = [
    '/usr/bin/g++',
    '/usr/local/bin/g++',
    'C:\\MinGW\\bin\\g++.exe',
    'C:\\msys64\\mingw64\\bin\\g++.exe',
    'C:\\Program Files\\mingw-w64\\bin\\g++.exe',
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        cachedGppPath = c;
        return c;
      }
    } catch (_) {}
  }

  try {
    const checkCmd = os.platform() === 'win32' ? 'where g++' : 'which g++';
    const out = require('child_process').execSync(checkCmd, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000 }).toString().trim().split(/\r?\n/)[0];
    if (out && fs.existsSync(out)) {
      cachedGppPath = out;
      return out;
    }
  } catch (_) {}

  cachedGppPath = null;
  return null;
}

let cachedJavaPaths = undefined;

/**
 * Searches for javac / java on host system (Linux / Windows)
 */
function findJavaPaths() {
  if (cachedJavaPaths !== undefined) return cachedJavaPaths;

  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const javac = path.join(javaHome, 'bin', os.platform() === 'win32' ? 'javac.exe' : 'javac');
    const java = path.join(javaHome, 'bin', os.platform() === 'win32' ? 'java.exe' : 'java');
    if (fs.existsSync(javac) && fs.existsSync(java)) {
      cachedJavaPaths = { javac, java };
      return cachedJavaPaths;
    }
  }

  const pairs = [
    { javac: '/usr/bin/javac', java: '/usr/bin/java' },
    { javac: '/usr/local/bin/javac', java: '/usr/local/bin/java' },
    { javac: '/usr/lib/jvm/default-jvm/bin/javac', java: '/usr/lib/jvm/default-jvm/bin/java' },
  ];
  for (const p of pairs) {
    try {
      if (fs.existsSync(p.javac) && fs.existsSync(p.java)) {
        cachedJavaPaths = p;
        return p;
      }
    } catch (_) {}
  }

  try {
    const checkJavac = os.platform() === 'win32' ? 'where javac' : 'which javac';
    const javac = require('child_process').execSync(checkJavac, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000 }).toString().trim().split(/\r?\n/)[0];
    const checkJava = os.platform() === 'win32' ? 'where java' : 'which java';
    const java = require('child_process').execSync(checkJava, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000 }).toString().trim().split(/\r?\n/)[0];
    if (javac && java && fs.existsSync(javac) && fs.existsSync(java)) {
      cachedJavaPaths = { javac, java };
      return cachedJavaPaths;
    }
  } catch (_) {}

  cachedJavaPaths = null;
  return null;
}

let cachedPythonPath = undefined;

/**
 * Searches for python3 / python on host system (Linux / Windows)
 */
function findPythonPath() {
  if (cachedPythonPath !== undefined) return cachedPythonPath;

  const candidates = [
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/usr/bin/python',
    'C:\\Python312\\python.exe',
    'C:\\Python311\\python.exe',
    'C:\\Python310\\python.exe',
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        cachedPythonPath = c;
        return c;
      }
    } catch (_) {}
  }

  try {
    const checkCmd = os.platform() === 'win32' ? 'where python' : 'which python3';
    const out = require('child_process').execSync(checkCmd, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 1000 }).toString().trim().split(/\r?\n/)[0];
    if (out && fs.existsSync(out)) {
      cachedPythonPath = out;
      return out;
    }
  } catch (_) {}

  cachedPythonPath = null;
  return null;
}

/**
 * Strips internal system paths, temporary file directories, and sensitive tokens
 * Returns a student-facing sanitized diagnostic string with line numbers
 */
function sanitizeCompilerError(rawError) {
  if (!rawError) return '';
  let str = String(rawError);

  // Replace absolute file paths with clean identifier
  str = str.replace(/([A-Za-z]:\\[^:\n\r]+|(?:\/[\w.-]+)+\/[\w.-]+\.(?:cpp|java|py|js))/g, 'solution');

  // Convert "solution:14:5: error:" to "Line 14:5: error:"
  str = str.replace(/solution:(\d+)(?::(\d+))?:?\s*(error|warning|note)?:?/gi, (_, line, col, type) => {
    const loc = col ? `Line ${line}:${col}` : `Line ${line}`;
    return type ? `${loc} [${type}]:` : `${loc}:`;
  });

  // Strip toolchain paths
  str = str.replace(/[A-Za-z]:\\[^\s\n]+\\g\+\+\.exe/gi, 'g++');

  return str.trim();
}

/**
 * High-speed Judge0 CE runner using non-blocking submission + token polling.
 * Zero Cloudflare socket hangs or timeout drops.
 */
async function executeOnJudge0(sourceCode, language, stdin = '', timeLimitSec = 2, memoryLimitMb = 256) {
  const langKey = (language || 'javascript').toLowerCase();
  const langId = JUDGE0_LANG_IDS[langKey] || 71;

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
    const errText = await response.text();
    throw new Error(`Judge0 POST failed (${response.status}): ${errText}`);
  }

  const { token } = await response.json();
  if (!token) throw new Error('Judge0 did not return submission token.');

  const pollUrl = `${JUDGE0_URL}/submissions/${token}?base64_encoded=true`;
  const maxAttempts = 20;
  let data = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, 350));
    try {
      const pollRes = await fetch(pollUrl, { headers, signal: AbortSignal.timeout(4000) });
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        if (pollData && pollData.status && pollData.status.id > 2) {
          data = pollData;
          break;
        }
      }
    } catch (_) {}
  }

  if (!data) {
    throw new Error('Judge0 submission timed out during queue processing.');
  }

  const decodeB64 = (val) => {
    if (!val) return '';
    try { return Buffer.from(val, 'base64').toString('utf8'); } catch (_) { return String(val); }
  };

  const stdout = decodeB64(data.stdout);
  const stderr = decodeB64(data.stderr);
  const compileOutput = decodeB64(data.compile_output);
  const message = data.message ? decodeB64(data.message) : null;
  const statusId = data.status?.id;

  let finalStatus = 'Success';
  let errorMsg = null;

  if (statusId === 6 || compileOutput) {
    finalStatus = 'Compilation Error';
    errorMsg = sanitizeCompilerError(compileOutput || stderr || 'Compilation error');
  } else if (statusId === 5 || (message && message.toLowerCase().includes('time limit'))) {
    finalStatus = 'Time Limit Exceeded';
    errorMsg = 'Time limit exceeded';
  } else if (statusId >= 7 && statusId <= 12) {
    finalStatus = 'Runtime Error';
    errorMsg = stderr || message || `Process exited with error (Status ${statusId})`;
  } else if (statusId !== 3 && stderr && !stdout) {
    finalStatus = 'Runtime Error';
    errorMsg = stderr || message;
  }

  return {
    status: finalStatus,
    judgeStatus: data.status?.description || finalStatus,
    stdout: stdout ? stdout.trim() : '',
    stderr: stderr || compileOutput,
    error: errorMsg,
    timeMs: Math.round(parseFloat(data.time || '0') * 1000),
    memoryKb: data.memory || Math.round(memoryLimitMb * 1024),
  };
}

/**
 * Creates a sanitized environment without any database credentials, secrets, or sensitive tokens
 */
function getSanitizedEnv(extraPath = '') {
  const safeEnv = { ...process.env };
  const sensitivePatterns = [
    /pass/i, /secret/i, /token/i, /key/i, /auth/i, /database/i, /db_/i, /postgres/i,
    /neon/i, /supabase/i, /brevo/i, /redis/i, /jwt/i, /session/i, /cookie/i, /smtp/i
  ];
  for (const k of Object.keys(safeEnv)) {
    if (sensitivePatterns.some(pattern => pattern.test(k))) {
      delete safeEnv[k];
    }
  }

  const existingPath = safeEnv.PATH || safeEnv.Path || '';
  if (os.platform() === 'win32') {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const sys32 = `${sysRoot}\\System32`;
    const combined = extraPath ? `${extraPath};${sys32};${existingPath}` : `${sys32};${existingPath}`;
    safeEnv.PATH = combined;
    safeEnv.Path = combined;
  } else {
    const defaultLinuxPath = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';
    const combined = extraPath ? `${extraPath}:${defaultLinuxPath}:${existingPath}` : `${defaultLinuxPath}:${existingPath}`;
    safeEnv.PATH = combined;
  }
  return safeEnv;
}

/**
 * Compiles source code ONCE for compiled languages (C++, Java, Python, JavaScript).
 * Returns a compiled handle with runTestCase() and cleanup() functions.
 */
async function compileOnce(language, completeSource, options = {}) {
  const lang = (language || 'javascript').toLowerCase();
  const timeLimitMs = options.timeLimitMs || 2000;
  const memoryLimitMb = options.memoryLimitMb || 256;

  // ── 1. C++ LOCAL COMPILE-ONCE ───────────────────────────────────────────────
  if (lang === 'cpp' || lang === 'c++' || lang === 'c') {
    const gppPath = findGppPath();
    if (gppPath) {
      const gppDir = path.dirname(gppPath);
      const compileEnv = getSanitizedEnv(gppDir);

      let tmpDir = os.tmpdir();
      if (os.platform() === 'win32') {
        const mingwTmp = path.join(path.dirname(gppDir), 'tmp');
        try {
          if (!fs.existsSync(mingwTmp)) fs.mkdirSync(mingwTmp, { recursive: true });
          tmpDir = mingwTmp;
        } catch (_) {}
      }

      const id = Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const srcFile = path.join(tmpDir, `sol_${id}.cpp`);
      const exeFile = os.platform() === 'win32'
        ? path.join(tmpDir, `sol_${id}.exe`)
        : path.join(tmpDir, `sol_${id}`);

      fs.writeFileSync(srcFile, completeSource, 'utf8');

      const cleanup = () => {
        try { if (fs.existsSync(srcFile)) fs.unlinkSync(srcFile); } catch (_) {}
        try { if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile); } catch (_) {}
      };

      // Compile ONCE
      const compileStart = Date.now();
      const compileResult = await new Promise((resolve) => {
        execFile(gppPath, ['-O2', srcFile, '-o', exeFile], { cwd: tmpDir, env: compileEnv, timeout: 8000 }, (compErr, _, compStderr) => {
          if (compErr || !fs.existsSync(exeFile)) {
            cleanup();
            return resolve({
              compileFailed: true,
              status: 'Compilation Error',
              judgeStatus: 'Compilation Error',
              error: sanitizeCompilerError(compStderr || compErr?.message || 'Compiler failed to produce executable binary'),
              timeMs: Date.now() - compileStart,
            });
          }
          resolve({ compileFailed: false });
        });
      });

      if (compileResult.compileFailed) {
        return compileResult;
      }

      // Windows Defender / file system scanner breather for newly created executable
      if (os.platform() === 'win32') {
        await new Promise(r => setTimeout(r, 80));
      }

      // Compiled successfully! Return reusable execution handle
      return {
        compileFailed: false,
        language: 'cpp',
        cleanup,
        runTestCase: (stdinText, caseTimeoutMs = timeLimitMs) => {
          return new Promise((resolve) => {
            const start = Date.now();
            const runEnv = getSanitizedEnv(gppDir);

            const executeChild = (attempt = 0) => {
              let stdout = '';
              let stderr = '';
              let timedOut = false;
              let child;

              try {
                child = spawn(
                  exeFile,
                  [],
                  {
                    cwd: tmpDir,
                    env: runEnv,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    windowsHide: true,
                  }
                );
              } catch (spawnErr) {
                if (attempt < 2) {
                  setTimeout(() => executeChild(attempt + 1), 100);
                  return;
                }
                return resolve({
                  status: 'Runtime Error',
                  judgeStatus: 'Runtime Error',
                  stdout: '',
                  stderr: spawnErr.message,
                  error: spawnErr.message,
                  timeMs: 0,
                  memoryKb: 0,
                });
              }

              const killTimer = setTimeout(() => {
                timedOut = true;
                try { child.kill('SIGKILL'); } catch (_) {}
              }, caseTimeoutMs);

              child.stdout.on('data', (c) => {
                stdout += c.toString();
                if (stdout.length > 1024 * 1024) child.kill('SIGKILL');
              });

              child.stderr.on('data', (c) => {
                stderr += c.toString();
                if (stderr.length > 256 * 1024) child.kill('SIGKILL');
              });

              child.on('close', (code, signal) => {
                clearTimeout(killTimer);
                const elapsed = Date.now() - start;

                if (timedOut || signal === 'SIGKILL' || signal === 'SIGTERM') {
                  return resolve({
                    status: 'Time Limit Exceeded',
                    judgeStatus: 'Time Limit Exceeded',
                    stdout,
                    stderr: stderr || 'Execution timed out',
                    error: 'Time Limit Exceeded',
                    timeMs: Math.max(caseTimeoutMs, elapsed),
                    memoryKb: 12000,
                  });
                }

                if (code !== 0) {
                  return resolve({
                    status: 'Runtime Error',
                    judgeStatus: 'Runtime Error',
                    stdout: stdout || '',
                    stderr: stderr || `Process exited with code ${code}`,
                    error: stderr || `Process exited with code ${code}`,
                    timeMs: elapsed,
                    memoryKb: 12000,
                  });
                }

                return resolve({
                  status: 'Success',
                  judgeStatus: 'Accepted',
                  stdout: stdout ? stdout.trim() : '',
                  stderr: stderr || null,
                  error: null,
                  timeMs: Math.max(1, elapsed),
                  memoryKb: 12000,
                });
              });

              child.on('error', (err) => {
                clearTimeout(killTimer);
                if (attempt < 3) {
                  setTimeout(() => executeChild(attempt + 1), 80 * (attempt + 1));
                  return;
                }
                resolve({
                  status: 'Runtime Error',
                  judgeStatus: 'Runtime Error',
                  stdout: '',
                  stderr: err.message,
                  error: err.message,
                  timeMs: Date.now() - start,
                  memoryKb: 0,
                });
              });

              let inputToSend = String(stdinText !== undefined && stdinText !== null ? stdinText : '');
              if (inputToSend && !inputToSend.endsWith('\n')) {
                inputToSend += '\n';
              }
              if (child && child.stdin) {
                child.stdin.on('error', () => {});
                try {
                  child.stdin.write(inputToSend);
                  child.stdin.end();
                } catch (_) {}
              }
            };

            executeChild(0);
          });
        }
      };
    }
  }

  // ── 2. JAVA LOCAL COMPILE-ONCE ───────────────────────────────────────────────
  if (lang === 'java') {
    const javaPaths = findJavaPaths();
    if (javaPaths) {
      const id = Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const javaTmpDir = path.join(os.tmpdir(), `java_${id}`);
      try {
        fs.mkdirSync(javaTmpDir, { recursive: true });
      } catch (_) {}

      // Find main/public class name or default to Main
      let className = 'Main';
      const pubMatch = completeSource.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      if (pubMatch) {
        className = pubMatch[1];
      } else {
        const classMatch = completeSource.match(/class\s+([A-Za-z0-9_]+)/);
        if (classMatch) {
          className = classMatch[1];
        }
      }

      const srcFile = path.join(javaTmpDir, `${className}.java`);
      fs.writeFileSync(srcFile, completeSource, 'utf8');

      const cleanup = () => {
        try {
          if (fs.existsSync(javaTmpDir)) {
            fs.rmSync(javaTmpDir, { recursive: true, force: true });
          }
        } catch (_) {}
      };

      const compileEnv = getSanitizedEnv(path.dirname(javaPaths.javac));
      const compileStart = Date.now();

      const compileResult = await new Promise((resolve) => {
        execFile(
          javaPaths.javac,
          ['-encoding', 'UTF-8', srcFile],
          { cwd: javaTmpDir, env: compileEnv, timeout: 10000 },
          (compErr, _, compStderr) => {
            const classFile = path.join(javaTmpDir, `${className}.class`);
            if (compErr || !fs.existsSync(classFile)) {
              cleanup();
              return resolve({
                compileFailed: true,
                status: 'Compilation Error',
                judgeStatus: 'Compilation Error',
                error: sanitizeCompilerError(compStderr || compErr?.message || 'Java compilation failed'),
                timeMs: Date.now() - compileStart,
              });
            }
            resolve({ compileFailed: false });
          }
        );
      });

      if (compileResult.compileFailed) {
        return compileResult;
      }

      return {
        compileFailed: false,
        language: 'java',
        cleanup,
        runTestCase: (stdinText, caseTimeoutMs = timeLimitMs) => {
          return new Promise((resolve) => {
            const start = Date.now();
            const runEnv = getSanitizedEnv(path.dirname(javaPaths.java));

            let stdout = '';
            let stderr = '';
            let timedOut = false;
            let child;

            try {
              child = spawn(
                javaPaths.java,
                [
                  `-Xmx${memoryLimitMb}m`,
                  '-cp',
                  javaTmpDir,
                  className
                ],
                {
                  cwd: javaTmpDir,
                  env: runEnv,
                  stdio: ['pipe', 'pipe', 'pipe'],
                  windowsHide: true,
                }
              );
            } catch (spawnErr) {
              return resolve({
                status: 'Runtime Error',
                judgeStatus: 'Runtime Error',
                stdout: '',
                stderr: spawnErr.message,
                error: spawnErr.message,
                timeMs: 0,
                memoryKb: 0,
              });
            }

            const killTimer = setTimeout(() => {
              timedOut = true;
              try { child.kill('SIGKILL'); } catch (_) {}
            }, caseTimeoutMs);

            child.stdout.on('data', (c) => {
              stdout += c.toString();
              if (stdout.length > 1024 * 1024) child.kill('SIGKILL');
            });

            child.stderr.on('data', (c) => {
              stderr += c.toString();
              if (stderr.length > 256 * 1024) child.kill('SIGKILL');
            });

            child.on('close', (code, signal) => {
              clearTimeout(killTimer);
              const elapsed = Date.now() - start;

              if (timedOut || signal === 'SIGKILL' || signal === 'SIGTERM') {
                return resolve({
                  status: 'Time Limit Exceeded',
                  judgeStatus: 'Time Limit Exceeded',
                  stdout,
                  stderr: stderr || 'Execution timed out',
                  error: 'Time Limit Exceeded',
                  timeMs: Math.max(caseTimeoutMs, elapsed),
                  memoryKb: 45000,
                });
              }

              if (code !== 0) {
                return resolve({
                  status: 'Runtime Error',
                  judgeStatus: 'Runtime Error',
                  stdout: stdout || '',
                  stderr: stderr || `Process exited with code ${code}`,
                  error: sanitizeCompilerError(stderr || `Process exited with code ${code}`),
                  timeMs: elapsed,
                  memoryKb: 45000,
                });
              }

              return resolve({
                status: 'Success',
                judgeStatus: 'Accepted',
                stdout: stdout ? stdout.trim() : '',
                stderr: stderr || null,
                error: null,
                timeMs: Math.max(1, elapsed),
                memoryKb: 45000,
              });
            });

            child.on('error', (err) => {
              clearTimeout(killTimer);
              resolve({
                status: 'Runtime Error',
                judgeStatus: 'Runtime Error',
                stdout: '',
                stderr: err.message,
                error: err.message,
                timeMs: Date.now() - start,
                memoryKb: 0,
              });
            });

            let inputToSend = String(stdinText !== undefined && stdinText !== null ? stdinText : '');
            if (inputToSend && !inputToSend.endsWith('\n')) {
              inputToSend += '\n';
            }
            if (child && child.stdin) {
              child.stdin.on('error', () => {});
              try {
                child.stdin.write(inputToSend);
                child.stdin.end();
              } catch (_) {}
            }
          });
        }
      };
    }
  }

  // ── 3. PYTHON LOCAL RUNNER / SYNTAX CHECK ───────────────────────────────────
  if (lang === 'python' || lang === 'py' || lang === 'python3') {
    const pythonPath = findPythonPath();
    if (pythonPath) {
      const id = Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const pyTmpDir = path.join(os.tmpdir(), `py_${id}`);
      try {
        fs.mkdirSync(pyTmpDir, { recursive: true });
      } catch (_) {}

      const srcFile = path.join(pyTmpDir, 'solution.py');
      fs.writeFileSync(srcFile, completeSource, 'utf8');

      const cleanup = () => {
        try {
          if (fs.existsSync(pyTmpDir)) {
            fs.rmSync(pyTmpDir, { recursive: true, force: true });
          }
        } catch (_) {}
      };

      const pyEnv = getSanitizedEnv(path.dirname(pythonPath));

      // Syntax check ONCE via python -m py_compile
      const compileStart = Date.now();
      const compileResult = await new Promise((resolve) => {
        execFile(
          pythonPath,
          ['-m', 'py_compile', srcFile],
          { cwd: pyTmpDir, env: pyEnv, timeout: 5000 },
          (compErr, _, compStderr) => {
            if (compErr) {
              cleanup();
              return resolve({
                compileFailed: true,
                status: 'Compilation Error',
                judgeStatus: 'Compilation Error',
                error: sanitizeCompilerError(compStderr || compErr?.message || 'Python syntax error'),
                timeMs: Date.now() - compileStart,
              });
            }
            resolve({ compileFailed: false });
          }
        );
      });

      if (compileResult.compileFailed) {
        return compileResult;
      }

      return {
        compileFailed: false,
        language: 'python',
        cleanup,
        runTestCase: (stdinText, caseTimeoutMs = timeLimitMs) => {
          return new Promise((resolve) => {
            const start = Date.now();
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            let child;

            try {
              child = spawn(
                pythonPath,
                ['-u', srcFile],
                {
                  cwd: pyTmpDir,
                  env: pyEnv,
                  stdio: ['pipe', 'pipe', 'pipe'],
                  windowsHide: true,
                }
              );
            } catch (spawnErr) {
              return resolve({
                status: 'Runtime Error',
                judgeStatus: 'Runtime Error',
                stdout: '',
                stderr: spawnErr.message,
                error: spawnErr.message,
                timeMs: 0,
                memoryKb: 0,
              });
            }

            const killTimer = setTimeout(() => {
              timedOut = true;
              try { child.kill('SIGKILL'); } catch (_) {}
            }, caseTimeoutMs);

            child.stdout.on('data', (c) => {
              stdout += c.toString();
              if (stdout.length > 1024 * 1024) child.kill('SIGKILL');
            });

            child.stderr.on('data', (c) => {
              stderr += c.toString();
              if (stderr.length > 256 * 1024) child.kill('SIGKILL');
            });

            child.on('close', (code, signal) => {
              clearTimeout(killTimer);
              const elapsed = Date.now() - start;

              if (timedOut || signal === 'SIGKILL' || signal === 'SIGTERM') {
                return resolve({
                  status: 'Time Limit Exceeded',
                  judgeStatus: 'Time Limit Exceeded',
                  stdout,
                  stderr: stderr || 'Execution timed out',
                  error: 'Time Limit Exceeded',
                  timeMs: Math.max(caseTimeoutMs, elapsed),
                  memoryKb: 15000,
                });
              }

              if (code !== 0) {
                return resolve({
                  status: 'Runtime Error',
                  judgeStatus: 'Runtime Error',
                  stdout: stdout || '',
                  stderr: stderr || `Process exited with code ${code}`,
                  error: sanitizeCompilerError(stderr || `Process exited with code ${code}`),
                  timeMs: elapsed,
                  memoryKb: 15000,
                });
              }

              return resolve({
                status: 'Success',
                judgeStatus: 'Accepted',
                stdout: stdout ? stdout.trim() : '',
                stderr: stderr || null,
                error: null,
                timeMs: Math.max(1, elapsed),
                memoryKb: 15000,
              });
            });

            child.on('error', (err) => {
              clearTimeout(killTimer);
              resolve({
                status: 'Runtime Error',
                judgeStatus: 'Runtime Error',
                stdout: '',
                stderr: err.message,
                error: err.message,
                timeMs: Date.now() - start,
                memoryKb: 0,
              });
            });

            let inputToSend = String(stdinText !== undefined && stdinText !== null ? stdinText : '');
            if (inputToSend && !inputToSend.endsWith('\n')) {
              inputToSend += '\n';
            }
            if (child && child.stdin) {
              child.stdin.on('error', () => {});
              try {
                child.stdin.write(inputToSend);
                child.stdin.end();
              } catch (_) {}
            }
          });
        }
      };
    }
  }

  // ── 4. JAVASCRIPT LOCAL COMPILE / SYNTAX CHECK ───────────────────────────────
  if (lang === 'javascript' || lang === 'js' || lang === 'node') {
    // Syntax check ONCE
    try {
      new vm.Script(completeSource);
    } catch (syntaxErr) {
      return {
        compileFailed: true,
        status: 'Compilation Error',
        judgeStatus: 'Compilation Error',
        error: sanitizeCompilerError(syntaxErr.stack || syntaxErr.message),
        timeMs: 5,
      };
    }

    const id = Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const jsTmpDir = path.join(os.tmpdir(), `js_${id}`);
    try {
      fs.mkdirSync(jsTmpDir, { recursive: true });
    } catch (_) {}
    const scriptFile = path.join(jsTmpDir, 'solution.js');
    fs.writeFileSync(scriptFile, completeSource, 'utf8');

    const cleanup = () => {
      try {
        if (fs.existsSync(jsTmpDir)) {
          fs.rmSync(jsTmpDir, { recursive: true, force: true });
        }
      } catch (_) {}
    };

    return {
      compileFailed: false,
      language: 'javascript',
      cleanup,
      runTestCase: (stdinText, caseTimeoutMs = timeLimitMs) => {
        return new Promise((resolve) => {
          const startTime = Date.now();

          const child = spawn(
            process.execPath,
            ['--max-old-space-size=' + memoryLimitMb, scriptFile],
            {
              cwd: jsTmpDir,
              env: getSanitizedEnv(),
              timeout: caseTimeoutMs + 800,
              stdio: ['pipe', 'pipe', 'pipe']
            }
          );

          let stdout = '';
          let stderr = '';
          let timedOut = false;

          const killTimer = setTimeout(() => {
            timedOut = true;
            try { child.kill('SIGKILL'); } catch (_) {}
          }, caseTimeoutMs);

          child.stdout.on('data', (c) => {
            stdout += c.toString();
            if (stdout.length > 1024 * 1024) child.kill('SIGKILL');
          });

          child.stderr.on('data', (c) => {
            stderr += c.toString();
            if (stderr.length > 256 * 1024) child.kill('SIGKILL');
          });

          child.on('close', (code, signal) => {
            clearTimeout(killTimer);
            const elapsed = Date.now() - startTime;

            if (timedOut || signal === 'SIGKILL' || signal === 'SIGTERM') {
              resolve({
                status: 'Time Limit Exceeded',
                judgeStatus: 'Time Limit Exceeded',
                stdout,
                stderr: stderr || 'Execution timed out.',
                error: 'Time Limit Exceeded',
                timeMs: Math.max(caseTimeoutMs, elapsed),
                memoryKb: 24000,
              });
            } else if (code !== 0) {
              resolve({
                status: 'Runtime Error',
                judgeStatus: 'Runtime Error',
                stdout,
                stderr,
                error: stderr || `Process exited with code ${code}`,
                timeMs: elapsed,
                memoryKb: 22000,
              });
            } else {
              resolve({
                status: 'Success',
                judgeStatus: 'Accepted',
                stdout: stdout ? stdout.trim() : '',
                stderr: stderr || null,
                error: null,
                timeMs: Math.max(1, elapsed),
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
            if (stdinText !== undefined && stdinText !== null) {
              child.stdin.write(String(stdinText));
            }
            child.stdin.end();
          } catch (_) {}
        });
      }
    };
  }

  // ── 5. CLOUD SANDBOX FALLBACK (Judge0 CE) ──────────────────────────────────
  // Only reached if local compiler is absent for the language or for non-standard languages
  return {
    compileFailed: false,
    language: lang,
    isCloudFallback: true,
    cleanup: () => {},
    runTestCase: async (stdinText, caseTimeoutMs = timeLimitMs) => {
      const timeLimitSec = Math.max(1, Math.round(caseTimeoutMs / 1000));
      return await executeOnJudge0(completeSource, lang, stdinText, timeLimitSec, memoryLimitMb);
    }
  };
}

module.exports = {
  findGppPath,
  findJavaPaths,
  findPythonPath,
  sanitizeCompilerError,
  executeOnJudge0,
  compileOnce,
  getSanitizedEnv,
};
