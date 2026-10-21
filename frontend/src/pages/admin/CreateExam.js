// src/pages/admin/CreateExam.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import CodingQuestionForm from '../../components/CodingQuestionForm';
import { formatIST, toISTISOString, toDateTimeLocalValue } from '../../utils/timezone';
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
  Layers,
  Plus,
  Minus,
  LayoutGrid,
  Building,
  Target,
  X,
  Filter
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
    targetDepartment: 'all',
    dateTime: toDateTimeLocalValue(new Date(Date.now() + 10 * 60000)), 
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

  // ── Multi-Section State ──
  const [sectionsEnabled, setSectionsEnabled] = useState(false);
  const [sections, setSections] = useState([
    { id: 'sec-1', name: 'Section A', marks: 30, timeLimit: 20 },
    { id: 'sec-2', name: 'Section B', marks: 20, timeLimit: 15 },
  ]);

  const addSection = () => {
    const nextLetter = String.fromCharCode(65 + sections.length); // A=65
    setSections(s => [...s, {
      id: `sec-${Date.now()}`,
      name: `Section ${nextLetter}`,
      marks: 10,
      timeLimit: 10
    }]);
  };

  const removeSection = (idx) => {
    if (sections.length <= 1) return toast.error('At least one section is required');
    const removedId = sections[idx].id;
    setSections(s => s.filter((_, i) => i !== idx));
    // Unassign questions from this section
    setQuestions(qs => qs.map(q => q.sectionId === removedId ? { ...q, sectionId: null, sectionName: null } : q));
  };

  const updateSection = (idx, field, value) => {
    setSections(s => s.map((sec, i) => {
      if (i !== idx) return sec;
      const updated = { ...sec, [field]: field === 'name' ? value : (parseInt(value) || 0) };
      // If section name changed, update questions assigned to it
      if (field === 'name') {
        setQuestions(qs => qs.map(q => q.sectionId === sec.id ? { ...q, sectionName: value } : q));
      }
      return updated;
    }));
  };

  const getQuestionsForSection = (sectionId) => {
    return questions.filter(q => q.sectionId === sectionId);
  };

  const getUnassignedQuestions = () => {
    return questions.filter(q => !q.sectionId);
  };

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
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [serverDepartments, setServerDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    adminAPI.getStudents({ limit: 'all' })
      .then(res => {
        const list = res.data?.students || res.data?.data?.students || (Array.isArray(res.data) ? res.data : []);
        setAllStudents(list);
        const depts = res.data?.departments || res.data?.data?.departments || [];
        setServerDepartments(depts);
      })
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

  const setQuickSchedule = (type) => {
    const now = new Date();
    let target = new Date();
    if (type === 'now') {
      target = new Date(now.getTime() + 60000); // 1 min from now
    } else if (type === '10m') {
      target = new Date(now.getTime() + 10 * 60000);
    } else if (type === '30m') {
      target = new Date(now.getTime() + 30 * 60000);
    } else if (type === '1h') {
      target = new Date(now.getTime() + 60 * 60000);
    } else if (type === 'tomorrow') {
      target = new Date(now.getTime() + 24 * 60 * 60000);
      target.setHours(10, 0, 0, 0);
    }
    setDetails(d => ({ ...d, dateTime: toDateTimeLocalValue(target) }));
    toast.success('Exam schedule updated');
  };

  const addQuestion = (type, sectionId = null) => {
    const section = sectionId ? sections.find(s => s.id === sectionId) : null;
    const base = {
      type,
      questionText: '',
      marks: type === 'mcq' ? 1 : (type === 'coding' ? 10 : 5),
      difficulty: 'medium',
      sectionId: sectionId || null,
      sectionName: section?.name || null
    };
    if (type === 'mcq') {
      base.options = [{id:'a',text:''},{id:'b',text:''},{id:'c',text:''},{id:'d',text:''}];
    } else if (type === 'coding') {
      base.testCases = [
        { input: '', output: '', explanation: '', is_hidden: false },
        { input: '', output: '', explanation: '', is_hidden: true }
      ];
      base.allowedLanguages = ['javascript', 'python', 'java', 'cpp'];
      base.timeLimit = 2000;
      base.memoryLimit = 256;
      base.executionFormat = 'stdin_stdout';
      base.inputFormat = '';
      base.outputFormat = '';
      base.constraints = '';
    }
    setQuestions(q => [...q, base]);
  };

  const updateQ = (idx, q) => setQuestions(qs => qs.map((old, i) => i === idx ? q : old));
  const removeQ = (idx) => setQuestions(qs => qs.filter((_, i) => i !== idx));

  // Canonical department mapping and grouping
  const canonicalDept = (dept) => {
    if (!dept || !dept.trim()) return '';
    const clean = dept.trim();
    const upper = clean.toUpperCase().replace(/\s+/g, '');
    if (upper === 'AIML' || upper === 'AI&ML' || upper === 'AIMML' || upper === 'AI/ML') return 'AIML';
    if (upper === 'CSE' || upper === 'COMPUTERSCIENCE') return 'CSE';
    if (upper === 'IT' || upper === 'INFORMATIONTECHNOLOGY') return 'IT';
    if (upper === 'ECE' || upper === 'ELECTRONICS') return 'ECE';
    if (upper === 'MECH' || upper === 'MECHANICAL') return 'Mechanical';
    if (upper === 'CIVIL') return 'Civil';
    return clean;
  };

  // Group counts per department
  const departmentCounts = React.useMemo(() => {
    const counts = {};
    allStudents.forEach(s => {
      const d = canonicalDept(s.department);
      if (d) {
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return counts;
  }, [allStudents]);

  const unassignedCount = React.useMemo(() => {
    return allStudents.filter(s => !canonicalDept(s.department)).length;
  }, [allStudents]);

  const availableDepartments = React.useMemo(() => {
    const set = new Set();
    Object.keys(departmentCounts).forEach(d => set.add(d));
    serverDepartments.forEach(d => {
      const c = canonicalDept(d);
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [departmentCounts, serverDepartments]);

  // Filter students based on selected department and search query
  const filteredStudents = allStudents.filter(s => {
    const studentDept = canonicalDept(s.department);

    // 1. Department filter
    if (selectedDepartment !== 'all') {
      if (selectedDepartment === 'Unassigned') {
        if (studentDept !== '') return false;
      } else {
        if (studentDept.toLowerCase() !== selectedDepartment.toLowerCase() && 
            (s.department || '').toLowerCase() !== selectedDepartment.toLowerCase()) {
          return false;
        }
      }
    }

    // 2. Search query filter
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.roll_no || '').toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q);
  });

  const toggleStudent = (id) => setSelectedStudents(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Filter-aware selection helpers
  const areAllFilteredSelected = filteredStudents.length > 0 && 
    filteredStudents.every(s => selectedStudents.includes(s.id));

  const selectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    setSelectedStudents(prev => {
      const set = new Set([...prev, ...filteredIds]);
      return Array.from(set);
    });
  };

  const deselectAllFiltered = () => {
    const filteredIdSet = new Set(filteredStudents.map(s => s.id));
    setSelectedStudents(prev => prev.filter(id => !filteredIdSet.has(id)));
  };

  const toggleFilteredAll = () => {
    if (areAllFilteredSelected) {
      deselectAllFiltered();
    } else {
      selectAllFiltered();
    }
  };

  // Specific department targeting helper: sets selection to ONLY students of this department
  const selectOnlyCurrentDepartment = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    setSelectedStudents(filteredIds);
    toast.success(`Selected ${filteredIds.length} candidate(s) specifically for ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}`);
  };

  const totalCalc = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

  const handleCreate = async () => {
    if (!details.name || !details.dateTime || !details.duration) return toast.error('Fill all required exam details');
    
    // Check for accidental far-future or past year typos (e.g. 2028 when current year is 2026)
    if (details.dateTime) {
      const selectedYear = new Date(details.dateTime).getFullYear();
      const currentYear = new Date().getFullYear();
      if (selectedYear > currentYear + 1) {
        const confirmed = window.confirm(`Notice: You have scheduled this exam for the year ${selectedYear} (${selectedYear - currentYear} year(s) in the future). Do you want to proceed?`);
        if (!confirmed) return;
      }
    }

    // Explicit AM/PM Past Time Safeguard
    if (details.dateTime) {
      const scheduledDate = new Date(details.dateTime);
      const now = new Date();
      if (scheduledDate < new Date(now.getTime() - 5 * 60000)) {
        const formattedScheduled = formatIST(details.dateTime, 'full');
        const formattedNow = formatIST(now, 'full');
        const confirmed = window.confirm(
          `⚠️ TIME CHECK WARNING:\n\n` +
          `The scheduled exam start time is in the PAST:\n` +
          `• Scheduled Time: ${formattedScheduled}\n` +
          `• Current Time:   ${formattedNow}\n\n` +
          `Did you accidentally choose AM instead of PM?\n` +
          `Exams scheduled in the past will immediately expire.\n\n` +
          `Click CANCEL to fix the time (e.g. switch AM to PM), or OK to proceed.`
        );
        if (!confirmed) return;
      }
    }

    setLoading(true);
    try {
      // Build sections payload if enabled
      const sectionsPayload = sectionsEnabled ? sections.map(s => ({
        id: s.id,
        name: s.name,
        marks: s.marks,
        timeLimit: s.timeLimit,
        questionCount: getQuestionsForSection(s.id).length
      })) : null;

      // Attach section info to each question
      const enrichedQuestions = questions.map(q => ({
        ...q,
        sectionId: sectionsEnabled ? (q.sectionId || null) : null,
        sectionName: sectionsEnabled ? (q.sectionName || null) : null
      }));

      await adminAPI.createExam({
        ...details,
        targetDepartment: details.targetDepartment || selectedDepartment,
        department: (details.targetDepartment && details.targetDepartment !== 'all')
          ? details.targetDepartment
          : (selectedDepartment !== 'all' ? selectedDepartment : null),
        dateTime: toISTISOString(details.dateTime),
        status: 'published',
        totalMarks: totalCalc || parseInt(details.totalMarks),
        passingMarks: parseInt(details.passingMarks),
        duration: parseInt(details.duration),
        questions: enrichedQuestions,
        sections: sectionsPayload,
        studentIds: selectedStudents,
        monitoringConfig: details.monitoringConfig,
        monitoring_config: details.monitoringConfig,
      });
      toast.success('Exam created and published successfully!');
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
                  <Input 
                    label="Target Department" 
                    as="select" 
                    icon={Building}
                    value={details.targetDepartment || 'all'} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setDetails(d => ({ ...d, targetDepartment: val }));
                      setSelectedDepartment(val);
                    }} 
                  >
                    <option value="all">Campus-Wide (All Departments)</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept} Department</option>
                    ))}
                    {unassignedCount > 0 && (
                      <option value="Unassigned">Unassigned Department</option>
                    )}
                  </Input>
                </div>
                <div className="admin-form-row">
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <Input 
                      label="Date & Time (IST)" 
                      required 
                      type="datetime-local" 
                      icon={Calendar}
                      value={details.dateTime} 
                      onChange={setD('dateTime')} 
                      min={toDateTimeLocalValue(new Date(Date.now() - 3600000))}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: -8, marginBottom: 10 }}>
                      <span style={{ fontSize: '0.73rem', color: '#64748b', alignSelf: 'center', fontWeight: 600 }}>Quick:</span>
                      <button type="button" onClick={() => setQuickSchedule('now')} style={{ padding: '3px 8px', fontSize: '0.73rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Live (Now)</button>
                      <button type="button" onClick={() => setQuickSchedule('10m')} style={{ padding: '3px 8px', fontSize: '0.73rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+10 Mins</button>
                      <button type="button" onClick={() => setQuickSchedule('30m')} style={{ padding: '3px 8px', fontSize: '0.73rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+30 Mins</button>
                      <button type="button" onClick={() => setQuickSchedule('1h')} style={{ padding: '3px 8px', fontSize: '0.73rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+1 Hour</button>
                      <button type="button" onClick={() => setQuickSchedule('tomorrow')} style={{ padding: '3px 8px', fontSize: '0.73rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Tomorrow 10 AM</button>
                    </div>
                    {details.dateTime && (
                      <div style={{ fontSize: '0.76rem', color: '#0369a1', background: '#f0f9ff', padding: '5px 8px', borderRadius: 6, marginBottom: 12, border: '1px solid #bae6fd' }}>
                        📅 <strong>Scheduled:</strong> {formatIST(details.dateTime, 'full')}
                      </div>
                    )}
                    {details.dateTime && new Date(details.dateTime) < new Date(Date.now() - 5 * 60000) && (
                      <div style={{ fontSize: '0.78rem', color: '#b91c1c', background: '#fef2f2', padding: '8px 12px', borderRadius: 6, marginBottom: 12, border: '1px solid #f87171', fontWeight: 600 }}>
                        🚨 <strong>Warning: Selected time is in the PAST!</strong><br />
                        Did you select AM instead of PM? This exam will immediately expire upon creation unless you set a future time.
                      </div>
                    )}
                    {details.dateTime && new Date(details.dateTime).getFullYear() > new Date().getFullYear() + 1 && (
                      <div style={{ fontSize: '0.76rem', color: '#b91c1c', background: '#fef2f2', padding: '6px 8px', borderRadius: 6, marginBottom: 12, border: '1px solid #fecaca', fontWeight: 600 }}>
                        ⚠️ Warning: Year {new Date(details.dateTime).getFullYear()} is {new Date(details.dateTime).getFullYear() - new Date().getFullYear()} year(s) in the future! Please check if this is intended.
                      </div>
                    )}
                  </div>
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

                {/* ── Multi-Section Builder ── */}
                <div className="admin-sections-toggle">
                  <div className="admin-checkbox-group" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      id="sections-enabled"
                      checked={sectionsEnabled}
                      onChange={() => setSectionsEnabled(v => !v)}
                      className="admin-checkbox"
                    />
                    <label htmlFor="sections-enabled" className="admin-checkbox-label" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                      <LayoutGrid size={18} color="#7c3aed" />
                      Enable Multi-Section Exam
                    </label>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 32 }}>
                    Organize your exam into sections, each with its own time limit and marks allocation.
                  </span>
                </div>

                {sectionsEnabled && (
                  <div className="admin-sections-builder">
                    <div className="admin-sections-builder-header">
                      <div>
                        <div className="admin-sections-builder-title">
                          <LayoutGrid size={18} color="#7c3aed" />
                          <span>Exam Sections</span>
                        </div>
                        <div className="admin-sections-builder-subtitle">
                          Define your sections below. Questions will be assigned to these sections in the next step.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="admin-section-add-btn"
                        onClick={addSection}
                      >
                        <Plus size={15} /> Add Section
                      </button>
                    </div>

                    <div className="admin-sections-list">
                      {sections.map((sec, idx) => (
                        <div key={sec.id} className="admin-section-card">
                          <div className="admin-section-card-header">
                            <span className="admin-section-badge">{String.fromCharCode(65 + idx)}</span>
                            <input
                              type="text"
                              value={sec.name}
                              onChange={e => updateSection(idx, 'name', e.target.value)}
                              className="admin-section-name-input"
                              placeholder="Section Name"
                            />
                            {sections.length > 1 && (
                              <button
                                type="button"
                                className="admin-section-remove-btn"
                                onClick={() => removeSection(idx)}
                                title="Remove section"
                              >
                                <Minus size={14} />
                              </button>
                            )}
                          </div>
                          <div className="admin-section-card-fields">
                            <div className="admin-section-field">
                              <label><Award size={13} /> Marks</label>
                              <input
                                type="number"
                                value={sec.marks}
                                onChange={e => updateSection(idx, 'marks', e.target.value)}
                                min={1}
                                className="admin-section-field-input"
                              />
                            </div>
                            <div className="admin-section-field">
                              <label><Clock size={13} /> Time (mins)</label>
                              <input
                                type="number"
                                value={sec.timeLimit}
                                onChange={e => updateSection(idx, 'timeLimit', e.target.value)}
                                min={1}
                                className="admin-section-field-input"
                              />
                            </div>
                            <div className="admin-section-field">
                              <label><FileText size={13} /> Questions</label>
                              <span className="admin-section-q-count">{getQuestionsForSection(sec.id).length}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="admin-sections-summary">
                      <span>Total: <strong>{sections.reduce((s, sec) => s + sec.marks, 0)} Marks</strong></span>
                      <span style={{ margin: '0 12px', color: '#cbd5e1' }}>·</span>
                      <span><strong>{sections.reduce((s, sec) => s + sec.timeLimit, 0)} Mins</strong> combined</span>
                      <span style={{ margin: '0 12px', color: '#cbd5e1' }}>·</span>
                      <span><strong>{sections.length}</strong> Sections</span>
                    </div>
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
                    {sectionsEnabled && (
                      <span style={{ color: '#7c3aed', fontWeight: 700, marginLeft: 8 }}>
                        ({sections.length} Sections)
                      </span>
                    )}
                  </p>
                </div>
                {!sectionsEnabled && (
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
                )}
              </div>

              {/* ── Section-Aware Question Builder ── */}
              {sectionsEnabled ? (
                <div className="admin-sections-questions">
                  {sections.map((sec, secIdx) => {
                    const secQuestions = getQuestionsForSection(sec.id);
                    return (
                      <div key={sec.id} className="admin-section-question-group">
                        <div className="admin-section-question-group-header">
                          <div className="admin-section-question-group-info">
                            <span className="admin-section-badge-sm">{String.fromCharCode(65 + secIdx)}</span>
                            <span className="admin-section-question-group-name">{sec.name}</span>
                            <span className="admin-section-question-group-meta">
                              {secQuestions.length} Qs · {sec.marks} Marks · {sec.timeLimit} min
                            </span>
                          </div>
                          <div className="admin-questions-actions">
                            {(details.type === 'mcq' || details.type === 'mixed') && (
                              <button type="button" className="admin-section-add-q-btn" onClick={() => addQuestion('mcq', sec.id)}>
                                <HelpCircle size={13} /> + MCQ
                              </button>
                            )}
                            {(details.type === 'subjective' || details.type === 'mixed') && (
                              <button type="button" className="admin-section-add-q-btn" onClick={() => addQuestion('subjective', sec.id)}>
                                <Edit3 size={13} /> + Subjective
                              </button>
                            )}
                            {(details.type === 'coding' || details.type === 'mixed') && (
                              <button type="button" className="admin-section-add-q-btn" onClick={() => addQuestion('coding', sec.id)}>
                                <Code size={13} /> + Coding
                              </button>
                            )}
                          </div>
                        </div>

                        {secQuestions.length === 0 ? (
                          <div className="admin-section-empty-qs">
                            <FileText size={28} color="#cbd5e1" />
                            <span>No questions in this section yet. Use the buttons above to add.</span>
                          </div>
                        ) : (
                          <div className="admin-questions-list">
                            {secQuestions.map((q) => {
                              const globalIdx = questions.findIndex(gq => gq === q);
                              return q.type === 'mcq' ? (
                                <MCQQuestionForm key={globalIdx} q={q} idx={globalIdx} onChange={updateQ} onRemove={removeQ} />
                              ) : q.type === 'coding' ? (
                                <CodingQuestionForm key={globalIdx} q={q} idx={globalIdx} onChange={updateQ} onRemove={removeQ} />
                              ) : (
                                <SubjectiveForm key={globalIdx} q={q} idx={globalIdx} onChange={updateQ} onRemove={removeQ} />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Unassigned questions */}
                  {getUnassignedQuestions().length > 0 && (
                    <div className="admin-section-question-group unassigned">
                      <div className="admin-section-question-group-header">
                        <div className="admin-section-question-group-info">
                          <span className="admin-section-badge-sm" style={{ background: '#fbbf24', color: '#78350f' }}>!</span>
                          <span className="admin-section-question-group-name">Unassigned Questions</span>
                          <span className="admin-section-question-group-meta">
                            {getUnassignedQuestions().length} Qs — assign these to a section
                          </span>
                        </div>
                      </div>
                      <div className="admin-questions-list">
                        {getUnassignedQuestions().map((q) => {
                          const globalIdx = questions.findIndex(gq => gq === q);
                          return (
                            <div key={globalIdx} className="admin-unassigned-q-wrap">
                              <div className="admin-unassigned-q-assign">
                                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Move to:</label>
                                <select
                                  value=""
                                  onChange={e => {
                                    const targetSec = sections.find(s => s.id === e.target.value);
                                    if (targetSec) {
                                      updateQ(globalIdx, { ...q, sectionId: targetSec.id, sectionName: targetSec.name });
                                    }
                                  }}
                                  className="admin-section-field-input"
                                  style={{ width: 140, fontSize: '0.78rem' }}
                                >
                                  <option value="">Select section</option>
                                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                              </div>
                              {q.type === 'mcq' ? (
                                <MCQQuestionForm q={q} idx={globalIdx} onChange={updateQ} onRemove={removeQ} />
                              ) : q.type === 'coding' ? (
                                <CodingQuestionForm q={q} idx={globalIdx} onChange={updateQ} onRemove={removeQ} />
                              ) : (
                                <SubjectiveForm q={q} idx={globalIdx} onChange={updateQ} onRemove={removeQ} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-sectioned question list (original) */
                <>
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
                </>
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
                    {selectedDepartment !== 'all' && (
                      <span className="admin-students-dept-filter-badge">
                        · Dept: <strong>{selectedDepartment}</strong> ({filteredStudents.filter(s => selectedStudents.includes(s.id)).length}/{filteredStudents.length} selected)
                      </span>
                    )}
                    {selectedStudents.length > 0 && (
                      <span style={{ color: '#10b981', fontWeight: 700 }}>
                        ({Math.round((selectedStudents.length / (allStudents.length || 1)) * 100)}% enrolled)
                      </span>
                    )}
                  </p>
                </div>

                <div className="admin-students-header-actions">
                  {selectedDepartment !== 'all' && filteredStudents.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={selectOnlyCurrentDepartment}
                      className="admin-select-dept-only-btn"
                      title={`Assign ONLY ${selectedDepartment} students to this test`}
                      icon={Target}
                    >
                      Only {selectedDepartment} ({filteredStudents.length})
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    onClick={toggleFilteredAll}
                    className="admin-select-all-btn"
                  >
                    {areAllFilteredSelected 
                      ? (selectedDepartment === 'all' ? 'Deselect All' : `Deselect ${selectedDepartment}`) 
                      : (selectedDepartment === 'all' ? 'Select All' : `Select All in ${selectedDepartment}`)}
                  </Button>
                </div>
              </div>

              {/* Department Quick Filter Tabs / Pills */}
              <div className="admin-dept-filter-bar">
                <div className="admin-dept-filter-heading">
                  <Building size={15} />
                  <span>Filter by Department:</span>
                </div>
                <div className="admin-dept-pills-row">
                  <button
                    type="button"
                    className={`admin-dept-filter-pill ${selectedDepartment === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedDepartment('all')}
                  >
                    <span>All Departments</span>
                    <span className="admin-dept-pill-count">{allStudents.length}</span>
                  </button>

                  {availableDepartments.map(dept => {
                    const count = departmentCounts[dept] || 0;
                    const selectedCountInDept = allStudents.filter(s => canonicalDept(s.department) === dept && selectedStudents.includes(s.id)).length;
                    return (
                      <button
                        key={dept}
                        type="button"
                        className={`admin-dept-filter-pill ${selectedDepartment === dept ? 'active' : ''}`}
                        onClick={() => setSelectedDepartment(dept)}
                      >
                        <span>{dept}</span>
                        <span className="admin-dept-pill-count">{count}</span>
                        {selectedCountInDept > 0 && (
                          <span className="admin-dept-pill-checked-dot" title={`${selectedCountInDept} selected`} />
                        )}
                      </button>
                    );
                  })}

                  {unassignedCount > 0 && (
                    <button
                      type="button"
                      className={`admin-dept-filter-pill ${selectedDepartment === 'Unassigned' ? 'active' : ''}`}
                      onClick={() => setSelectedDepartment('Unassigned')}
                    >
                      <span>Unassigned</span>
                      <span className="admin-dept-pill-count">{unassignedCount}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Candidate Search Bar & Quick Dropdown */}
              <div className="admin-students-toolbar">
                <div className="admin-dept-select-wrap">
                  <Building size={16} className="admin-dept-select-icon" />
                  <select 
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="admin-dept-select-dropdown"
                    aria-label="Department Filter"
                  >
                    <option value="all">All Departments ({allStudents.length})</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept} ({departmentCounts[dept] || 0})
                      </option>
                    ))}
                    {unassignedCount > 0 && (
                      <option value="Unassigned">Unassigned ({unassignedCount})</option>
                    )}
                  </select>
                </div>

                <div className="admin-student-search-box">
                  <Search size={16} className="admin-student-search-icon" />
                  <input 
                    type="text"
                    placeholder={`Search candidate in ${selectedDepartment === 'all' ? 'all departments' : selectedDepartment}...`}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="admin-student-search-input"
                  />
                  {studentSearch && (
                    <button 
                      type="button" 
                      onClick={() => setStudentSearch('')} 
                      className="admin-search-clear-btn"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Department Active Filter Banner */}
              {selectedDepartment !== 'all' && (
                <div className="admin-dept-active-banner">
                  <div className="admin-dept-active-text">
                    <Building size={16} color="#0284c7" />
                    <span>
                      Filtering for <strong>{selectedDepartment} Department</strong> ({filteredStudents.length} candidate{filteredStudents.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="admin-dept-active-actions">
                    <button 
                      type="button" 
                      className="admin-dept-banner-btn"
                      onClick={selectOnlyCurrentDepartment}
                    >
                      🎯 Conduct Test for {selectedDepartment} Only
                    </button>
                    <button 
                      type="button" 
                      className="admin-dept-banner-link"
                      onClick={() => setSelectedDepartment('all')}
                    >
                      Show All Departments
                    </button>
                  </div>
                </div>
              )}
              
              <div className="admin-students-list">
                {filteredStudents.length === 0 ? (
                  <div className="admin-students-empty-state">
                    <div className="admin-empty-icon"><Building size={36} color="#94a3b8" /></div>
                    <p className="admin-empty-title">
                      No candidates found {selectedDepartment !== 'all' ? `in "${selectedDepartment}" department` : ''}
                      {studentSearch ? ` matching "${studentSearch}"` : ''}
                    </p>
                    <div className="admin-empty-actions">
                      {studentSearch && (
                        <button type="button" onClick={() => setStudentSearch('')} className="admin-empty-action-btn">
                          Clear Search
                        </button>
                      )}
                      {selectedDepartment !== 'all' && (
                        <button type="button" onClick={() => setSelectedDepartment('all')} className="admin-empty-action-btn primary">
                          View All Departments
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredStudents.map(s => {
                    const isSelected = selectedStudents.includes(s.id);
                    const initials = (s.name || 'ST').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    const dept = canonicalDept(s.department) || 'Unassigned';
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
                          <div className="admin-student-name-row">
                            <span className="admin-student-name" title={s.name}>{s.name}</span>
                            <span className={`admin-student-dept-tag ${dept === 'Unassigned' ? 'unassigned' : ''}`}>
                              <Building size={10} />
                              {dept}
                            </span>
                          </div>
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
                    {details.subject ? `Subject: ${details.subject}` : 'Enterprise Assessment'} · 
                    {selectedDepartment !== 'all' ? ` Target: ${selectedDepartment} Department` : ' Campus-Wide Examination'}
                  </div>
                </div>
                <div className="admin-review-hero-badges">
                  <span className="admin-review-pill type">{details.type} MODE</span>
                  {selectedDepartment !== 'all' && (
                    <span className="admin-review-pill dept">
                      <Building size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      {selectedDepartment} DEPT
                    </span>
                  )}
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
                  ['Target Department', selectedDepartment !== 'all' ? `${selectedDepartment} Department` : (details.targetDepartment && details.targetDepartment !== 'all' ? `${details.targetDepartment} Department` : 'Campus-Wide (All Departments)'), Building],
                  ['Date & Time (IST)', details.dateTime ? formatIST(details.dateTime, 'full') : 'Not set', Calendar],
                  ['Duration', `${details.duration} Minutes`, Clock],
                  ['Total Marks', `${totalCalc || details.totalMarks} Marks`, Award],
                  ['Passing Score', `${details.passingMarks} Marks`, CheckCircle],
                  ['Questions Configured', `${questions.length} Questions`, HelpCircle],
                  ['Candidates Enrolled', `${selectedStudents.length} Students ${selectedDepartment !== 'all' ? `(${selectedDepartment})` : ''}`, Users],
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

              {/* Section Breakdown in Review */}
              {sectionsEnabled && sections.length > 0 && (
                <div className="admin-review-sections-card">
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LayoutGrid size={16} color="#7c3aed" />
                    <span>Exam Section Breakdown</span>
                  </div>
                  <div className="admin-review-sections-grid">
                    {sections.map((sec, idx) => {
                      const secQs = getQuestionsForSection(sec.id);
                      return (
                        <div key={sec.id} className="admin-review-section-item">
                          <div className="admin-review-section-badge">{String.fromCharCode(65 + idx)}</div>
                          <div className="admin-review-section-details">
                            <div className="admin-review-section-name">{sec.name}</div>
                            <div className="admin-review-section-stats">
                              <span>{secQs.length} Questions</span>
                              <span>{sec.marks} Marks</span>
                              <span>{sec.timeLimit} Min</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    Combined: {sections.reduce((s, sec) => s + sec.marks, 0)} Marks · {sections.reduce((s, sec) => s + sec.timeLimit, 0)} Minutes · {questions.length} Total Questions
                  </div>
                </div>
              )}

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
