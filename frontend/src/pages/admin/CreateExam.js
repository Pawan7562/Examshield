// src/pages/admin/CreateExam.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import CodingQuestionForm from '../../components/CodingQuestionForm';
import { 
  FileText, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Users, 
  Clock, 
  Calendar, 
  Settings, 
  Eye, 
  Edit3, 
  Trash2, 
  Code, 
  HelpCircle, 
  BookOpen,
  Award,
  Shield,
  AlertCircle,
  Bot,
  Zap,
  Database,
  Globe,
  Cpu,
  Layers,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

const steps = ['Exam Details', 'Questions', 'Students', 'Review'];

const Input = ({ label, required, icon: Icon, error, ...props }) => (
  <div className="admin-form-group">
    <label className="admin-form-label">
      {Icon && <Icon size={16} />}
      {label}
      {required && <span className="admin-required">*</span>}
    </label>
    {props.as === 'textarea' ? (
      <textarea {...props} as={undefined} className={`admin-form-input ${error ? 'error' : ''}`} />
    ) : props.as === 'select' ? (
      <select {...props} as={undefined} className={`admin-form-input ${error ? 'error' : ''}`}>
        {props.children}
      </select>
    ) : (
      <input {...props} className={`admin-form-input ${error ? 'error' : ''}`} />
    )}
    {error && <span className="admin-form-error">{error}</span>}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, loading, ...props }) => {
  return (
    <button 
      {...props} 
      className={`admin-btn admin-btn-${variant} admin-btn-${size} ${loading ? 'loading' : ''}`}
      disabled={loading || props.disabled}
    >
      {loading ? (
        <div className="admin-btn-spinner"></div>
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
    </button>
  );
};

const StepIndicator = ({ currentStep }) => (
  <div className="admin-steps-indicator">
    {steps.map((step, index) => (
      <div key={step} className="admin-step-item">
        <div className={`admin-step-circle ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}>
          {index < currentStep ? <CheckCircle size={16} /> : index + 1}
        </div>
        <div className={`admin-step-label ${index === currentStep ? 'active' : ''}`}>
          {step}
        </div>
        {index < steps.length - 1 && <div className={`admin-step-line ${index < currentStep ? 'active' : ''}`} />}
      </div>
    ))}
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
    <div className={`admin-question-card ${q.correctAnswer ? 'has-answer' : ''}`}>
      <div className="admin-question-header">
        <div className="admin-question-meta">
          <span className="admin-question-number">Q{idx + 1}</span>
          <span className="admin-question-type">MCQ</span>
          {q.correctAnswer && (
            <span className="admin-question-status">
              <CheckCircle size={12} />
              Answer Set
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          icon={Trash2}
          onClick={() => onRemove(idx)}
          className="admin-remove-question"
        >
          Remove
        </Button>
      </div>
      
      <div className="admin-question-content">
        <div className="admin-form-group">
          <label className="admin-form-label">Question Text</label>
          <textarea 
            value={q.questionText || ''} 
            onChange={e => onChange(idx, { ...q, questionText: e.target.value })}
            placeholder="Enter your question here..." 
            rows={3}
            className="admin-form-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-form-label">Answer Options</label>
          <div className="admin-options-grid">
            {opts.map((opt, i) => (
              <div key={opt.id} className="admin-option-item">
                <div className={`admin-option-input ${q.correctAnswer === opt.id ? 'correct' : ''}`}>
                  <span className="admin-option-label">{opt.id?.toUpperCase()}.</span>
                  <input 
                    value={opt.text} 
                    onChange={e => setOption(i, e.target.value)} 
                    placeholder={`Option ${opt.id?.toUpperCase()}`}
                    className="admin-option-field"
                  />
                  {q.correctAnswer === opt.id && (
                    <CheckCircle size={14} className="admin-option-check" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="admin-question-settings">
          <div className="admin-setting-group">
            <label className="admin-setting-label">Correct Answer:</label>
            <select 
              value={q.correctAnswer || ''} 
              onChange={set('correctAnswer')}
              className={`admin-form-input ${q.correctAnswer ? 'has-answer' : ''}`}
            >
              <option value="">Select correct option</option>
              {opts.map(o => <option key={o.id} value={o.id}>{o.id?.toUpperCase()}. {o.text || '(empty)'}</option>)}
            </select>
          </div>
          
          <div className="admin-setting-group">
            <label className="admin-setting-label">Marks:</label>
            <input 
              type="number" 
              value={q.marks || 1} 
              onChange={set('marks')} 
              min={1}
              className="admin-form-input admin-marks-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SubjectiveForm = ({ q, idx, onChange, onRemove }) => (
  <div className="admin-question-card">
    <div className="admin-question-header">
      <div className="admin-question-meta">
        <span className="admin-question-number">Q{idx + 1}</span>
        <span className="admin-question-type subjective">Subjective</span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        icon={Trash2}
        onClick={() => onRemove(idx)}
        className="admin-remove-question"
      >
        Remove
      </Button>
    </div>
    <div className="admin-question-content">
      <div className="admin-form-group">
        <label className="admin-form-label">Question Text</label>
        <textarea 
          value={q.questionText || ''} 
          onChange={e => onChange(idx, { ...q, questionText: e.target.value })}
          placeholder="Enter question text..." 
          rows={3}
          className="admin-form-input"
        />
      </div>
      <div className="admin-question-settings">
        <div className="admin-setting-group">
          <label className="admin-setting-label">Marks:</label>
          <input 
            type="number" 
            value={q.marks || 5} 
            onChange={e => onChange(idx, { ...q, marks: parseInt(e.target.value) })} 
            min={1}
            className="admin-form-input admin-marks-input"
          />
        </div>
      </div>
    </div>
  </div>
);

export default function CreateExam() {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({
    name: '', 
    type: 'mcq', 
    subject: '', 
    dateTime: '', 
    duration: 60,
    totalMarks: 100, 
    passingMarks: 40, 
    instructions: '', 
    isProctored: true, 
    maxViolations: 3,
  });
  const [questions, setQuestions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examId, setExamId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    adminAPI.getStudents({ limit: 500 }).then(res => setAllStudents(res.data.students)).catch(() => {});
    
    // Handle questions passed from AI Generator
    if (location.state?.questions) {
      setQuestions(location.state.questions);
      toast.success(`Loaded ${location.state.questions.length} questions from AI Generator`);
    }
  }, [location.state]);

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
    <div className="admin-pages-container">
      <div className="admin-create-exam-container">
        {/* Header */}
        <div className="admin-page-header">
          <div className="admin-header-content">
            <h1 className="admin-page-title">Create New Exam</h1>
            <p className="admin-page-subtitle">Set up your examination in a few simple steps</p>
          </div>
        </div>

        {/* Steps Indicator */}
        <StepIndicator currentStep={step} />

        {/* Step Content */}
        <div className="admin-content-card admin-step-content">
          {/* Step 0: Details */}
          {step === 0 && (
            <div className="admin-step-section">
              <h2 className="admin-step-title">Exam Details</h2>
              <div className="admin-form-grid">
                <Input 
                  label="Exam Name" 
                  required 
                  icon={FileText}
                  value={details.name} 
                  onChange={setD('name')} 
                  placeholder="Midterm Examination - Computer Networks" 
                />
                <div className="admin-form-row">
                  <Input 
                    label="Exam Type" 
                    as="select" 
                    icon={Settings}
                    value={details.type} 
                    onChange={setD('type')}
                  >
                    <option value="mcq">MCQ</option>
                    <option value="subjective">Subjective</option>
                    <option value="coding">Coding</option>
                    <option value="mixed">Mixed</option>
                  </Input>
                  <Input 
                    label="Subject" 
                    icon={BookOpen}
                    value={details.subject} 
                    onChange={setD('subject')} 
                    placeholder="Computer Science" 
                  />
                </div>
                <div className="admin-form-row">
                  <Input 
                    label="Date & Time" 
                    required 
                    type="datetime-local" 
                    icon={Calendar}
                    value={details.dateTime} 
                    onChange={setD('dateTime')} 
                  />
                  <Input 
                    label="Duration (minutes)" 
                    required 
                    type="number" 
                    icon={Clock}
                    value={details.duration} 
                    onChange={setD('duration')} 
                    min={5} 
                  />
                </div>
                <div className="admin-form-row">
                  <Input 
                    label="Total Marks" 
                    type="number" 
                    icon={Award}
                    value={details.totalMarks} 
                    onChange={setD('totalMarks')} 
                    min={1} 
                  />
                  <Input 
                    label="Passing Marks" 
                    type="number" 
                    icon={CheckCircle}
                    value={details.passingMarks} 
                    onChange={setD('passingMarks')} 
                    min={1} 
                  />
                  <Input 
                    label="Max Violations" 
                    type="number" 
                    icon={AlertCircle}
                    value={details.maxViolations} 
                    onChange={setD('maxViolations')} 
                    min={1} 
                    max={10} 
                  />
                </div>
                <Input 
                  label="Instructions" 
                  as="textarea" 
                  icon={HelpCircle}
                  value={details.instructions} 
                  onChange={setD('instructions')} 
                  placeholder="Rules and guidelines for this exam..." 
                />
                <div className="admin-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="proctored"
                    checked={details.isProctored} 
                    onChange={setD('isProctored')} 
                    className="admin-checkbox"
                  />
                  <label htmlFor="proctored" className="admin-checkbox-label">
                    <Shield size={16} />
                    Enable AI Proctoring (webcam + tab monitoring)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Questions */}
          {step === 1 && (
            <div className="admin-step-section">
              <div className="admin-questions-header">
                <div className="admin-questions-info">
                  <h2 className="admin-step-title">Questions</h2>
                  <p className="admin-questions-count">
                    {questions.length} Questions · {totalCalc} Marks
                  </p>
                </div>
                <div className="admin-questions-actions">
                  {(details.type === 'mcq' || details.type === 'mixed') && (
                    <Button variant="secondary" icon={HelpCircle} onClick={() => addQuestion('mcq')}>
                      + MCQ
                    </Button>
                  )}
                  {(details.type === 'subjective' || details.type === 'mixed') && (
                    <Button variant="secondary" icon={Edit3} onClick={() => addQuestion('subjective')}>
                      + Subjective
                    </Button>
                  )}
                  {(details.type === 'coding' || details.type === 'mixed') && (
                    <Button variant="secondary" icon={Code} onClick={() => addQuestion('coding')}>
                      + Coding
                    </Button>
                  )}
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="admin-empty-questions">
                  <FileText size={48} />
                  <h3>No questions yet</h3>
                  <p>Add questions using the buttons above to get started.</p>
                </div>
              ) : (
                <div className="admin-questions-list">
                  {questions.map((q, i) =>
                    q.type === 'mcq' ? (
                      <MCQQuestionForm key={i} q={q} idx={i} onChange={updateQ} onRemove={removeQ} />
                    ) : q.type === 'coding' ? (
                      <CodingQuestionForm key={i} q={q} idx={i} onChange={updateQ} onRemove={removeQ} />
                    ) : (
                      <SubjectiveForm key={i} q={q} idx={i} onChange={updateQ} onRemove={removeQ} />
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Assign Students */}
          {step === 2 && (
            <div className="admin-step-section">
              <div className="admin-students-header">
                <div className="admin-students-info">
                  <h2 className="admin-step-title">Assign Students</h2>
                  <p className="admin-students-count">
                    {selectedStudents.length}/{allStudents.length} Students Selected
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={toggleAll}
                  className="admin-select-all-btn"
                >
                  {selectedStudents.length === allStudents.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="admin-students-list">
                {allStudents.map(s => (
                  <label key={s.id} className={`admin-student-item ${selectedStudents.includes(s.id) ? 'selected' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(s.id)} 
                      onChange={() => toggleStudent(s.id)} 
                      className="admin-student-checkbox"
                    />
                    <div className="admin-student-info">
                      <div className="admin-student-name">{s.name}</div>
                      <div className="admin-student-meta">{s.student_id} · {s.roll_no}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="admin-step-section">
              <h2 className="admin-step-title">Review & Create</h2>
              <div className="admin-review-grid">
                {[
                  ['Exam Name', details.name, FileText],
                  ['Type', details.type.toUpperCase(), Settings],
                  ['Subject', details.subject || '—', BookOpen],
                  ['Date & Time', details.dateTime, Calendar],
                  ['Duration', `${details.duration} minutes`, Clock],
                  ['Total Marks', totalCalc || details.totalMarks, Award],
                  ['Passing Marks', details.passingMarks, CheckCircle],
                  ['Questions', questions.length, HelpCircle],
                  ['Students', `${selectedStudents.length} assigned`, Users],
                  ['Proctoring', details.isProctored ? 'Enabled' : 'Disabled', Shield],
                ].map(([key, value, Icon]) => (
                  <div key={key} className="admin-review-item">
                    <div className="admin-review-label">
                      {Icon && <Icon size={16} />}
                      {key}
                    </div>
                    <div className="admin-review-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="admin-step-navigation">
          <Button 
            variant="secondary" 
            icon={ChevronLeft}
            onClick={() => step > 0 && setStep(s => s - 1)} 
            disabled={step === 0}
          >
            Back
          </Button>
          
          {step < steps.length - 1 ? (
            <Button 
              icon={ChevronRight}
              onClick={() => canProceed() && setStep(s => s + 1)} 
              disabled={!canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="success" 
              icon={CheckCircle}
              onClick={handleCreate} 
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Creating...' : 'Create Exam'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
