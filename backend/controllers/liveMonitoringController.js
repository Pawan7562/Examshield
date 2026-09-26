// controllers/liveMonitoringController.js
const { supabase } = require('../config/postgres-client');

/**
 * GET /api/admin/monitoring/overview
 * Get summary of all exams for college to select or see multi-exam status
 */
exports.getLiveOverview = async (req, res) => {
  try {
    const collegeId = req.user.id;

    // Fetch exams for this college (sorted by date_time descending)
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('id, title, name, subject, exam_code, status, date_time, duration, total_marks')
      .eq('college_id', collegeId)
      .order('date_time', { ascending: false });

    if (examsError) {
      console.error('Error fetching exams for monitoring overview:', examsError);
      return res.status(500).json({ success: false, message: 'Failed to fetch exams overview', error: examsError.message });
    }

    const allExams = exams || [];

    // For each exam, query sessions to get real-time counts
    const examSummaries = await Promise.all(
      allExams.map(async (exam) => {
        const { data: sessions } = await supabase
          .from('exam_sessions')
          .select('id, status, student_id')
          .eq('exam_id', exam.id);

        const { data: violations } = await supabase
          .from('violations')
          .select('id, type, severity')
          .eq('exam_id', exam.id);

        const sessList = sessions || [];
        const violList = violations || [];

        const activeCount = sessList.filter((s) => s.status === 'active').length;
        const submittedCount = sessList.filter((s) => s.status === 'submitted').length;
        const terminatedCount = sessList.filter((s) => s.status === 'terminated').length;

        // Determine if exam is currently live based on time and status
        const now = new Date();
        const start = exam.date_time ? new Date(exam.date_time) : null;
        const durationMin = Number(exam.duration) || 60;
        const end = start ? new Date(start.getTime() + durationMin * 60000) : null;
        const isTimeLive = start && end && now >= start && now <= end;
        const isLive = activeCount > 0 || isTimeLive || exam.status === 'active' || exam.status === 'published';

        return {
          id: exam.id,
          title: exam.title || exam.name || 'Untitled Examination',
          subject: exam.subject || 'General Assessment',
          exam_code: exam.exam_code,
          status: exam.status,
          date_time: exam.date_time,
          start_time: exam.date_time,
          duration: exam.duration,
          isLive,
          stats: {
            totalSessions: sessList.length,
            activeStudents: activeCount,
            submittedStudents: submittedCount,
            terminatedStudents: terminatedCount,
            totalViolations: violList.length,
          },
        };
      })
    );

    // Pick recommended active exam (first live or first with active students or latest)
    const activeExam = examSummaries.find((e) => e.stats.activeStudents > 0) ||
      examSummaries.find((e) => e.isLive) ||
      examSummaries[0] ||
      null;

    const totalActiveAcrossExams = examSummaries.reduce((acc, e) => acc + e.stats.activeStudents, 0);
    const totalViolationsAcrossExams = examSummaries.reduce((acc, e) => acc + e.stats.totalViolations, 0);

    return res.json({
      success: true,
      data: {
        exams: examSummaries,
        activeExamId: activeExam ? activeExam.id : null,
        kpis: {
          totalExams: examSummaries.length,
          activeExams: examSummaries.filter((e) => e.isLive).length,
          totalActiveStudents: totalActiveAcrossExams,
          totalViolations: totalViolationsAcrossExams,
        },
      },
    });
  } catch (error) {
    console.error('Error in getLiveOverview:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving live overview' });
  }
};

/**
 * GET /api/admin/exams/:id/monitor
 * Get comprehensive live monitoring data for a specific exam
 */
exports.getMonitoringData = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const collegeId = req.user.id;

    // Verify exam belongs to college
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examError || !examData) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    // Get all sessions for this exam
    let sessions = [];
    try {
      const { data: sessData, error: sessError } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          students(id, name, email, student_id)
        `)
        .eq('exam_id', examId)
        .order('started_at', { ascending: false });

      if (!sessError && sessData) {
        sessions = sessData;
      } else {
        // Fallback: query sessions and students separately
        const { data: rawSessions } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('exam_id', examId)
          .order('started_at', { ascending: false });

        if (rawSessions && rawSessions.length > 0) {
          const studentIds = rawSessions.map((s) => s.student_id).filter(Boolean);
          let studentsMap = {};
          if (studentIds.length > 0) {
            const { data: stdList } = await supabase
              .from('students')
              .select('id, name, email, student_id')
              .in('id', studentIds);
            if (stdList) {
              stdList.forEach((st) => { studentsMap[st.id] = st; });
            }
          }
          sessions = rawSessions.map((s) => ({
            ...s,
            students: studentsMap[s.student_id] || { id: s.student_id, name: 'Candidate', email: '', student_id: '' },
          }));
        }
      }
    } catch (e) {
      console.warn('Fallback session query used due to:', e.message);
    }

    // Get violations for all students in this exam
    let violations = [];
    try {
      const { data: violData } = await supabase
        .from('violations')
        .select('*')
        .eq('exam_id', examId)
        .order('created_at', { ascending: false })
        .limit(200);

      violations = violData || [];
    } catch (ve) {
      console.warn('Violations query warning:', ve.message);
    }

    // Group violations by student
    const violationsByStudent = {};
    violations.forEach((violation) => {
      const sid = violation.student_id;
      if (!violationsByStudent[sid]) {
        violationsByStudent[sid] = [];
      }
      violationsByStudent[sid].push(violation);
    });

    // Format candidate list
    const candidateList = sessions.map((session) => {
      const st = session.students || session.student || {};
      const studentViolations = violationsByStudent[session.student_id] || [];
      const warningCount = studentViolations.filter((v) => v.type === 'warning').length;

      return {
        id: session.student_id,
        sessionId: session.id,
        session_id: session.id,
        name: st.name || 'Candidate',
        email: st.email || 'N/A',
        studentId: st.student_id || st.id?.slice(0, 8) || 'STD',
        status: session.status || 'active',
        started_at: session.started_at,
        submitted_at: session.submitted_at,
        terminated_at: session.terminated_at,
        violation_count: studentViolations.length,
        warning_count: warningCount,
        violations: studentViolations,
        activity: {
          status: session.status || 'active',
          currentQuestion: session.current_question || 0,
          totalQuestions: examData.total_questions || 0,
          timeSpent: session.started_at
            ? Math.max(0, Math.floor((new Date() - new Date(session.started_at)) / 1000))
            : 0,
          cameraActive: session.status === 'active',
          lastSeen: session.last_heartbeat || session.updated_at || session.started_at || new Date().toISOString(),
          audioLevel: 0,
        },
      };
    });

    const activeStudents = candidateList.filter((c) => c.status === 'active').length;
    const submittedStudents = candidateList.filter((c) => c.status === 'submitted').length;
    const terminatedStudents = candidateList.filter((c) => c.status === 'terminated').length;
    const flaggedStudents = candidateList.filter((c) => c.violation_count > 0 && c.status === 'active').length;
    const safeStudents = candidateList.filter((c) => c.violation_count === 0 && c.status === 'active').length;

    const stats = {
      total: candidateList.length,
      totalStudents: candidateList.length,
      active: activeStudents,
      activeStudents: activeStudents,
      submitted: submittedStudents,
      submittedStudents: submittedStudents,
      terminated: terminatedStudents,
      terminatedStudents: terminatedStudents,
      flagged: flaggedStudents,
      flaggedStudents: flaggedStudents,
      safe: safeStudents,
      safeStudents: safeStudents,
      warnings: violations.filter((v) => v.type === 'warning').length,
      totalWarnings: violations.filter((v) => v.type === 'warning').length,
      totalViolations: violations.length,
    };

    return res.json({
      success: true,
      data: {
        exam: examData,
        students: candidateList,
        sessions: candidateList,
        violations: violationsByStudent,
        recentViolations: violations.slice(0, 50),
        stats,
      },
    });
  } catch (error) {
    console.error('Error getting monitoring data:', error);
    return res.status(500).json({ success: false, message: 'Failed to get monitoring data', error: error.message });
  }
};

/**
 * POST /api/admin/exams/:id/warn-student
 * Send official warning to student & log into violations table
 */
exports.sendWarning = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { studentId, message, severity = 'medium', strike = 1 } = req.body;
    const collegeId = req.user.id;

    if (!studentId || !message) {
      return res.status(400).json({ success: false, message: 'studentId and message are required' });
    }

    // Verify exam belongs to college
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('id, title, name')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examError || !examData) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    // Insert warning into violations
    const warningPayload = {
      exam_id: examId,
      student_id: studentId,
      type: 'warning',
      severity: severity,
      message: message,
      created_at: new Date().toISOString(),
    };

    const { data: warningRecord, error: warnError } = await supabase
      .from('violations')
      .insert(warningPayload)
      .select()
      .single();

    if (warnError) {
      console.error('Failed to log warning violation:', warnError);
    }

    // Real-time broadcast to student and admin rooms
    const io = req.app.get('io');
    if (io) {
      const payload = {
        examId,
        studentId,
        message,
        severity,
        strike: strike || 1,
        timestamp: new Date().toISOString(),
        warningId: warningRecord?.id,
      };

      // 1. Direct student room
      io.to(`student-${studentId}`).emit('warning-received', payload);
      // 2. Exam room
      io.to(`exam-${examId}`).emit('warning-received', payload);
      // 3. Admin monitoring rooms
      io.to(`admin-exam-${examId}`).emit('warning-sent', payload);
      io.to(`exam-monitoring-${examId}`).emit('warning-sent', payload);
    }

    return res.json({
      success: true,
      message: 'Official proctoring warning issued successfully',
      data: warningRecord || warningPayload,
    });
  } catch (error) {
    console.error('Error sending warning:', error);
    return res.status(500).json({ success: false, message: 'Failed to send warning' });
  }
};

/**
 * POST /api/admin/exams/:id/terminate-student
 * Terminate candidate exam session immediately
 */
exports.terminateStudentExam = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { studentId, reason = 'Exam terminated due to proctoring policy violation.' } = req.body;
    const collegeId = req.user.id;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    // Verify exam belongs to college
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('id, title, name')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examError || !examData) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    // Update active session to terminated
    const nowIso = new Date().toISOString();
    const { data: updatedSession, error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        status: 'terminated',
        terminated_at: nowIso,
        termination_reason: reason,
      })
      .eq('exam_id', examId)
      .eq('student_id', studentId);

    if (updateError) {
      console.warn('Session termination update warning:', updateError.message);
    }

    // Log high-severity termination violation
    const { data: violationRecord } = await supabase
      .from('violations')
      .insert({
        exam_id: examId,
        student_id: studentId,
        type: 'termination',
        severity: 'high',
        message: `Admin Disqualification: ${reason}`,
        created_at: nowIso,
      })
      .select()
      .single();

    // Real-time broadcast to student and admin
    const io = req.app.get('io');
    if (io) {
      const payload = {
        examId,
        studentId,
        reason,
        timestamp: nowIso,
      };

      io.to(`student-${studentId}`).emit('exam-terminated', payload);
      io.to(`exam-${examId}`).emit('exam-terminated', payload);
      io.to(`admin-exam-${examId}`).emit('student-terminated', payload);
      io.to(`exam-monitoring-${examId}`).emit('student-terminated', payload);
    }

    return res.json({
      success: true,
      message: 'Candidate session terminated successfully',
      data: {
        studentId,
        examId,
        terminatedAt: nowIso,
        reason,
      },
    });
  } catch (error) {
    console.error('Error terminating student exam:', error);
    return res.status(500).json({ success: false, message: 'Failed to terminate exam' });
  }
};

/**
 * POST /api/admin/exams/:id/broadcast
 * Broadcast an announcement message to all students taking this exam
 */
exports.broadcastAnnouncement = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { title = 'Proctor Announcement', message, urgency = 'normal' } = req.body;
    const collegeId = req.user.id;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required for broadcast' });
    }

    // Verify exam belongs to college
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('id, title, name')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examError || !examData) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    const payload = {
      examId,
      title,
      message,
      urgency,
      sender: req.user.name || 'Exam Administrator',
      timestamp: new Date().toISOString(),
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`exam-${examId}`).emit('broadcast-received', payload);
      io.to(`admin-exam-${examId}`).emit('broadcast-sent', payload);
      io.to(`exam-monitoring-${examId}`).emit('broadcast-sent', payload);
    }

    return res.json({
      success: true,
      message: 'Broadcast sent to all candidates in the exam room',
      data: payload,
    });
  } catch (error) {
    console.error('Error broadcasting announcement:', error);
    return res.status(500).json({ success: false, message: 'Failed to send broadcast announcement' });
  }
};

/**
 * GET /api/admin/exams/:id/student-activity/:studentId
 * Get detailed activity timeline for an individual student
 */
exports.getStudentActivity = async (req, res) => {
  try {
    const { id: examId, studentId } = req.params;
    const collegeId = req.user.id;

    // Verify exam belongs to college
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examError || !examData) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    // Get student info
    const { data: student } = await supabase
      .from('students')
      .select('id, name, email, student_id')
      .eq('id', studentId)
      .single();

    // Get session
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .single();

    // Get violations
    const { data: violations } = await supabase
      .from('violations')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Get answers count
    let answersCount = 0;
    try {
      if (session?.id) {
        const { count } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);
        answersCount = count || 0;
      }
    } catch (_) {}

    return res.json({
      success: true,
      data: {
        student: student || { id: studentId, name: 'Candidate' },
        session: session || null,
        violations: violations || [],
        answersCount,
        totalQuestions: examData.total_questions || 0,
      },
    });
  } catch (error) {
    console.error('Error getting student activity:', error);
    return res.status(500).json({ success: false, message: 'Failed to get student activity' });
  }
};
