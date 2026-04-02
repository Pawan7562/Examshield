// src/components/QuestionFormSimple.js - Simplified Question Form Component
import React, { useState } from 'react';

const QuestionFormSimple = ({ question, index, onChange, onRemove }) => {
  const [formData, setFormData] = useState(question || {
    questionText: '',
    type: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
    timeLimit: 30,
    codeTemplate: '',
    testCases: [{ input: '', output: '', explanation: '' }],
    allowedLanguages: ['javascript']
  });

  React.useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.question_text || '',
        type: question.type || 'mcq',
        options: question.options ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) : ['', '', '', ''],
        correctAnswer: question.correct_answer || '',
        marks: question.marks || 1,
        timeLimit: question.time_limit || 30,
        codeTemplate: question.code_template || '',
        testCases: question.test_cases || [{ input: '', output: '', explanation: '' }],
        allowedLanguages: question.allowed_languages || ['javascript']
      });
    }
  }, [question]);

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    onChange(index, newFormData);
  };

  const handleOptionChange = (optionIndex, field, value) => {
    const newOptions = [...formData.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...formData.options, ''];
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (optionIndex) => {
    const newOptions = formData.options.filter((_, index) => index !== optionIndex);
    setFormData({ ...formData, options: newOptions });
  };

  const addTestCase = () => {
    const newTestCases = [...formData.testCases, { input: '', output: '', explanation: '' }];
    setFormData({ ...formData, testCases: newTestCases });
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData({ ...formData, testCases: newTestCases });
  };

  const removeTestCase = (index) => {
    const newTestCases = formData.testCases.filter((_, i) => i !== index);
    setFormData({ ...formData, testCases: newTestCases });
  };

  const toggleLanguage = (lang) => {
    const newLanguages = formData.allowedLanguages.includes(lang)
      ? formData.allowedLanguages.filter(l => l !== lang)
      : [...formData.allowedLanguages, lang];
    setFormData({ ...formData, allowedLanguages: newLanguages });
  };

  const renderMCQOptions = () => {
    const optionElements = [];
    for (let i = 0; i < formData.options.length; i++) {
      const option = formData.options[i];
      optionElements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#6b7280', minWidth: 30 }}>{String.fromCharCode(65 + i).toUpperCase()}.</span>
            <input
              type="text"
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              value={option.text}
              onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            />
            <input
              type="radio"
              name={`correct-${i}`}
              checked={formData.correctAnswer === String.fromCharCode(65 + i).toLowerCase()}
              onChange={() => handleOptionChange(i, 'isCorrect', String.fromCharCode(65 + i).toLowerCase())}
              style={{ marginLeft: 8 }}
            />
            <label style={{ fontSize: 12, color: '#6b7280' }}>Correct</label>
            <button
              type="button"
              onClick={() => removeOption(i)}
              style={{
                padding: '4px 8px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <button
          type="button"
          onClick={addOption}
          style={{
            padding: '8px 16px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer',
            marginTop: 8
          }}
        >
          + Add Option
        </button>
        {optionElements}
      </div>
    );
  };

  const renderSubjectiveForm = () => {
    return (
      <div>
        <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#374151' }}>Subjective Answer Settings</div>
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Character Limit (optional)</label>
            <input
              type="number"
              value={formData.characterLimit || 1000}
              onChange={(e) => handleInputChange('characterLimit', parseInt(e.target.value) || 1000)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Word Limit (optional)</label>
            <input
              type="number"
              value={formData.wordLimit || 500}
              onChange={(e) => handleInputChange('wordLimit', parseInt(e.target.value) || 500)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderObjectiveForm = () => {
    return (
      <div>
        <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#374151' }}>Objective Answer Settings</div>
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Correct Answer</label>
            <input
              type="text"
              value={formData.objectiveAnswer || ''}
              onChange={(e) => handleInputChange('objectiveAnswer', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Case Sensitivity (optional)</label>
            <select
              value={formData.caseSensitivity || 'exact'}
              onChange={(e) => handleInputChange('caseSensitivity', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="exact">Exact Match</option>
              <option value="case-insensitive">Case Insensitive</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderCodingForm = () => {
    return (
      <div>
        <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#374151' }}>Code Template</div>
        <div>
          <textarea
            value={formData.codeTemplate || ''}
            onChange={(e) => handleInputChange('codeTemplate', e.target.value)}
            placeholder="Write your code template here..."
            style={{
              width: '100%',
              height: '200px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'Monaco, Consolas, monospace',
              backgroundColor: '#1e293b',
              color: '#f8f8ff'
            }}
          />
        </div>
        <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#374151' }}>Test Cases</div>
        {formData.testCases.map((testCase, index) => {
          return (
            <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Input</label>
                  <textarea
                    value={testCase.input}
                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                    placeholder="Test input..."
                    style={{
                      width: '100%',
                      height: '60px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'Monaco, Consolas, monospace',
                      backgroundColor: '#1e293b',
                      color: '#f8f8ff'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Expected Output</label>
                  <textarea
                    value={testCase.output}
                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                    placeholder="Expected output..."
                    style={{
                      width: '100%',
                      height: '60px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'Monaco, Consolas, monospace',
                      backgroundColor: '#1e293b',
                      color: '#f8f8ff'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Explanation</label>
                  <textarea
                    value={testCase.explanation}
                    onChange={(e) => handleTestCaseChange(index, 'explanation', e.target.value)}
                    placeholder="Explanation..."
                    style={{
                      width: '100%',
                      height: '60px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'Monaco, Consolas, monospace',
                      backgroundColor: '#1e293b',
                      color: '#f8f8ff'
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeTestCase(index)}
                style={{
                  padding: '6px 12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                Remove Test Case
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addTestCase}
          style={{
            padding: '8px 16px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer',
            marginTop: 8
          }}
        >
          + Add Test Case
        </button>
      </div>
    );
  };

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      border: '1px solid rgba(255,255,255,0.06)', 
      borderRadius: 12, 
      padding: '20px',
      marginBottom: 16
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>
          Question {index + 1}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              style={{
                padding: '4px 8px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Remove Question
            </button>
          )}
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: 'white'
            }}
          >
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="subjective">Subjective</option>
            <option value="objective">Objective</option>
            <option value="coding">Coding</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Question Text</label>
        <textarea
          value={formData.questionText}
          onChange={(e) => handleInputChange('questionText', e.target.value)}
          placeholder="Enter your question here..."
          style={{
            width: '100%',
            height: '100px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Marks</label>
        <input
          type="number"
          value={formData.marks}
          onChange={(e) => handleInputChange('marks', parseInt(e.target.value) || 1)}
          min="1"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Time Limit (seconds)</label>
        <input
          type="number"
          value={formData.timeLimit}
          onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value) || 30)}
          min="10"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14
          }}
        />
      </div>

      {/* Type-specific fields */}
      {formData.type === 'mcq' && renderMCQOptions()}
      {formData.type === 'subjective' && renderSubjectiveForm()}
      {formData.type === 'objective' && renderObjectiveForm()}
      {formData.type === 'coding' && renderCodingForm()}
    </div>
  );
};

export default QuestionFormSimple;
