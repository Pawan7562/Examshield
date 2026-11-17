// src/pages/admin/Dashboard.js — Nexify Examina · College Admin Command Center
// Professional Executive Implementation of nexify-dashboard-v3.html
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { formatIST, isExamStartable, isExamEnded } from '../../utils/timezone';
import toast from 'react-hot-toast';
import { NexifyIcon } from '../../components/admin/NexifyIcons';
import CandidateActivityChart from '../../components/admin/CandidateActivityChart';
import '../../components/admin/NexifyDashboardTheme.css';

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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const collegeId = user?.id || '';
  const storageKey = collegeId ? `cached_admin_dashboard_${collegeId}` : null;

  const [data, setData] = useState(() => {
    try {
      if (!storageKey) return null;
      const cached = sessionStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!collegeId) return;
    adminAPI.getDashboard()
      .then((res) => {
        setData(res.data);
        if (storageKey) {
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(res.data));
          } catch (_) { }
        }
      })
      .catch(() => toast.error('Failed to load college dashboard'))
      .finally(() => setLoading(false));
  }, [collegeId, storageKey]);

  const { stats, upcomingExams } = data || {};

  const liveExam = useMemo(() => {
    return upcomingExams?.find(exam => isExamStartable(exam) && !isExamEnded(exam));
  }, [upcomingExams]);

  const collegeName = user?.collegeName || user?.college_name || user?.name || 'Pk university';

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  return (
    <div className="wrap">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <section className="head rise" style={{ '--d': 0 }}>
        <div>
          <h1>Academic Institution Command Center</h1>
          <p id="date">{formattedDate}. Welcome back, Administrator {collegeName}</p>
        </div>
        <div className="btns">
          <button className="btn" onClick={() => navigate('/admin/students')}>
            <NexifyIcon name="users" />
            <span>Enroll candidates</span>
          </button>
          <button className="btn pri" onClick={() => navigate('/admin/exams/create')}>
            <NexifyIcon name="plus" />
            <span>Schedule new exam</span>
          </button>
        </div>
      </section>

      {/* ── Active Exam Fast Launch Alert (if exam is live) ────────── */}
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
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--sf)',
                color: 'var(--good)',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <NexifyIcon name="radio" size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="bdg live">Live Invigilation</span>
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: 600, color: 'var(--tx)' }}>
                {liveExam.name || liveExam.title}
              </h3>
            </div>
          </div>
          <button
            className="btn pri"
            onClick={() => navigate(`/admin/exams/${liveExam.id}/monitor`)}
          >
            <NexifyIcon name="shield" />
            <span>Launch Live Monitor</span>
          </button>
        </section>
      )}

      {/* ── KPI Strip ──────────────────────────────────────────────── */}
      <section className="card kpis rise" style={{ '--d': 1 }} aria-label="Key metrics">
        {/* KPI 1: Enrolled Candidates */}
        <article className="kpi">
          <div className="kh">
            <span>
              <NexifyIcon name="users" />
              <span>Enrolled candidates</span>
            </span>
            <span className="tr">↗ 12%</span>
          </div>
          <div className="num">
            <AnimatedNumber value={stats?.totalStudents ?? 526} />
          </div>
          <div className="s">{stats?.totalStudents ?? 526} verified and active</div>
          <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path pathLength="1" d="M0 24 C12 22 18 25 28 18 S45 20 55 13 S75 14 85 8 S95 6 100 3" />
          </svg>
        </article>

        {/* KPI 2: Examinations set up */}
        <article className="kpi">
          <div className="kh">
            <span>
              <NexifyIcon name="file" />
              <span>Examinations set up</span>
            </span>
            <span className="tr">↗ 8%</span>
          </div>
          <div className="num">
            <AnimatedNumber value={stats?.totalExams ?? 34} />
          </div>
          <div className="s">{upcomingExams?.length ?? 0} scheduled</div>
          <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path pathLength="1" d="M0 20 C10 24 20 12 32 16 S50 8 62 14 S82 6 100 9" />
          </svg>
        </article>

        {/* KPI 3: Completed submissions */}
        <article className="kpi">
          <div className="kh">
            <span>
              <NexifyIcon name="trophy" />
              <span>Completed submissions</span>
            </span>
            <span className="tr">↗ 15%</span>
          </div>
          <div className="num">
            <AnimatedNumber value={stats?.totalResults ?? 3} />
          </div>
          <div className="s">{stats?.passRate ?? 88}% overall pass rate</div>
          <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path pathLength="1" d="M0 26 C14 26 22 20 36 21 S58 12 70 11 S90 5 100 4" />
          </svg>
        </article>

        {/* KPI 4: Integrity rating */}
        <article className="kpi">
          <div className="kh">
            <span>
              <NexifyIcon name="shield" />
              <span>Integrity rating</span>
            </span>
            <span className="tr">↗ 4%</span>
          </div>
          <div className="num">
            <AnimatedNumber value={stats?.successRate ?? 96} suffix="%" />
          </div>
          <div className="s">Clean proctoring audits</div>
          <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path pathLength="1" d="M0 14 C15 12 22 16 38 10 S60 9 72 6 S92 5 100 4" />
          </svg>
        </article>
      </section>

      {/* ── Two Column Analytics & Integrity Panels ────────────────── */}
      <section className="cols">
        {/* Left: Interactive Candidate Activity Chart */}
        <CandidateActivityChart />

        {/* Right: Proctoring Health & Audit Breakdown */}
        <article className="card pad rise proctoring-health-card" style={{ '--d': 3 }}>
          <div className="ph" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="ph-title">Proctoring health</h2>
              <p className="ph-subtitle">Based on the latest audits</p>
            </div>
          </div>

          <div className="proctoring-health-body">
            {/* Left: Donut Gauge Ring */}
            <div className="proctoring-donut-wrap">
              <svg className="proctoring-donut-svg" viewBox="0 0 120 120">
                <circle
                  className="proctoring-donut-track"
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  strokeWidth="12"
                />
                <circle
                  className="proctoring-donut-val"
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 * (1 - (stats?.successRate ?? 96) / 100)}
                />
              </svg>
              <div className="proctoring-donut-center">
                <span className="proctoring-donut-num">{stats?.successRate ?? 96}%</span>
                <span className="proctoring-donut-label">Clean audits</span>
              </div>
            </div>

            {/* Right: Colored Metric Bars */}
            <div className="proctoring-health-bars">
              <div className="ph-metric-row">
                <div className="ph-metric-info">
                  <span className="ph-metric-name">Identity verified</span>
                  <span className="ph-metric-pct">100%</span>
                </div>
                <div className="ph-metric-track">
                  <div className="ph-metric-bar blue" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="ph-metric-row">
                <div className="ph-metric-info">
                  <span className="ph-metric-name">Browser lockdown</span>
                  <span className="ph-metric-pct">97%</span>
                </div>
                <div className="ph-metric-track">
                  <div className="ph-metric-bar teal" style={{ width: '97%' }}></div>
                </div>
              </div>

              <div className="ph-metric-row">
                <div className="ph-metric-info">
                  <span className="ph-metric-name">Behavior flags cleared</span>
                  <span className="ph-metric-pct">92%</span>
                </div>
                <div className="ph-metric-track">
                  <div className="ph-metric-bar purple" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* ── Institutional Management Hub ───────────────────────────── */}
      <h2 className="rise" style={{ '--d': 4, marginBottom: '-6px' }}>
        Institutional management hub
      </h2>

      <section className="hubs">
        <button
          className="card hub rise"
          style={{ '--d': 5 }}
          onClick={() => navigate('/admin/students')}
        >
          <div className="ico">
            <NexifyIcon name="users" />
          </div>
          <div>
            <b>Candidate registry</b>
            <small>Enroll students, bulk upload CSV, and issue exam keys</small>
          </div>
          <span className="go">
            <NexifyIcon name="arrow" />
          </span>
        </button>

        <button
          className="card hub rise"
          style={{ '--d': 6 }}
          onClick={() => navigate('/admin/exams')}
        >
          <div className="ico">
            <NexifyIcon name="file" />
          </div>
          <div>
            <b>Examinations center</b>
            <small>Configure schedules, duration, and AI proctoring rules</small>
          </div>
          <span className="go">
            <NexifyIcon name="arrow" />
          </span>
        </button>

        <button
          className="card hub rise"
          style={{ '--d': 7 }}
          onClick={() => navigate('/admin/ai-questions')}
        >
          <div className="ico">
            <NexifyIcon name="brain" />
          </div>
          <div>
            <b>AI question studio</b>
            <small>Generate high-rigor MCQs and coding challenges</small>
          </div>
          <span className="go">
            <NexifyIcon name="arrow" />
          </span>
        </button>
      </section>

      {/* ── Scheduled & Active Examination Queue ───────────────────── */}
      <section className="card pad rise" style={{ '--d': 8 }}>
        <div className="ph">
          <h2>Scheduled &amp; active examination queue</h2>
          <button className="link" onClick={() => navigate('/admin/exams')}>
            <NexifyIcon name="eye" />
            <span>Manage all assessments</span>
          </button>
        </div>

        <div className="tbl">
          <div className="th">
            <span>Examination</span>
            <span>Schedule</span>
            <span>Candidates</span>
            <span>Proctoring</span>
            <span>Status</span>
          </div>

          {upcomingExams && upcomingExams.length > 0 ? (
            upcomingExams.map((exam) => {
              const isEnded = isExamEnded(exam);
              const isLive = isExamStartable(exam) && !isEnded;
              const isCompleted = isEnded || exam.status === 'completed';

              return (
                <div
                  key={exam.id}
                  className="tr-row"
                  onClick={() => navigate(isLive ? `/admin/exams/${exam.id}/monitor` : '/admin/exams')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--tx)' }}>
                      {exam.name || exam.title}
                    </span>
                    {exam.exam_code && (
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'var(--mu)',
                        background: 'var(--s2)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        width: 'fit-content'
                      }}>
                        KEY: {exam.exam_code}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--mu)' }}>
                    {formatIST(exam.date_time, 'dateTime')}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--tx)' }}>
                    {exam.duration} mins · {exam.student_count ?? 'All assigned'}
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
                      AI Proctoring
                    </span>
                  </div>

                  <div>
                    {isLive ? (
                      <span className="bdg live">Live</span>
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
              <p>Schedule your first assessment to monitor candidate telemetry and AI proctoring in real time.</p>
              <button className="btn pri" onClick={() => navigate('/admin/exams/create')}>
                <NexifyIcon name="plus" />
                <span>Schedule new exam</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
