const { evaluateTestCases } = require('./services/codeExecutionService');

async function test() {
  console.log('Testing C++ evaluation...');
  const cppCode = `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "[0, 1]" << endl;
    return 0;
}`;

  const testCases = [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0, 1]'
    }
  ];

  const t0 = Date.now();
  const res = await evaluateTestCases(cppCode, 'cpp', testCases, { timeLimitMs: 3000 });
  console.log(`C++ evaluation took ${Date.now() - t0}ms:`, JSON.stringify(res, null, 2));

  console.log('Testing JavaScript evaluation...');
  const jsCode = `console.log("[0, 1]");`;
  const resJs = await evaluateTestCases(jsCode, 'javascript', testCases, { timeLimitMs: 2000 });
  console.log('JavaScript evaluation:', JSON.stringify(resJs, null, 2));

  console.log('Testing Python evaluation...');
  const pyCode = `print("[0, 1]")`;
  const resPy = await evaluateTestCases(pyCode, 'python', testCases, { timeLimitMs: 3000 });
  console.log('Python evaluation:', JSON.stringify(resPy, null, 2));
}

test();
