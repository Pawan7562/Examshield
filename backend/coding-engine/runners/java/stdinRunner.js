// backend/coding-engine/runners/java/stdinRunner.js
// Java Runner for STANDARD_INPUT_OUTPUT mode

function wrapJavaStdin(studentCode) {
  let code = (studentCode || '').trim();

  // If student wrote a class that is not public Main, we can make class public or ensure Main
  if (!code.includes('import java.')) {
    code = 'import java.util.*;\nimport java.io.*;\n\n' + code;
  }
  return code;
}

module.exports = {
  wrapJavaStdin,
};
