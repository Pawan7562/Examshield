import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Building2, Users, Globe, Award,
  CheckCircle2, Sparkles, TrendingUp, Heart, Lightbulb, Target,
  ChevronRight,
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import './PublicPages.css';
import './About.css';

/* ─── Data ─── */
const milestones = [
  { year: '2020', title: 'Company Founded', desc: 'ExamShield founded in Bangalore to solve the academic integrity crisis exposed by the pandemic-era remote exam explosion.' },
  { year: '2021', title: 'First 10 Institutions', desc: 'Onboarded our first 10 Indian engineering and management colleges. Secured 200,000+ exams in our first year of operations.' },
  { year: '2022', title: 'AI Engine v2.0', desc: 'Launched AI Vision 2.0 with real-time facial landmark mesh and acoustic intelligence — reducing false positives by 73%.' },
  { year: '2023', title: 'International Expansion', desc: 'Expanded to Southeast Asia with offices in Singapore. Became the first Indian proctoring platform to achieve SOC 2 Type II certification.' },
  { year: '2024', title: '1 Million Exams', desc: 'Crossed 1 million secured exam sessions. Onboarded our 100th institutional client and launched LTI 1.3 native LMS integration.' },
  { year: '2025', title: 'AI Vision 3.0', desc: 'Released AI Vision 3.0 with sub-500ms biometric verification and multi-face detection. Serving 1.2M+ exams across 150+ institutions.' },
];

const values = [
  {
    icon: ShieldCheck,
    title: 'Integrity First',
    desc: 'Every product decision is made through the lens of protecting academic and professional credential integrity. We never compromise on this.',
    color: 'green',
  },
  {
    icon: Heart,
    title: 'Human-Centered AI',
    desc: 'Our AI is a tool that empowers human proctors — it never replaces their judgement. No candidate is penalized without human review.',
    color: 'red',
  },
  {
    icon: Globe,
    title: 'Privacy by Design',
    desc: 'FERPA, GDPR, and ISO 27001 compliance is built into our architecture from the ground up — not bolted on as an afterthought.',
    color: 'blue',
  },
  {
    icon: Lightbulb,
    title: 'Radical Transparency',
    desc: 'Candidates always know exactly what is being monitored, why each flag was raised, and how to submit an appeal.',
    color: 'orange',
  },
  {
    icon: Target,
    title: 'Institutional Empathy',
    desc: 'We partner with colleges, not just sell to them. Our success engineers embed with your team until you\'re self-sufficient.',
    color: 'green',
  },
  {
    icon: TrendingUp,
    title: 'Relentless Improvement',
    desc: 'We ship meaningful product improvements every two weeks, driven by data from 1.2M+ exams and direct feedback from our institutional partners.',
    color: 'blue',
  },
];

const leadership = [
  {
    name: 'Dr. Arjun Mehta',
    role: 'CEO & Co-Founder',
    bio: 'Former Head of Academic Technology at IIT Delhi. PhD in Computer Vision, Cambridge. Built ExamShield after witnessing widespread credential fraud firsthand.',
    initials: 'AM',
    color: 'green',
    linkedin: '#!',
  },
  {
    name: 'Priya Nambiar',
    role: 'CTO & Co-Founder',
    bio: '15 years in applied ML. Former Principal Engineer at Google Brain. Leads our AI Vision and Acoustic Intelligence research teams.',
    initials: 'PN',
    color: 'blue',
    linkedin: '#!',
  },
  {
    name: 'Dr. Samuel Adeyemi',
    role: 'Chief Privacy Officer',
    bio: 'Former Data Protection Officer at UNESCO. Led FERPA and GDPR compliance architecture across 6 countries. Chairs our ethics board.',
    initials: 'SA',
    color: 'orange',
    linkedin: '#!',
  },
  {
    name: 'Li Wei',
    role: 'VP Engineering',
    bio: 'Full-stack infrastructure specialist. Previously VP Engineering at Coursera Asia-Pacific. Built our sub-180ms streaming WebRTC pipeline.',
    initials: 'LW',
    color: 'red',
    linkedin: '#!',
  },
  {
    name: 'Margaret Osei',
    role: 'VP Customer Success',
    bio: 'Former Director of Academic Affairs at University of Ghana. Oversees institutional onboarding, training, and 14-day deployment guarantee.',
    initials: 'MO',
    color: 'green',
    linkedin: '#!',
  },
  {
    name: 'Rohan Verma',
    role: 'VP Sales & Partnerships',
    bio: '10 years in EdTech enterprise sales across India, SEA, and MENA. Built our LMS partnership programme with Canvas and Moodle.',
    initials: 'RV',
    color: 'blue',
    linkedin: '#!',
  },
];

const stats = [
  { value: '1.2M+', label: 'Exams Secured', icon: ShieldCheck },
  { value: '150+', label: 'Institutions', icon: Building2 },
  { value: '99.98%', label: 'AI Accuracy', icon: TrendingUp },
  { value: '3', label: 'Global Offices', icon: Globe },
  { value: '80+', label: 'Team Members', icon: Users },
  { value: '5', label: 'Years Operating', icon: Award },
];

const certifications = [
  'FERPA Compliant', 'GDPR Certified', 'ISO 27001', 'SOC 2 Type II',
  'LTI 1.3 Certified', 'AES-256 Encrypted',
];

export default function AboutPage() {
  const [activeMilestone, setActiveMilestone] = useState(5); // default: latest

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <section className="about-hero-section public-shell" aria-labelledby="about-h1">
        <div className="features-hero-eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          <span>Our Story & Mission</span>
        </div>
        <h1 id="about-h1">
          Built to defend <span>every credential</span> earned honestly
        </h1>
        <p className="features-hero-sub">
          ExamShield was founded to answer one question: how do you ensure that every diploma, certificate, and professional licence truly represents earned knowledge? Five years later, we secure 1.2M+ exams across 150+ institutions on 3 continents.
        </p>
        <div className="features-hero-actions">
          <Link to="/admin/register" className="feat-cta-primary">
            Register Your Institution
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/contact" className="feat-cta-secondary">
            Talk to Our Team
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── Stats Grid ── */}
      <section className="public-shell about-stats-section" aria-label="Company statistics">
        <div className="about-stats-grid">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div className="about-stat-card" key={s.label}>
                <div className="about-stat-icon" aria-hidden="true"><Icon size={22} /></div>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Mission Statement ── */}
      <section className="public-shell about-mission-section" aria-labelledby="mission-heading">
        <div className="about-mission-inner">
          <div className="about-mission-left">
            <p className="feat-kicker">OUR MISSION</p>
            <h2 id="mission-heading">Make every exam result trustworthy — globally</h2>
            <p>
              Academic credentials are the foundation of meritocracy. When credential fraud goes unchecked, it devalues the degrees of honest graduates, undermines employer trust, and corrodes the social contract that education is built on.
            </p>
            <p>
              ExamShield exists to close that trust gap — not by creating an adversarial surveillance environment, but by building a fair, transparent, and privacy-respecting monitoring system that gives honest candidates confidence that their integrity is protected.
            </p>
            <Link to="/how-it-works" className="feat-cta-secondary" style={{ marginTop: 8, display: 'inline-flex' }}>
              See How ExamShield Works
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="about-mission-right">
            <div className="about-mission-quote">
              <p className="about-quote-text">
                "We don't build surveillance tools. We build trust infrastructure — for institutions that believe every credential should genuinely represent earned knowledge."
              </p>
              <div className="about-quote-author">
                <div className="about-quote-avatar feat-icon-green" aria-hidden="true">AM</div>
                <div>
                  <strong>Dr. Arjun Mehta</strong>
                  <span>CEO & Co-Founder, ExamShield</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="public-shell about-timeline-section" aria-labelledby="timeline-heading">
        <div className="feat-section-header">
          <p className="feat-kicker">OUR JOURNEY</p>
          <h2 id="timeline-heading">Five years of defending academic integrity</h2>
        </div>
        <div className="about-timeline">
          {milestones.map((m, i) => (
            <button
              key={m.year}
              className={`about-timeline-item ${activeMilestone === i ? 'active' : ''}`}
              onClick={() => setActiveMilestone(i)}
            >
              <div className="about-timeline-year">{m.year}</div>
              <div className="about-timeline-dot" aria-hidden="true" />
              <div className="about-timeline-label">{m.title}</div>
            </button>
          ))}
        </div>
        <div className="about-timeline-panel">
          <div className="about-timeline-panel-year">{milestones[activeMilestone].year}</div>
          <h3>{milestones[activeMilestone].title}</h3>
          <p>{milestones[activeMilestone].desc}</p>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="public-shell about-values-section" aria-labelledby="values-heading">
        <div className="feat-section-header">
          <p className="feat-kicker">WHAT WE STAND FOR</p>
          <h2 id="values-heading">The principles behind every product decision</h2>
          <p className="feat-section-sub">
            Our company values aren't decorative. They're enforced engineering and policy constraints.
          </p>
        </div>
        <div className="about-values-grid" role="list">
          {values.map(v => {
            const Icon = v.icon;
            return (
              <article key={v.title} className={`about-value-card feat-color-${v.color}`} role="listitem">
                <div className={`fdc-icon-wrap feat-icon-${v.color}`} aria-hidden="true">
                  <Icon size={22} />
                </div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Leadership Team ── */}
      <section className="public-shell about-team-section" aria-labelledby="team-heading">
        <div className="feat-section-header">
          <p className="feat-kicker">LEADERSHIP</p>
          <h2 id="team-heading">The team building the future of exam integrity</h2>
          <p className="feat-section-sub">
            Researchers, engineers, and institutional experts united by a single mission.
          </p>
        </div>
        <div className="about-team-grid" role="list">
          {leadership.map(person => (
            <article key={person.name} className="about-team-card" role="listitem">
              <div className={`about-team-avatar feat-icon-${person.color}`} aria-hidden="true">
                {person.initials}
              </div>
              <div className="about-team-info">
                <strong>{person.name}</strong>
                <span className="about-team-role">{person.role}</span>
                <p>{person.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="public-shell about-certs-section" aria-labelledby="certs-heading">
        <div className="about-certs-inner">
          <div className="about-certs-left">
            <p className="feat-kicker">COMPLIANCE</p>
            <h2 id="certs-heading">Certified for the strictest institutional requirements</h2>
            <p>
              ExamShield has earned certifications across the most demanding data protection, security, and academic privacy standards globally. Our legal team maintains ongoing compliance documentation available to institutional partners.
            </p>
            <Link to="/contact" className="feat-cta-primary" style={{ marginTop: 8, display: 'inline-flex' }}>
              Request Compliance Docs
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="about-certs-badges" role="list" aria-label="Certifications">
            {certifications.map(cert => (
              <div key={cert} className="about-cert-badge" role="listitem">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="public-shell about-cta-section" aria-labelledby="about-cta-heading">
        <p className="feat-kicker">JOIN 150+ INSTITUTIONS</p>
        <h2 id="about-cta-heading">
          Partner with a team that's as invested in your institution's integrity as you are
        </h2>
        <p>
          Start your 14-day institutional trial, request a campus walkthrough, or speak directly to our team about your specific requirements.
        </p>
        <div className="features-hero-actions" style={{ marginTop: 32 }}>
          <Link to="/admin/register" className="feat-cta-primary">
            Start Institutional Trial
            <ArrowRight size={16} />
          </Link>
          <Link to="/contact" className="feat-cta-secondary">
            Contact Our Team
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
