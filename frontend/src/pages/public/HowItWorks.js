import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle, Users, Shield, FileText, Clock, ChevronRight } from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import { workflowSteps } from './publicContent';
import './PublicPages.css';

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  const enhancedSteps = [
    {
      ...workflowSteps[0],
      icon: <Users size={32} />,
      duration: '2-3 minutes',
      features: ['Identity verification', 'Exam credentials check', 'System requirements test']
    },
    {
      ...workflowSteps[1],
      icon: <Shield size={32} />,
      duration: 'Exam duration',
      features: ['Live video monitoring', 'AI behavior analysis', 'Real-time alerts']
    },
    {
      ...workflowSteps[2],
      icon: <FileText size={32} />,
      duration: 'Instant',
      features: ['Violation reports', 'Session recordings', 'Performance analytics']
    }
  ];

  return (
    <PublicLayout>
      <section className="public-shell public-page-hero how-it-works-hero">
        <div className="public-page-copy">
          <div className="process-badge">
            <Play size={16} />
            <span>Step-by-step guide</span>
          </div>
          <h1>How Secure Online Monitoring Works</h1>
          <p>
            From student verification to final reporting, the platform keeps the exam lifecycle
            simple, structured, and easy for institutions to manage.
          </p>
          <div className="public-page-actions">
            <Link to="/pricing" className="public-primary-button">
              Explore Plans
              <ArrowRight size={16} />
            </Link>
            <Link to="/admin/register" className="public-secondary-button">
              <CheckCircle size={16} />
              Get Started
            </Link>
          </div>
        </div>

        <div className="public-visual-card process-visual">
          <div className="process-animation">
            <div className="process-steps-mini">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`mini-step ${activeStep === step ? 'active' : ''}`}
                  onClick={() => setActiveStep(step)}
                >
                  <div className="mini-step-icon">
                    {enhancedSteps[step].icon}
                  </div>
                  <span className="mini-step-label">Step {step + 1}</span>
                </div>
              ))}
            </div>
            <div className="process-preview">
              <div className="preview-content">
                <h3>{enhancedSteps[activeStep].title}</h3>
                <p>{enhancedSteps[activeStep].body}</p>
                <div className="preview-duration">
                  <Clock size={16} />
                  <span>{enhancedSteps[activeStep].duration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section process-steps-section">
        <div className="public-section-title">
          <h2>Simple and Effective Process</h2>
          <p>Three connected stages keep the experience clear for admins, invigilators, and students.</p>
        </div>

        <div className="enhanced-process-grid">
          {enhancedSteps.map((step, index) => (
            <article 
              className={`enhanced-process-card ${activeStep === index ? 'active' : ''}`} 
              key={step.number}
              onMouseEnter={() => setActiveStep(index)}
            >
              <div className="process-step-header">
                <div className="process-step-icon">
                  {step.icon}
                </div>
                <div className="process-step-number">
                  <span>{step.number}</span>
                </div>
              </div>
              
              <div className="process-step-content">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                
                <div className="process-duration">
                  <Clock size={16} />
                  <span>{step.duration}</span>
                </div>
                
                <div className="process-features">
                  {step.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="process-feature">
                      <CheckCircle size={14} className="feature-check" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="process-step-image">
                <div className={`process-image-content ${step.imageClass.replace('landing-step-image-', '')}`} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-shell public-page-section process-timeline">
        <div className="public-section-title">
          <h2>Complete Exam Journey Timeline</h2>
          <p>From setup to results, see how the entire process flows seamlessly</p>
        </div>

        <div className="timeline-container">
          <div className="timeline-track">
            <div className="timeline-line" />
            
            <div className="timeline-items">
              <div className="timeline-item">
                <div className="timeline-marker">
                  <div className="marker-icon">
                    <Users size={20} />
                  </div>
                </div>
                <div className="timeline-content">
                  <h4>Setup Phase</h4>
                  <p>Admin creates exam, configures rules, and invites students</p>
                  <span className="timeline-time">5-10 minutes</span>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-marker">
                  <div className="marker-icon">
                    <Shield size={20} />
                  </div>
                </div>
                <div className="timeline-content">
                  <h4>Monitoring Phase</h4>
                  <p>Live proctoring with AI alerts and real-time oversight</p>
                  <span className="timeline-time">Exam duration</span>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-marker">
                  <div className="marker-icon">
                    <FileText size={20} />
                  </div>
                </div>
                <div className="timeline-content">
                  <h4>Analysis Phase</h4>
                  <p>Automated reports and violation summaries for review</p>
                  <span className="timeline-time">Instant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section process-benefits">
        <div className="public-section-title">
          <h2>Why This Process Works Better</h2>
          <p>Designed by educators, for educators with security and simplicity in mind</p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">
              <CheckCircle size={32} />
            </div>
            <h3>Zero Learning Curve</h3>
            <p>Intuitive interface requires minimal training for both admins and students.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <Shield size={32} />
            </div>
            <h3>Enterprise-Grade Security</h3>
            <p>Bank-level encryption and compliance with data protection regulations.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <Clock size={32} />
            </div>
            <h3>Real-Time Insights</h3>
            <p>Instant alerts and live monitoring prevent issues before they escalate.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <Users size={32} />
            </div>
            <h3>Scalable Architecture</h3>
            <p>Handles everything from small classes to university-wide examinations.</p>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section process-cta">
        <div className="process-cta-content">
          <div className="cta-visual">
            <div className="cta-steps">
              <div className="cta-step completed">
                <CheckCircle size={24} />
              </div>
              <div className="cta-connector" />
              <div className="cta-step completed">
                <CheckCircle size={24} />
              </div>
              <div className="cta-connector" />
              <div className="cta-step active">
                <Play size={24} />
              </div>
            </div>
          </div>
          
          <div className="cta-text">
            <h2>Ready to Transform Your Exam Process?</h2>
            <p>Join thousands of institutions that have already streamlined their online examinations with our secure monitoring platform.</p>
            
            <div className="cta-stats">
              <div className="stat-item">
                <strong>10,000+</strong>
                <span>Exams Monitored</span>
              </div>
              <div className="stat-item">
                <strong>99.9%</strong>
                <span>Uptime</span>
              </div>
              <div className="stat-item">
                <strong>4.8/5</strong>
                <span>User Rating</span>
              </div>
            </div>
          </div>
          
          <div className="cta-actions">
            <Link to="/admin/register" className="public-primary-button">
              Start Your Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="public-secondary-button">
              View Pricing
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
