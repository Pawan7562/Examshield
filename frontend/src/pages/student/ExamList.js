// src/pages/student/ExamList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Filter,
  Play,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import '../../components/student/StudentSidebar.css';

const statusConfig = {
  published: { label: 'UPCOMING', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
  active: { label: 'LIVE NOW', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
  completed: { label: 'ENDED', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' },
};

const sessionConfig = {
  submitted: { label: 'SUBMITTED', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
  terminated: { label: 'TERMINATED', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
  active: { label: 'IN PROGRESS', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
};

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI.getExams().then(r => setExams(r.data.exams || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(e => {
    if (filter === 'upcoming') return e.status === 'published' && !e.session_status;
    if (filter === 'completed') return e.session_status === 'submitted' || e.session_status === 'terminated';
    return true;
  });

  const canStart = (exam) => {
    if (exam.session_status === 'submitted' || exam.session_status === 'terminated') return false;
    if (exam.status === 'completed') return false;
    const now = new Date();
    const start = new Date(exam.date_time);
    const end = new Date(start.getTime() + exam.duration * 60000);
    return now >= new Date(start.getTime() - 15 * 60000) && now <= end;
  };

  const getStatus = (exam) => {
    if (exam.session_status) return sessionConfig[exam.session_status] || { label: exam.session_status.toUpperCase(), color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' };
    return statusConfig[exam.status] || { label: exam.status.toUpperCase(), color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' };
  };

  if (loading) {
    return (
      <div className="student-pages-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your exams...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="content-card">
        <div className="card-header">
          <h1>My Exams</h1>
          <div className="header-actions">
            <Filter size={20} />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              <option value="all">All Exams</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content-card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={48} />
            </div>
            <h3>No Exams Found</h3>
            <p>
              {filter === 'upcoming' ? 'You don\'t have any upcoming exams at the moment.' :
               filter === 'completed' ? 'You haven\'t completed any exams yet.' :
               'No exams are currently assigned to you.'}
            </p>
          </div>
        ) : (
          <div className="exam-list">
            {filtered.map(exam => {
              const st = getStatus(exam);
              const startable = canStart(exam);
              return (
                <div key={exam.id} className="list-item">
                  <div className="exam-content">
                    <div className="exam-header">
                      <div className="exam-title-section">
                        <h3 className="list-item-title">{exam.name}</h3>
                        <span className={`status-badge status-${exam.status}`}>
                          {st.label}
                        </span>
                      </div>
                      
                      {startable && (
                        <button 
                          onClick={() => navigate(`/student/exam/${exam.id}`)}
                          className="btn btn-success"
                        >
                          <Play size={16} />
                          Start Exam
                        </button>
                      )}
                      
                      {exam.session_status === 'active' && (
                        <button 
                          onClick={() => navigate(`/student/exam/${exam.id}`)}
                          className="btn btn-secondary"
                        >
                          <Play size={16} />
                          Resume
                        </button>
                      )}
                    </div>

                    <div className="exam-details">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <Calendar size={16} />
                          <span>{format(new Date(exam.date_time), 'dd MMM yyyy, HH:mm')}</span>
                        </div>
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{exam.duration} minutes</span>
                        </div>
                        <div className="detail-item">
                          <BookOpen size={16} />
                          <span>{exam.subject}</span>
                        </div>
                        <div className="detail-item">
                          <FileText size={16} />
                          <span>{exam.total_marks} marks</span>
                        </div>
                      </div>
                    </div>

                    {exam.result_status && exam.result_status !== 'pending' && (
                      <div className="result-section">
                        <div className="result-badge">
                          {exam.result_status === 'pass' ? (
                            <>
                              <CheckCircle size={16} />
                              <span>PASSED</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} />
                              <span>FAILED</span>
                            </>
                          )}
                        </div>
                        <div className="score-display">
                          <span className="score-value">{exam.marks_obtained}</span>
                          <span className="score-label">/ {exam.total_marks}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
