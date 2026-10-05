const { evaluateSubmission } = require('../coding-engine');
const { pool } = require('../config/database');

async function testFindMax() {
  const qRes = await pool.query("SELECT * FROM questions WHERE id = '5aba0eac-1a51-4eb9-ae9c-bd20cdc6bc0a'");
  const q = qRes.rows[0];
  console.log('Question options:', q.options);
  console.log('Question test_cases:', q.test_cases);

  const studentCode = `class Solution {
public:
    int findMax(vector<int>& nums) {
        // Write your code here
        int largest=nums[0];
        for(int i=1;i<nums.size();i++){
            if(nums[i]>largest){
                largest=nums[i];
            }
        }
        return largest;
    }
};`;

  // Simulate what codeExecutionController does:
  console.log('\n--- SIMULATING WITH q.options AS METADATA ---');
  const metadata = q.options;
  const testCases = q.test_cases || [];

  const resWithMeta = await evaluateSubmission(studentCode, 'cpp', testCases, {
    questionMetadata: metadata,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    isSampleOnly: true
  });
  console.log('Result with metadata:');
  console.log('Status:', resWithMeta.status);
  console.log('Passed:', resWithMeta.passedTestCases, '/', resWithMeta.totalTestCases);
  if (resWithMeta.testCases) {
    console.log('Cases:', JSON.stringify(resWithMeta.testCases, null, 2));
  }

  console.log('\n--- SIMULATING WITHOUT METADATA (WHAT PREVIOUSLY HAPPENED IN RUN-CODE) ---');
  const resWithoutMeta = await evaluateSubmission(studentCode, 'cpp', testCases, {
    questionMetadata: {},
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    isSampleOnly: true
  });
  console.log('Result without metadata:');
  console.log('Status:', resWithoutMeta.status);
  console.log('Error:', resWithoutMeta.error);
  process.exit(0);
}

testFindMax().catch(e => {
  console.error(e);
  process.exit(1);
});
