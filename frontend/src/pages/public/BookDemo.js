import React from 'react';
import PublicLayout from '../../components/public/PublicLayout';
import SEOHead from '../../components/common/SEOHead';
import InstitutionalDemoForm from '../../components/public/InstitutionalDemoForm';
import { ShieldCheck, CheckCircle, Users, Award, Clock, Laptop } from 'lucide-react';
import './InstitutionalLandingPage.css';

export default function BookDemo() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Book Institutional Demo & Campus Pilot | Nexify Examina',
    url: 'https://exam.nexifyforge.in/book-demo',
    description: 'Schedule a personalized demonstration and 14-day campus trial of Nexify Examina online examination and AI proctoring platform.'
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Book Institutional Demo & Campus Trial | Nexify Examina"
        description="Schedule a 1-on-1 walkthrough and 14-day campus pilot of Nexify Examina for your college, university, or school. Experience 2,000+ concurrency, browser lockdown, and AI proctoring."
        keywords="book exam software demo, schedule online examination walkthrough, college exam platform trial, university proctoring demo India, Nexify Examina pilot"
        canonical="https://exam.nexifyforge.in/book-demo"
        jsonLd={jsonLd}
      />

      <div className="inst-page-container">
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 40px' }}>
          <div className="inst-hero-badge">
            <ShieldCheck size={14} />
            <span>Campus Demonstration & Trial Setup</span>
          </div>
          <h1 className="inst-hero-title" style={{ fontSize: '38px', marginBottom: '16px' }}>
            Experience Nexify Examina Live with Your Institution's Exams
          </h1>
          <p className="inst-hero-subtitle" style={{ fontSize: '16px', margin: 0 }}>
            Join colleges and universities across India conducting secure online examinations. Get a guided demonstration, customized sample question setup, and zero-risk 14-day faculty trial.
          </p>
        </div>

        <div className="inst-grid-split" style={{ alignItems: 'center' }}>
          {/* Left Column: What's included in demo */}
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', marginBottom: '20px' }}>
              What You Will Experience During Your Session:
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', color: '#10b981' }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px' }}>
                    Live 2,000+ Concurrent Student Exam Simulation
                  </h3>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Witness our 16-node cluster effortlessly process hundreds of simultaneous student logins and instant answer auto-saves without lag.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', color: '#10b981' }}>
                  <Laptop size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px' }}>
                    Zero-Install Browser Lockdown & AI Invigilation
                  </h3>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    See how students take exams inside Chrome or Edge with full-screen lockdown, tab-switch prevention, and real-time facial anomaly tracking.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', color: '#10b981' }}>
                  <Award size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px' }}>
                    In-Browser Coding Compiler Practical Test
                  </h3>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Review Python, Java, C++, and JS programming tests with hidden test cases and automated grading tailored for your computer science department.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', color: '#10b981' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px' }}>
                    Immediate 14-Day Free Pilot Account
                  </h3>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Your faculties receive complete Super Admin and College Admin credentials to test real mock papers with your students before making any commitment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div>
            <InstitutionalDemoForm
              sourcePage="/book-demo"
              title="Schedule Walkthrough & Pilot"
              subtitle="Fill in your details below and our academic technical director will reach out within 24 hours."
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
