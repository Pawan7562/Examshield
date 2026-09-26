// src/pages/student/ExamList.js — Professional Examination Schedule & Catalog
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { formatIST, isExamStartable } from '../../utils/timezone';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  Play,
  FileText,
  Search,
  KeyRound,
  Shield,
  Copy,
  Award,
  CheckCircle2
} from 'lucide-react';
import './ExamList.css';

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'live' | 'upcoming' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI.getExams()
      .then(r => setExams(r.data?.exams || []))
      .catch(err => console.error('Error loading examinations:', err))
      .finally(() => setLoading(false));
  }, []);

  // Determine whether an exam is startable right now in IST
  const isStartable = (exam) => {
    return isExamStartable(exam);
  };

  const copyKey = (e, key) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    toast.success(`Copied key "${key}" to clipboard!`);
  };

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const isSubmitted = exam.session_status === 'submitted' || exam.session_status === 'terminated';
      const startable = isStartable(exam);

      // Category filter
      if (filter === 'live' && !startable) return false;
      if (filter === 'upcoming' && (startable || isSubmitted || exam.status === 'completed')) return false;
      if (filter === 'completed' && !isSubmitted && exam.status !== 'completed') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (exam.title || exam.name || '').toLowerCase().includes(q);
        const subjectMatch = (exam.subject || '').toLowerCase().includes(q);
        const codeMatch = (exam.exam_code || exam.exam_key || '').toLowerCase().includes(q);
        if (!titleMatch && !subjectMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [exams, filter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    const live = exams.filter(e => isStartable(e)).length;
    const completed = exams.filter(e => e.session_status === 'submitted' || e.status === 'completed').length;
    return { total: exams.length, live, completed };
  }, [exams]);

  if (loading) {
    return (
      <div className="el-container">
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0a74da',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ fontWeight: 600 }}>Loading Assigned Examinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="el-container">
      {/* ── Header Banner ── */}
      <div className="el-header-banner">
        <div className="el-header-left">
          <h1>My Assigned Examinations</h1>
          <p>View your scheduled institutional assessments, access keys, and proctoring requirements.</p>
        </div>

        <div className="el-stats-pills">
          <div className="el-stat-chip">
            <span>Total Enrolled:</span>
            <span className="el-stat-num">{counts.total}</span>
          </div>
          <div className="el-stat-chip" style={{ background: counts.live > 0 ? '#fef2f2' : undefined, borderColor: counts.live > 0 ? '#fecaca' : undefined }}>
            <span style={{ color: counts.live > 0 ? '#dc2626' : undefined }}>Live Now:</span>
            <span className="el-stat-num" style={{ color: counts.live > 0 ? '#dc2626' : undefined }}>{counts.live}</span>
          </div>
          <div className="el-stat-chip">
            <span>Completed:</span>
            <span className="el-stat-num" style={{ color: '#10b981' }}>{counts.completed}</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="el-controls-bar">
        <div className="el-search-input-wrap">
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by title, subject, or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="el-filter-tabs">
          <button
            onClick={() => setFilter('all')}
            className={`el-filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            All ({counts.total})
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`el-filter-btn ${filter === 'live' ? 'active' : ''}`}
          >
            Live Today ({counts.live})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`el-filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          >
            Upcoming Schedule
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`el-filter-btn ${filter === 'completed' ? 'active' : ''}`}
          >
            Completed ({counts.completed})
          </button>
        </div>
      </div>

      {/* ── Examinations Cards Grid ── */}
      {filteredExams.length === 0 ? (
        <div className="el-empty-box">
          <div className="el-empty-icon">
            <FileText size={30} />
          </div>
          <h3>No Examinations Match Your Filter</h3>
          <p>
            {searchQuery
              ? `No assessments found matching "${searchQuery}".`
              : 'There are no assessments in this category at this moment.'}
          </p>
        </div>
      ) : (
        <div className="el-cards-grid">
          {filteredExams.map(exam => {
            const startable = isStartable(exam);
            const isCompleted = exam.session_status === 'submitted' || exam.status === 'completed';
            const examCode = exam.exam_code || exam.exam_key;

            return (
              <div key={exam.id} className="el-card">
                <div>
                  <div className="el-card-top-bar">
                    <span className="el-subject-pill">
                      {exam.subject || 'General Academic'}
                    </span>

                    {startable ? (
                      <span className="el-status-pill status-live">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                        Live Now
                      </span>
                    ) : isCompleted ? (
                      <span className="el-status-pill status-completed">
                        Completed
                      </span>
                    ) : (
                      <span className="el-status-pill status-upcoming">
                        Scheduled
                      </span>
                    )}
                  </div>

                  <h2 className="el-card-title">
                    {exam.title || exam.name || 'Assessment'}
                  </h2>

                  {examCode && (
                    <div
                      className="el-key-chip"
                      onClick={(e) => copyKey(e, examCode)}
                      title="Click to copy access key"
                    >
                      <KeyRound size={13} />
                      <span>Key: {examCode}</span>
                      <Copy size={11} style={{ marginLeft: 2 }} />
                    </div>
                  )}

                  <div className="el-card-meta-grid">
                    <div className="el-meta-item">
                      <Calendar size={14} />
                      <span>{exam.date_time ? formatIST(exam.date_time, 'full') : 'Flexible Window'}</span>
                    </div>
                    <div className="el-meta-item">
                      <Clock size={14} />
                      <span>{exam.duration || 60} Minutes</span>
                    </div>
                    <div className="el-meta-item">
                      <Award size={14} />
                      <span>{exam.total_marks || 100} Total Marks</span>
                    </div>
                    <div className="el-meta-item">
                      <CheckCircle2 size={14} />
                      <span>Pass: {exam.passing_marks || 40} Marks</span>
                    </div>
                  </div>
                </div>

                <div className="el-card-footer">
                  <div className="el-proctor-notice">
                    <Shield size={14} />
                    <span>AI Proctoring Secured</span>
                  </div>

                  {startable ? (
                    <button
                      onClick={() => navigate(`/student/exams/${exam.id}`)}
                      className="el-btn-launch"
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Launch Room</span>
                    </button>
                  ) : isCompleted ? (
                    <button
                      onClick={() => navigate('/student/results')}
                      className="el-btn-secondary"
                    >
                      <span>View Transcript</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/student/exams/${exam.id}`)}
                      className="el-btn-secondary"
                    >
                      <span>Instructions & Room</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
