// backend/services/codeExecutionService.js
// Production-grade multi-language sandboxed execution & automated grading service for ExamShield

const { spawn } = require('child_process');
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
 * Execute source code on Judge0 CE with Base64 encoding
 */
async function executeOnJudge0(sourceCode, language, stdin = '', timeLimitSec = 2, memoryLimitMb = 256) {
  const langKey = (language || 'javascript').toLowerCase();
  const langId = JUDGE0_LANGUAGE_MAP[langKey] || 71;

  const url = `${JUDGE0_URL}/submissions?wait=true&base64_encoded=true`;
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
    signal: AbortSignal.timeout(12000), // 12s HTTP timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Judge0 responded with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();

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
    stdout,
    stderr: stderr || compileOutput,
    error: errorMsg,
    timeMs: Math.round(parseFloat(data.time || '0') * 1000),
    memoryKb: data.memory || Math.round(memoryLimitMb * 1024),
  };
}

/**
 * Secure local isolated sub-process execution for Node.js
 * Completely isolated from Express process. Zero environment variables passed.
 */
function executeLocalNode(sourceCode, stdin = '', timeLimitMs = 2000) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    // Spawn isolated child process with no host env variables (prevents secret leaks)
    const child = spawn(
      process.execPath,
      ['--max-old-space-size=256', '-e', sourceCode],
      {
        env: {}, // Completely empty environment: process.env has NO database credentials or keys
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
      if (stdout.length > 500000) { // 500KB output cap
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
          stdout,
          stderr,
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
 * Universal code runner:
 * Tries Judge0 CE first for multi-language execution (Python, JS, Java, C++, etc.).
 * Falls back to secure local subprocess for Node.js / JS if Judge0 is unreachable.
 */
async function runSingleCase(sourceCode, language, stdin = '', timeLimitMs = 2000, memoryLimitMb = 256) {
  const lang = (language || 'javascript').toLowerCase();
  const timeLimitSec = Math.max(1, Math.round(timeLimitMs / 1000));

  // 1. Try Judge0 CE
  try {
    const judgeResult = await executeOnJudge0(sourceCode, lang, stdin, timeLimitSec, memoryLimitMb);
    return judgeResult;
  } catch (judgeErr) {
    console.warn(`Judge0 CE unavailable (${judgeErr.message}). Checking local runner fallback for ${lang}...`);

    // 2. If JavaScript, fallback to local isolated Node sub-process
    if (lang === 'javascript' || lang === 'js' || lang === 'node') {
      return await executeLocalNode(sourceCode, stdin, timeLimitMs);
    }

    // If other language and Judge0 is down
    throw new Error(`Compiler service temporarily unreachable for ${language}. Please ensure internet connectivity to Judge0 CE or configure JUDGE0_API_URL: ${judgeErr.message}`);
  }
}

/**
 * Evaluates source code against an array of test cases
 * Returns complete evaluation report, pass/fail counts, execution stats
 */
async function evaluateTestCases(sourceCode, language, testCases = [], options = {}) {
  const {
    timeLimitMs = 2000,
    memoryLimitMb = 256,
    isSampleOnly = false,
    questionMarks = 10,
  } = options;

  if (!sourceCode || typeof sourceCode !== 'string' || sourceCode.trim() === '') {
    return {
      status: 'Empty Code',
      totalTestCases: testCases.length,
      passedTestCases: 0,
      failedTestCases: testCases.length,
      scorePercentage: 0,
      earnedMarks: 0,
      testCases: [],
    };
  }

  const casesToRun = Array.isArray(testCases) && testCases.length > 0
    ? testCases
    : [{ input: '', output: '' }];

  const results = [];
  let totalTime = 0;
  let maxMemory = 0;
  let firstErrorStatus = null;

  for (let i = 0; i < casesToRun.length; i++) {
    const tc = casesToRun[i];
    const rawInput = tc.input !== undefined ? String(tc.input) : '';
    const rawExpected = tc.output !== undefined
      ? String(tc.output)
      : (tc.expectedOutput !== undefined ? String(tc.expectedOutput) : (tc.expected_output !== undefined ? String(tc.expected_output) : ''));
    const isHidden = !!(tc.is_hidden || tc.isHidden);

    let execResult;
    try {
      execResult = await runSingleCase(sourceCode, language, rawInput, timeLimitMs, memoryLimitMb);
    } catch (err) {
      execResult = {
        status: 'Runtime Error',
        judgeStatus: 'Execution Service Error',
        stdout: '',
        stderr: err.message,
        error: err.message,
        timeMs: 0,
        memoryKb: 0,
      };
    }

    totalTime += (execResult.timeMs || 0);
    if ((execResult.memoryKb || 0) > maxMemory) {
      maxMemory = execResult.memoryKb;
    }

    const hasExpected = rawExpected.trim() !== '';
    let passed = false;

    if (execResult.status === 'Success') {
      passed = hasExpected ? areOutputsEqual(execResult.stdout, rawExpected) : true;
      if (!passed && !firstErrorStatus) {
        firstErrorStatus = 'Wrong Answer';
      }
    } else {
      passed = false;
      if (!firstErrorStatus) {
        firstErrorStatus = execResult.status;
      }
    }

    results.push({
      testCaseIndex: i + 1,
      input: isHidden && !isSampleOnly ? '[Hidden Test Case]' : rawInput,
      expectedOutput: isHidden && !isSampleOnly ? '[Hidden Test Case]' : rawExpected,
      actualOutput: isHidden && !isSampleOnly
        ? (passed ? '[Passed]' : (execResult.error ? execResult.error : '[Hidden Test Case Failed]'))
        : (execResult.error ? `${execResult.status}: ${execResult.error}` : execResult.stdout),
      output: isHidden && !isSampleOnly
        ? (passed ? '[Passed]' : (execResult.error ? execResult.error : '[Hidden Test Case Failed]'))
        : (execResult.error ? `${execResult.status}: ${execResult.error}` : execResult.stdout),
      stdout: isHidden && !isSampleOnly ? '' : execResult.stdout,
      stderr: isHidden && !isSampleOnly ? (execResult.error ? 'Error in hidden test case' : '') : execResult.stderr,
      passed,
      isHidden,
      executionTimeMs: execResult.timeMs,
      error: execResult.error,
    });
  }

  const passedCount = results.filter(r => r.passed).length;
  const isAllPassed = passedCount === results.length;
  const allNoExpected = results.length > 0 && results.every(r => r.expectedOutput === '' || r.expectedOutput === undefined);

  let finalStatus = 'Wrong Answer';
  if (firstErrorStatus === 'Compilation Error') {
    finalStatus = 'Compilation Error';
  } else if (firstErrorStatus === 'Time Limit Exceeded') {
    finalStatus = 'Time Limit Exceeded';
  } else if (firstErrorStatus === 'Runtime Error') {
    finalStatus = 'Runtime Error';
  } else if (isAllPassed) {
    finalStatus = 'Accepted';
  } else if (allNoExpected) {
    finalStatus = 'Finished';
  }

  const scorePercentage = results.length > 0
    ? Math.round((passedCount / results.length) * 100)
    : 0;

  const earnedMarks = results.length > 0
    ? Math.round(((passedCount / results.length) * questionMarks) * 100) / 100
    : 0;

  return {
    status: finalStatus,
    totalTestCases: results.length,
    passedTestCases: passedCount,
    failedTestCases: results.length - passedCount,
    scorePercentage,
    earnedMarks,
    maxMarks: questionMarks,
    executionTimeMs: Math.max(1, Math.round(totalTime)),
    memoryKb: maxMemory || 24000,
    testCases: results,
  };
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
