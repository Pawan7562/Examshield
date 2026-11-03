const { generateCompleteSource } = require('./coding-engine/wrapperGenerator');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

const { completeSource } = generateCompleteSource(studentCppCode, 'cpp', questionMetadata);

const gpp = 'C:\\MinGW\\bin\\g++.exe';
const gppDir = path.dirname(gpp);
const compileEnv = {
  PATH: `${gppDir};${process.env.SystemRoot || 'C:\\Windows'}\\System32;${process.env.PATH || ''}`,
  SystemRoot: process.env.SystemRoot || 'C:\\Windows'
};

const src = path.join(os.tmpdir(), 'debug_twosum.cpp');
const exe = path.join(os.tmpdir(), 'debug_twosum.exe');
fs.writeFileSync(src, completeSource);

execFile(gpp, ['-static', '-O2', src, '-o', exe], { env: compileEnv }, (err, stdout, stderr) => {
  console.log('Compile Error:', err ? err.message : 'NONE');
  console.log('Compile Stderr:', stderr);
  console.log('Exe exists:', fs.existsSync(exe));

  if (fs.existsSync(exe)) {
    const child = execFile(exe, [], { env: compileEnv }, (rErr, rOut, rStderr) => {
      console.log('Run Error:', rErr ? rErr.message : 'NONE');
      console.log('Run Out:', rOut);
    });
    child.stdin.write('[2,7,11,15]\n9\n');
    child.stdin.end();
  }
});
