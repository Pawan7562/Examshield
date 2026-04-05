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
  Eye,
  FileDown,
  Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import '../../components/student/StudentSidebar.css';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [examKeyInput, setExamKeyInput] = useState('');
  const [downloadingKey, setDownloadingKey] = useState(false);

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

  const downloadResultPDF = (resultData) => {
    if (!resultData) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Professional Header
    doc.setFillColor(15, 23, 42); // Dark slate
    if (resultData.status === 'fail') doc.setFillColor(185, 28, 28); // Dark red for fail
    if (resultData.status === 'pass') doc.setFillColor(21, 128, 61); // Green for pass
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("EXAMSHIELD - RESULT CARD", pageWidth / 2, 25, { align: "center" });

    // Student Information Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Student Information", 14, 55);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const nameStr = resultData.student_name || resultData.name || 'Student';
    doc.text(`Name: ${nameStr}`, 14, 65);
    if (resultData.student_roll_no) doc.text(`Roll No: ${resultData.student_roll_no}`, 14, 72);

    // Exam Details Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Exam Details", pageWidth / 2 + 10, 55);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Exam Name: ${resultData.exam_name}`, pageWidth / 2 + 10, 65);
    doc.text(`Subject: ${resultData.subject || 'N/A'}`, pageWidth / 2 + 10, 72);
    if (resultData.exam_code) doc.text(`Exam Code: ${resultData.exam_code}`, pageWidth / 2 + 10, 79);
    
    const dateVal = resultData.date_time || resultData.exam_date || new Date().toISOString();
    doc.text(`Date: ${format(new Date(dateVal), 'dd MMM yyyy')}`, pageWidth / 2 + 10, 86);

    // Results Table
    doc.autoTable({
      startY: 100,
      head: [['Metrics', 'Score / Status']],
      body: [
        ['Total Marks', (resultData.total_marks || 0).toString()],
        ['Marks Obtained', (resultData.marks_obtained || 0).toString()],
        ['Percentage', `${resultData.percentage || 0}%`],
        ['Grade', resultData.grade || 'N/A'],
        ['Result Status', (resultData.status || 'Pending').toUpperCase()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 12, cellPadding: 8 },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 90 },
        1: { halign: 'right' }
      }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 40;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a system generated result document and does not require a physical signature.', pageWidth / 2, finalY, { align: 'center' });
    doc.text('ExamShield Proctoring Systems', pageWidth / 2, finalY + 7, { align: 'center' });

    doc.save(`${resultData.exam_name.replace(/[^a-zA-Z0-9]/g, '_')}_Result.pdf`);
  };

  const handleDownloadByKey = async () => {
    if (!examKeyInput.trim()) {
      toast.error('Please enter an Exam Key');
      return;
    }
    setDownloadingKey(true);
    const downloadId = toast.loading('Fetching your result...');
    
    try {
      const response = await studentAPI.getResultByKey(examKeyInput.trim());
      const resData = response.data.data ? response.data.data.result : response.data.result;
      
      toast.success('Result found! Generating PDF...', { id: downloadId });
      downloadResultPDF(resData);
      setExamKeyInput('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Result not found or not published yet.', { id: downloadId });
    } finally {
      setDownloadingKey(false);
    }
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

      {/* Download by Exam Key Section */}
      <div className="content-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileDown size={20} color="#3b82f6" />
              Download Result via Exam Key
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              Enter the exact Exam Key given to you to directly download your professional report card.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="e.g. 5G4H9J"
                value={examKeyInput}
                onChange={(e) => setExamKeyInput(e.target.value.toUpperCase())}
                style={{
                  padding: '10px 10px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  width: '200px',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}
              />
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleDownloadByKey}
              disabled={downloadingKey || !examKeyInput.trim()}
              style={{ padding: '10px 18px', fontWeight: 600 }}
            >
              {downloadingKey ? 'Downloading...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="content-card">
        <h2 className="card-title">
          <BarChart3 size={20} />
          Your Taken Exams
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
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => setSelectedResult(result)}
                          title="View Details"
                          style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={() => downloadResultPDF(result)}
                          title="Download PDF"
                          style={{ padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.4)' }}
                        >
                          <Download size={16} color="#3b82f6" />
                        </button>
                      </div>
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
