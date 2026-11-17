// src/pages/student/ExamList.js — Executive Examination Schedule & Catalog (v6)
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { formatIST, isExamStartable, isExamEnded } from '../../utils/timezone';
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
  CheckCircle2,
  X,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import './ExamList.css';

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'live' | 'upcoming' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [directKey, setDirectKey] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI.getExams()
      .then(r => setExams(r.data?.exams || []))
      .catch(err => {
        console.error('Error loading examinations:', err);
        toast.error('Unable to fetch assessments catalog');
      })
      .finally(() => setLoading(false));
  }, []);

  // Determine whether an exam is startable right now in IST (never true if expired)
  const isStartable = (exam) => {
    return isExamStartable(exam) && !isExamEnded(exam);
  };

  const isCompletedExam = (exam) => {
    if (exam.date_time) {
      return isExamEnded(exam) || exam.session_status === 'submitted' || exam.session_status === 'terminated';
    }
    return isExamEnded(exam) || exam.session_status === 'submitted' || exam.status === 'completed';
  };

  const copyKey = (e, key) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    toast.success(`Copied key "${key}" to clipboard!`);
  };

  const handleDirectKeySubmit = (e) => {
    e.preventDefault();
    const clean = directKey.trim();
    if (!clean) {
      toast.error('Please enter an examination access key');
      return;
    }
    navigate(`/student/exams/${clean}`);
  };

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const completed = isCompletedExam(exam);
      const startable = isStartable(exam);
      const isUpcoming = !completed && !startable;

      // Category filter
      if (filter === 'live' && !startable) return false;
      if (filter === 'upcoming' && !isUpcoming) return false;
      if (filter === 'completed' && !completed) return false;

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

  // Dynamic counts
  const counts = useMemo(() => {
    const live = exams.filter(e => isStartable(e)).length;
    const completed = exams.filter(e => isCompletedExam(e)).length;
    const upcoming = exams.filter(e => !isCompletedExam(e) && !isStartable(e)).length;
    return { total: exams.length, live, completed, upcoming };
  }, [exams]);

  if (loading) {
    return (
      <div className="el-container">
        <div className="el-loading-wrap">
          <div className="el-spinner" />
          <p className="el-loading-text">Synchronizing Assessment Catalog & Access Tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="el-container">
      {/* ── 1. Editorial Header Banner ── */}
      <div className="el-header-banner">
        <div className="el-header-left">
          <div className="el-eyebrow">
            <span className="el-eyebrow-dot" />
            Institutional Examination Center
          </div>
          <h1>My Assigned Assessments</h1>
          <p>
            Official institutional examination roster, proctoring integrity guidelines, and real-time room dispatch.
          </p>
        </div>

        <div className="el-stats-pills">
          <div className="el-stat-chip">
            <span className="el-stat-label">Enrolled:</span>
            <span className="el-stat-num">{counts.total}</span>
          </div>

          <div className={`el-stat-chip ${counts.live > 0 ? 'live-active' : ''}`}>
            {counts.live > 0 && <span className="el-live-ping" />}
            <span className="el-stat-label">Live Now:</span>
            <span className="el-stat-num">{counts.live}</span>
          </div>

          <div className="el-stat-chip">
            <span className="el-stat-label">Completed:</span>
            <span className="el-stat-num" style={{ color: '#10b981' }}>{counts.completed}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Search, Filter & Quick Key Launch Bar ── */}
      <div className="el-controls-bar">
        <div className="el-controls-left">
          <div className="el-search-input-wrap">
            <Search size={18} color="var(--el-text-muted)" />
            <input
              type="text"
              placeholder="Search by title, subject, or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="el-search-clear" 
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="el-filter-tabs">
            <button
              onClick={() => setFilter('all')}
              className={`el-filter-btn ${filter === 'all' ? 'active' : ''}`}
            >
              All Assessments <span className="el-tab-count">{counts.total}</span>
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`el-filter-btn ${filter === 'live' ? 'active' : ''}`}
            >
              Live Today <span className="el-tab-count">{counts.live}</span>
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`el-filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
            >
              Upcoming <span className="el-tab-count">{counts.upcoming}</span>
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`el-filter-btn ${filter === 'completed' ? 'active' : ''}`}
            >
              Completed <span className="el-tab-count">{counts.completed}</span>
            </button>
          </div>
        </div>

        {/* Quick Launch by Key */}
        <form onSubmit={handleDirectKeySubmit} className="el-key-launcher-form">
          <input
            type="text"
            className="el-key-input-inline"
            placeholder="ENTER EXAM KEY"
            value={directKey}
            onChange={(e) => setDirectKey(e.target.value)}
          />
          <button type="submit" className="el-key-btn-join">
            <span>Join</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>

      {/* ── 3. Examination Cards Grid ── */}
      {filteredExams.length === 0 ? (
        <div className="el-empty-box">
          <div className="el-empty-icon">
            <FileText size={28} />
          </div>
          <h3>No Assessments Match Your Filter</h3>
          <p>
            {searchQuery
              ? `No assessments found matching "${searchQuery}". Please check your search query or reset your filters.`
              : 'There are no assigned assessments found under this filter at the moment.'}
          </p>
          {(searchQuery || filter !== 'all') && (
            <button
              className="el-empty-reset-btn"
              onClick={() => {
                setSearchQuery('');
                setFilter('all');
              }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="el-cards-grid">
          {filteredExams.map(exam => {
            const startable = isStartable(exam);
            const isCompleted = isCompletedExam(exam);
            const examCode = exam.exam_code || exam.exam_key;

            return (
              <div 
                key={exam.id} 
                className={`el-card ${startable ? 'is-live-card' : ''}`}
              >
                <div>
                  <div className="el-card-top-bar">
                    <span className="el-subject-pill">
                      {exam.subject || 'General Academic'}
                    </span>

                    {startable ? (
                      <span className="el-status-pill status-live">
                        <span className="el-live-ping" />
                        Live Now
                      </span>
                    ) : isCompleted ? (
                      <span className="el-status-pill status-completed">
                        <CheckCircle2 size={12} />
                        {exam.session_status === 'submitted' ? 'Completed' : 'Ended'}
                      </span>
                    ) : (
                      <span className="el-status-pill status-upcoming">
                        <Clock size={12} />
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
                      <Copy size={12} style={{ marginLeft: 2 }} />
                    </div>
                  )}

                  {(() => {
                    const totalMarks = exam.total_marks || 100;
                    const rawPass = exam.passing_marks;
                    let passMarks;
                    if (rawPass !== undefined && rawPass !== null && !isNaN(rawPass) && Number(rawPass) > 0) {
                      const num = Number(rawPass);
                      if (num <= totalMarks) {
                        passMarks = num;
                      } else if (num <= 100) {
                        passMarks = Math.round((totalMarks * num) / 100);
                      } else {
                        passMarks = Math.round(totalMarks * 0.4);
                      }
                    } else {
                      passMarks = Math.round(totalMarks * 0.4);
                    }

                    return (
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
                          <span>{totalMarks} Total Marks</span>
                        </div>
                        <div className="el-meta-item">
                          <CheckCircle2 size={14} />
                          <span>Pass: {passMarks} Marks</span>
                        </div>
                      </div>
                    );
                  })()}
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
                      onClick={() => navigate(exam.session_status === 'submitted' ? '/student/results' : `/student/exams/${exam.id}`)}
                      className="el-btn-secondary"
                    >
                      <span>{exam.session_status === 'submitted' ? 'View Transcript' : 'Exam Ended'}</span>
                      <ExternalLink size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/student/exams/${exam.id}`)}
                      className="el-btn-secondary"
                    >
                      <span>Instructions & Room</span>
                      <ArrowRight size={13} />
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
