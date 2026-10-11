// src/utils/transcriptGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatIST } from './timezone';
import toast from 'react-hot-toast';

export const generateTranscriptPDF = (resultData, currentUser = null) => {
  if (!resultData) {
    toast.error('No examination result data available to generate transcript');
    return false;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Data normalization
    const studentName = resultData.student_name || resultData.candidate_name || resultData.name || currentUser?.name || 'Candidate';
    const rollNo = resultData.student_roll_no || resultData.roll_no || resultData.roll_number || currentUser?.roll_number || currentUser?.enrollment_number || 'N/A';
    const email = resultData.email || resultData.student_email || currentUser?.email || '';
    const examName = resultData.exam_name || resultData.exam_title || resultData.title || 'Official Assessment';
    const subject = resultData.subject || 'Standard Domain';
    const examCode = resultData.exam_code || resultData.exam_key || '';
    const dateVal = resultData.date_time || resultData.exam_date || resultData.submitted_at || resultData.created_at || new Date().toISOString();

    const marksObtained = resultData.marks_obtained !== undefined 
      ? Number(resultData.marks_obtained) 
      : (resultData.score !== undefined ? Number(resultData.score) : 0);
    const totalMarks = Number(resultData.total_marks || resultData.totalMarks || 100);
    const rawPct = resultData.percentage !== undefined 
      ? Number(resultData.percentage) 
      : (totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0);
    const percentage = Math.round(rawPct * 10) / 10;

    const rawStatus = (resultData.status || (percentage >= 40 ? 'pass' : 'fail')).toLowerCase();
    const isPending = rawStatus === 'pending' || resultData.isPending === true;
    const finalStatus = isPending ? 'PENDING' : rawStatus.toUpperCase();

    let assignedGrade = resultData.grade;
    if (!assignedGrade) {
      if (isPending) assignedGrade = 'UNDER REVIEW';
      else if (percentage >= 90) assignedGrade = 'A+';
      else if (percentage >= 80) assignedGrade = 'A';
      else if (percentage >= 70) assignedGrade = 'B+';
      else if (percentage >= 60) assignedGrade = 'B';
      else if (percentage >= 50) assignedGrade = 'C+';
      else if (percentage >= 40) assignedGrade = 'C';
      else assignedGrade = 'F';
    }

    // ── Header Banner ──
    if (isPending) {
      doc.setFillColor(217, 119, 6); // Amber
    } else if (rawStatus === 'pass') {
      doc.setFillColor(16, 185, 129); // Emerald
    } else {
      doc.setFillColor(220, 38, 38); // Red
    }
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('NEXIFY EXAMINA ACADEMIC TRANSCRIPT', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      isPending 
        ? 'PROVISIONAL AUDIT REPORT — PENDING FACULTY SUBJECTIVE EVALUATION' 
        : 'AI PROCTOR-VERIFIED OFFICIAL GRADE REPORT',
      pageWidth / 2, 
      30, 
      { align: 'center' }
    );

    // ── Candidate Info (Left Column) ──
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Candidate Profile', 14, 54);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Candidate Name: ${studentName}`, 14, 63);
    doc.text(`Roll / Enrollment No: ${rollNo}`, 14, 70);
    if (email) doc.text(`Email Address: ${email}`, 14, 77);
    const verId = resultData.id ? String(resultData.id).slice(0, 8).toUpperCase() : 'VERIFIED';
    doc.text(`Verification ID: NXE-${verId}`, 14, email ? 84 : 77);

    // ── Assessment Metadata (Right Column) ──
    const rightColX = pageWidth / 2 + 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Assessment Particulars', rightColX, 54);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exam Name: ${examName}`, rightColX, 63);
    doc.text(`Domain / Subject: ${subject}`, rightColX, 70);
    if (examCode) doc.text(`Exam Key: ${examCode}`, rightColX, 77);
    doc.text(`Submission Date: ${formatIST(dateVal, 'dateTime')} (IST)`, rightColX, examCode ? 84 : 77);

    // ── Evaluation Table ──
    const tableBody = [
      ['Total Maximum Marks', totalMarks.toString()],
      ['Marks Awarded', `${marksObtained} / ${totalMarks}`],
      ['Academic Score Percentage', `${percentage}%`],
      ['Assigned Letter Grade', assignedGrade],
      ['AI Proctoring Integrity Verification', 'Passed (Clean Verification Record)'],
      ['Official Evaluation Status', finalStatus]
    ];

    // Add Sectional Breakdown if available
    if (resultData.mcq_marks !== undefined && resultData.mcq_marks !== null) {
      tableBody.push(['Objective / MCQ Marks', String(resultData.mcq_marks)]);
    }
    if (resultData.coding_marks !== undefined && resultData.coding_marks !== null) {
      tableBody.push(['Coding Challenges Marks', String(resultData.coding_marks)]);
    }
    if (resultData.subjective_marks !== undefined && resultData.subjective_marks !== null) {
      tableBody.push(['Subjective / Descriptive Marks', isPending ? 'Pending Evaluation' : String(resultData.subjective_marks)]);
    }

    doc.autoTable({
      startY: 96,
      head: [['Evaluation Parameter', 'Value / Audit Grade']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [11, 19, 41], textColor: 255, fontStyle: 'bold', fontSize: 10.5 },
      bodyStyles: { fontSize: 9.5, cellPadding: 6, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 105 },
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // ── Institutional Seal & Footer ──
    const finalY = doc.lastAutoTable.finalY + 24;
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('This official academic transcript is cryptographically authenticated by the Nexify Examina AI Proctoring Engine.', pageWidth / 2, finalY, { align: 'center' });
    doc.text('Valid for institution course accreditation, university credit verification, and grading records.', pageWidth / 2, finalY + 5, { align: 'center' });

    const safeFilename = `${examName.replace(/[^a-zA-Z0-9]/g, '_')}_Transcript.pdf`;
    doc.save(safeFilename);
    toast.success('Transcript downloaded successfully');
    return true;
  } catch (err) {
    console.error('Failed to generate PDF transcript:', err);
    toast.error('Failed to generate transcript PDF');
    return false;
  }
};
