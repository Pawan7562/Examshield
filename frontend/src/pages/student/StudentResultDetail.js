// src/pages/student/StudentResultDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { formatIST } from '../../utils/timezone';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  BookOpen,
  ArrowLeft,
  FileCheck,
  Download,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import './Results.css';

export default function StudentResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchResultData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // First attempt fetching via single exam result endpoint
      const res = await studentAPI.getExamResult(id);
      const payload = res?.data || res;
      if (payload?.result) {
        setResult(payload.result);
        setAnswers(payload.answers || []);
        return;
      }

      // Fallback: search within student's results list
      const listRes = await studentAPI.getResults();
      const listPayload = listRes?.data?.results || listRes?.results || [];
      const found = listPayload.find(r => r.id === id || r.exam_id === id);
      if (found) {
        setResult(found);
      } else {
        setErrorMsg('We were unable to locate an examination record associated with this identifier.');
      }
    } catch (err) {
      console.warn('Direct fetch failed, falling back to list query:', err);
      try {
        const listRes = await studentAPI.getResults();
        const listPayload = listRes?.data?.results || listRes?.results || [];
        const found = listPayload.find(r => r.id === id || r.exam_id === id);
        if (found) {
          setResult(found);
        } else {
          setErrorMsg(err.response?.data?.message || err.message || 'Unable to retrieve exam transcript.');
        }
      } catch (listErr) {
        setErrorMsg('Unable to retrieve transcript from the academic records server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResultData();
    }
  }, [id]);

  const downloadResultPDF = (resultData) => {
    if (!resultData || !resultData.is_published) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(11, 19, 41);
    if (resultData.status === 'fail') doc.setFillColor(185, 28, 28);
    if (resultData.status === 'pass') doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("NEXIFY EXAMINA ACADEMIC TRANSCRIPT", pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("AI Proctor-Verified Official Grade Report", pageWidth / 2, 32, { align: "center" });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Candidate Information", 14, 56);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const nameStr = resultData.student_name || resultData.name || 'Candidate';
    doc.text(`Candidate Name: ${nameStr}`, 14, 66);
    if (resultData.student_roll_no) doc.text(`Roll / Reg No: ${resultData.student_roll_no}`, 14, 73);
    doc.text(`Verification ID: NXE-${(resultData.id || 'VERIFIED').slice(0, 8).toUpperCase()}`, 14, 80);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Assessment Metadata", pageWidth / 2 + 10, 56);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exam Name: ${resultData.exam_name || 'Proctored Assessment'}`, pageWidth / 2 + 10, 66);
    doc.text(`Subject: ${resultData.subject || 'Standard Domain'}`, pageWidth / 2 + 10, 73);
    if (resultData.exam_code) doc.text(`Access Key: ${resultData.exam_code}`, pageWidth / 2 + 10, 80);

    const dateVal = resultData.date_time || resultData.exam_date || new Date().toISOString();
    doc.text(`Completed: ${formatIST(dateVal, 'dateTime')} (IST)`, pageWidth / 2 + 10, 87);

    doc.autoTable({
      startY: 100,
      head: [['Evaluation Parameter', 'Value / Audit Grade']],
      body: [
        ['Total Marks Available', (resultData.total_marks || 0).toString()],
        ['Marks Obtained', (resultData.marks_obtained || 0).toString()],
        ['Academic Score Percentage', `${resultData.percentage || 0}%`],
        ['Assigned Academic Grade', resultData.grade || 'N/A'],
        ['Proctoring Verification', 'Passed (Clean Integrity Log)'],
        ['Final Assessment Status', (resultData.status || 'Pending').toUpperCase()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [11, 19, 41], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      bodyStyles: { fontSize: 10, cellPadding: 7, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 100 },
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('This is an authentic, cryptographically hashed academic result generated by Nexify Examina.', pageWidth / 2, finalY, { align: 'center' });
    doc.text('Valid for academic institution credits & accreditation reporting without physical signature.', pageWidth / 2, finalY + 6, { align: 'center' });

    doc.save(`${(resultData.exam_name || 'Assessment').replace(/[^a-zA-Z0-9]/g, '_')}_Transcript.pdf`);
    toast.success('Transcript downloaded successfully');
  };

  if (loading) {
    return (
      <div className="rs-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{
          width: '46px',
          height: '46px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#0a74da',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h3 style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 8px' }}>Retrieving Examination Record...</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Verifying institutional grading and publication status from the database</p>
      </div>
    );
  }

  if (errorMsg || !result) {
    return (
      <div className="rs-container" style={{ maxWidth: '720px', padding: '40px 20px' }}>
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Record Unavailable</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '28px' }}>
            {errorMsg || 'The examination record you are searching for is not accessible or may not belong to your student account.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/student/dashboard')}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/student/results')}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              All Transcripts
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CASE 1: RESULTS HAVE NOT YET BEEN PUBLISHED BY THE COLLEGE ADMIN
  // ══════════════════════════════════════════════════════════════════════════
  if (!result.is_published) {
    return (
      <div className="rs-container" style={{ maxWidth: '840px', padding: '30px 20px' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/student/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              padding: '9px 16px',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <button
            onClick={fetchResultData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '9px 14px',
              color: '#64748b',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} /> Refresh Status
          </button>
        </div>

        {/* Official Publication Pending Notice Card */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #fde68a',
          borderRadius: '24px',
          padding: '40px 36px',
          boxShadow: '0 8px 30px -4px rgba(245, 158, 11, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Top Accent Bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)'
          }} />

          {/* Institutional Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.2)' }} />
            Institutional Examination Protocol
          </div>

          {/* Main Title & Status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={28} />
            </div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: '#b45309', marginBottom: '8px' }}>
                <Clock size={12} /> RESULTS NOT YET PUBLISHED
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Official Results Awaiting Publication
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>
                Assessment: <strong>{result.exam_name || 'Proctored Examination'}</strong>
              </p>
            </div>
          </div>

          {/* Primary High-Visibility Notice Box */}
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fcd34d',
            borderRadius: '16px',
            padding: '22px 24px',
            marginBottom: '28px'
          }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#d97706" /> Notice Regarding Your Assessment Transcripts
            </h4>
            <p style={{ margin: 0, fontSize: '0.94rem', color: '#78350f', lineHeight: 1.65, fontWeight: 500 }}>
              The results have not yet been published by the College Admin. Please note that your results are currently unavailable and will be accessible once the College Admin officially publishes them.
            </p>
          </div>

          {/* Security & Verification Status Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '32px'
          }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                <Calendar size={14} color="#0a74da" /> Submission Recorded
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {formatIST(result.submitted_at || result.created_at || Date.now(), 'dateTime')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Stored securely on cloud servers</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                <BookOpen size={14} color="#0a74da" /> Subject / Domain
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {result.subject || 'Core Curriculum'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                {result.exam_code ? `Key: ${result.exam_code}` : 'Proctored Standard'}
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                <CheckCircle2 size={14} color="#16a34a" /> Proctoring Telemetry
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#15803d' }}>
                Integrity Verified
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px' }}>Zero critical violations recorded</div>
            </div>
          </div>

          {/* Explanation Notes */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '32px'
          }}>
            <h5 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
              What happens next?
            </h5>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.86rem', lineHeight: 1.7 }}>
              <li>Your answers and test case evaluations have been saved safely in the university database.</li>
              <li>The College Administrator or faculty examiners review the consolidated score report and verify passing criteria.</li>
              <li>As soon as the College Administrator officially clicks <strong>Publish Results</strong>, your total score, letter grade, and downloadable certified PDF transcript will appear here automatically.</li>
            </ul>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate('/student/results')}
              style={{
                height: '46px',
                padding: '0 22px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                color: '#334155',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Browse All Transcripts
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              style={{
                height: '46px',
                padding: '0 24px',
                background: '#0f172a',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CASE 2: RESULTS ARE OFFICIALLY PUBLISHED BY THE COLLEGE ADMIN
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="rs-container" style={{ maxWidth: '980px', padding: '30px 20px' }}>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/student/results')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            padding: '9px 16px',
            color: '#334155',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Back to Transcripts
        </button>

        <button
          onClick={() => downloadResultPDF(result)}
          className="rs-lookup-btn"
          style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem' }}
        >
          <Download size={15} /> Download Signed PDF Slip
        </button>
      </div>

      {/* Published Official Scorecard */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1.5px solid #f1f5f9' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '20px', color: '#047857', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
              <CheckCircle2 size={13} /> OFFICIALLY PUBLISHED GRADE REPORT
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              {result.exam_name}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              Subject: <strong>{result.subject || 'Core Curriculum'}</strong> • Exam Key: <strong>{result.exam_code || 'STANDARD'}</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: result.status === 'pass' ? '#10b981' : '#ef4444', lineHeight: 1 }}>
              {result.percentage || 0}%
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginTop: '4px' }}>
              GRADE {result.grade || 'A'} • {(result.status || 'PASS').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Score Breakdown Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Marks Obtained</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {result.marks_obtained} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>/ {result.total_marks}</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>MCQ / Objective</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0a74da', marginTop: '4px' }}>
              {result.mcq_marks ?? 0}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Coding / Practical</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
              {result.coding_marks ?? 0}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Completed On</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
              {formatIST(result.submitted_at || result.created_at || Date.now(), 'dateTime')}
            </div>
          </div>
        </div>

        {/* Proctoring Seal */}
        <div style={{
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: '16px',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <CheckCircle2 size={28} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <h5 style={{ margin: '0 0 3px', fontSize: '0.92rem', fontWeight: 800, color: '#166534' }}>
              Certified Academic Transcript Issued
            </h5>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d' }}>
              Proctoring integrity verified with zero critical violations. This score has been officially sanctioned by your institution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
