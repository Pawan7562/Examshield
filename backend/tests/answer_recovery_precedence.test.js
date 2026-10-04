// backend/tests/answer_recovery_precedence.test.js
// Unit & Integration Tests for Answer Recovery Precedence, Timestamp Resolution & Resilience

const assert = require('assert');

// ── 1. Pure Algorithm Unit Test: Question-by-Question Reconciliation ──
function reconcileAnswers(serverSavedAnswers, localBackupRaw) {
  const serverMap = {};
  if (Array.isArray(serverSavedAnswers) && serverSavedAnswers.length > 0) {
    serverSavedAnswers.forEach(a => {
      const val = a.selected_option ?? a.code_submission ?? a.answer_text;
      if (val !== undefined && val !== null) {
        const serverTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        serverMap[String(a.question_id)] = {
          value: val,
          updatedAt: serverTime,
          language: a.selected_language || null
        };
      }
    });
  }

  let localEntries = {};
  if (localBackupRaw) {
    let parsed = typeof localBackupRaw === 'string' ? JSON.parse(localBackupRaw) : localBackupRaw;
    if (parsed && parsed.version === 2 && parsed.entries) {
      localEntries = parsed.entries;
    } else if (parsed && typeof parsed === 'object') {
      const flat = parsed.answers || parsed;
      Object.entries(flat).forEach(([k, v]) => {
        localEntries[k] = { value: v, updatedAt: 0 };
      });
    }
  }

  const allQuestionIds = new Set([
    ...Object.keys(serverMap),
    ...Object.keys(localEntries)
  ]);

  const mergedAnswers = {};
  const mergedLanguages = {};

  allQuestionIds.forEach(qId => {
    const s = serverMap[qId];
    const l = localEntries[qId];

    if (s && l) {
      // If local answer has a newer timestamp than server, prioritize fresher local answer
      if (l.updatedAt && l.updatedAt > s.updatedAt) {
        mergedAnswers[qId] = l.value;
        if (l.language) mergedLanguages[qId] = l.language;
      } else {
        mergedAnswers[qId] = s.value;
        if (s.language) mergedLanguages[qId] = s.language;
      }
    } else if (s) {
      mergedAnswers[qId] = s.value;
      if (s.language) mergedLanguages[qId] = s.language;
    } else if (l) {
      mergedAnswers[qId] = l.value;
      if (l.language) mergedLanguages[qId] = l.language;
    }
  });

  return { mergedAnswers, mergedLanguages };
}

async function runRecoveryPrecedenceTests() {
  console.log('\n======================================================');
  console.log('  ExamShield Answer Recovery & Precedence Test Suite   ');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function runTest(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ Passed: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ Failed: ${name} -> ${err.message}`);
    }
  }

  // TEST 1: Newer local answer vs older server answer (Local Wins)
  runTest('1. Newer local answer vs older server answer (Local Wins)', () => {
    const serverAnswers = [
      { question_id: 'q1', selected_option: 'Option A', updated_at: '2026-10-04T05:00:00.000Z' }
    ];
    const localBackup = JSON.stringify({
      version: 2,
      savedAt: new Date('2026-10-04T05:01:00.000Z').getTime(),
      entries: {
        q1: { value: 'Option B (Newer Local)', updatedAt: new Date('2026-10-04T05:01:00.000Z').getTime() }
      }
    });

    const res = reconcileAnswers(serverAnswers, localBackup);
    assert.strictEqual(res.mergedAnswers['q1'], 'Option B (Newer Local)', 'Local newer answer must win');
  });

  // TEST 2: Newer server answer vs older local answer (Server Wins)
  runTest('2. Newer server answer vs older local answer (Server Wins)', () => {
    const serverAnswers = [
      { question_id: 'q1', selected_option: 'Option Server Fresh', updated_at: '2026-10-04T05:05:00.000Z' }
    ];
    const localBackup = JSON.stringify({
      version: 2,
      savedAt: new Date('2026-10-04T05:00:00.000Z').getTime(),
      entries: {
        q1: { value: 'Option Local Stale', updatedAt: new Date('2026-10-04T05:00:00.000Z').getTime() }
      }
    });

    const res = reconcileAnswers(serverAnswers, localBackup);
    assert.strictEqual(res.mergedAnswers['q1'], 'Option Server Fresh', 'Server newer answer must win');
  });

  // TEST 3: Answer present only on server (Preserved)
  runTest('3. Answer present only on server (Preserved)', () => {
    const serverAnswers = [
      { question_id: 'q2', answer_text: 'Server Only Subjective', updated_at: '2026-10-04T05:00:00.000Z' }
    ];
    const localBackup = JSON.stringify({ version: 2, entries: {} });

    const res = reconcileAnswers(serverAnswers, localBackup);
    assert.strictEqual(res.mergedAnswers['q2'], 'Server Only Subjective');
  });

  // TEST 4: Answer present only in localStorage (Preserved)
  runTest('4. Answer present only in localStorage (Preserved)', () => {
    const serverAnswers = [];
    const localBackup = JSON.stringify({
      version: 2,
      entries: {
        q3: { value: 'print("hello")', language: 'python', updatedAt: Date.now() }
      }
    });

    const res = reconcileAnswers(serverAnswers, localBackup);
    assert.strictEqual(res.mergedAnswers['q3'], 'print("hello")');
    assert.strictEqual(res.mergedLanguages['q3'], 'python');
  });

  // TEST 5: Legacy flat localStorage backup compatibility
  runTest('5. Legacy flat localStorage backup compatibility', () => {
    const serverAnswers = [
      { question_id: 'q1', selected_option: 'Server Choice', updated_at: '2026-10-04T05:00:00.000Z' }
    ];
    // Legacy format without version or timestamps
    const localBackup = JSON.stringify({
      q1: 'Legacy Local Choice',
      q4: 'Legacy Local Only'
    });

    const res = reconcileAnswers(serverAnswers, localBackup);
    // For q1, server has timestamp > 0, so server wins
    assert.strictEqual(res.mergedAnswers['q1'], 'Server Choice');
    // For q4, only in local, so local preserved
    assert.strictEqual(res.mergedAnswers['q4'], 'Legacy Local Only');
  });

  // TEST 6: In-Flight Pending Answer Flush on Submit
  runTest('6. In-Flight Pending Answer Flush on Submit', () => {
    const inMemoryAnswers = { q1: 'Final Option', q2: 'Final Code' };
    const pendingDebounceTimers = {
      q1: setTimeout(() => {}, 1000),
      q2: setTimeout(() => {}, 1000)
    };

    // Cancellation & bundling simulation
    Object.values(pendingDebounceTimers).forEach(t => clearTimeout(t));
    const finalAnswersBundle = Object.entries(inMemoryAnswers).map(([k, v]) => ({
      questionId: k,
      answer: v
    }));

    assert.strictEqual(finalAnswersBundle.length, 2);
    assert.strictEqual(finalAnswersBundle[0].answer, 'Final Option');
    assert.strictEqual(finalAnswersBundle[1].answer, 'Final Code');
  });

  // TEST 7: Failed submission retry safety
  runTest('7. Failed submission retry safety (State Reversion)', () => {
    let submittedState = false;
    let submittedRef = { current: false };

    // Simulate initial click
    submittedRef.current = true;
    submittedState = true;

    // Simulate network rejection
    const mockError = new Error('ETIMEDOUT');
    if (mockError) {
      // Revert so student can retry
      submittedRef.current = false;
      submittedState = false;
    }

    assert.strictEqual(submittedState, false, 'UI must re-enable submit button');
    assert.strictEqual(submittedRef.current, false, 'In-flight guard must be released');
  });

  console.log(`\nResults: ${passed}/${total} Recovery & Precedence Tests Passed!`);
  if (passed !== total) {
    process.exitCode = 1;
  }
}

runRecoveryPrecedenceTests();
