// controllers/liveMonitoringController.js
const { supabase } = require('../config/supabase');
const { io } = require('socket.io');

/**
 * GET /api/admin/exams/:id/monitor
 * Get live monitoring data for an exam
 */
exports.getMonitoringData = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const collegeId = req.user.id;

    // Verify exam belongs to college
    const examResult = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examResult.error) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get all active sessions for this exam
    const sessionsResult = await supabase
      .from('exam_sessions')
      .select(`
        *,
        student:students(id, name, email, student_id)
      `)
      .eq('exam_id', examId)
      .in('status', ['active', 'submitted']);

    const sessions = sessionsResult.data || [];

    // Get violations for all students in this exam
    const violationsResult = await supabase
      .from('violations')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: false })
      .limit(100);

    const violations = violationsResult.data || [];

    // Group violations by student
    const violationsByStudent = {};
    violations.forEach(violation => {
      if (!violationsByStudent[violation.student_id]) {
        violationsByStudent[violation.student_id] = [];
      }
      violationsByStudent[violation.student_id].push(violation);
    });

    // Calculate stats
    const stats = {
      totalStudents: sessions.length,
      activeStudents: sessions.filter(s => s.status === 'active').length,
      submittedStudents: sessions.filter(s => s.status === 'submitted').length,
      terminatedStudents: sessions.filter(s => s.status === 'terminated').length,
      totalWarnings: violations.filter(v => v.type === 'warning').length,
      totalViolations: violations.length
    };

    res.json({
      success: true,
      data: {
        exam: examResult.data,
        students: sessions.map(session => ({
          id: session.student_id,
          name: session.student.name,
          email: session.student.email,
          studentId: session.student.student_id,
          session_id: session.id,
          status: session.status,
          started_at: session.started_at,
          submitted_at: session.submitted_at,
          violation_count: violationsByStudent[session.student_id]?.length || 0,
          answers_count: 0, // Would need to query answers table
          activity: {
            status: session.status,
            currentQuestion: 0, // Would need to track this
            totalQuestions: 0, // Would need to get from exam
            timeSpent: session.started_at ? 
              Math.floor((new Date() - new Date(session.started_at)) / 1000) : 0,
            cameraActive: true, // Would need to track this
            lastSeen: new Date()
          }
        })),
        violations: violationsByStudent,
        stats
      }
    });

  } catch (error) {
    console.error('Error getting monitoring data:', error);
    res.status(500).json({ success: false, message: 'Failed to get monitoring data' });
  }
};

/**
 * POST /api/admin/exams/:id/warn-student
 * Send warning to a student
 */
exports.sendWarning = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { studentId, message, severity = 'medium' } = req.body;
    const collegeId = req.user.id;

    // Verify exam belongs to college
    const examResult = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examResult.error) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Create warning record
    const warningResult = await supabase
      .from('violations')
      .insert({
        exam_id: examId,
        student_id: studentId,
        type: 'warning',
        severity: severity,
        message: message,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (warningResult.error) {
      return res.status(500).json({ success: false, message: 'Failed to create warning' });
    }

    // Emit real-time warning to student via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`student-${studentId}`).emit('warning-received', {
        examId,
        message,
        severity,
        timestamp: new Date().toISOString()
      });

      // Also emit to monitoring room
      io.to(`exam-monitoring-${examId}`).emit('warning-sent', {
        examId,
        studentId,
        message,
        severity,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Warning sent successfully',
      data: warningResult.data
    });

  } catch (error) {
    console.error('Error sending warning:', error);
    res.status(500).json({ success: false, message: 'Failed to send warning' });
  }
};

/**
 * POST /api/admin/exams/:id/terminate-student
 * Terminate a student's exam
 */
exports.terminateStudentExam = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { studentId, reason } = req.body;
    const collegeId = req.user.id;

    // Verify exam belongs to college
    const examResult = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examResult.error) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get student's session
    const sessionResult = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (sessionResult.error) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    // Update session status to terminated
    const updateResult = await supabase
      .from('exam_sessions')
      .update({
        status: 'terminated',
        terminated_at: new Date().toISOString(),
        termination_reason: reason
      })
      .eq('id', sessionResult.data.id);

    if (updateResult.error) {
      return res.status(500).json({ success: false, message: 'Failed to terminate exam' });
    }

    // Create termination record
    const violationResult = await supabase
      .from('violations')
      .insert({
        exam_id: examId,
        student_id: studentId,
        type: 'termination',
        severity: 'high',
        message: reason,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Emit real-time termination to student via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`student-${studentId}`).emit('exam-terminated', {
        examId,
        reason,
        timestamp: new Date().toISOString()
      });

      // Also emit to monitoring room
      io.to(`exam-monitoring-${examId}`).emit('student-terminated', {
        examId,
        studentId,
        reason,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Student exam terminated successfully',
      data: {
        sessionId: sessionResult.data.id,
        terminatedAt: new Date().toISOString(),
        reason
      }
    });

  } catch (error) {
    console.error('Error terminating student exam:', error);
    res.status(500).json({ success: false, message: 'Failed to terminate exam' });
  }
};

/**
 * GET /api/admin/exams/:id/student-activity/:studentId
 * Get detailed activity for a specific student
 */
exports.getStudentActivity = async (req, res) => {
  try {
    const { id: examId, studentId } = req.params;
    const collegeId = req.user.id;

    // Verify exam belongs to college
    const examResult = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examResult.error) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get student session
    const sessionResult = await supabase
      .from('exam_sessions')
      .select(`
        *,
        student:students(id, name, email, student_id)
      `)
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .single();

    if (sessionResult.error) {
      return res.status(404).json({ success: false, message: 'Student session not found' });
    }

    // Get student's violations
    const violationsResult = await supabase
      .from('violations')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Get student's answers
    const answersResult = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionResult.data.id)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      data: {
        session: sessionResult.data,
        violations: violationsResult.data || [],
        answers: answersResult.data || [],
        activity: {
          status: sessionResult.data.status,
          currentQuestion: answersResult.data?.length || 0,
          totalQuestions: examResult.data.total_questions || 0,
          timeSpent: sessionResult.data.started_at ? 
            Math.floor((new Date() - new Date(sessionResult.data.started_at)) / 1000) : 0,
          lastActivity: answersResult.data?.[0]?.created_at || sessionResult.data.started_at
        }
      }
    });

  } catch (error) {
    console.error('Error getting student activity:', error);
    res.status(500).json({ success: false, message: 'Failed to get student activity' });
  }
};

/**
 * POST /api/admin/exams/:id/camera-feed/:studentId
 * Handle camera feed updates (for proctoring)
 */
exports.updateCameraFeed = async (req, res) => {
  try {
    const { id: examId, studentId } = req.params;
    const { imageData, timestamp } = req.body;
    const collegeId = req.user.id;

    // Verify exam belongs to college
    const examResult = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('college_id', collegeId)
      .single();

    if (examResult.error) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // In a real implementation, you would store the camera feed
    // For now, we'll just emit it via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`exam-monitoring-${examId}`).emit('camera-feed', {
        examId,
        studentId,
        imageData,
        timestamp: timestamp || new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Camera feed updated'
    });

  } catch (error) {
    console.error('Error updating camera feed:', error);
    res.status(500).json({ success: false, message: 'Failed to update camera feed' });
  }
};
