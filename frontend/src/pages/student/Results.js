// src/pages/student/Results.js
import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { format } from 'date-fns';
import { 
  Trophy, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Download,
  Eye
} from 'lucide-react';
import '../../components/student/StudentSidebar.css';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    studentAPI.getResults().then(r => setResults(r.data.results || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return '#10b981';
      case 'fail': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'pass': return 'rgba(16, 185, 129, 0.2)';
      case 'fail': return 'rgba(239, 68, 68, 0.2)';
      case 'pending': return 'rgba(245, 158, 11, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  };

  const getGradeColor = (grade) => {
    if (grade?.includes('A')) return '#10b981';
    if (grade?.includes('B')) return '#3b82f6';
    if (grade?.includes('C')) return '#f59e0b';
    if (grade?.includes('D')) return '#f97316';
    return '#ef4444';
  };

  const calculateStats = () => {
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const pending = results.filter(r => r.status === 'pending').length;
    const averageScore = results.length > 0 
      ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
      : 0;

    return { total, passed, failed, pending, averageScore };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="student-pages-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your results...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="content-card">
        <div className="card-header">
          <h1>My Results</h1>
          <div className="header-actions">
            <button className="btn btn-secondary">
              <Download size={16} />
              Download All
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
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Exams</div>
              </div>
              <div className="stat-icon exams">
                <Trophy size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-value">{stats.passed}</div>
                <div className="stat-label">Passed</div>
              </div>
              <div className="stat-icon results">
                <Award size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-value">{stats.averageScore}%</div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="stat-icon average">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-icon streak">
                <Target size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="content-card">
        <h2 className="card-title">
          <BarChart3 size={20} />
          Exam Results
        </h2>

        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Trophy size={48} />
            </div>
            <h3>No Results Yet</h3>
            <p>Complete your first exam to see results here.</p>
          </div>
        ) : (
          <div className="results-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.id}>
                    <td>
                      <div className="exam-name-cell">
                        <strong>{result.exam_name}</strong>
                      </div>
                    </td>
                    <td>{result.subject}</td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        {format(new Date(result.date_time), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td>
                      <div className="marks-cell">
                        <span className="score-value">{result.marks_obtained}</span>
                        <span className="score-label">/ {result.total_marks}</span>
                      </div>
                    </td>
                    <td>
                      <div className="percentage-cell">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${result.percentage}%`,
                              background: result.percentage >= 60 ? '#10b981' : result.percentage >= 40 ? '#f59e0b' : '#ef4444'
                            }}
                          ></div>
                        </div>
                        <span>{result.percentage}%</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="grade-badge"
                        style={{ 
                          background: getGradeColor(result.grade) + '20',
                          color: getGradeColor(result.grade)
                        }}
                      >
                        {result.grade || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={`status-badge status-${result.status}`}
                        style={{ 
                          background: getStatusBg(result.status),
                          color: getStatusColor(result.status)
                        }}
                      >
                        {result.status?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setSelectedResult(result)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="modal-overlay" onClick={() => setSelectedResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedResult.exam_name}</h3>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedResult(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="result-details">
                <div className="detail-row">
                  <span className="detail-label">Subject:</span>
                  <span className="detail-value">{selectedResult.subject}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Exam Type:</span>
                  <span className="detail-value">{selectedResult.exam_type?.toUpperCase()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{format(new Date(selectedResult.date_time), 'dd MMM yyyy, HH:mm')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Marks Obtained:</span>
                  <span className="detail-value">{selectedResult.marks_obtained} / {selectedResult.total_marks}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Percentage:</span>
                  <span className="detail-value">{selectedResult.percentage}%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Grade:</span>
                  <span 
                    className="detail-value grade-badge"
                    style={{ 
                      background: getGradeColor(selectedResult.grade) + '20',
                      color: getGradeColor(selectedResult.grade)
                    }}
                  >
                    {selectedResult.grade || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span 
                    className={`status-badge status-${selectedResult.status}`}
                    style={{ 
                      background: getStatusBg(selectedResult.status),
                      color: getStatusColor(selectedResult.status)
                    }}
                  >
                    {selectedResult.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
