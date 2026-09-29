import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Lock,
  Code,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import SEOHead from '../../components/common/SEOHead';
import './PublicPages.css';
import './FAQ.css';

const faqCategories = [
  {
    id: 'monitoring',
    label: 'AI Exam Monitoring & Proctoring',
    icon: ShieldCheck,
    description: 'How ExamShield by Nexify Forge monitors, flags, and verifies candidate exam sessions.',
    faqs: [
      {
        q: "What is ExamShield's AI Online Exam Monitoring System?",
        a: "ExamShield by Nexify Forge is an enterprise online exam monitoring and proctoring platform designed for higher education institutions, universities, and certification providers. It uses dual-layer AI to analyze webcam video, gaze coordinates, microphone audio levels, and browser activity in real time, detecting anomalies such as multiple faces, looking away, whispering, and tab switching.",
      },
      {
        q: 'How does AI online proctoring differ from traditional human invigilation?',
        a: 'Traditional proctoring requires invigilators to watch dozens of video feeds simultaneously, which leads to fatigue and missed infractions. ExamShield’s AI acts as an intelligent co-pilot: it continuously monitors all candidates and surfaces high-risk anomalies to the invigilator dashboard with timestamped video clips, allowing 1 proctor to oversee up to 50–100 students with higher precision.',
      },
      {
        q: 'Does ExamShield require students to install extensions or desktop software?',
        a: 'No. ExamShield is 100% web-based. It runs directly inside standard browsers (Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari) using HTML5 WebRTC, Canvas API, and Web Audio. Students do not need to download invasive kernel-level drivers or third-party executables.',
      },
      {
        q: 'What happens if a student loses internet connectivity during an exam?',
        a: 'ExamShield uses an offline-first caching mechanism. If a student loses their connection, their answers and encrypted biometric timestamps are preserved securely in protected browser storage and automatically sync to the server as soon as the connection is restored.',
      },
    ],
  },
  {
    id: 'security',
    label: 'Browser Lockdown & Security',
    icon: Lock,
    description: 'Kiosk sandboxing, secondary screen blocking, and anti-cheating mechanisms.',
    faqs: [
      {
        q: 'How does the browser kiosk lockdown prevent cheating?',
        a: 'ExamShield locks the browser window into full-screen mode and intercepts keyboard shortcuts such as Alt+Tab, Windows Key, Command, Ctrl+C, Ctrl+V, and screenshot hotkeys (PrtScn). Any attempt to exit full screen or switch tabs is instantly logged as an anomaly with an automatic 3-strike alert threshold.',
      },
      {
        q: 'Can ExamShield detect dual monitors, HDMI splitters, and virtual machines?',
        a: 'Yes. ExamShield’s display environment probe detects multi-monitor configurations, virtual display drivers, remote desktop software (TeamViewer, AnyDesk), and virtual machine environments, requiring candidates to disconnect secondary screens before the exam can begin.',
      },
      {
        q: 'Are candidate exam sessions recorded for audit and dispute resolution?',
        a: 'Yes. Every exam session produces a court-admissible forensic audit report containing timestamped infraction logs, video snippets, audio spikes, and verified answers, giving university academic boards objective proof for grade dispute resolutions.',
      },
    ],
  },
  {
    id: 'assessment',
    label: 'Coding & Assessment Engine',
    icon: Code,
    description: 'Online coding assessments, MCQ grading, and question generation.',
    faqs: [
      {
        q: 'How does ExamShield support online coding assessments?',
        a: 'ExamShield features a sandboxed online code execution engine supporting over 20 programming languages including Python, Java, C++, JavaScript, Go, and Rust. Instructors can configure public and hidden test cases, execution time limits, memory limits, and automated unit testing.',
      },
      {
        q: 'Does ExamShield support automated MCQ and subjective exam evaluation?',
        a: 'Yes. Multiple-choice questions (MCQs) are evaluated instantly with negative marking support. For subjective and coding exams, answers are graded through automated rubrics and structured professor evaluation dashboards.',
      },
      {
        q: 'Can instructors use AI to generate questions automatically?',
        a: 'Yes. ExamShield includes an AI Question Generator capable of generating balanced MCQ and coding questions based on subject syllabus, difficulty level, and educational Bloom’s taxonomy.',
      },
    ],
  },
  {
    id: 'institutional',
    label: 'Colleges, Universities & Scalability',
    icon: GraduationCap,
    description: 'Multi-hall radar, LMS integrations, and campus-wide scale.',
    faqs: [
      {
        q: 'How does ExamShield scale for large college and university examinations?',
        a: 'ExamShield is built on high-throughput cloud infrastructure with PostgreSQL connection pooling, Redis clustering, and WebSocket room broadcasting. It easily handles concurrent exam batches of 1,000 to 10,000+ students taking the same exam simultaneously.',
      },
      {
        q: 'Can ExamShield integrate with existing LMS platforms like Canvas, Moodle, and Blackboard?',
        a: 'Yes. ExamShield supports LTI 1.3 standards and REST API hooks, allowing universities to import student rosters, schedule exams directly from their LMS, and synchronize verified grades back into their institutional gradebook.',
      },
      {
        q: 'How does Nexify Forge support institutions implementing ExamShield?',
        a: 'Nexify Forge provides institutional onboarding, custom LMS configuration, proctor training workshops, and dedicated 24/7 technical mission control on examination days.',
      },
    ],
  },
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('monitoring');
  const [openItems, setOpenItems] = useState({ 'monitoring-0': true });

  const toggleItem = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Build flattened FAQs for JSON-LD schema
  const allFaqs = faqCategories.flatMap((c) => c.faqs);
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  const currentCategory = faqCategories.find((c) => c.id === activeCategory) || faqCategories[0];

  return (
    <PublicLayout className="exam-landing-theme">
      <SEOHead
        title="Frequently Asked Questions (FAQ) | Online Exam Monitoring & Proctoring"
        description="Find answers to common questions about ExamShield by Nexify Forge: AI exam monitoring, browser lockdown, online coding assessments, student privacy, and university deployment."
        canonical="https://exam.nexifyforge.in/faq"
        jsonLd={faqJsonLd}
      />

      <div className="public-page-shell faq-page-wrap">
        {/* Header */}
        <section className="faq-hero-section">
          <div className="landing-eyebrow-wrapper">
            <span className="landing-eyebrow-pill">
              <HelpCircle size={14} aria-hidden="true" />
              Nexify Forge Knowledge Base · Online Exam Systems
            </span>
          </div>

          <h1 className="faq-page-title">
            Frequently Asked Questions<br />
            <span>Online Exam Monitoring &amp; AI Proctoring</span>
          </h1>

          <p className="faq-page-subtitle">
            Everything you need to know about ExamShield by Nexify Forge — from AI invigilation and browser kiosk lockdown to student privacy, coding assessments, and institutional university deployment.
          </p>
        </section>

        {/* Category Selector Tabs */}
        <div className="faq-category-nav" role="tablist" aria-label="FAQ Categories">
          {faqCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat.id)}
                className={`faq-cat-tab ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className="faq-cat-icon" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <section className="faq-content-section" aria-label="Questions and answers">
          <div className="faq-category-info">
            <h2 className="faq-category-heading">{currentCategory.label}</h2>
            <p className="faq-category-sub">{currentCategory.description}</p>
          </div>

          <div className="faq-items-list">
            {currentCategory.faqs.map((faq, idx) => {
              const itemKey = `${currentCategory.id}-${idx}`;
              const isOpen = !!openItems[itemKey];

              return (
                <div key={itemKey} className={`faq-card-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    onClick={() => toggleItem(itemKey)}
                    className="faq-card-question-btn"
                    aria-expanded={isOpen}
                  >
                    <span className="faq-card-q-text">{faq.q}</span>
                    <ChevronDown size={18} className={`faq-card-arrow ${isOpen ? 'rotated' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="faq-card-answer-body">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Institutional Consultation CTA */}
        <section className="faq-cta-banner">
          <div className="faq-cta-content">
            <div className="faq-cta-badge">
              <Sparkles size={14} />
              <span>Nexify Forge Institutional Support</span>
            </div>
            <h3>Have a specific technical or accreditation inquiry?</h3>
            <p>
              Our solutions engineering team can demonstrate multi-hall radar monitoring, conduct a pilot run for your faculty, and answer any compliance questions.
            </p>
            <div className="faq-cta-actions">
              <Link to="/contact" className="faq-cta-btn-primary">
                Schedule Institutional Consultation
                <ArrowRight size={15} />
              </Link>
              <Link to="/features" className="faq-cta-btn-secondary">
                View All AI Platform Features
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
