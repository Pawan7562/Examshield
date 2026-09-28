// backend/utils/evaluation.js
// Intelligent assessment & auto-evaluation engine for ExamShield

/**
 * Robust MCQ & Objective Answer Evaluator
 * Supports multiple formats:
 * - Option text matching (exact, trimmed, case-insensitive)
 * - Option IDs / keys ('a', 'b', 'c', 'd' or 'A', 'B', 'C', 'D')
 * - Numeric indices ('0', '1', '2', '3')
 * - Options as Array of strings or Array of objects [{id, text}, {label, value}]
 */
function evaluateMCQAnswer(selectedOption, correctAnswer, options) {
  if (selectedOption === undefined || selectedOption === null || selectedOption === '') {
    return false;
  }
  if (correctAnswer === undefined || correctAnswer === null || correctAnswer === '') {
    return false;
  }

  const selRaw = String(selectedOption).trim();
  const corRaw = String(correctAnswer).trim();

  // 1. Direct case-insensitive string equality
  if (selRaw.toLowerCase() === corRaw.toLowerCase()) {
    return true;
  }

  // Parse options if JSON string
  let parsedOptions = options;
  if (typeof parsedOptions === 'string') {
    try {
      parsedOptions = JSON.parse(parsedOptions);
    } catch (_) {
      parsedOptions = [];
    }
  }

  if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
    // Standardize every option into a normalized reference object
    const normalizedOptions = parsedOptions.map((opt, idx) => {
      let optId = '';
      let optText = '';

      if (opt && typeof opt === 'object') {
        optId = opt.id !== undefined ? String(opt.id).trim().toLowerCase() : '';
        optText = opt.text || opt.label || opt.value || opt.title || '';
      } else {
        optText = String(opt || '');
      }

      const letter = String.fromCharCode(97 + idx); // 'a', 'b', 'c', ...
      const letterUpper = String.fromCharCode(65 + idx); // 'A', 'B', 'C', ...
      const numIndex = String(idx); // '0', '1', '2', ...
      const oneIndex = String(idx + 1); // '1', '2', '3', ...

      return {
        index: idx,
        id: optId,
        text: String(optText).trim().toLowerCase(),
        letter,
        letterUpper: letterUpper.toLowerCase(),
        numIndex,
        oneIndex
      };
    });

    const sel = selRaw.toLowerCase();
    const cor = corRaw.toLowerCase();

    // Match candidate selection to one of the options
    const selectedItem = normalizedOptions.find(o =>
      o.text === sel ||
      (o.id && o.id === sel) ||
      o.letter === sel ||
      o.letterUpper === sel ||
      o.numIndex === sel ||
      o.oneIndex === sel
    );

    // Match official correct answer to one of the options
    const correctItem = normalizedOptions.find(o =>
      o.id === cor ||
      o.letter === cor ||
      o.letterUpper === cor ||
      o.text === cor ||
      o.numIndex === cor ||
      o.oneIndex === cor
    );

    // If both resolve to the same option index, candidate is correct!
    if (selectedItem && correctItem && selectedItem.index === correctItem.index) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates grade based on percentage
 */
function calculateGrade(percentage) {
  const p = Number(percentage) || 0;
  if (p >= 90) return 'A+';
  if (p >= 80) return 'A';
  if (p >= 70) return 'B+';
  if (p >= 60) return 'B';
  if (p >= 50) return 'C';
  if (p >= 40) return 'D';
  return 'F';
}

/**
 * Normalizes question options into standard format for UI rendering
 */
function normalizeOptionsList(options) {
  let parsed = options;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch (_) { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx); // 'A', 'B', 'C', ...
    if (opt && typeof opt === 'object') {
      return {
        id: opt.id || letter,
        letter,
        text: String(opt.text || opt.label || opt.value || '')
      };
    }
    return {
      id: letter,
      letter,
      text: String(opt || '')
    };
  });
}

module.exports = {
  evaluateMCQAnswer,
  calculateGrade,
  normalizeOptionsList
};
