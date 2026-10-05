// backend/coding-engine/runners/cpp/stdinRunner.js
// C++ Runner for STANDARD_INPUT_OUTPUT mode

function wrapCppStdin(studentCode) {
  let code = (studentCode || '').trim();

  // If student did not include common competitive programming headers, inject safe standard headers
  const needsIostream = !code.includes('<iostream>') && !code.includes('<bits/stdc++.h>');
  const needsStd = !code.includes('using namespace std;') && !code.includes('std::');

  let headers = '';
  if (needsIostream) {
    headers += '#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <cmath>\n';
  }
  if (needsStd) {
    headers += 'using namespace std;\n\n';
  }

  return headers + code;
}

module.exports = {
  wrapCppStdin,
};
