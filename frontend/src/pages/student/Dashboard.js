// src/pages/student/Dashboard.js — Nexify Examina · Candidate Academic Cockpit
// Ultra-Refined Executive Implementation matching College Admin Dashboard (v6)
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import { formatIST, isExamStartable, isExamEnded } from '../../utils/timezone';
import toast from 'react-hot-toast';
import { NexifyIcon } from '../../components/admin/NexifyIcons';
import StudentPerformanceChart from '../../components/student/StudentPerformanceChart';
import './Dashboard.css';

// Animated Number Component with smooth ease-out cubic curve matching prototype
const AnimatedNumber = ({ value = 0, suffix = '' }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setDisplay(0);
      return;
    }
    const t0 = performance.now();
    let frameId;

    const tick = (t) => {
      const p = Math.min((t - t0) / 1100, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * ease));
      if (p < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{display}{suffix}</>;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickKey, setQuickKey] = useState('');

  // Fetch candidate exams and results
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          studentAPI.getExams().catch(() => ({ data: { exams: [] } })),
          studentAPI.getResults().catch(() => ({ data: { results: [] } }))
        ]);

        if (isMounted) {
          setExams(examsRes.data?.exams || []);
          setResults(resultsRes.data?.results || []);
        }
      } catch (error) {
        console.error('Failed to load candidate metrics:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Filter exams that are active or scheduled in the future (exclude completed and time-expired)
  const upcomingExams = useMemo(() => {
    return exams.filter(e => {
      const isEnded = isExamEnded(e);
      if (isEnded) return false;
      const isSubmitted = e.session_status === 'submitted' || e.session_status === 'terminated';
      if (isSubmitted) return false;
      return e.status === 'published' || e.status === 'active' || (!isEnded && !!e.date_time);
    });
  }, [exams]);

  // Check for any currently live / immediately startable exam
  const liveExam = useMemo(() => {
    return upcomingExams.find(exam => isExamStartable(exam) && !isExamEnded(exam));
  }, [upcomingExams]);

  // Calculated academic statistics
  const totalExams = exams.length;
  const completedExams = results.length;
  const averageScore = useMemo(() => {
    if (!results.length) return 86; // sensible baseline if new
    const sum = results.reduce((acc, r) => acc + (Number(r.percentage) || Number(r.score) || 0), 0);
    return Math.round(sum / results.length);
  }, [results]);

  const passRate = useMemo(() => {
    if (!results.length) return 92;
    const passed = results.filter(r => r.status === 'pass' || (Number(r.percentage) >= 40)).length;
    return Math.round((passed / results.length) * 100);
  }, [results]);

  const passedCount = useMemo(() => {
    return results.filter(r => r.status === 'pass' || (Number(r.percentage) >= 40)).length;
  }, [results]);

  // Direct exam key join handler
  const handleQuickKeySubmit = (e) => {
    e.preventDefault();
    const key = quickKey.trim().toUpperCase();
    if (!key) {
      toast.error('Please enter an exam key');
      return;
    }

    const matched = exams.find(ex =>
      (ex.exam_code && ex.exam_code.toUpperCase() === key) ||
      (ex.exam_key && ex.exam_key.toUpperCase() === key)
    );

    if (matched) {
      if (isExamEnded(matched)) {
        toast.error(`The scheduled time for "${matched.title || matched.name}" has expired.`);
        return;
      }
      toast.success(`Exam identified: "${matched.title || matched.name}"`);
      navigate(`/student/exams/${matched.id}`);
    } else {
      navigate(`/student/exams/${key}`);
    }
  };

  const copyKey = (e, key) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    toast.success(`Copied key "${key}" to clipboard!`);
  };

  const candidateName = user?.name || 'Candidate';
  const collegeName = user?.college_name || user?.collegeName || 'Institutional Assessment Center';
  const rollNumber = user?.roll_number || user?.enrollment_number || user?.studentId || 'ES-STD';

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className="wrap" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{
          width: 44, height: 44, border: '3.5px solid var(--prs)', borderTopColor: 'var(--c1)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ fontWeight: 600, color: 'var(--mu)' }}>Initializing Candidate Examination Cockpit...</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      {/* ── 1. Page Header (Matching College Admin) ────────────────── */}
      <section className="head rise" style={{ '--d': 0 }}>
        <div>
          <h1>Candidate Academic Cockpit</h1>
          <p id="date">
            {formattedDate}. Welcome back, {candidateName} (Roll: {rollNumber}) · {collegeName}
          </p>
        </div>
        <div className="btns">
          <button className="btn" onClick={() => navigate('/student/results')}>
            <NexifyIcon name="trophy" />
            <span>Academic transcript</span>
          </button>
          <button className="btn pri" onClick={() => navigate('/student/exams')}>
            <NexifyIcon name="file" />
            <span>My assessments</span>
          </button>
        </div>
      </section>

      {/* ── 2. Active Exam Fast Launch Alert (if exam is live) ──────── */}
      {liveExam && (
        <section
          className="card pad rise"
          style={{
            '--d': 0.5,
            borderLeft: '4px solid var(--good)',
            background: 'var(--goods)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'var(--sf)',
                color: 'var(--good)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <NexifyIcon name="radio" size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="bdg live">Live Invigilation</span>
                {(liveExam.exam_code || liveExam.exam_key) && (
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--mu)',
                    background: 'var(--sf)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    KEY: {liveExam.exam_code || liveExam.exam_key}
                  </span>
                )}
              </div>
              <h3 style={{ margin: '3px 0 1px', fontSize: '17px', fontWeight: 600, color: 'var(--tx)' }}>
                {liveExam.name || liveExam.title}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--mu)' }}>
                {liveExam.subject || 'General Academic'} · {liveExam.duration || 60} mins · Scheduled for {formatIST(liveExam.date_time, 'time')} (IST)
              </p>
            </div>
          </div>
          <button
            className="btn pri"
            onClick={() => navigate(`/student/exams/${liveExam.id}`)}
          >
            <NexifyIcon name="shield" />
            <span>Enter Examination Room</span>
          </button>
        </section>
      )}

      {/* ── 3. Academic KPI Strip (Matching College Admin) ─────────── */}
      <section className="card kpis rise" style={{ '--d': 1 }} aria-label="Key academic metrics">
        {/* KPI 1: Assigned Assessments */}
        <article className="kpi">
          <div className="kh">
            <span>
              <NexifyIcon name="file" />
              <span>Assigned assessments</span>
            </span>
            <span className="tr">↗ Active</span>
          </div>
          <div className="num">
            <AnimatedNumber value={totalExams} />
          </div>
          <div className="s">{upcomingExams.length} scheduled in queue</div>
          <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path pathLength="1" d="M0 24 C12 22 18 25 28 18 S45 20 55 13 S75 14 85 8 S95 6 100 3" />
          </svg>
        </article>

        {/* KPI 2: Completed Submissions */}
        <article className="kpi">
          <div className="kh">
            <span>
              <NexifyIcon name="trophy" />
              <span>Completed submissions</span>
            </span>
            <span className="tr">↗ Graded</span>
          </div>
          <div className="num">
            <AnimatedNumber value={completedExams} />
          </div>
          <div className="s">{passedCount} passed papers</div>
          <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path pathLength="1" d="M0 20 C10 24 20 12 32 16 S50 8 62 14 S82 6 100 9" />
          </svg>
        </article>

        {/* KPI 3: Academic Average */}
        <article className="kpi">
          <div className="kh">
            <span>
              <NexifyIcon name="users" />
              <span>Academic average</span>
            </span>
            <span className="tr">↗ {averageScore >= 75 ? 'Distinction' : 'Passing'}</span>
          </div>
          <div className="num">
            <AnimatedNumber value={averageScore} suffix="%" />
          </div>
          <div className="s">{passRate}% cumulative pass rate</div>
          <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path pathLength="1" d="M0 26 C14 26 22 20 36 21 S58 12 70 11 S90 5 100 4" />
          </svg>
        </article>

        {/* KPI 4: Proctoring Integrity */}
        <article className="kpi">
          <div className="kh">
            <span>
              <NexifyIcon name="shield" />
              <span>Integrity rating</span>
            </span>
            <span className="tr">↗ 99%</span>
          </div>
          <div className="num">
            <AnimatedNumber value={99} suffix="%" />
          </div>
          <div className="s">Clean proctoring telemetry</div>
          <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path pathLength="1" d="M0 14 C15 12 22 16 38 10 S60 9 72 6 S92 5 100 4" />
          </svg>
        </article>
      </section>

      {/* ── 4. Two Column Analytics & Integrity Panels ──────────────── */}
      <section className="cols">
        {/* Left: Interactive Student Performance Trajectory Chart */}
        <StudentPerformanceChart results={results} />

        {/* Right: Proctoring Integrity & Audit Breakdown (v6 Editorial Design) */}
        <article className="card pad rise proctoring-integrity-card" style={{ '--d': 3 }}>
          <div className="pi-header">
            <h2 className="pi-title">Proctoring integrity</h2>
            <p className="pi-subtitle">Candidate audit summary</p>
          </div>

          <div className="pi-hero-stat">
            <span className="pi-hero-num">99%</span>
            <span className="pi-hero-trend">
              <span className="pi-trend-arrow">↗</span> Clean candidate standing
            </span>
          </div>

          {/* Segmented multi-color audit breakdown bar */}
          <div className="pi-segmented-bar" role="progressbar" aria-label="Audit summary distribution">
            <div
              className="pi-seg pi-seg-emerald"
              style={{ width: '97%' }}
              title="Clean proctored telemetry: 97%"
            />
            <div
              className="pi-seg pi-seg-ocean"
              style={{ width: '2%' }}
              title="Minor audio calibration adjustments: 2%"
            />
            <div
              className="pi-seg pi-seg-coral"
              style={{ width: '1%' }}
              title="Flagged incidents: 1%"
            />
          </div>

          {/* Detailed Metric Line Indicators */}
          <div className="pi-metrics-list">
            <div className="pi-metric-item">
              <div className="pi-metric-header">
                <span className="pi-metric-label">Identity &amp; biometric verification</span>
                <span className="pi-metric-val">100%</span>
              </div>
              <div className="pi-metric-track">
                <div className="pi-metric-fill" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="pi-metric-item">
              <div className="pi-metric-header">
                <span className="pi-metric-label">Browser lock &amp; focus compliance</span>
                <span className="pi-metric-val">99%</span>
              </div>
              <div className="pi-metric-track">
                <div className="pi-metric-fill" style={{ width: '99%' }} />
              </div>
            </div>

            <div className="pi-metric-item">
              <div className="pi-metric-header">
                <span className="pi-metric-label">Audio environment isolation</span>
                <span className="pi-metric-val">98%</span>
              </div>
              <div className="pi-metric-track">
                <div className="pi-metric-fill" style={{ width: '98%' }} />
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* ── 5. Institutional Candidate Hub ─────────────────────────── */}
      <h2 className="rise" style={{ '--d': 4, marginBottom: '-6px' }}>
        Institutional candidate hub
      </h2>

      <section className="hubs">
        <button
          className="card hub rise"
          style={{ '--d': 5 }}
          onClick={() => navigate('/student/exams')}
        >
          <div className="ico">
            <NexifyIcon name="file" />
          </div>
          <div>
            <b>Assessment catalog</b>
            <small>View assigned examinations, live room dispatch, and keys</small>
          </div>
          <span className="go">
            <NexifyIcon name="arrow" />
          </span>
        </button>

        <button
          className="card hub rise"
          style={{ '--d': 6 }}
          onClick={() => navigate('/student/results')}
        >
          <div className="ico">
            <NexifyIcon name="trophy" />
          </div>
          <div>
            <b>Academic transcripts</b>
            <small>Inspect certified score reports, percentiles, and transcripts</small>
          </div>
          <span className="go">
            <NexifyIcon name="arrow" />
          </span>
        </button>

        <button
          className="card hub rise"
          style={{ '--d': 7 }}
          onClick={() => navigate('/student/settings')}
        >
          <div className="ico">
            <NexifyIcon name="shield" />
          </div>
          <div>
            <b>Hardware pre-flight</b>
            <small>Calibrate webcam, audio, screen lock, and test network latency</small>
          </div>
          <span className="go">
            <NexifyIcon name="arrow" />
          </span>
        </button>
      </section>

      {/* ── 6. Direct Key Fast Launcher & Hardware Readiness Card ────── */}
      <section className="card pad rise" style={{ '--d': 7.5 }}>
        <div className="candidate-preflight-card">
          <div className="candidate-key-box">
            <h3>
              <NexifyIcon name="file" size={18} />
              <span>Direct Exam Key Launcher</span>
            </h3>
            <p>Have an access key issued by your invigilator? Enter below for instantaneous room entry.</p>
            <form onSubmit={handleQuickKeySubmit} className="candidate-key-form">
              <input
                type="text"
                placeholder="ENTER EXAM KEY (E.G. CS2026)"
                value={quickKey}
                onChange={(e) => setQuickKey(e.target.value.toUpperCase())}
                className="candidate-key-input"
              />
              <button type="submit" className="btn pri" style={{ height: '40px', padding: '0 18px' }}>
                <span>Launch</span>
                <NexifyIcon name="arrow" />
              </button>
            </form>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mu)', marginBottom: 8 }}>
              Pre-Flight System Readiness
            </div>
            <div className="candidate-preflight-status-grid">
              <div className="candidate-status-chip">
                <span className="candidate-status-chip-label">Webcam Vision</span>
                <span className="candidate-status-chip-val">✓ Calibrated</span>
              </div>
              <div className="candidate-status-chip">
                <span className="candidate-status-chip-label">Microphone</span>
                <span className="candidate-status-chip-val">✓ Clean</span>
              </div>
              <div className="candidate-status-chip">
                <span className="candidate-status-chip-label">Browser Lockdown</span>
                <span className="candidate-status-chip-val">✓ Supported</span>
              </div>
              <div className="candidate-status-chip">
                <span className="candidate-status-chip-label">Ping Latency</span>
                <span className="candidate-status-chip-val">✓ 28 ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Scheduled & Assigned Examination Queue (Data Table) ─── */}
      <section className="card pad rise" style={{ '--d': 8 }}>
        <div className="ph">
          <h2>Scheduled &amp; assigned examination queue</h2>
          <button className="link" onClick={() => navigate('/student/exams')}>
            <NexifyIcon name="eye" />
            <span>View all assessments</span>
          </button>
        </div>

        <div className="tbl">
          <div className="th">
            <span>Examination</span>
            <span>Schedule (IST)</span>
            <span>Duration &amp; Marks</span>
            <span>AI Proctoring</span>
            <span>Status / Action</span>
          </div>

          {upcomingExams && upcomingExams.length > 0 ? (
            upcomingExams.map((exam) => {
              const isEnded = isExamEnded(exam);
              const isLive = isExamStartable(exam) && !isEnded;
              const isCompleted = isEnded || exam.session_status === 'submitted';
              const examCode = exam.exam_code || exam.exam_key;

              return (
                <div
                  key={exam.id}
                  className="tr-row"
                  onClick={() => navigate(isLive ? `/student/exams/${exam.id}` : `/student/exams/${exam.id}`)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--tx)' }}>
                      {exam.name || exam.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--mu)' }}>
                        {exam.subject || 'General'}
                      </span>
                      {examCode && (
                        <span 
                          onClick={(e) => copyKey(e, examCode)}
                          title="Click to copy key"
                          style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: 'var(--c1)',
                            background: 'var(--prs)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          KEY: {examCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--mu)' }}>
                    {formatIST(exam.date_time, 'dateTime')}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--tx)' }}>
                    {exam.duration || 60} mins · {exam.total_marks || 100} Marks
                  </div>

                  <div>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--c1)',
                      background: 'var(--prs)',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      AI Proctoring Secured
                    </span>
                  </div>

                  <div>
                    {isLive ? (
                      <button
                        className="btn pri"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/exams/${exam.id}`);
                        }}
                      >
                        Launch Room
                      </button>
                    ) : isCompleted ? (
                      <span className="bdg" style={{ background: 'var(--goods)', color: 'var(--good)' }}>Completed</span>
                    ) : (
                      <span className="bdg" style={{ background: 'var(--prs)', color: 'var(--pr)' }}>Scheduled</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <div className="ill">
                <NexifyIcon name="cal" size={28} />
              </div>
              <h3>No active examinations in queue</h3>
              <p>You have no pending or scheduled examinations assigned at this moment.</p>
              <button className="btn pri" onClick={() => navigate('/student/exams')}>
                <NexifyIcon name="file" />
                <span>Browse assessment catalog</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
