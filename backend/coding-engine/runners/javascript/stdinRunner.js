// backend/coding-engine/runners/javascript/stdinRunner.js
// JavaScript Runner for STANDARD_INPUT_OUTPUT mode

function wrapJavaScriptStdin(studentCode) {
  return studentCode || '';
}

module.exports = {
  wrapJavaScriptStdin,
};
