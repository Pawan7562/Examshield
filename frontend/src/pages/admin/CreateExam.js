// src/pages/admin/CreateExam.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import CodingQuestionForm from '../../components/CodingQuestionForm';
import { formatIST, toISTISOString } from '../../utils/timezone';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Users, 
  Clock, 
  Calendar, 
  Settings, 
  Edit3, 
  Trash2, 
  Code, 
  HelpCircle, 
  BookOpen, 
  Award, 
  Shield, 
  AlertCircle,
  Search,
  Eye,
  Mic,
  Maximize,
  Camera,
  Layers
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';
import './CreateExam.css';

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
    monitoringConfig: {
      face_detection: true,
      voice_detection: true,
      tab_switch: true,
      fullscreen: true,
      device_camera: true
    }
  });

  const toggleMonitoringOption = (key) => {
    setDetails(prev => ({
      ...prev,
      monitoringConfig: {
        ...prev.monitoringConfig,
        [key]: !prev.monitoringConfig[key]
      }
    }));
  };
  const [questions, setQuestions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    adminAPI.getStudents({ limit: 500 })
      .then(res => setAllStudents(res.data?.students || res.data?.data?.students || (Array.isArray(res.data) ? res.data : [])))
      .catch(() => {});
    
    // Handle questions passed from AI Generator (sessionStorage or location.state)
    let qs = null;
    try {
      const sessionQs = sessionStorage.getItem('ai_generated_exam_questions');
      if (sessionQs) {
        qs = JSON.parse(sessionQs);
        sessionStorage.removeItem('ai_generated_exam_questions');
      }
    } catch (_) {}

    if (!qs && location.state?.questions) {
      qs = location.state.questions;
    }

    if (Array.isArray(qs) && qs.length > 0) {
      setQuestions(qs);
      if (qs.some(q => q.type === 'coding')) {
        setDetails(d => ({ ...d, type: 'coding' }));
      }
      toast.success(`Loaded ${qs.length} questions from AI Generator`);
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

  const filteredStudents = allStudents.filter(s => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.roll_no || '').toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q);
  });

  const totalCalc = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

  const handleCreate = async () => {
    if (!details.name || !details.dateTime || !details.duration) return toast.error('Fill all required exam details');
    setLoading(true);
    try {
      await adminAPI.createExam({
        ...details,
        dateTime: toISTISOString(details.dateTime),
        totalMarks: totalCalc || parseInt(details.totalMarks),
        passingMarks: parseInt(details.passingMarks),
        duration: parseInt(details.duration),
        questions,
        studentIds: selectedStudents,
        monitoringConfig: details.monitoringConfig,
        monitoring_config: details.monitoringConfig,
      });
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
                {/* Master Proctoring Control */}
                <div className="admin-checkbox-group" style={{ marginBottom: 12 }}>
                  <input 
                    type="checkbox" 
                    id="proctored"
                    checked={details.isProctored} 
                    onChange={setD('isProctored')} 
                    className="admin-checkbox"
                  />
                  <label htmlFor="proctored" className="admin-checkbox-label" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    <Shield size={18} color="#0a74da" />
                    Enable Dedicated AI Proctoring & Live Monitoring
                  </label>
                </div>

                {/* Granular Per-Exam Monitoring Configuration */}
                {details.isProctored ? (
                  <div className="admin-monitoring-card">
                    <div className="admin-monitoring-header">
                      <div>
                        <div className="admin-monitoring-title">
                          <Shield size={18} color="#0a74da" />
                          <span>Custom Exam Monitoring Features</span>
                        </div>
                        <div className="admin-monitoring-subtitle">
                          Select the monitoring features to enforce for this specific exam. Leave any feature unchecked to disable it.
                        </div>
                      </div>
                      <span className="admin-monitoring-badge">
                        {Object.values(details.monitoringConfig).filter(Boolean).length} of 5 Active
                      </span>
                    </div>

                    <div className="admin-monitoring-grid">
                      {/* Face Detection */}
                      <div 
                        className={`admin-monitoring-item ${details.monitoringConfig.face_detection ? 'active' : ''}`}
                        onClick={() => toggleMonitoringOption('face_detection')}
                      >
                        <div className="admin-monitoring-icon-wrap">
                          <Eye size={20} />
                        </div>
                        <div className="admin-monitoring-info">
                          <div className="admin-monitoring-item-title">
                            <span>Face & Person Detection</span>
                            <label className="admin-switch" onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={details.monitoringConfig.face_detection}
                                onChange={() => toggleMonitoringOption('face_detection')}
                              />
                              <span className="admin-switch-slider"></span>
                            </label>
                          </div>
                          <div className="admin-monitoring-item-desc">
                            Alerts if candidate leaves the frame, looks away continuously, or multiple faces are detected.
                          </div>
                        </div>
                      </div>

                      {/* Voice Detection */}
                      <div 
                        className={`admin-monitoring-item ${details.monitoringConfig.voice_detection ? 'active' : ''}`}
                        onClick={() => toggleMonitoringOption('voice_detection')}
                      >
                        <div className="admin-monitoring-icon-wrap">
                          <Mic size={20} />
                        </div>
                        <div className="admin-monitoring-info">
                          <div className="admin-monitoring-item-title">
                            <span>Voice & Speech Detection</span>
                            <label className="admin-switch" onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={details.monitoringConfig.voice_detection}
                                onChange={() => toggleMonitoringOption('voice_detection')}
                              />
                              <span className="admin-switch-slider"></span>
                            </label>
                          </div>
                          <div className="admin-monitoring-item-desc">
                            Monitors candidate microphone and detects talking, whispering, or ambient speech.
                          </div>
                        </div>
                      </div>

                      {/* Tab-Switch Detection */}
                      <div 
                        className={`admin-monitoring-item ${details.monitoringConfig.tab_switch ? 'active' : ''}`}
                        onClick={() => toggleMonitoringOption('tab_switch')}
                      >
                        <div className="admin-monitoring-icon-wrap">
                          <Layers size={20} />
                        </div>
                        <div className="admin-monitoring-info">
                          <div className="admin-monitoring-item-title">
                            <span>Tab-Switch & Blur Detection</span>
                            <label className="admin-switch" onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={details.monitoringConfig.tab_switch}
                                onChange={() => toggleMonitoringOption('tab_switch')}
                              />
                              <span className="admin-switch-slider"></span>
                            </label>
                          </div>
                          <div className="admin-monitoring-item-desc">
                            Tracks when candidate shifts to another browser tab or minimizes the exam browser.
                          </div>
                        </div>
                      </div>

                      {/* Full-Screen Mode */}
                      <div 
                        className={`admin-monitoring-item ${details.monitoringConfig.fullscreen ? 'active' : ''}`}
                        onClick={() => toggleMonitoringOption('fullscreen')}
                      >
                        <div className="admin-monitoring-icon-wrap">
                          <Maximize size={20} />
                        </div>
                        <div className="admin-monitoring-info">
                          <div className="admin-monitoring-item-title">
                            <span>Full-Screen Enforcement</span>
                            <label className="admin-switch" onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={details.monitoringConfig.fullscreen}
                                onChange={() => toggleMonitoringOption('fullscreen')}
                              />
                              <span className="admin-switch-slider"></span>
                            </label>
                          </div>
                          <div className="admin-monitoring-item-desc">
                            Requires candidates to stay in full-screen mode and alerts immediately on full-screen exit.
                          </div>
                        </div>
                      </div>

                      {/* Device Camera Feed */}
                      <div 
                        className={`admin-monitoring-item ${details.monitoringConfig.device_camera ? 'active' : ''}`}
                        onClick={() => toggleMonitoringOption('device_camera')}
                      >
                        <div className="admin-monitoring-icon-wrap">
                          <Camera size={20} />
                        </div>
                        <div className="admin-monitoring-info">
                          <div className="admin-monitoring-item-title">
                            <span>Live Camera Stream & HUD</span>
                            <label className="admin-switch" onClick={e => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={details.monitoringConfig.device_camera}
                                onChange={() => toggleMonitoringOption('device_camera')}
                              />
                              <span className="admin-switch-slider"></span>
                            </label>
                          </div>
                          <div className="admin-monitoring-item-desc">
                            Displays candidate picture-in-picture webcam HUD and streams live snapshots to cockpit.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px 18px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px', marginTop: 12, color: '#64748b', fontSize: '0.85rem' }}>
                    ℹ️ AI Proctoring is disabled for this exam. Candidates will not be monitored via webcam, microphone, or tab-switch detection.
                  </div>
                )}
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
                  <h2 className="admin-step-title">
                    <Users size={22} color="#0a74da" /> Assign Students
                  </h2>
                  <p className="admin-students-count">
                    <span>{selectedStudents.length} of {allStudents.length} Students Selected</span>
                    {selectedStudents.length > 0 && (
                      <span style={{ color: '#10b981', fontWeight: 700 }}>
                        ({Math.round((selectedStudents.length / (allStudents.length || 1)) * 100)}% enrolled)
                      </span>
                    )}
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

              {/* Candidate Search Bar */}
              <div className="admin-students-toolbar">
                <div className="admin-student-search-box">
                  <Search size={16} className="admin-student-search-icon" />
                  <input 
                    type="text"
                    placeholder="Search candidate name, roll number, student ID, or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="admin-student-search-input"
                  />
                </div>
              </div>
              
              <div className="admin-students-list">
                {filteredStudents.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                    No students match "{studentSearch}". Try a different search term.
                  </div>
                ) : (
                  filteredStudents.map(s => {
                    const isSelected = selectedStudents.includes(s.id);
                    const initials = (s.name || 'ST').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <label key={s.id} className={`admin-student-item ${isSelected ? 'selected' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleStudent(s.id)} 
                          className="admin-student-checkbox"
                        />
                        <div className="admin-student-avatar">
                          {initials}
                        </div>
                        <div className="admin-student-info">
                          <div className="admin-student-name" title={s.name}>{s.name}</div>
                          <div className="admin-student-meta">
                            {s.student_id || s.roll_no ? `${s.student_id || ''}${s.student_id && s.roll_no ? ' · ' : ''}${s.roll_no || ''}` : s.email}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="admin-step-section">
              <div className="admin-review-hero-card">
                <div className="admin-review-hero-info">
                  <div className="admin-review-hero-title">{details.name || 'Untitled Assessment'}</div>
                  <div className="admin-review-hero-sub">
                    {details.subject ? `Subject: ${details.subject}` : 'Enterprise Assessment'} · Verified Configuration
                  </div>
                </div>
                <div className="admin-review-hero-badges">
                  <span className="admin-review-pill type">{details.type} MODE</span>
                  <span className="admin-review-pill proctor">
                    <Shield size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    {details.isProctored ? 'AI PROCTORING ACTIVE' : 'UNPROCTORED'}
                  </span>
                </div>
              </div>

              <div className="admin-review-grid">
                {[
                  ['Exam Name', details.name || 'Untitled Exam', FileText],
                  ['Assessment Type', details.type.toUpperCase(), Settings],
                  ['Subject', details.subject || '—', BookOpen],
                  ['Date & Time (IST)', details.dateTime ? formatIST(details.dateTime, 'full') : 'Not set', Calendar],
                  ['Duration', `${details.duration} Minutes`, Clock],
                  ['Total Marks', `${totalCalc || details.totalMarks} Marks`, Award],
                  ['Passing Score', `${details.passingMarks} Marks`, CheckCircle],
                  ['Questions Configured', `${questions.length} Questions`, HelpCircle],
                  ['Candidates Enrolled', `${selectedStudents.length} Students`, Users],
                  ['Proctoring Security', details.isProctored ? 'Webcam + Speech + Tab' : 'Disabled', Shield],
                ].map(([key, value, Icon]) => (
                  <div key={key} className="admin-review-item">
                    <div className="admin-review-label">
                      {Icon && <Icon size={14} />}
                      {key}
                    </div>
                    <div className="admin-review-value">{value}</div>
                  </div>
                ))}
              </div>

              {/* Monitoring Feature Breakdown */}
              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '18px 22px', marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={16} color="#0a74da" />
                  <span>Configured Exam Monitoring Policies</span>
                </div>
                {details.isProctored ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {[
                      { key: 'face_detection', label: 'Face & Person Detection', icon: Eye },
                      { key: 'voice_detection', label: 'Voice & Speech Detection', icon: Mic },
                      { key: 'tab_switch', label: 'Tab-Switch Detection', icon: Layers },
                      { key: 'fullscreen', label: 'Full-Screen Enforcement', icon: Maximize },
                      { key: 'device_camera', label: 'Live Camera HUD & Cockpit Feed', icon: Camera },
                    ].map(feat => {
                      const active = details.monitoringConfig[feat.key];
                      const Icon = feat.icon;
                      return (
                        <div 
                          key={feat.key} 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 8, 
                            padding: '6px 14px', 
                            borderRadius: '8px',
                            background: active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.08)',
                            border: `1.5px solid ${active ? '#10b981' : '#cbd5e1'}`,
                            color: active ? '#065f46' : '#64748b',
                            fontSize: '0.82rem',
                            fontWeight: 700
                          }}
                        >
                          <Icon size={14} color={active ? '#10b981' : '#94a3b8'} />
                          <span>{feat.label}: {active ? 'ENABLED' : 'DISABLED'}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    All monitoring features are disabled for this exam.
                  </div>
                )}
              </div>

              {details.instructions && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Candidate Instructions
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {details.instructions}
                  </div>
                </div>
              )}
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
