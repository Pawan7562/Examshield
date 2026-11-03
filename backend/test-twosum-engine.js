const { evaluateSubmission } = require('./coding-engine');

async function testTwoSum() {
  console.log('Testing LeetCode C++ Two Sum with FUNCTION_BASED Mode...');

  const studentCppCode = `class Solution {
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

  const questionMetadata = {
    language: 'cpp',
    executionMode: 'FUNCTION_BASED',
    className: 'Solution',
    functionName: 'twoSum',
    returnType: 'vector<int>',
    parameters: [
      { name: 'nums', type: 'vector<int>' },
      { name: 'target', type: 'int' }
    ]
  };

  const testCases = [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      is_hidden: false
    },
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
      is_hidden: false
    },
    {
      input: { nums: [3, 3], target: 6 },
      output: '[0,1]',
      is_hidden: true
    }
  ];

  const t0 = Date.now();
  const res = await evaluateSubmission(studentCppCode, 'cpp', testCases, questionMetadata, {
    timeLimitMs: 2000,
    questionMarks: 10
  });

  console.log(`Evaluated in ${Date.now() - t0}ms:`);
  console.log(JSON.stringify(res, null, 2));

  if (res.status === 'Accepted' && res.passedTestCases === 3) {
    console.log('\n SUCCESS: C++ Function-Based Two Sum Passed without student main()!');
  } else {
    console.error('\n FAILED: Result did not match expectations.');
    process.exit(1);
  }
}

testTwoSum();
