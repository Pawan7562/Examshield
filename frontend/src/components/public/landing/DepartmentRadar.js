import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  GraduationCap,
  ShieldCheck,
  Calendar,
  Users,
  FileSpreadsheet,
  BarChart3,
  FileText,
  Layers,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import {
  COLLEGE_DEPARTMENTS,
  COLLEGE_ADMIN_CAPABILITIES,
  PORTAL_LINKS
} from '../../../content/landingContent';

const getCapabilityIcon = (iconName) => {
  switch (iconName) {
    case 'Calendar':
      return <Calendar size={22} className="cap-icon" aria-hidden="true" />;
    case 'Users':
      return <Users size={22} className="cap-icon" aria-hidden="true" />;
    case 'FileSpreadsheet':
      return <FileSpreadsheet size={22} className="cap-icon" aria-hidden="true" />;
    case 'BarChart3':
      return <BarChart3 size={22} className="cap-icon" aria-hidden="true" />;
    case 'FileText':
      return <FileText size={22} className="cap-icon" aria-hidden="true" />;
    case 'Layers':
    default:
      return <Layers size={22} className="cap-icon" aria-hidden="true" />;
  }
};

export default function DepartmentRadar() {
  const [activeDeptId, setActiveDeptId] = useState('engineering');

  const selectedDepartment =
    COLLEGE_DEPARTMENTS.find((d) => d.id === activeDeptId) || COLLEGE_DEPARTMENTS[0];

  return (
    <section id="command-suite" className="es-section es-department-radar-section" aria-labelledby="radar-heading">
      <div className="es-container">
        {/* Section Header */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <GraduationCap size={15} aria-hidden="true" />
            <span>Campus-Wide Governance</span>
          </div>
          <h2 id="radar-heading" className="es-section-title">
            The College Admin &amp; Institutional Command Suite
          </h2>
          <p className="es-section-desc">
            Equip University Deans, Examination Controllers, and Department Heads with a central control plane to orchestrate semester schedules, delegate invigilator rosters, batch-enroll students, and export indisputable integrity forensics.
          </p>
        </div>

        {/* Real-time Department Cockpit Card */}
        <div className="es-dept-cockpit-frame">
          {/* Cockpit Top Bar with Department Switcher Tabs */}
          <div className="es-cockpit-top-bar">
            <div className="es-cockpit-title-group">
              <Building2 size={20} className="es-cockpit-icon" aria-hidden="true" />
              <div>
                <h3 className="es-cockpit-h3">University Examination Command Radar</h3>
                <span className="es-cockpit-sub">Real-Time Multi-Department Semester Session Monitoring</span>
              </div>
            </div>

            <div className="es-cockpit-tabs" role="tablist" aria-label="Department switchers">
              {COLLEGE_DEPARTMENTS.map((dept) => {
                const isActive = activeDeptId === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`es-dept-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveDeptId(dept.id)}
                  >
                    <span>{dept.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cockpit Inner Grid */}
          <div className="es-cockpit-grid">
            {/* Left: Department Detail Card */}
            <div className="es-dept-main-col">
              <div className="es-dept-meta-header">
                <div>
                  <span className="es-faculty-badge">{selectedDepartment.faculty}</span>
                  <h4 className="es-dept-name">{selectedDepartment.name}</h4>
                  <p className="es-dept-dean">
                    Presiding Officer: <strong>{selectedDepartment.dean}</strong>
                  </p>
                </div>
                <div className="es-dept-integrity-tag">
                  <ShieldCheck size={16} />
                  <span>{selectedDepartment.integrityScore} Normal</span>
                </div>
              </div>

              {/* Active Exam Banner */}
              <div className="es-dept-active-exam-banner">
                <span className="es-exam-status-dot" aria-hidden="true" />
                <div className="es-active-exam-info">
                  <strong>CURRENT ACTIVE EXAM:</strong>
                  <span>{selectedDepartment.activeExam}</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="es-dept-metrics-row">
                <div className="es-dept-stat-box">
                  <strong>{selectedDepartment.totalStudents}</strong>
                  <span>Enrolled Candidates</span>
                </div>
                <div className="es-dept-stat-box">
                  <strong>{selectedDepartment.hallsActive} Halls</strong>
                  <span>Active Exam Rooms</span>
                </div>
                <div className="es-dept-stat-box">
                  <strong>{selectedDepartment.proctorsOnDuty} Proctors</strong>
                  <span>Invigilators on Duty</span>
                </div>
                <div className="es-dept-stat-box highlight">
                  <strong>100%</strong>
                  <span>Kiosk Sandboxed</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="es-dept-actions-bar">
                <Link to={PORTAL_LINKS.registerInstitution} className="es-btn es-btn-lime es-btn-sm">
                  <Calendar size={14} aria-hidden="true" />
                  <span>Schedule Exam Batch</span>
                </Link>
                <Link to={PORTAL_LINKS.registerInstitution} className="es-btn es-btn-secondary es-btn-sm">
                  <FileSpreadsheet size={14} aria-hidden="true" />
                  <span>Import Student CSV</span>
                </Link>
                <Link to={PORTAL_LINKS.contact} className="es-btn es-btn-secondary es-btn-sm">
                  <FileText size={14} aria-hidden="true" />
                  <span>Disciplinary Dossier</span>
                </Link>
              </div>
            </div>

            {/* Right: Live Hall Telemetry Rows */}
            <div className="es-dept-halls-col">
              <div className="es-halls-header">
                <strong>Live Examination Halls Telemetry</strong>
                <span className="es-halls-counter">{selectedDepartment.hallsActive} Active Rooms</span>
              </div>

              <div className="es-halls-list" role="list">
                {selectedDepartment.hallBreakdown.map((hall) => (
                  <div key={hall.name} className="es-hall-item" role="listitem">
                    <div className="es-hall-info">
                      <span className="es-hall-name">{hall.name}</span>
                      <span className="es-hall-candidates">{hall.students} Active Candidates</span>
                    </div>
                    <div className="es-hall-status">
                      <span className={`es-hall-pill ${hall.alertCount > 0 ? 'warning' : 'safe'}`}>
                        {hall.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="es-fast-track-callout">
                <GraduationCap size={18} className="es-fast-track-icon" aria-hidden="true" />
                <div>
                  <strong>Institutional Fast-Track Onboarding</strong>
                  <span>Configure faculty courses, invigilator shifts, and hall rosters in under 15 minutes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Core College Admin Capabilities Grid */}
        <div className="es-capabilities-grid" role="list">
          {COLLEGE_ADMIN_CAPABILITIES.map((cap) => (
            <article key={cap.id} className="es-capability-card" role="listitem">
              <div className="es-cap-top">
                <div className="es-cap-icon-box" aria-hidden="true">
                  {getCapabilityIcon(cap.iconName)}
                </div>
                <span className="es-cap-badge">{cap.badge}</span>
              </div>
              <h3 className="es-cap-title">{cap.title}</h3>
              <p className="es-cap-desc">{cap.description}</p>
            </article>
          ))}
        </div>

        {/* Clean Unified Banner CTA */}
        <div className="es-dept-cta-banner">
          <div className="es-dept-cta-content">
            <h3 className="es-dept-cta-title">Ready to modernize your campus examination system?</h3>
            <p className="es-dept-cta-desc">
              Empower your faculty, eliminate question leakage, and establish unassailable academic credentials with ExamShield.
            </p>
          </div>
          <div className="es-dept-cta-actions">
            <Link to={PORTAL_LINKS.registerInstitution} className="es-btn es-btn-lime">
              <span>Register Your College</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to={PORTAL_LINKS.collegeAdminLogin} className="es-btn es-btn-secondary">
              <span>College Admin Console</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
