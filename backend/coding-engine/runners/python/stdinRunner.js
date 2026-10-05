// backend/coding-engine/runners/python/stdinRunner.js
// Python Runner for STANDARD_INPUT_OUTPUT mode

function wrapPythonStdin(studentCode) {
  // Pass-through student code directly for standard I/O
  return studentCode || '';
}

module.exports = {
  wrapPythonStdin,
};
