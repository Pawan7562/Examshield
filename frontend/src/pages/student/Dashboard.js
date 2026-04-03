// src/pages/student/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Clock,
  Target,
  Award,
  Activity,
  ArrowRight,
  User,
  BarChart3
} from 'lucide-react';
import '../../components/student/StudentSidebar.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          studentAPI.getExams(),
          studentAPI.getResults()
        ]);
        setExams(examsRes.data.exams || []);
        setResults(resultsRes.data.results || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcoming = exams.filter(e => e.status === 'published' && !e.session_status && new Date(e.date_time) > new Date()).slice(0, 3);
  const recent = exams.filter(e => e.session_status === 'submitted').slice(0, 3);

  // Get result for an exam
  const getResultForExam = (examId) => {
    return results.find(r => r.exam_id === examId);
  };

  const getScoreColor = (status, percentage) => {
    if (status === 'pending') return '#f59e0b';
    if (status === 'pass') return '#22c55e';
    if (status === 'fail') return '#ef4444';
    return '#6b7280';
  };

  const getGradeColor = (grade) => {
    if (grade?.includes('A')) return '#22c55e';
    if (grade?.includes('B')) return '#3b82f6';
    if (grade?.includes('C')) return '#f59e0b';
    return '#ef4444';
  };

  // Calculate statistics
  const totalExams = exams.length;
  const completedExams = results.length;
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
    : 0;
  const passRate = results.length > 0 
    ? Math.round((results.filter(r => r.status === 'pass').length / results.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="content-card">
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p>{user?.studentId} · {user?.collegeName}</p>
          </div>
          <div className="welcome-actions">
            <button className="btn" onClick={() => navigate('/student/exams')}>
              <BookOpen size={20} />
              Take Exam
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/student/results')}>
              <Trophy size={20} />
              View Results
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid-4">
        <div className="content-card">
          <div className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-value">{totalExams}</div>
                <div className="stat-label">Total Exams</div>
              </div>
              <div className="stat-icon exams">
                <BookOpen size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-value">{completedExams}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-icon results">
                <Trophy size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-value">{averageScore}%</div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="stat-icon average">
                <TrendingUp size={24} />
              </div>
            </div>
            {averageScore > 0 && (
              <div className="stat-change">
                <ArrowRight size={12} />
                {averageScore >= 70 ? 'Excellent' : averageScore >= 50 ? 'Good' : 'Needs Improvement'}
              </div>
            )}
          </div>
        </div>

        <div className="content-card">
          <div className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-value">{passRate}%</div>
                <div className="stat-label">Pass Rate</div>
              </div>
              <div className="stat-icon streak">
                <Target size={24} />
              </div>
            </div>
            {passRate > 0 && (
              <div className="stat-change">
                <ArrowRight size={12} />
                {passRate >= 80 ? 'Outstanding' : passRate >= 60 ? 'Good' : 'Keep Trying'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid-2">
        {/* Upcoming Exams */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">
              <Calendar size={20} />
              Upcoming Exams
            </h2>
            <a href="/student/exams" className="card-action">
              View All
              <ArrowRight size={16} />
            </a>
          </div>
          
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar size={48} />
              </div>
              <h3>No Upcoming Exams</h3>
              <p>You don't have any scheduled exams at the moment.</p>
            </div>
          ) : (
            <div className="item-list">
              {upcoming.map(exam => (
                <div key={exam.id} className="list-item" onClick={() => navigate('/student/exams')}>
                  <div className="item-content">
                    <div className="item-title">{exam.name}</div>
                    <div className="item-meta">
                      <Clock size={14} />
                      {format(new Date(exam.date_time), 'dd MMM, HH:mm')}
                      <span>·</span>
                      <Activity size={14} />
                      {exam.duration} min
                    </div>
                  </div>
                  <span className="item-status status-upcoming">Upcoming</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">
              <Award size={20} />
              Recent Results
            </h2>
            <a href="/student/results" className="card-action">
              View All
              <ArrowRight size={16} />
            </a>
          </div>
          
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Trophy size={48} />
              </div>
              <h3>No Results Yet</h3>
              <p>Complete your first exam to see results here.</p>
            </div>
          ) : (
            <div className="item-list">
              {recent.map(exam => {
                const result = getResultForExam(exam.id);
                return (
                  <div key={exam.id} className="list-item" onClick={() => navigate(`/student/results/${exam.id}`)}>
                    <div className="item-content">
                      <div className="item-title">{exam.name}</div>
                      <div className="item-meta">
                        <Clock size={14} />
                        {exam.submitted_at ? formatDistanceToNow(new Date(exam.submitted_at)) + ' ago' : 'Submitted'}
                      </div>
                      
                      {result && (
                        <div className="score-display" style={{ marginTop: '0.5rem' }}>
                          <span className={`score-badge ${result.status === 'pending' ? 'status-pending' : result.status === 'pass' ? 'status-pass' : 'status-fail'}`}>
                            {result.status === 'pending' ? 'Pending' : `${result.marks_obtained}/${result.total_marks}`}
                          </span>
                          
                          {result.status !== 'pending' && (
                            <span className="score-percentage">({result.percentage}%)</span>
                          )}
                          
                          {result.grade && result.status !== 'pending' && (
                            <span className={`grade-badge ${result.status === 'pass' ? 'status-pass' : 'status-fail'}`}>
                              {result.grade}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className={`item-status ${result ? (result.status === 'pending' ? 'status-pending' : result.status === 'pass' ? 'status-pass' : 'status-fail') : 'status-submitted'}`}>
                      {result ? (result.status === 'pending' ? 'Evaluating' : result.status?.toUpperCase()) : 'Submitted'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
