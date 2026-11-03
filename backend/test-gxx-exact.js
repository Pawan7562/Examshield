const { exec } = require('child_process');
const fs = require('fs');

fs.writeFileSync('temp_test.cpp', '#include <iostream>\nint main(){ std::cout << 42 << std::endl; return 0; }');
exec('C:\\MinGW\\bin\\g++.exe temp_test.cpp -o temp_test.exe', (err, stdout, stderr) => {
  console.log('Error:', err?.message);
  console.log('Stderr:', stderr);
  console.log('Stdout:', stdout);
});
