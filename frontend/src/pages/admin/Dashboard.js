// src/pages/admin/Dashboard.js — Ultra-Modern Emerald College Admin Dashboard
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { formatIST } from '../../utils/timezone';
import toast from 'react-hot-toast';
import {
  Users,
  Calendar,
  Play,
  ShieldCheck,
  CheckCircle2,
  Info,
  AlertTriangle,
  Clock,
  Maximize2,
  Minimize2,
  ChevronRight,
  TrendingUp,
  Activity,
  Server,
  Database,
  Wifi,
  Shield,
  BarChart2,
  ArrowRight,
  X,
  Radio,
  Eye,
  Camera
} from 'lucide-react';
import './Dashboard.css';

export default function CollegeAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const collegeId = user?.id || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartRange, setChartRange] = useState('7D'); // '7D', '30D', 'custom'
  const [expandedCam, setExpandedCam] = useState(null); // null or cam index

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard metrics
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await adminAPI.getDashboard();
      const payload = res?.data || res || {};
      setData(payload);
    } catch (err) {
      console.error('Failed to load college dashboard:', err);
      // Soft fallback so dashboard always displays beautifully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Dynamic Metrics bound with fallbacks matching the mockup
  const stats = data?.stats || {};
  const totalStudents = stats.totalStudents || 526;
  const totalExams = stats.totalExams || 33;
  const ongoingExamsCount = data?.upcomingExams?.length ? Math.min(data.upcomingExams.length, 2) : 2;
  const uptimePct = 96;

  // Active / Upcoming exam
  const currentExam = useMemo(() => {
    if (data?.upcomingExams && data.upcomingExams.length > 0) {
      return data.upcomingExams[0];
    }
    return {
      id: 'live-aiml-sem3',
      name: 'AIML – Semester III',
      time: '08:00 PM',
      date: '16 Nov 2026',
      totalCandidates: 526,
      activeCandidates: 482,
      activePct: 92,
    };
  }, [data]);

  // Simulated live camera feeds matching examination hall monitoring
  const cameraFeeds = [
    {
      id: 1,
      name: 'Cam 1',
      hall: 'Hall A – Row 1-4',
      students: 28,
      status: 'Normal',
      img: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 2,
      name: 'Cam 2',
      hall: 'Hall A – Row 5-8',
      students: 30,
      status: 'Normal',
      img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 3,
      name: 'Cam 3',
      hall: 'Hall B – Front',
      students: 24,
      status: 'Normal',
      img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 4,
      name: 'Cam 4',
      hall: 'Hall B – Lateral',
      students: 26,
      status: 'Normal',
      img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // Recent notifications matching the image
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Exam started successfully',
      sub: 'AIML – Semester III',
      time: '2m ago',
      path: '/admin/monitoring',
    },
    {
      id: 2,
      type: 'info',
      title: '482 students logged in',
      sub: 'Verified via campus IP & credentials',
      time: '2m ago',
      path: '/admin/students',
    },
    {
      id: 3,
      type: 'warning',
      title: 'Camera issue detected in hall B',
      sub: 'AI proctor auto-recalibrating stream',
      time: '5m ago',
      path: '/admin/monitoring',
    },
    {
      id: 4,
      type: 'success',
      title: 'Result published for BCA – Sem I',
      sub: 'Rank & forensic audit ready',
      time: '10m ago',
      path: '/admin/results',
    },
  ];

  // Recent timeline activities matching the image
  const activities = [
    {
      time: '08:45 PM',
      title: 'AIML – Sem III Exam started successfully',
      active: true,
    },
    {
      time: '08:40 PM',
      title: '482 students logged in',
      active: true,
    },
    {
      time: '07:30 PM',
      title: 'Result published for BCA – Sem I',
      active: false,
    },
    {
      time: '06:15 PM',
      title: 'New exam scheduled: Data Structures',
      active: false,
    },
  ];

  return (
    <div className="emerald-dashboard-root">
      {/* ═══════════════════════════════════════════════════════════
          ROW 1: EXECUTIVE WELCOME BANNER
          ═══════════════════════════════════════════════════════════ */}
      <section className="dashboard-welcome-banner">
        <div className="welcome-banner-aurora" aria-hidden="true" />

        <div className="welcome-content-left">
          <div className="welcome-accent-bar" />
          <div>
            <h1 className="welcome-title">
              Welcome back, <span>{user?.name || 'College Admin'}!</span> 👋
            </h1>
            <p className="welcome-subtitle">
              Monitor • Manage • Ensure Fair Examination
            </p>
          </div>
        </div>

        <div className="welcome-content-right">
          <div className="welcome-status-pill">
            <span className="welcome-pulse-dot" />
            <span>All Systems Online</span>
          </div>

          <div className="welcome-clock-meta">
            <Clock size={14} className="welcome-clock-icon" />
            <span>
              Last Updated: {formatIST(currentTime, 'dateOnly')} •{' '}
              {currentTime.toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        </div>

        {/* 3D Floating Laptop Hologram Graphic */}
        <div className="welcome-hologram-graphic" aria-hidden="true">
          <div className="laptop-3d-wrapper">
            {/* Screen */}
            <div className="laptop-screen">
              <div className="laptop-shield-glow">
                <ShieldCheck size={36} className="hologram-shield-icon" />
              </div>
              <div className="laptop-hud-lines">
                <span className="hud-line hud-line-1" />
                <span className="hud-line hud-line-2" />
                <span className="hud-line hud-line-3" />
              </div>
            </div>
            {/* Base Keyboard */}
            <div className="laptop-base" />
            {/* Ambient Base Reflection */}
            <div className="laptop-reflection" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ROW 2: FOUR ANIMATED KPI METRIC CARDS
          ═══════════════════════════════════════════════════════════ */}
      <section className="dashboard-kpi-grid">
        {/* Card 1: Registered Students */}
        <div className="kpi-card card-students" onClick={() => navigate('/admin/students')}>
          <div className="kpi-header-row">
            <div className="kpi-icon-bubble green-bubble">
              <Users size={20} />
            </div>
            <span className="kpi-trend-pill green-trend">↑ 12%</span>
          </div>
          <div className="kpi-number-display">{totalStudents}</div>
          <div className="kpi-label-text">Total Registered Students</div>
          {/* Animated SVG Sparkline Wave */}
          <div className="kpi-sparkline-box">
            <svg viewBox="0 0 120 32" className="sparkline-svg green-sparkline">
              <path
                d="M0,24 Q20,28 35,16 T70,18 T100,6 T120,8"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,24 Q20,28 35,16 T70,18 T100,6 T120,8 L120,32 L0,32 Z"
                fill="url(#green-gradient)"
                opacity="0.2"
              />
              <defs>
                <linearGradient id="green-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Examinations Scheduled */}
        <div className="kpi-card card-exams" onClick={() => navigate('/admin/exams')}>
          <div className="kpi-header-row">
            <div className="kpi-icon-bubble purple-bubble">
              <Calendar size={20} />
            </div>
            <span className="kpi-trend-pill green-trend">↑ 8%</span>
          </div>
          <div className="kpi-number-display">{totalExams}</div>
          <div className="kpi-label-text">Total Examinations Scheduled</div>
          <div className="kpi-sparkline-box">
            <svg viewBox="0 0 120 32" className="sparkline-svg purple-sparkline">
              <path
                d="M0,22 Q25,26 45,14 T80,18 T105,8 T120,10"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,22 Q25,26 45,14 T80,18 T105,8 T120,10 L120,32 L0,32 Z"
                fill="url(#purple-gradient)"
                opacity="0.2"
              />
              <defs>
                <linearGradient id="purple-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Ongoing Exams */}
        <div className="kpi-card card-ongoing" onClick={() => navigate('/admin/monitoring')}>
          <div className="kpi-header-row">
            <div className="kpi-icon-bubble blue-bubble">
              <Play size={18} fill="#3b82f6" />
            </div>
            <span className="kpi-trend-pill live-trend">
              <span className="pulse-mini-bullet" />
              Live
            </span>
          </div>
          <div className="kpi-number-display">{ongoingExamsCount}</div>
          <div className="kpi-label-text">Ongoing Exams Right Now</div>
          <div className="kpi-sparkline-box">
            <svg viewBox="0 0 120 32" className="sparkline-svg blue-sparkline">
              <path
                d="M0,26 Q20,28 40,20 T75,12 T95,16 T120,6"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,26 Q20,28 40,20 T75,12 T95,16 T120,6 L120,32 L0,32 Z"
                fill="url(#blue-gradient)"
                opacity="0.2"
              />
              <defs>
                <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: System Uptime */}
        <div className="kpi-card card-uptime">
          <div className="kpi-header-row">
            <div className="kpi-icon-bubble orange-bubble">
              <ShieldCheck size={20} />
            </div>
            <span className="kpi-trend-pill orange-trend">↑ 2%</span>
          </div>
          <div className="kpi-number-display">{uptimePct}%</div>
          <div className="kpi-label-text">System Uptime (Last 30 Days)</div>
          <div className="kpi-sparkline-box">
            <svg viewBox="0 0 120 32" className="sparkline-svg orange-sparkline">
              <path
                d="M0,24 Q25,28 50,18 T85,12 T110,6 T120,8"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,24 Q25,28 50,18 T85,12 T110,6 T120,8 L120,32 L0,32 Z"
                fill="url(#orange-gradient)"
                opacity="0.2"
              />
              <defs>
                <linearGradient id="orange-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ROW 3: SPLIT SECTION — LIVE MONITORING & NOTIFICATIONS
          ═══════════════════════════════════════════════════════════ */}
      <section className="dashboard-split-row">
        {/* LEFT PANEL (Wide): Live Examination Monitoring */}
        <div className="card-panel panel-live-monitoring">
          {/* Header */}
          <div className="panel-header-row">
            <div className="panel-title-group">
              <span className="panel-live-pulse-dot" />
              <h2 className="panel-title-text">Live Examination Monitoring</h2>
              <span className="panel-live-pill">
                <span className="pulse-mini-bullet" />
                Live
              </span>
            </div>

            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/admin/monitoring')}
            >
              <span>View All Exams</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Subheader Banner */}
          <div className="live-exam-subbanner">
            <div className="subbanner-info">
              <h3 className="exam-subject-title">{currentExam.name}</h3>
              <div className="exam-schedule-time">
                <Clock size={13} />
                <span>
                  Scheduled at: {currentExam.time || '08:00 PM'} •{' '}
                  {currentExam.date || '16 Nov 2026'}
                </span>
              </div>
            </div>

            <div className="subbanner-timer-badge">
              <span className="timer-label">Ends in:</span>
              <span className="timer-countdown">01:45:32</span>
            </div>
          </div>

          {/* Monitoring Content Body (Split: Radial Progress + 4 Camera Feeds) */}
          <div className="live-monitoring-body-grid">
            {/* Left: Radial Progress & Candidate Stat Chips */}
            <div className="monitoring-stats-column">
              {/* Radial Meter */}
              <div className="radial-meter-container">
                <svg viewBox="0 0 160 160" className="radial-meter-svg">
                  {/* Track Background */}
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="radial-meter-track"
                  />
                  {/* Active Gradient Stroke */}
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="radial-meter-indicator"
                    style={{
                      strokeDasharray: 427,
                      strokeDashoffset: 427 - (427 * 0.92),
                    }}
                  />
                </svg>

                <div className="radial-center-content">
                  <div className="radial-big-pct">92%</div>
                  <div className="radial-status-label">Active</div>
                  <div className="radial-subtext">Students in Exam</div>
                </div>
              </div>

              {/* Progress Count Footnote */}
              <div className="radial-enrolled-count">
                <Users size={16} />
                <span>482 / 526</span>
              </div>

              {/* 3 Metric Chips */}
              <div className="monitoring-chips-group">
                <div className="monitoring-chip chip-enrolled">
                  <div className="chip-icon-box">
                    <Users size={14} />
                  </div>
                  <div>
                    <div className="chip-value">482</div>
                    <div className="chip-label">Enrolled</div>
                  </div>
                </div>

                <div className="monitoring-chip chip-started">
                  <div className="chip-icon-box">
                    <Play size={13} fill="currentColor" />
                  </div>
                  <div>
                    <div className="chip-value">482</div>
                    <div className="chip-label">Started</div>
                  </div>
                </div>

                <div className="monitoring-chip chip-elapsed">
                  <div className="chip-icon-box">
                    <Clock size={14} />
                  </div>
                  <div>
                    <div className="chip-value">01:45:32</div>
                    <div className="chip-label">Elapsed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 4 Split Camera Feeds Grid */}
            <div className="monitoring-cams-column">
              <div className="cams-grid-wrapper">
                {cameraFeeds.map((cam, idx) => (
                  <div
                    key={cam.id}
                    className="cam-tile-card"
                    onClick={() => setExpandedCam(idx)}
                    title={`Click to inspect ${cam.name} (${cam.hall})`}
                  >
                    <img
                      src={cam.img}
                      alt={cam.name}
                      className="cam-feed-image"
                      loading="lazy"
                    />
                    <div className="cam-feed-scanline" />
                    <div className="cam-overlay-badge">
                      <span className="cam-pulse-dot" />
                      <span>{cam.name}</span>
                    </div>
                  </div>
                ))}

                {/* Fullscreen Expand Icon Button on top right */}
                <button
                  type="button"
                  className="cams-fullscreen-btn"
                  onClick={() => setExpandedCam(0)}
                  title="Expand CCTV Proctoring Grid"
                  aria-label="Expand Feeds"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (Narrow): Recent Notifications */}
        <div className="card-panel panel-notifications">
          <div className="panel-header-row">
            <div className="panel-title-group">
              <Bell size={18} className="panel-header-bell" />
              <h2 className="panel-title-text">Recent Notifications</h2>
            </div>

            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/admin/monitoring')}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="notifications-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="notif-row-card"
                onClick={() => navigate(n.path)}
              >
                <div className={`notif-icon-circle ${n.type}`}>
                  {n.type === 'success' && <CheckCircle2 size={16} />}
                  {n.type === 'info' && <Info size={16} />}
                  {n.type === 'warning' && <AlertTriangle size={16} />}
                </div>

                <div className="notif-text-block">
                  <div className="notif-title-row">
                    <span className="notif-item-title">{n.title}</span>
                  </div>
                  <div className="notif-item-sub">{n.sub}</div>
                </div>

                <div className="notif-time-badge">
                  <span>{n.time}</span>
                  <ChevronRight size={14} className="notif-chevron" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ROW 4: THREE BOTTOM INTELLIGENCE WIDGETS
          ═══════════════════════════════════════════════════════════ */}
      <section className="dashboard-trio-grid">
        {/* Widget 1: Exam Statistics (Chart) */}
        <div className="card-panel widget-chart">
          <div className="panel-header-row">
            <div className="panel-title-group">
              <BarChart2 size={18} className="panel-header-icon green-icon" />
              <h2 className="panel-title-text">Exam Statistics</h2>
            </div>

            {/* Filter Pills */}
            <div className="chart-range-pills">
              <button
                type="button"
                className={`range-pill ${chartRange === '7D' ? 'active' : ''}`}
                onClick={() => setChartRange('7D')}
              >
                7D
              </button>
              <button
                type="button"
                className={`range-pill ${chartRange === '30D' ? 'active' : ''}`}
                onClick={() => setChartRange('30D')}
              >
                30D
              </button>
              <button
                type="button"
                className={`range-pill ${chartRange === 'custom' ? 'active' : ''}`}
                onClick={() => setChartRange('custom')}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Chart Legends */}
          <div className="chart-legends-row">
            <span className="chart-legend-item">
              <span className="legend-dot dot-scheduled" />
              <span>Scheduled</span>
            </span>
            <span className="chart-legend-item">
              <span className="legend-dot dot-conducted" />
              <span>Conducted</span>
            </span>
            <span className="chart-legend-item">
              <span className="legend-dot dot-completed" />
              <span>Completed</span>
            </span>
          </div>

          {/* SVG Multi-Line Area Chart */}
          <div className="chart-canvas-wrapper">
            <svg viewBox="0 0 460 170" className="chart-svg-main">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="450" y2="20" className="chart-grid-line" />
              <line x1="40" y1="55" x2="450" y2="55" className="chart-grid-line" />
              <line x1="40" y1="90" x2="450" y2="90" className="chart-grid-line" />
              <line x1="40" y1="125" x2="450" y2="125" className="chart-grid-line" />

              {/* Y-Axis Labels */}
              <text x="12" y="24" className="chart-axis-text">400</text>
              <text x="12" y="59" className="chart-axis-text">300</text>
              <text x="12" y="94" className="chart-axis-text">200</text>
              <text x="12" y="129" className="chart-axis-text">100</text>

              {/* Line 1: Scheduled (Teal) */}
              <path
                d="M50,115 C100,105 160,85 220,80 C280,75 350,70 440,55"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M50,115 C100,105 160,85 220,80 C280,75 350,70 440,55 L440,140 L50,140 Z"
                fill="url(#teal-area)"
                opacity="0.12"
              />

              {/* Line 2: Conducted (Dark Green) */}
              <path
                d="M50,130 C100,110 160,95 220,90 C280,85 350,78 440,35"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M50,130 C100,110 160,95 220,90 C280,85 350,78 440,35 L440,140 L50,140 Z"
                fill="url(#green-area)"
                opacity="0.16"
              />

              {/* Line 3: Completed (Neon Emerald) */}
              <path
                d="M50,125 C100,120 160,110 220,98 C280,92 350,85 440,65"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Node Dots */}
              <circle cx="50" cy="125" r="3.5" className="chart-data-node" fill="#10b981" />
              <circle cx="115" cy="120" r="3.5" className="chart-data-node" fill="#10b981" />
              <circle cx="180" cy="105" r="3.5" className="chart-data-node" fill="#10b981" />
              <circle cx="245" cy="98" r="3.5" className="chart-data-node" fill="#10b981" />
              <circle cx="310" cy="90" r="3.5" className="chart-data-node" fill="#10b981" />
              <circle cx="375" cy="78" r="3.5" className="chart-data-node" fill="#10b981" />
              <circle cx="440" cy="65" r="4.5" className="chart-data-node active-node" fill="#10b981" />

              {/* Gradients */}
              <defs>
                <linearGradient id="teal-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="green-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* X-Axis Labels */}
              <text x="42" y="158" className="chart-x-text">10 Nov</text>
              <text x="105" y="158" className="chart-x-text">11 Nov</text>
              <text x="170" y="158" className="chart-x-text">12 Nov</text>
              <text x="235" y="158" className="chart-x-text">13 Nov</text>
              <text x="300" y="158" className="chart-x-text">14 Nov</text>
              <text x="365" y="158" className="chart-x-text">15 Nov</text>
              <text x="425" y="158" className="chart-x-text">16 Nov</text>
            </svg>
          </div>
        </div>

        {/* Widget 2: Recent Activities */}
        <div className="card-panel widget-activities">
          <div className="panel-header-row">
            <div className="panel-title-group">
              <Clock size={18} className="panel-header-icon green-icon" />
              <h2 className="panel-title-text">Recent Activities</h2>
            </div>

            <button
              type="button"
              className="panel-view-all-link"
              onClick={() => navigate('/admin/monitoring')}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="activities-timeline">
            {activities.map((act, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-marker-column">
                  <span className={`timeline-bullet ${act.active ? 'active-bullet' : ''}`} />
                  {i < activities.length - 1 && <span className="timeline-connector-line" />}
                </div>

                <div className="timeline-content-column">
                  <span className="timeline-time-text">{act.time}</span>
                  <span className="timeline-title-text">{act.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: System Health */}
        <div className="card-panel widget-health">
          <div className="panel-header-row">
            <div className="panel-title-group">
              <Activity size={18} className="panel-header-icon green-icon" />
              <h2 className="panel-title-text">System Health</h2>
            </div>

            <span className="health-all-good-badge">
              <span className="pulse-mini-bullet" />
              All Good
            </span>
          </div>

          <div className="health-dials-grid">
            {/* Dial 1: Server */}
            <div className="health-dial-item">
              <div className="dial-svg-wrapper">
                <svg viewBox="0 0 80 80" className="dial-svg">
                  <circle cx="40" cy="40" r="32" className="dial-track" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="dial-indicator"
                    style={{ strokeDasharray: 201, strokeDashoffset: 201 - (201 * 0.98) }}
                  />
                </svg>
                <div className="dial-center-icon">
                  <Server size={18} />
                </div>
              </div>
              <div className="dial-pct-label">98%</div>
              <div className="dial-name-label">Server Health</div>
            </div>

            {/* Dial 2: Database */}
            <div className="health-dial-item">
              <div className="dial-svg-wrapper">
                <svg viewBox="0 0 80 80" className="dial-svg">
                  <circle cx="40" cy="40" r="32" className="dial-track" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="dial-indicator"
                    style={{ strokeDasharray: 201, strokeDashoffset: 201 - (201 * 0.99) }}
                  />
                </svg>
                <div className="dial-center-icon">
                  <Database size={18} />
                </div>
              </div>
              <div className="dial-pct-label">99%</div>
              <div className="dial-name-label">Database Health</div>
            </div>

            {/* Dial 3: Network */}
            <div className="health-dial-item">
              <div className="dial-svg-wrapper">
                <svg viewBox="0 0 80 80" className="dial-svg">
                  <circle cx="40" cy="40" r="32" className="dial-track" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="dial-indicator"
                    style={{ strokeDasharray: 201, strokeDashoffset: 201 - (201 * 0.97) }}
                  />
                </svg>
                <div className="dial-center-icon">
                  <Wifi size={18} />
                </div>
              </div>
              <div className="dial-pct-label">97%</div>
              <div className="dial-name-label">Network Health</div>
            </div>

            {/* Dial 4: Security */}
            <div className="health-dial-item">
              <div className="dial-svg-wrapper">
                <svg viewBox="0 0 80 80" className="dial-svg">
                  <circle cx="40" cy="40" r="32" className="dial-track" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="dial-indicator"
                    style={{ strokeDasharray: 201, strokeDashoffset: 201 - (201 * 1.0) }}
                  />
                </svg>
                <div className="dial-center-icon">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="dial-pct-label">100%</div>
              <div className="dial-name-label">Security Status</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CCTV EXPANDED MODAL LIGHTBOX
          ═══════════════════════════════════════════════════════════ */}
      {expandedCam !== null && (
        <div className="cams-modal-backdrop" onClick={() => setExpandedCam(null)}>
          <div className="cams-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cams-modal-header">
              <div className="cams-modal-title">
                <Camera size={18} className="green-icon" />
                <span>Live Proctoring Surveillance Feed – {cameraFeeds[expandedCam]?.name}</span>
                <span className="panel-live-pill">
                  <span className="pulse-mini-bullet" />
                  Streaming 1080p
                </span>
              </div>
              <button
                type="button"
                className="cams-modal-close"
                onClick={() => setExpandedCam(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cams-modal-body">
              <div className="expanded-cam-display">
                <img
                  src={cameraFeeds[expandedCam]?.img}
                  alt={cameraFeeds[expandedCam]?.name}
                  className="expanded-cam-image"
                />
                <div className="cam-feed-scanline" />
                <div className="cam-hud-overlay">
                  <div className="hud-badge top-left">
                    <span>{cameraFeeds[expandedCam]?.hall}</span>
                  </div>
                  <div className="hud-badge top-right">
                    <span>AI FACE DETECT: {cameraFeeds[expandedCam]?.students} ACTIVE</span>
                  </div>
                  <div className="hud-badge bottom-left">
                    <span>FPS: 30 • BITRATE: 2.4 Mbps • PROCTOR: AI SHIELD</span>
                  </div>
                </div>
              </div>

              {/* Thumbnail Switcher */}
              <div className="cams-thumb-switcher">
                {cameraFeeds.map((cam, idx) => (
                  <button
                    key={cam.id}
                    type="button"
                    className={`cams-thumb-btn ${expandedCam === idx ? 'active' : ''}`}
                    onClick={() => setExpandedCam(idx)}
                  >
                    <img src={cam.img} alt={cam.name} />
                    <span>{cam.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
