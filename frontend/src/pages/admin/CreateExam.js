// src/pages/admin/CreateExam.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import CodingQuestionForm from '../../components/CodingQuestionForm';

const steps = ['Exam Details', 'Questions', 'Students', 'Review'];

const Input = ({ label, required, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
      {label}{required && <span style={{ color: '#e94560' }}> *</span>}
    </label>
    {props.as === 'textarea' ? (
      <textarea {...props} as={undefined} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Sora, sans-serif', minHeight: 80, resize: 'vertical' }} />
    ) : props.as === 'select' ? (
      <select {...props} as={undefined} style={{ width: '100%', background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Sora, sans-serif' }}>
        {props.children}
      </select>
    ) : (
      <input {...props} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Sora, sans-serif' }} />
    )}
  </div>
);

const MCQQuestionForm = ({ q, idx, onChange, onRemove }) => {
  const set = (k) => (e) => onChange(idx, { ...q, [k]: e.target.value });
  const setOption = (i, val) => {
    const opts = [...(q.options || [{id:'a',text:''},{id:'b',text:''},{id:'c',text:''},{id:'d',text:''}])];
    opts[i] = { ...opts[i], text: val };
    onChange(idx, { ...q, options: opts });
  };

  const opts = q.options || [{id:'a',text:''},{id:'b',text:''},{id:'c',text:''},{id:'d',text:''}];

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      border: `1px solid ${q.correctAnswer ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`, 
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 16,
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e94560' }}>Q{idx + 1}</span>
          <span style={{ 
            fontSize: 10, 
            fontWeight: 600, 
            padding: '2px 8px', 
            borderRadius: 12, 
            background: 'rgba(233,69,96,0.15)', 
            color: '#e94560' 
          }}>
            MCQ
          </span>
          {q.correctAnswer && (
            <span style={{ 
              fontSize: 10, 
              fontWeight: 600, 
              padding: '2px 8px', 
              borderRadius: 12, 
              background: 'rgba(34,197,94,0.15)', 
              color: '#22c55e' 
            }}>
              ✓ Answer Set
            </span>
          )}
        </div>
        <button 
          onClick={() => onRemove(idx)} 
          style={{ 
            background: 'rgba(239,68,68,0.1)', 
            border: '1px solid rgba(239,68,68,0.3)', 
            borderRadius: 6, 
            color: '#ef4444', 
            cursor: 'pointer', 
            fontSize: 12,
            padding: '4px 8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239,68,68,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(239,68,68,0.1)';
          }}
        >
          Remove
        </button>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ 
          display: 'block', 
          fontSize: 11, 
          fontWeight: 600, 
          color: '#718096', 
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Question Text
        </label>
        <textarea 
          value={q.questionText || ''} 
          onChange={e => onChange(idx, { ...q, questionText: e.target.value })}
          placeholder="Enter your question here..." 
          rows={3}
          style={{ 
            width: '100%', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: 8, 
            padding: '10px 14px', 
            color: '#e2e8f0', 
            fontSize: 14, 
            fontFamily: 'Sora, sans-serif',
            resize: 'vertical',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#e94560';
            e.target.style.outline = 'none';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        />
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ 
          display: 'block', 
          fontSize: 11, 
          fontWeight: 600, 
          color: '#718096', 
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Answer Options
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {opts.map((opt, i) => (
            <div key={opt.id} style={{ position: 'relative' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '8px 12px',
                background: q.correctAnswer === opt.id 
                  ? 'rgba(34,197,94,0.1)' 
                  : 'rgba(255,255,255,0.02)',
                border: q.correctAnswer === opt.id 
                  ? '2px solid rgba(34,197,94,0.5)' 
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                transition: 'all 0.2s ease'
              }}>
                <span style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: q.correctAnswer === opt.id ? '#22c55e' : '#4a5568', 
                  width: 20,
                  textAlign: 'center'
                }}>
                  {opt.id?.toUpperCase()}.
                </span>
                <input 
                  value={opt.text} 
                  onChange={e => setOption(i, e.target.value)} 
                  placeholder={`Option ${opt.id?.toUpperCase()}`}
                  style={{ 
                    flex: 1, 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#e2e8f0', 
                    fontSize: 13, 
                    fontFamily: 'Sora, sans-serif',
                    outline: 'none'
                  }}
                />
                {q.correctAnswer === opt.id && (
                  <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        alignItems: 'center',
        padding: '12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 11, color: '#718096', fontWeight: 600 }}>Correct Answer:</label>
          <select 
            value={q.correctAnswer || ''} 
            onChange={set('correctAnswer')}
            style={{ 
              background: q.correctAnswer 
                ? 'rgba(34,197,94,0.15)' 
                : '#0e0e1a', 
              border: q.correctAnswer 
                ? '1px solid rgba(34,197,94,0.3)' 
                : '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 6, 
              padding: '6px 12px', 
              color: q.correctAnswer ? '#22c55e' : '#e2e8f0', 
              fontSize: 12,
              fontFamily: 'Sora, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="">Select correct option</option>
            {opts.map(o => <option key={o.id} value={o.id}>{o.id?.toUpperCase()}. {o.text || '(empty)'}</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 11, color: '#718096', fontWeight: 600 }}>Marks:</label>
          <input 
            type="number" 
            value={q.marks || 1} 
            onChange={set('marks')} 
            min={1}
            style={{ 
              width: 60, 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 6, 
              padding: '6px 8px', 
              color: '#e2e8f0', 
              fontSize: 12, 
              fontFamily: 'Sora, sans-serif',
              textAlign: 'center'
            }} 
          />
        </div>
      </div>
    </div>
  );
};

const SubjectiveForm = ({ q, idx, onChange, onRemove }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 18, marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6' }}>Q{idx + 1} · Subjective</span>
      <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
    </div>
    <textarea value={q.questionText || ''} onChange={e => onChange(idx, { ...q, questionText: e.target.value })}
      placeholder="Enter question text..." rows={3}
      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, fontFamily: 'Sora, sans-serif', marginBottom: 10 }} />
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <label style={{ fontSize: 11, color: '#718096' }}>Marks:</label>
      <input type="number" value={q.marks || 5} onChange={e => onChange(idx, { ...q, marks: parseInt(e.target.value) })} min={1}
        style={{ width: 60, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, fontFamily: 'Sora, sans-serif' }} />
    </div>
  </div>
);

export default function CreateExam() {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({
    name: '', type: 'mcq', subject: '', dateTime: '', duration: 60,
    totalMarks: 100, passingMarks: 40, instructions: '', isProctored: true, maxViolations: 3,
  });
  const [questions, setQuestions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examId, setExamId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    adminAPI.getStudents({ limit: 500 }).then(res => setAllStudents(res.data.students)).catch(() => {});
  }, []);

  const setD = (k) => (e) => setDetails(d => ({ ...d, [k]: e.type === 'checkbox' ? e.target.checked : e.target.value }));

  const addQuestion = (type) => {
    const base = { type, questionText: '', marks: type === 'mcq' ? 1 : 5, difficulty: 'medium' };
    if (type === 'mcq') base.options = [{id:'a',text:''},{id:'b',text:''},{id:'c',text:''},{id:'d',text:''}];
    setQuestions(q => [...q, base]);
  };

  const updateQ = (idx, q) => setQuestions(qs => qs.map((old, i) => i === idx ? q : old));
  const removeQ = (idx) => setQuestions(qs => qs.filter((_, i) => i !== idx));

  const toggleStudent = (id) => setSelectedStudents(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelectedStudents(s => s.length === allStudents.length ? [] : allStudents.map(s => s.id));

  const totalCalc = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

  const handleCreate = async () => {
    if (!details.name || !details.dateTime || !details.duration) return toast.error('Fill all required exam details');
    setLoading(true);
    try {
      const res = await adminAPI.createExam({
        ...details,
        totalMarks: totalCalc || parseInt(details.totalMarks),
        passingMarks: parseInt(details.passingMarks),
        duration: parseInt(details.duration),
        questions,
        studentIds: selectedStudents,
      });
      setExamId(res.data.id);
      toast.success('Exam created successfully!');
      navigate('/admin/exams');
    } catch (err) {
      toast.error(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return details.name && details.dateTime && details.duration;
    return true;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Create New Exam</h1>
        <p style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>Set up your examination in a few steps</p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: i <= step ? '#e94560' : 'rgba(255,255,255,0.08)', color: i <= step ? 'white' : '#4a5568', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, margin: '0 auto 6px' }}>
              {i < step ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 11, color: i === step ? '#e2e8f0' : '#4a5568', fontWeight: i === step ? 600 : 400 }}>{s}</div>
            {i < steps.length - 1 && <div style={{ position: 'absolute', top: 16, left: '60%', right: '-40%', height: 1, background: i < step ? '#e94560' : 'rgba(255,255,255,0.08)' }} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 28, marginBottom: 20 }}>

        {/* Step 0: Details */}
        {step === 0 && (
          <div>
            <Input label="Exam Name" required value={details.name} onChange={setD('name')} placeholder="Midterm Examination - Computer Networks" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Exam Type" as="select" value={details.type} onChange={setD('type')}>
                <option value="mcq">MCQ</option>
                <option value="subjective">Subjective</option>
                <option value="coding">Coding</option>
                <option value="mixed">Mixed</option>
              </Input>
              <Input label="Subject" value={details.subject} onChange={setD('subject')} placeholder="Computer Science" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Date & Time" required type="datetime-local" value={details.dateTime} onChange={setD('dateTime')} />
              <Input label="Duration (minutes)" required type="number" value={details.duration} onChange={setD('duration')} min={5} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Input label="Total Marks" type="number" value={details.totalMarks} onChange={setD('totalMarks')} min={1} />
              <Input label="Passing Marks" type="number" value={details.passingMarks} onChange={setD('passingMarks')} min={1} />
              <Input label="Max Violations" type="number" value={details.maxViolations} onChange={setD('maxViolations')} min={1} max={10} />
            </div>
            <Input label="Instructions" as="textarea" value={details.instructions} onChange={setD('instructions')} placeholder="Rules and guidelines for this exam..." />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={details.isProctored} onChange={setD('isProctored')} style={{ width: 16, height: 16, accentColor: '#e94560' }} />
              <span style={{ fontSize: 13, color: '#a0aec0' }}>Enable AI Proctoring (webcam + tab monitoring)</span>
            </label>
          </div>
        )}

        {/* Step 1: Questions */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{questions.length} Questions · {totalCalc} Marks</h3>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(details.type === 'mcq' || details.type === 'mixed') && (
                  <button onClick={() => addQuestion('mcq')} style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: 8, padding: '7px 14px', color: '#e94560', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>+ MCQ</button>
                )}
                {(details.type === 'subjective' || details.type === 'mixed') && (
                  <button onClick={() => addQuestion('subjective')} style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '7px 14px', color: '#8b5cf6', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>+ Subjective</button>
                )}
                {(details.type === 'coding' || details.type === 'mixed') && (
                  <button onClick={() => addQuestion('coding')} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '7px 14px', color: '#22c55e', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>+ Coding</button>
                )}
              </div>
            </div>

            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#4a5568', border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 10 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                <p>No questions yet. Add questions using the buttons above.</p>
              </div>
            ) : (
              questions.map((q, i) =>
                q.type === 'mcq' ? (
                  <MCQQuestionForm key={i} q={q} idx={i} onChange={updateQ} onRemove={removeQ} />
                ) : q.type === 'coding' ? (
                  <CodingQuestionForm key={i} q={q} idx={i} onChange={updateQ} onRemove={removeQ} />
                ) : (
                  <SubjectiveForm key={i} q={q} idx={i} onChange={updateQ} onRemove={removeQ} />
                )
              )
            )}
          </div>
        )}

        {/* Step 2: Assign Students */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                {selectedStudents.length}/{allStudents.length} Students Selected
              </h3>
              <button onClick={toggleAll} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 12, fontFamily: 'Sora, sans-serif' }}>
                {selectedStudents.length === allStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {allStudents.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: selectedStudents.includes(s.id) ? 'rgba(233,69,96,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedStudents.includes(s.id) ? 'rgba(233,69,96,0.3)' : 'transparent'}` }}>
                  <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} style={{ accentColor: '#e94560', width: 14, height: 14 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#4a5568' }}>{s.student_id} · {s.roll_no}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Review & Create</h3>
            {[
              ['Exam Name', details.name],
              ['Type', details.type.toUpperCase()],
              ['Subject', details.subject || '—'],
              ['Date & Time', details.dateTime],
              ['Duration', `${details.duration} minutes`],
              ['Total Marks', totalCalc || details.totalMarks],
              ['Passing Marks', details.passingMarks],
              ['Questions', questions.length],
              ['Students', `${selectedStudents.length} assigned`],
              ['Proctoring', details.isProctored ? 'Enabled' : 'Disabled'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 13, color: '#718096' }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 24px', color: step === 0 ? '#4a5568' : '#e2e8f0', cursor: step === 0 ? 'default' : 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13 }}>
          ← Back
        </button>
        {step < steps.length - 1 ? (
          <button onClick={() => canProceed() && setStep(s => s + 1)} disabled={!canProceed()}
            style={{ background: 'linear-gradient(135deg,#e94560,#c62a47)', border: 'none', borderRadius: 8, padding: '10px 28px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'Sora, sans-serif', opacity: canProceed() ? 1 : 0.5 }}>
            Next →
          </button>
        ) : (
          <button onClick={handleCreate} disabled={loading}
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: 8, padding: '10px 28px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'Sora, sans-serif' }}>
            {loading ? 'Creating...' : '✓ Create Exam'}
          </button>
        )}
      </div>

      <style>{`input:focus,textarea:focus,select:focus{outline:none;border-color:#e94560!important;} input::placeholder,textarea::placeholder{color:#4a5568;}`}</style>
    </div>
  );
}
