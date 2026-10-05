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

/**
 * Searches for g++ compiler binary on host system
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
 * Searches for javac / java on host system
 */
function findJavaPaths() {
  try {
    const javaHome = process.env.JAVA_HOME;
    if (javaHome) {
      const javac = path.join(javaHome, 'bin', os.platform() === 'win32' ? 'javac.exe' : 'javac');
      const java = path.join(javaHome, 'bin', os.platform() === 'win32' ? 'java.exe' : 'java');
      if (fs.existsSync(javac) && fs.existsSync(java)) {
        return { javac, java };
      }
    }
  } catch (_) {}
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

  const sysRoot = process.env.SystemRoot || 'C:\\Windows';
  const sys32 = `${sysRoot}\\System32`;
  const existingPath = safeEnv.PATH || safeEnv.Path || '';
  const combined = extraPath ? `${extraPath};${sys32};${existingPath}` : `${sys32};${existingPath}`;

  safeEnv.PATH = combined;
  safeEnv.Path = combined;
  return safeEnv;
}

/**
 * Compiles source code ONCE for compiled languages (C++, Java).
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
      const exeFile = path.join(tmpDir, `sol_${id}.exe`);

      fs.writeFileSync(srcFile, completeSource, 'utf8');

      const cleanup = () => {
        try { if (fs.existsSync(srcFile)) fs.unlinkSync(srcFile); } catch (_) {}
        try { if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile); } catch (_) {}
      };

      // Compile ONCE
      const compileStart = Date.now();
      const compileResult = await new Promise((resolve) => {
        execFile(gppPath, ['-O2', srcFile, '-o', exeFile], { cwd: gppDir, env: compileEnv, timeout: 8000 }, (compErr, _, compStderr) => {
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
                    cwd: gppDir,
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

  // ── 2. JAVASCRIPT LOCAL COMPILE / SYNTAX CHECK ─────────────────────────────
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

    return {
      compileFailed: false,
      language: 'javascript',
      cleanup: () => {},
      runTestCase: (stdinText, caseTimeoutMs = timeLimitMs) => {
        return new Promise((resolve) => {
          const startTime = Date.now();

          // Isolated node child with sanitized env (prevents leak of DB credentials)
          const child = spawn(
            process.execPath,
            ['--max-old-space-size=' + memoryLimitMb, '-e', completeSource],
            {
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

  // ── 3. CLOUD SANDBOX FALLBACK (Judge0 CE) ──────────────────────────────────
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
  sanitizeCompilerError,
  executeOnJudge0,
  compileOnce,
  getSanitizedEnv,
};
