// src/components/common/MarkdownRenderer.js
// Renders structured AI-generated coding problem descriptions beautifully.
// Uses structured fields (problemStatement, constraints[], examples[], etc.)
// with a plain-text description fallback. No external markdown parser needed.

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
    borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
  }}>
    {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
    <h4 style={{
      margin: 0,
      fontSize: '0.9rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--text-secondary, #a78bfa)',
    }}>{title}</h4>
  </div>
);

const CodeBlock = ({ children, language }) => (
  <pre style={{
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    overflowX: 'auto',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    fontSize: '0.82rem',
    lineHeight: '1.6',
    color: '#e2e8f0',
    margin: '6px 0',
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
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    color: '#cbd5e1',
    listStyle: 'none',
  }}>
    <span style={{ color: '#a78bfa', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>•</span>
    <code style={{
      fontFamily: '"JetBrains Mono", monospace',
      background: 'rgba(139,92,246,0.08)',
      padding: '1px 5px',
      borderRadius: '4px',
      fontSize: '0.82rem',
    }}>{text}</code>
  </li>
);

const ExampleBlock = ({ example, index }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(139,92,246,0.15)',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '12px',
  }}>
    <div style={{
      fontSize: '0.78rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#a78bfa',
      marginBottom: '10px',
    }}>
      Example {index + 1}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Input
        </div>
        <CodeBlock>{String(example.input ?? '')}</CodeBlock>
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Output
        </div>
        <CodeBlock>{String(example.output ?? '')}</CodeBlock>
      </div>
    </div>

    {example.explanation && (
      <div style={{
        background: 'rgba(139,92,246,0.05)',
        borderLeft: '3px solid rgba(139,92,246,0.4)',
        padding: '8px 12px',
        borderRadius: '0 6px 6px 0',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Explanation:{' '}
        </span>
        <span style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>
          {example.explanation}
        </span>
      </div>
    )}
  </div>
);

const HintItem = ({ hint, index }) => (
  <div style={{
    display: 'flex',
    gap: '10px',
    padding: '8px 12px',
    background: 'rgba(245,158,11,0.05)',
    border: '1px solid rgba(245,158,11,0.15)',
    borderRadius: '8px',
    marginBottom: '8px',
  }}>
    <span style={{
      background: 'rgba(245,158,11,0.2)',
      color: '#f59e0b',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      fontWeight: 700,
      flexShrink: 0,
      marginTop: '2px',
    }}>{index + 1}</span>
    <span style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.5' }}>{hint}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MarkdownRenderer
 *
 * Props:
 *  - question: the full question object from the backend
 *  - compact?: boolean — show minimal fields for card view
 *  - showHints?: boolean
 *  - showApproach?: boolean
 *  - showEditorial?: boolean (full mode)
 *  - showSolutionCode?: boolean (full mode)
 */
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
    marginBottom: '20px',
  };

  const bodyTextStyle = {
    fontSize: '0.9rem',
    lineHeight: '1.75',
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  // ── Compact card view ────────────────────────────────────────────────────
  if (compact) {
    const preview = problemStatement || description || '';
    return (
      <p style={{
        ...bodyTextStyle,
        fontSize: '0.82rem',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        color: '#94a3b8',
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
    <div style={{ color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>

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
          background: 'rgba(34, 197, 94, 0.05)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🔒</span>
          <span style={{ fontSize: '0.85rem', color: '#86efac' }}>
            {testCases.length} hidden test case{testCases.length !== 1 ? 's' : ''} will be used for evaluation
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
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
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
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
          }}>
            <p style={{ ...bodyTextStyle, margin: 0 }}>{editorial}</p>
          </div>
        </div>
      )}

      {/* Solution Code (full mode only) */}
      {showSolutionCode && hasSolutionCode && (
        <div style={sectionStyle}>
          <SectionHeader icon="💻" title="Solution Code (Python)" />
          <CodeBlock language="python">{solutionCode}</CodeBlock>
        </div>
      )}

      {/* Follow-Up Question */}
      {showApproach && hasFollowUp && (
        <div style={{
          ...sectionStyle,
          background: 'rgba(245,158,11,0.05)',
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: '8px',
          padding: '12px 16px',
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            🔮 Follow-Up
          </div>
          <p style={{ ...bodyTextStyle, margin: 0, color: '#fde68a' }}>{followUp}</p>
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;
