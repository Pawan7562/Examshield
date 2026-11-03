const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = os.tmpdir();
const srcFile = path.join(tmpDir, 'test_sol.cpp');
const exeFile = path.join(tmpDir, 'test_sol.exe');

fs.writeFileSync(srcFile, '#include <iostream>\nusing namespace std;\nint main() { cout << "0 1" << endl; return 0; }');

execFile('C:\\MinGW\\bin\\g++.exe', ['-O2', srcFile, '-o', exeFile], (compileErr, stdout, stderr) => {
  if (compileErr) {
    console.error('Compilation error:', compileErr.message, stderr);
    return;
  }
  console.log('Compiled successfully to', exeFile);
  const child = execFile(exeFile, [], (runErr, runOut, runErrOut) => {
    console.log('Run output:', runOut);
    try { fs.unlinkSync(srcFile); fs.unlinkSync(exeFile); } catch(_) {}
  });
});
