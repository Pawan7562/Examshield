// controllers/liveMonitoringController.js
const { pool } = require('../config/database');
const { supabase } = require('../config/postgres-client');
const { autoCloseExpiredExams } = require('../services/examLifecycleService');

/**
 * GET /api/admin/monitoring/overview
 * Ultra-fast single consolidated query for multi-exam live monitoring status
 */
exports.getLiveOverview = async (req, res) => {
  try {
    const collegeId = req.user.id;
    await autoCloseExpiredExams().catch(() => {});

    // Single consolidated high-speed query
    const result = await pool.query(`
      SELECT 
        e.id, 
        COALESCE(e.title, e.name, 'Untitled Examination') AS title,
        COALESCE(e.name, e.title, 'Untitled Examination') AS name,
        COALESCE(e.subject, 'General Assessment') AS subject,
        e.exam_code, 
        e.status, 
        e.date_time, 
        e.duration, 
        e.total_marks,
        COALESCE(sess.total_sessions, 0)::int AS total_sessions,
        COALESCE(sess.active_students, 0)::int AS active_students,
        COALESCE(sess.submitted_students, 0)::int AS submitted_students,
        COALESCE(sess.terminated_students, 0)::int AS terminated_students,
        COALESCE(viol.total_violations, 0)::int AS total_violations
      FROM exams e
      LEFT JOIN (
        SELECT 
          exam_id,
          COUNT(*)::int AS total_sessions,
          COUNT(CASE WHEN status = 'active' THEN 1 END)::int AS active_students,
          COUNT(CASE WHEN status = 'submitted' THEN 1 END)::int AS submitted_students,
          COUNT(CASE WHEN status = 'terminated' THEN 1 END)::int AS terminated_students
        FROM exam_sessions
        GROUP BY exam_id
      ) sess ON sess.exam_id = e.id
      LEFT JOIN (
        SELECT exam_id, COUNT(*)::int AS total_violations
        FROM violations
        GROUP BY exam_id
      ) viol ON viol.exam_id = e.id
      WHERE e.college_id = $1
      ORDER BY e.date_time DESC;
    `, [collegeId]);

    const now = new Date();
    const examSummaries = (result.rows || []).map((exam) => {
      const start = exam.date_time ? new Date(exam.date_time) : null;
      const durationMin = Number(exam.duration) || 60;
      const end = start ? new Date(start.getTime() + durationMin * 60000) : null;
      const isEnded = end ? now > end : (exam.status === 'completed');
      const isTimeLive = start && end && now >= start && now <= end;
      const isLive = !isEnded && (exam.active_students > 0 || isTimeLive);

      return {
        id: exam.id,
        title: exam.title,
        name: exam.name,
        subject: exam.subject,
        exam_code: exam.exam_code,
        status: isEnded ? 'completed' : exam.status,
        date_time: exam.date_time,
        start_time: exam.date_time,
        duration: exam.duration,
        isLive,
        stats: {
          totalSessions: exam.total_sessions,
          activeStudents: exam.active_students,
          submittedStudents: exam.submitted_students,
          terminatedStudents: exam.terminated_students,
          totalViolations: exam.total_violations,
        },
      };
    });

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
 * High-speed parallel query for specific exam live cockpit
 */
exports.getMonitoringData = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const collegeId = req.user.id;

    // Parallel fetch exam details, sessions with students, and violations
    const examPromise = pool.query(
      'SELECT * FROM exams WHERE id = $1 AND college_id = $2',
      [examId, collegeId]
    );

    const sessionsPromise = pool.query(`
      SELECT 
        s.*,
        json_build_object(
          'id', st.id,
          'name', st.name,
          'email', st.email,
          'student_id', st.student_id,
          'roll_no', st.roll_no
        ) AS students
      FROM exam_sessions s
      JOIN students st ON s.student_id = st.id
      WHERE s.exam_id = $1
      ORDER BY s.started_at DESC
    `, [examId]);

    const violationsPromise = pool.query(
      'SELECT * FROM violations WHERE exam_id = $1 ORDER BY created_at DESC LIMIT 200',
      [examId]
    );

    const [examRes, sessionsRes, violationsRes] = await Promise.all([
      examPromise,
      sessionsPromise,
      violationsPromise
    ]);

    const examData = examRes.rows[0];
    if (!examData) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    const sessions = sessionsRes.rows || [];
    const violations = violationsRes.rows || [];

    // Group violations by student
    const violationsByStudent = {};
    violations.forEach((violation) => {
      const sid = violation.student_id;
      if (!violationsByStudent[sid]) violationsByStudent[sid] = [];
      violationsByStudent[sid].push(violation);
    });

    // Format candidate list
    const candidateList = sessions.map((session) => {
      const st = session.students || {};
      const studentViolations = violationsByStudent[session.student_id] || [];
      const warningCount = studentViolations.filter((v) => v.type === 'warning').length;

      return {
        id: session.student_id,
        sessionId: session.id,
        name: st.name || 'Candidate',
        student_id: st.student_id || '',
        roll_no: st.roll_no || '',
        email: st.email || '',
        status: session.status,
        camera_status: session.camera_status || 'connected',
        screen_share_status: session.screen_share_status || 'active',
        audio_status: session.audio_status || 'normal',
        violation_count: session.violation_count || studentViolations.length,
        violations: studentViolations,
        warning_count: session.warning_count || warningCount,
        tab_switches: session.tab_switches || 0,
        multiple_faces_detected: session.multiple_faces_detected || false,
        no_face_detected: session.no_face_detected || false,
        last_ping: session.last_ping || session.started_at,
        started_at: session.started_at,
        time_remaining: session.time_remaining,
        current_question: session.current_question || 1,
        total_questions: examData.total_questions || 0,
      };
    });

    const activeCount = candidateList.filter((c) => c.status === 'active').length;
    const safeCount = candidateList.filter((c) => c.status === 'active' && c.violation_count === 0).length;
    const flaggedCount = candidateList.filter((c) => c.status === 'active' && c.violation_count > 0).length;
    const terminatedCount = candidateList.filter((c) => c.status === 'terminated').length;
    const totalWarnings = candidateList.reduce((acc, c) => acc + (c.warning_count || 0), 0);

    return res.json({
      success: true,
      data: {
        exam: examData,
        students: candidateList,
        sessions: candidateList,
        recentViolations: violations.slice(0, 30),
        stats: {
          totalStudents: candidateList.length,
          activeStudents: activeCount,
          safeStudents: safeCount,
          flaggedStudents: flaggedCount,
          totalWarnings,
          terminatedStudents: terminatedCount,
        },
      },
    });
  } catch (error) {
    console.error('Error in getMonitoringData:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving monitoring details' });
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

/**
 * POST /api/admin/exams/:id/resume-student
 * Admin override: unblock / resume a student whose session was terminated or interrupted
 */
exports.resumeStudentExam = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { studentId, resetViolations = true } = req.body;
    const collegeId = req.user.id;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    // Verify exam ownership
    const { rows: examRows } = await pool.query(
      'SELECT id, title FROM exams WHERE id = $1 AND college_id = $2',
      [examId, collegeId]
    );

    if (examRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    // Reset session back to active and clear termination flag
    const updateQuery = `
      UPDATE exam_sessions
      SET status = 'active',
          is_auto_submitted = false,
          auto_submit_reason = null,
          submitted_at = null,
          violation_count = CASE WHEN $1 THEN 0 ELSE violation_count END
      WHERE exam_id = $2 AND student_id = $3
      RETURNING id, status, violation_count;
    `;

    const { rows: updatedRows } = await pool.query(updateQuery, [
      Boolean(resetViolations),
      examId,
      studentId,
    ]);

    if (updatedRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found for this candidate' });
    }

    // Also update assignment status to started/in_progress
    await pool.query(
      "UPDATE exam_assignments SET status = 'started' WHERE exam_id = $1 AND student_id = $2",
      [examId, studentId]
    ).catch(() => {});

    // Notify real-time client via Socket.IO if connected
    const io = req.app.get('io');
    if (io) {
      io.to(`exam_${examId}`).emit('student_resumed', {
        examId,
        studentId,
        message: 'Your exam session has been unlocked by the administrator. You may resume your exam.',
      });
    }

    return res.json({
      success: true,
      message: 'Candidate session successfully resumed and unlocked.',
      data: updatedRows[0],
    });
  } catch (error) {
    console.error('Error in resumeStudentExam:', error);
    return res.status(500).json({ success: false, message: 'Failed to resume student session', error: error.message });
  }
};

