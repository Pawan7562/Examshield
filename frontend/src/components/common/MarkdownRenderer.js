// src/components/common/MarkdownRenderer.js
// Renders structured AI-generated coding problem descriptions beautifully.
// Professional institutional styling for ExamShield SaaS.

import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Internal sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1.5px solid #e2e8f0',
  }}>
    {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
    <h4 style={{
      margin: 0,
      fontSize: '0.86rem',
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#0f172a',
    }}>{title}</h4>
  </div>
);

const CodeBlock = ({ children }) => (
  <pre style={{
    background: '#0b1329',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    padding: '14px 18px',
    overflowX: 'auto',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: '0.84rem',
    lineHeight: '1.6',
    color: '#e2e8f0',
    margin: '8px 0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }}>
    <code>{children}</code>
  </pre>
);

const ConstraintBadge = ({ text }) => (
  <li style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.88rem',
    lineHeight: '1.5',
    color: '#334155',
    listStyle: 'none',
  }}>
    <span style={{ color: '#0a74da', fontWeight: 800, marginTop: '2px', flexShrink: 0 }}>•</span>
    <code style={{
      fontFamily: '"JetBrains Mono", monospace',
      background: '#f1f5f9',
      border: '1px solid #e2e8f0',
      padding: '2px 7px',
      borderRadius: '6px',
      fontSize: '0.82rem',
      color: '#0f172a',
    }}>{text}</code>
  </li>
);

const ExampleBlock = ({ example, index }) => (
  <div style={{
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '14px',
  }}>
    <div style={{
      fontSize: '0.78rem',
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#0a74da',
      marginBottom: '10px',
    }}>
      Example {index + 1}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '10px' }}>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Input
        </div>
        <CodeBlock>{String(example.input ?? '')}</CodeBlock>
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Output
        </div>
        <CodeBlock>{String(example.output ?? '')}</CodeBlock>
      </div>
    </div>

    {example.explanation && (
      <div style={{
        background: '#ffffff',
        borderLeft: '3px solid #0a74da',
        borderTop: '1px solid #e2e8f0',
        borderRight: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 14px',
        borderRadius: '0 8px 8px 0',
      }}>
        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Explanation:{' '}
        </span>
        <span style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.6' }}>
          {example.explanation}
        </span>
      </div>
    )}
  </div>
);

const HintItem = ({ hint, index }) => (
  <div style={{
    display: 'flex',
    gap: '12px',
    padding: '10px 14px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '10px',
    marginBottom: '10px',
  }}>
    <span style={{
      background: '#fef3c7',
      color: '#b45309',
      border: '1px solid #fcd34d',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.76rem',
      fontWeight: 800,
      flexShrink: 0,
      marginTop: '1px',
    }}>{index + 1}</span>
    <span style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: '1.5', fontWeight: 500 }}>{hint}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const MarkdownRenderer = ({
  question,
  compact = false,
  showHints = true,
  showApproach = true,
  showEditorial = false,
  showSolutionCode = false,
}) => {
  if (!question) return null;

  const {
    problemStatement,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    testCases,
    hints,
    solutionApproach,
    editorial,
    solutionCode,
    followUp,
    description,
  } = question;

  const sectionStyle = {
    marginBottom: '22px',
  };

  const bodyTextStyle = {
    fontSize: '0.92rem',
    lineHeight: '1.75',
    color: '#334155',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  // ── Compact card view ────────────────────────────────────────────────────
  if (compact) {
    const preview = problemStatement || description || '';
    return (
      <p style={{
        fontSize: '0.86rem',
        lineHeight: '1.6',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        color: '#475569',
        margin: 0,
      }}>
        {preview.slice(0, 280)}{preview.length > 280 ? '…' : ''}
      </p>
    );
  }

  // ── Full rich view ───────────────────────────────────────────────────────
  const hasProblemStatement = !!(problemStatement && problemStatement.trim());
  const hasInputFormat     = !!(inputFormat && inputFormat.trim());
  const hasOutputFormat    = !!(outputFormat && outputFormat.trim());
  const hasConstraints     = Array.isArray(constraints) && constraints.length > 0;
  const hasExamples        = Array.isArray(examples) && examples.length > 0;
  const hasHints           = Array.isArray(hints) && hints.length > 0;
  const hasApproach        = !!(solutionApproach && solutionApproach.trim());
  const hasEditorial       = !!(editorial && editorial.trim());
  const hasSolutionCode    = !!(solutionCode && solutionCode.trim());
  const hasFollowUp        = !!(followUp && followUp.trim());

  // Use plain description as fallback if structured fields empty
  const useFallbackText = !hasProblemStatement && !hasInputFormat && !hasExamples;

  return (
    <div style={{ color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Problem Statement */}
      {hasProblemStatement ? (
        <div style={sectionStyle}>
          <SectionHeader icon="📝" title="Problem Statement" />
          <p style={bodyTextStyle}>{problemStatement}</p>
        </div>
      ) : useFallbackText && description ? (
        <div style={sectionStyle}>
          <SectionHeader icon="📝" title="Problem Statement" />
          <p style={bodyTextStyle}>{description}</p>
        </div>
      ) : null}

      {/* Input Format */}
      {hasInputFormat && (
        <div style={sectionStyle}>
          <SectionHeader icon="📥" title="Input Format" />
          <p style={bodyTextStyle}>{inputFormat}</p>
        </div>
      )}

      {/* Output Format */}
      {hasOutputFormat && (
        <div style={sectionStyle}>
          <SectionHeader icon="📤" title="Output Format" />
          <p style={bodyTextStyle}>{outputFormat}</p>
        </div>
      )}

      {/* Constraints */}
      {hasConstraints && (
        <div style={sectionStyle}>
          <SectionHeader icon="📏" title="Constraints" />
          <ul style={{ margin: 0, padding: 0 }}>
            {constraints.map((c, i) => <ConstraintBadge key={i} text={c} />)}
          </ul>
        </div>
      )}

      {/* Examples */}
      {hasExamples && (
        <div style={sectionStyle}>
          <SectionHeader icon="💡" title="Examples" />
          {examples.map((ex, i) => <ExampleBlock key={i} example={ex} index={i} />)}
        </div>
      )}

      {/* Hidden Test Cases count */}
      {Array.isArray(testCases) && testCases.length > 0 && (
        <div style={{
          ...sectionStyle,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          <span style={{ fontSize: '0.86rem', color: '#166534', fontWeight: 600 }}>
            {testCases.length} verified test case{testCases.length !== 1 ? 's' : ''} configured for proctored evaluation
          </span>
        </div>
      )}

      {/* Hints */}
      {showHints && hasHints && (
        <div style={sectionStyle}>
          <SectionHeader icon="💭" title="Hints" />
          {hints.map((h, i) => <HintItem key={i} hint={h} index={i} />)}
        </div>
      )}

      {/* Solution Approach */}
      {showApproach && hasApproach && (
        <div style={sectionStyle}>
          <SectionHeader icon="🎯" title="Recommended Approach" />
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderLeft: '4px solid #0a74da',
            borderRadius: '10px',
            padding: '14px 18px',
          }}>
            <p style={{ ...bodyTextStyle, margin: 0 }}>{solutionApproach}</p>
          </div>
        </div>
      )}

      {/* Editorial (full mode only) */}
      {showEditorial && hasEditorial && (
        <div style={sectionStyle}>
          <SectionHeader icon="📖" title="Editorial" />
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderLeft: '4px solid #6366f1',
            borderRadius: '10px',
            padding: '14px 18px',
          }}>
            <p style={{ ...bodyTextStyle, margin: 0 }}>{editorial}</p>
          </div>
        </div>
      )}

      {/* Solution Code (full mode only) */}
      {showSolutionCode && hasSolutionCode && (
        <div style={sectionStyle}>
          <SectionHeader icon="💻" title="Solution Reference (Python)" />
          <CodeBlock>{solutionCode}</CodeBlock>
        </div>
      )}

      {/* Follow-Up Question */}
      {showApproach && hasFollowUp && (
        <div style={{
          ...sectionStyle,
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '14px 18px',
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            🔮 Follow-Up & Extension
          </div>
          <p style={{ ...bodyTextStyle, margin: 0, color: '#92400e' }}>{followUp}</p>
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;
