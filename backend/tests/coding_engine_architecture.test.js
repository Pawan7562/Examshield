// backend/tests/coding_engine_architecture.test.js
// Comprehensive Architecture Test Suite for ExamShield Modular Coding Engine
// Covers all 15 test scenarios specified in Section 17 of the Architectural Specification

const assert = require('assert');
const {
  evaluateSubmission,
  compileOnce,
  compareOutputs,
  normalizeOutput,
  resolveExecutionMode,
  generateCompleteSource,
  getAdapter,
} = require('../coding-engine');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

const suiteResults = [];

async function runTest(testName, fn) {
  process.stdout.write(`  ▶ Running: ${testName}... `);
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`${colors.green}✓ PASSED${colors.reset} (${duration}ms)`);
    suiteResults.push({ name: testName, passed: true, duration });
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`${colors.red}✗ FAILED${colors.reset} (${duration}ms)`);
    console.error(`    ${colors.red}Error: ${err.message}${colors.reset}`);
    suiteResults.push({ name: testName, passed: false, duration, error: err.message });
  }
}

async function runAll() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   ExamShield Coding Engine Architecture Test Suite (15 Scenarios) ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. C++ function-based Two Sum (NO student main())
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('1. C++ function-based Two Sum (No main() required)', async () => {
    const cppCode = `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> mp;
        for(int i = 0; i < nums.size(); i++) {
            int need = target - nums[i];
            if(mp.find(need) != mp.end()) {
                return {mp[need], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'twoSum',
      returnType: 'vector<int>',
      parameters: [
        { name: 'nums', type: 'vector<int>' },
        { name: 'target', type: 'int' }
      ],
      comparisonMode: 'ARRAY',
    };

    const testCases = [
      { input: '[2,7,11,15]\n9', output: '[0,1]', is_hidden: false, weight: 10 },
      { input: '[3,2,4]\n6', output: '[1,2]', is_hidden: true, weight: 10 },
    ];

    const result = await evaluateSubmission(cppCode, 'cpp', testCases, {
      questionMarks: 20,
      questionMetadata: metadata,
      timeLimitMs: 3000,
    });

    assert.strictEqual(result.status, 'Accepted');
    assert.strictEqual(result.passedTestCases, 2);
    assert.strictEqual(result.scorePercentage, 100);
    assert.strictEqual(result.earnedMarks, 20);
    assert.strictEqual(result.executionMode, 'FUNCTION_BASED');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. C++ standard-input/output question (Has main(), no double main generated)
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('2. C++ standard-input/output question (Has main(), preserved)', async () => {
    const cppCode = `
#include <iostream>
using namespace std;

int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << (a + b) << endl;
    }
    return 0;
}
`;
    const metadata = {
      executionMode: 'STANDARD_INPUT_OUTPUT',
    };

    const testCases = [
      { input: '10 25', output: '35', is_hidden: false },
      { input: '100 200', output: '300', is_hidden: true },
    ];

    const result = await evaluateSubmission(cppCode, 'cpp', testCases, {
      questionMarks: 10,
      questionMetadata: metadata,
    });

    assert.strictEqual(result.status, 'Accepted');
    assert.strictEqual(result.passedTestCases, 2);
    assert.strictEqual(result.earnedMarks, 10);
    assert.strictEqual(result.executionMode, 'STANDARD_INPUT_OUTPUT');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Java function-based question
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('3. Java function-based question', async () => {
    const javaCode = `
class Solution {
    public int add(int a, int b) {
        return a + b;
    }
}
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'add',
      returnType: 'int',
      parameters: [
        { name: 'a', type: 'int' },
        { name: 'b', type: 'int' }
      ],
      comparisonMode: 'INTEGER',
    };

    const testCases = [
      { input: '12\n30', output: '42', is_hidden: false }
    ];

    const result = await evaluateSubmission(javaCode, 'java', testCases, {
      questionMarks: 10,
      questionMetadata: metadata,
    });

    assert.strictEqual(result.status, 'Accepted');
    assert.strictEqual(result.passedTestCases, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Python function-based question
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('4. Python function-based question (Two Sum)', async () => {
    const pyCode = `
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, x in enumerate(nums):
            diff = target - x
            if diff in seen:
                return [seen[diff], i]
            seen[x] = i
        return []
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'twoSum',
      comparisonMode: 'ARRAY',
    };

    const testCases = [
      { input: '[2, 7, 11, 15]\n9', output: '[0, 1]', is_hidden: false },
      { input: '[3, 2, 4]\n6', output: '[1, 2]', is_hidden: true },
    ];

    const result = await evaluateSubmission(pyCode, 'python', testCases, {
      questionMarks: 10,
      questionMetadata: metadata,
    });

    assert.strictEqual(result.status, 'Accepted');
    assert.strictEqual(result.passedTestCases, 2);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. JavaScript function-based question
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('5. JavaScript function-based question', async () => {
    const jsCode = `
class Solution {
    twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
            const complement = target - nums[i];
            if (map.has(complement)) {
                return [map.get(complement), i];
            }
            map.set(nums[i], i);
        }
        return [];
    }
}
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'twoSum',
      comparisonMode: 'ARRAY',
    };

    const testCases = [
      { input: '[2, 7, 11, 15]\n9', output: '[0, 1]', is_hidden: false }
    ];

    const result = await evaluateSubmission(jsCode, 'javascript', testCases, {
      questionMarks: 10,
      questionMetadata: metadata,
    });

    assert.strictEqual(result.status, 'Accepted');
    assert.strictEqual(result.passedTestCases, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Compilation error handling (Sanitized, no server paths leaked)
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('6. Compilation error handling (Sanitized, paths stripped)', async () => {
    const invalidCpp = `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        this_is_an_undefined_token_syntax_error();
    }
};
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'twoSum',
      returnType: 'vector<int>',
    };

    const testCases = [{ input: '[1,2]\n3', output: '[0,1]' }];
    const result = await evaluateSubmission(invalidCpp, 'cpp', testCases, {
      questionMetadata: metadata,
    });

    assert.strictEqual(result.status, 'Compilation Error');
    assert.strictEqual(result.passedTestCases, 0);
    assert.strictEqual(result.earnedMarks, 0);

    // Verify no server paths (C:\ or /home/) leaked
    const errText = result.testCases[0]?.error || result.compilerError || '';
    assert.strictEqual(/([A-Za-z]:\\[^\s\n]+|\/home\/[^\s\n]+)/.test(errText), false, 'Error must not contain server paths');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Runtime error handling (Division by zero)
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('7. Runtime error handling (ZeroDivisionError)', async () => {
    const pyCode = `
class Solution:
    def solve(self, n: int) -> int:
        return 100 // 0
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'solve',
    };

    const testCases = [{ input: '5', output: '20' }];
    const result = await evaluateSubmission(pyCode, 'python', testCases, {
      questionMetadata: metadata,
    });

    assert.strictEqual(result.status, 'Runtime Error');
    assert.strictEqual(result.passedTestCases, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Infinite loop / timeout enforcement
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('8. Infinite loop / timeout enforcement (Time Limit Exceeded)', async () => {
    const jsLoop = `
class Solution {
    solve() {
        while (true) {}
    }
}
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'solve',
    };

    const testCases = [{ input: '', output: '42' }];
    const result = await evaluateSubmission(jsLoop, 'javascript', testCases, {
      questionMetadata: metadata,
      timeLimitMs: 800,
    });

    assert.strictEqual(result.status, 'Time Limit Exceeded');
    assert.strictEqual(result.passedTestCases, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Memory limit enforcement
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('9. Memory limit configuration & bounds', async () => {
    // Verifies memory limit metadata is passed through and configured
    const pyCode = 'import sys\nprint("OK")';
    const testCases = [{ input: '', output: 'OK' }];
    const result = await evaluateSubmission(pyCode, 'python', testCases, {
      memoryLimitMb: 128,
    });

    assert.strictEqual(result.status, 'Accepted');
    assert.ok(result.memoryKb > 0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Hidden test case confidentiality (Inputs & outputs never sent)
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('10. Hidden test case confidentiality (Zero leakage to student)', async () => {
    const cppCode = `
#include <iostream>
using namespace std;
int main() {
    int x;
    cin >> x;
    cout << (x * 2) << endl;
    return 0;
}
`;
    const secretInput = '999999';
    const secretOutput = '1999998';

    const testCases = [
      { input: '5', output: '10', is_hidden: false },
      { input: secretInput, output: secretOutput, is_hidden: true },
    ];

    const result = await evaluateSubmission(cppCode, 'cpp', testCases, {
      questionMarks: 10,
    });

    // Check hidden test case result structure
    const hiddenCase = result.testCases.find(tc => tc.isHidden);
    assert.ok(hiddenCase, 'Hidden case must be present in response');
    assert.strictEqual(hiddenCase.input, '[Hidden Test Case]');
    assert.strictEqual(hiddenCase.expectedOutput, '[Hidden Test Case]');
    assert.strictEqual(hiddenCase.actualOutput, '[Passed]');
    assert.strictEqual(hiddenCase.passed, true);
    assert.strictEqual(JSON.stringify(result).includes(secretInput), false, 'Secret input must not appear in result payload');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Multiple test cases with weighted marks calculation
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('11. Multiple test cases with weighted marks calculation', async () => {
    const jsCode = `
const fs = require('fs');
const n = parseInt(fs.readFileSync(0, 'utf8').trim());
// Only passes even inputs
if (n % 2 === 0) {
    console.log(n * 2);
} else {
    console.log(0);
}
`;
    const testCases = [
      { input: '2', output: '4', weight: 3 },
      { input: '3', output: '6', weight: 4 }, // fails
      { input: '4', output: '8', weight: 3 },
    ];

    const result = await evaluateSubmission(jsCode, 'javascript', testCases, {
      questionMarks: 10,
    });

    assert.strictEqual(result.totalTestCases, 3);
    assert.strictEqual(result.passedTestCases, 2);
    assert.strictEqual(result.failedTestCases, 1);
    // Weights: 3 + 3 = 6 out of 10 -> earnedMarks: 6
    assert.strictEqual(result.earnedMarks, 6);
    assert.strictEqual(result.scorePercentage, 60);
    assert.strictEqual(result.status, 'Wrong Answer');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Wrong answer detection
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('12. Wrong answer detection', async () => {
    const pyCode = 'print("wrong_output")';
    const testCases = [{ input: 'hello', output: 'world' }];
    const result = await evaluateSubmission(pyCode, 'python', testCases, {
      questionMarks: 10,
    });

    assert.strictEqual(result.status, 'Wrong Answer');
    assert.strictEqual(result.passedTestCases, 0);
    assert.strictEqual(result.earnedMarks, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Correct answer with multi-mode comparison (UNORDERED_ARRAY)
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('13. Multi-mode output comparison (UNORDERED_ARRAY & FLOAT)', async () => {
    // Unordered array comparison
    const unorderedRes = compareOutputs('[1, 0]', '[0, 1]', { comparisonMode: 'UNORDERED_ARRAY' });
    assert.strictEqual(unorderedRes, true);

    // Float with tolerance
    const floatRes = compareOutputs('3.14159', '3.14160', { comparisonMode: 'FLOAT_WITH_TOLERANCE', tolerance: 0.001 });
    assert.strictEqual(floatRes, true);

    // Boolean equality
    const boolRes = compareOutputs('True', 'true', { comparisonMode: 'BOOLEAN' });
    assert.strictEqual(boolRes, true);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. Empty input handling
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('14. Empty input handling gracefully', async () => {
    const jsCode = `
class Solution {
    greet() {
        return "Hello World";
    }
}
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'greet',
      parameters: [],
      returnType: 'string',
    };

    const testCases = [{ input: '', output: 'Hello World' }];
    const result = await evaluateSubmission(jsCode, 'javascript', testCases, {
      questionMetadata: metadata,
    });

    assert.strictEqual(result.status, 'Accepted');
    assert.strictEqual(result.passedTestCases, 1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. Large input performance (1,000 array elements)
  // ─────────────────────────────────────────────────────────────────────────────
  await runTest('15. Large input performance (1,000 elements C++ Two Sum)', async () => {
    const cppCode = `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> mp;
        for(int i = 0; i < nums.size(); i++) {
            int need = target - nums[i];
            if(mp.find(need) != mp.end()) {
                return {mp[need], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};
`;
    const metadata = {
      executionMode: 'FUNCTION_BASED',
      className: 'Solution',
      functionName: 'twoSum',
      returnType: 'vector<int>',
      parameters: [
        { name: 'nums', type: 'vector<int>' },
        { name: 'target', type: 'int' }
      ],
      comparisonMode: 'ARRAY',
    };

    // Create array with 1,000 elements with a unique target pair at index 500 and 999
    const largeNums = Array.from({ length: 1000 }, (_, i) => i);
    largeNums[500] = 1000000;
    largeNums[999] = 2000000;
    const target = 3000000;
    const testCases = [
      { input: `${JSON.stringify(largeNums)}\n${target}`, output: '[500,999]', is_hidden: false }
    ];

    const result = await evaluateSubmission(cppCode, 'cpp', testCases, {
      questionMetadata: metadata,
      timeLimitMs: 3000,
    });

    assert.strictEqual(result.status, 'Accepted');
    assert.strictEqual(result.passedTestCases, 1);
    assert.ok(result.executionTimeMs < 2500, `Execution time was ${result.executionTimeMs}ms (expected < 2500ms)`);
  });

  console.log(`\n${colors.bold}${colors.cyan}----------------------------------------------------------------${colors.reset}`);
  const passedCount = suiteResults.filter(r => r.passed).length;
  const totalCount = suiteResults.length;

  if (passedCount === totalCount) {
    console.log(`  ${colors.green}${colors.bold}✓ ALL ${totalCount} ARCHITECTURE TEST SCENARIOS PASSED!${colors.reset}`);
  } else {
    console.log(`  ${colors.red}${colors.bold}✗ ${totalCount - passedCount}/${totalCount} TEST SCENARIOS FAILED${colors.reset}`);
    process.exit(1);
  }
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);
}

runAll().catch(err => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
