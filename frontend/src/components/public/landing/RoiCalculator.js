import React, { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  TrendingUp,
  Clock,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { PORTAL_LINKS } from '../../../content/landingContent';

export default function RoiCalculator() {
  const [studentCount, setStudentCount] = useState(3500);
  const [examHalls, setExamHalls] = useState(25);
  const studentSliderId = useId();
  const hallSliderId = useId();

  // Dynamic calculations based on institutional parameters
  // Traditional proctoring: 1 proctor per 15 students. Nexify Examina: 1 proctor per 50 students.
  const traditionalProctors = Math.ceil(studentCount / 15);
  const nexifyExaminaProctors = Math.ceil(studentCount / 50);
  const proctorsSaved = Math.max(0, traditionalProctors - nexifyExaminaProctors);

  // Estimated faculty hours saved (assuming 4 exams per student, 2.5 hours each)
  const totalExamHours = studentCount * 4 * 2.5;
  const facultyHoursSaved = Math.round(proctorsSaved * 4 * 2.5 * 1.4);

  // Administrative cost efficiency percentage
  const costReductionPct = Math.min(84, Math.round(52 + (studentCount / 50000) * 28));

  // Incident resolution turnaround: manual 14 days vs automated 4 minutes
  const auditSpeedup = '4 mins vs 14 days';

  return (
    <section id="roi-calculator" className="es-section es-roi-section" aria-labelledby="roi-heading">
      <div className="es-container">
        {/* Section Header */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <Calculator size={15} aria-hidden="true" />
            <span>INSTITUTIONAL VALUE CALCULATOR</span>
          </div>
          <h2 id="roi-heading" className="es-section-title">
            Calculate your campus efficiency &amp; scale
          </h2>
          <p className="es-section-desc">
            See how transitioning to autonomous AI proctoring and centralized 1:50 invigilator cockpits drastically reduces faculty overhead while eliminating credential fraud.
          </p>
        </div>

        {/* Interactive Calculator Workspace Card */}
        <div className="es-roi-card">
          <div className="es-roi-grid">
            {/* Left: Interactive Input Sliders */}
            <div className="es-roi-controls">
              <div className="es-roi-control-group">
                <div className="es-control-label-row">
                  <label htmlFor={studentSliderId} className="es-control-label">
                    <Users size={16} className="control-icon" aria-hidden="true" />
                    <span>Candidate Cohort Size per Semester</span>
                  </label>
                  <span className="es-control-val-badge">
                    {studentCount.toLocaleString()} Students
                  </span>
                </div>
                <input
                  id={studentSliderId}
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="es-range-slider"
                  aria-label="Student cohort size per semester"
                />
                <div className="es-range-ticks" aria-hidden="true">
                  <span>500</span>
                  <span>10,000</span>
                  <span>25,000</span>
                  <span>50,000+</span>
                </div>
              </div>

              <div className="es-roi-control-group">
                <div className="es-control-label-row">
                  <label htmlFor={hallSliderId} className="es-control-label">
                    <Building2 size={16} className="control-icon" aria-hidden="true" />
                    <span>Simultaneous Exam Halls / Virtual Rooms</span>
                  </label>
                  <span className="es-control-val-badge">
                    {examHalls} Exam Halls
                  </span>
                </div>
                <input
                  id={hallSliderId}
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={examHalls}
                  onChange={(e) => setExamHalls(Number(e.target.value))}
                  className="es-range-slider"
                  aria-label="Simultaneous exam halls"
                />
                <div className="es-range-ticks" aria-hidden="true">
                  <span>5 Halls</span>
                  <span>30 Halls</span>
                  <span>60 Halls</span>
                  <span>100 Halls</span>
                </div>
              </div>

              <div className="es-roi-assurance-box">
                <CheckCircle2 size={18} className="assurance-check" aria-hidden="true" />
                <div>
                  <strong>Zero IT Friction Guarantee</strong>
                  <p>
                    100% in-browser WebAssembly. No software download required on student devices. Full LTI 1.3 integration with Moodle, Canvas, Blackboard, and custom university ERPs.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Real-time Projection Metrics */}
            <div className="es-roi-results">
              <div className="es-results-header">
                <span className="es-results-kicker">PROJECTED INSTITUTIONAL IMPACT</span>
                <span className="es-results-tag">Live Dynamic Model</span>
              </div>

              <div className="es-roi-metrics-grid">
                {/* Metric 1: Faculty Hours Saved */}
                <div className="es-roi-metric-item">
                  <div className="metric-icon-wrap">
                    <Clock size={18} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-number">
                      {facultyHoursSaved.toLocaleString()} hrs
                    </span>
                    <span className="metric-title">Faculty Supervision Saved</span>
                    <span className="metric-sub">Freed up for teaching and academic research</span>
                  </div>
                </div>

                {/* Metric 2: Invigilator Ratio */}
                <div className="es-roi-metric-item">
                  <div className="metric-icon-wrap highlight">
                    <TrendingUp size={18} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-number highlight">
                      1:50 Ratio
                    </span>
                    <span className="metric-title">Proctoring Scalability</span>
                    <span className="metric-sub">Up from legacy 1:15 manual room monitoring</span>
                  </div>
                </div>

                {/* Metric 3: Overhead Reduction */}
                <div className="es-roi-metric-item">
                  <div className="metric-icon-wrap">
                    <Sparkles size={18} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-number">
                      {costReductionPct}%
                    </span>
                    <span className="metric-title">Administrative Cost Reduction</span>
                    <span className="metric-sub">Eliminates physical hall rental &amp; paper logistics</span>
                  </div>
                </div>

                {/* Metric 4: Audit Forensic Speed */}
                <div className="es-roi-metric-item">
                  <div className="metric-icon-wrap">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-number">
                      {auditSpeedup}
                    </span>
                    <span className="metric-title">Incident Dossier Generation</span>
                    <span className="metric-sub">Instant cryptographic PDF audit reports</span>
                  </div>
                </div>
              </div>

              {/* Action Banner inside Calculator */}
              <div className="es-roi-cta-bar">
                <div className="es-roi-cta-text">
                  <strong>Ready to deploy for {studentCount.toLocaleString()} candidates?</strong>
                  <span>Book a tailored demonstration with our campus solutions engineering team.</span>
                </div>
                <Link
                  to={PORTAL_LINKS.contact}
                  className="es-btn es-btn-lime es-btn-md"
                  aria-label="Request tailored demonstration"
                >
                  <span>Request Custom Pilot</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
