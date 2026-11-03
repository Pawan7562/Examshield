const { compileOnce } = require('./coding-engine/secureSandbox');
const { generateCompleteSource } = require('./coding-engine/wrapperGenerator');

async function test() {
  const code = `class Solution {
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
};`;

  const meta = {
    className: 'Solution',
    functionName: 'twoSum',
    returnType: 'vector<int>',
    parameters: [
      { name: 'nums', type: 'vector<int>' },
      { name: 'target', type: 'int' }
    ]
  };

  const { completeSource, adapter } = generateCompleteSource(code, 'cpp', meta);
  console.log('Compiling...');
  const compiled = await compileOnce('cpp', completeSource, { timeLimitMs: 2000 });
  console.log('Compile result:', compiled.compileFailed);
  if (!compiled.compileFailed) {
    const cases = [
      'nums = [2,7,11,15], target = 9',
      'nums = [3,2,4], target = 6',
      { nums: [3, 3], target: 6 }
    ];
    for (const c of cases) {
      const formatted = adapter.formatTestInput(c, meta);
      console.log('--- RUNNING CASE --- formatted input:\n', formatted);
      const res = await compiled.runTestCase(formatted);
      console.log('Case res:', res);
    }
    compiled.cleanup();
  }

  console.log('\n--- TESTING EVALUATESUBMISSION ---');
  const { evaluateSubmission } = require('./coding-engine/testRunner');
  const res = await evaluateSubmission(code, 'cpp', [
    { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', is_hidden: false },
    { input: 'nums = [3,2,4], target = 6', output: '[1,2]', is_hidden: false },
    { input: { nums: [3, 3], target: 6 }, output: '[0,1]', is_hidden: true }
  ], meta);
  console.log('evaluateSubmission status:', res.status, 'Passed:', res.passedTestCases, '/', res.totalTestCases);
  console.log('Cases:', res.testCases);
}

test();
