// backend/coding-engine/testRunner.js
// Production-grade test runner orchestrating compilation, test case execution, comparison, and scoring

const { generateCompleteSource } = require('./wrapperGenerator');
const { compileOnce } = require('./secureSandbox');
const { compareOutputs, normalizeOutput } = require('./comparator');

/**
 * Normalizes test cases from various input shapes (options.testCases, question.test_cases, etc.)
 */
function normalizeTestCaseList(testCases) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return [{ input: '', expectedOutput: '', isHidden: false, weight: 1 }];
  }

  return testCases.map((tc, idx) => {
    const rawInput = tc.input !== undefined ? tc.input : (tc.stdin !== undefined ? tc.stdin : '');
    const rawExpected = tc.output !== undefined
      ? tc.output
      : (tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected_output !== undefined ? tc.expected_output : ''));
    const isHidden = !!(tc.is_hidden || tc.isHidden || (tc.visibility && tc.visibility.toUpperCase() === 'HIDDEN'));
    const weight = Number(tc.weight) > 0 ? Number(tc.weight) : 1;

    return {
      index: idx + 1,
      input: rawInput,
      expectedOutput: rawExpected,
      explanation: tc.explanation || '',
      isHidden,
      weight,
    };
  });
}

/**
 * Core Evaluation Engine: Compiles ONCE, executes test cases, normalizes and compares outputs, calculates score
 */
async function evaluateSubmission(studentCode, language = 'cpp', testCases = [], questionMetadata = {}, options = {}) {
  let resolvedMetadata = questionMetadata || {};
  let resolvedOptions = options || {};

  // Support both (code, lang, testCases, metadata, options) AND (code, lang, testCases, optionsWithMetadata)
  if (questionMetadata && (
    questionMetadata.questionMarks !== undefined ||
    questionMetadata.questionMetadata !== undefined ||
    questionMetadata.timeLimitMs !== undefined ||
    questionMetadata.isSampleOnly !== undefined ||
    questionMetadata.memoryLimitMb !== undefined
  )) {
    resolvedOptions = { ...questionMetadata, ...options };
    resolvedMetadata = questionMetadata.questionMetadata || questionMetadata;
  }

  const {
    timeLimitMs = 2000,
    memoryLimitMb = 256,
    isSampleOnly = false,
    questionMarks = 10,
    comparisonMode = (resolvedMetadata.comparisonMode || resolvedMetadata.comparison_mode || 'ARRAY'),
  } = resolvedOptions;

  if (!studentCode || typeof studentCode !== 'string' || studentCode.trim() === '') {
    return {
      status: 'Empty Code',
      judgeStatus: 'Empty Code',
      totalTestCases: testCases.length,
      passedTestCases: 0,
      failedTestCases: testCases.length,
      scorePercentage: 0,
      earnedMarks: 0,
      maxMarks: questionMarks,
      executionTimeMs: 0,
      memoryKb: 0,
      testCases: [],
    };
  }

  // 1. Generate complete compilable source code via Language Adapter & Wrapper
  const { completeSource, executionMode, resolvedMetadata: metaUsed, adapter } = generateCompleteSource(studentCode, language, resolvedMetadata);
  const activeMetadata = metaUsed || resolvedMetadata;

  // 2. Compile ONCE
  const compiled = await compileOnce(language, completeSource, { timeLimitMs, memoryLimitMb });

  if (compiled.compileFailed) {
    return {
      status: 'Compilation Error',
      judgeStatus: 'Compilation Error',
      error: compiled.error,
      stderr: compiled.error,
      totalTestCases: testCases.length,
      passedTestCases: 0,
      failedTestCases: testCases.length,
      scorePercentage: 0,
      earnedMarks: 0,
      maxMarks: questionMarks,
      executionTimeMs: compiled.timeMs || 0,
      memoryKb: 0,
      testCases: (testCases || []).map((tc, i) => ({
        testCaseIndex: i + 1,
        input: typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input ?? tc.stdin ?? ''),
        expectedOutput: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output ?? tc.expectedOutput ?? tc.expected_output ?? ''),
        actualOutput: '',
        output: '',
        passed: false,
        error: compiled.error,
        status: 'Compilation Error'
      })),
      executionMode,
    };
  }

  const normalizedCases = normalizeTestCaseList(testCases);
  const results = [];
  let totalTime = 0;
  let maxMemory = 0;
  let firstErrorStatus = null;
  let totalWeight = 0;
  let passedWeight = 0;

  try {
    // 3. Run all test cases against compiled executable / runtime
    for (let i = 0; i < normalizedCases.length; i++) {
      const tc = normalizedCases[i];
      totalWeight += tc.weight;

      // Format input lines for the runner (e.g. extracts named parameters if LeetCode style)
      const formattedInput = executionMode === 'FUNCTION_BASED'
        ? adapter.formatTestInput(tc.input, activeMetadata)
        : (typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input));

      let execResult;
      try {
        execResult = await compiled.runTestCase(formattedInput, timeLimitMs);
      } catch (runErr) {
        execResult = {
          status: 'Runtime Error',
          judgeStatus: 'Runtime Error',
          stdout: '',
          stderr: runErr.message,
          error: runErr.message,
          timeMs: 0,
          memoryKb: 0,
        };
      }

      totalTime += (execResult.timeMs || 0);
      if ((execResult.memoryKb || 0) > maxMemory) {
        maxMemory = execResult.memoryKb;
      }

      const expectedStr = normalizeOutput(tc.expectedOutput);
      const hasExpected = expectedStr !== '';
      let passed = false;

      if (execResult.status === 'Success') {
        passed = hasExpected ? compareOutputs(execResult.stdout, expectedStr, comparisonMode, resolvedOptions) : true;
        if (!passed && !firstErrorStatus) {
          firstErrorStatus = 'Wrong Answer';
        }
      } else {
        passed = false;
        if (!firstErrorStatus) {
          firstErrorStatus = execResult.status;
        }
      }

      if (passed) {
        passedWeight += tc.weight;
      }

      const isMasked = tc.isHidden && !isSampleOnly;

      results.push({
        testCaseIndex: tc.index,
        input: isMasked ? '[Hidden Test Case]' : (typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input)),
        expectedOutput: isMasked ? '[Hidden Test Case]' : expectedStr,
        actualOutput: isMasked
          ? (passed ? '[Passed]' : (execResult.error ? '[Hidden Test Case Error]' : '[Hidden Test Case Failed]'))
          : (execResult.error ? `${execResult.status}: ${execResult.error}` : execResult.stdout),
        output: isMasked
          ? (passed ? '[Passed]' : (execResult.error ? '[Hidden Test Case Error]' : '[Hidden Test Case Failed]'))
          : (execResult.error ? `${execResult.status}: ${execResult.error}` : execResult.stdout),
        stdout: isMasked ? '' : execResult.stdout,
        stderr: isMasked ? (execResult.error ? 'Error occurred in hidden test' : '') : execResult.stderr,
        passed,
        isHidden: tc.isHidden,
        weight: tc.weight,
        executionTimeMs: execResult.timeMs,
        error: isMasked ? (execResult.error ? 'Runtime Error' : null) : execResult.error,
      });
    }
  } finally {
    // 4. Always clean up temporary compiled binary and source files
    if (typeof compiled.cleanup === 'function') {
      compiled.cleanup();
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  const isAllPassed = passedCount === results.length;
  const allNoExpected = results.length > 0 && results.every(r => !r.expectedOutput);

  let finalStatus = 'Wrong Answer';
  if (firstErrorStatus === 'Time Limit Exceeded') {
    finalStatus = 'Time Limit Exceeded';
  } else if (firstErrorStatus === 'Runtime Error') {
    finalStatus = 'Runtime Error';
  } else if (isAllPassed) {
    finalStatus = 'Accepted';
  } else if (allNoExpected) {
    finalStatus = 'Finished';
  }

  const scorePercentage = totalWeight > 0
    ? Math.round((passedWeight / totalWeight) * 100)
    : (results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0);

  const earnedMarks = Math.round((scorePercentage / 100) * questionMarks * 100) / 100;

  return {
    status: finalStatus,
    judgeStatus: finalStatus,
    totalTestCases: results.length,
    passedTestCases: passedCount,
    failedTestCases: results.length - passedCount,
    scorePercentage,
    earnedMarks,
    maxMarks: questionMarks,
    executionTimeMs: Math.max(1, Math.round(totalTime)),
    memoryKb: maxMemory || 24000,
    testCases: results,
    executionMode,
  };
}

module.exports = {
  normalizeTestCaseList,
  evaluateSubmission,
};
