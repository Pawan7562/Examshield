import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeAlert,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  Mic,
  Monitor,
  Phone,
  PlayCircle,
  ScanFace,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PublicLayout from '../../components/public/PublicLayout';
import { featureItems, pricingPlans, workflowSteps } from './publicContent';
import './Home.css';

const iconMap = {
  eye: Eye,
  shield: ShieldAlert,
  monitor: Monitor,
  mic: Mic,
};

const dashboardPathFor = (role) => {
  if (role === 'student') return '/student/dashboard';
  if (role === 'super_admin') return '/super-admin/dashboard';
  return '/admin/dashboard';
};

export default function Home() {
  const { user } = useAuth();
  const dashboardPath = dashboardPathFor(user?.role);
  const startExamTarget = user?.role === 'student' ? '/student/dashboard' : '/student/login';
  const ctaTarget = user ? dashboardPath : '/admin/register';

  return (
    <PublicLayout>
      <section className="public-shell landing-hero" aria-labelledby="hero-heading">
        <div className="landing-copy">
          <h1 id="hero-heading">AI-Based Secure Exam Monitoring System</h1>
          <p>Prevent cheating with real-time proctoring</p>

          <div className="landing-actions" role="group" aria-label="Primary actions">
            <Link to={startExamTarget} className="landing-primary-button" aria-label="Start your exam now">
              Start Exam
            </Link>
            <Link to="/how-it-works" className="landing-secondary-button" aria-label="Watch demo of how it works">
              <PlayCircle size={16} aria-hidden="true" />
              Watch Demo
            </Link>
          </div>
        </div>

        <div className="landing-visual" aria-hidden="true">
          <div className="landing-hero-photo-card">
            <div className="landing-hero-photo" role="img" aria-label="Student taking exam with monitoring" />

            <div className="landing-detection-card">
              <div className="landing-detection-chip">Face Detected</div>
              <div className="landing-detection-shot" role="img" aria-label="Face detection preview" />
            </div>

            <div className="landing-alert-stack">
              <div className="landing-alert-badge" role="alert">
                <BadgeAlert size={14} aria-hidden="true" />
                <span>Warning: Multiple Faces Detected</span>
              </div>
              <div className="landing-alert-badge" role="alert">
                <ScanFace size={14} aria-hidden="true" />
                <span>Alert: Looking Away</span>
              </div>
            </div>

            <div className="landing-thumb-row">
              <div className="landing-thumb landing-thumb-one" role="img" aria-label="Monitoring thumbnail 1" />
              <div className="landing-thumb landing-thumb-two" role="img" aria-label="Monitoring thumbnail 2" />
              <div className="landing-thumb landing-thumb-three" role="img" aria-label="Monitoring thumbnail 3" />
              <div className="landing-thumb landing-thumb-four" role="img" aria-label="Monitoring thumbnail 4" />
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell landing-section" aria-labelledby="features-heading">
        <div className="landing-section-title">
          <h2 id="features-heading">Powerful Proctoring Features</h2>
          <p>Advanced tools to ensure exam integrity</p>
        </div>

        <div className="landing-feature-grid" role="list">
          {featureItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <article className="landing-feature-card" key={item.title} role="listitem">
                <div className="landing-feature-icon" aria-hidden="true">
                  <Icon size={36} strokeWidth={2} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.shortDescription}</p>
              </article>
            );
          })}
        </div>

        <div className="landing-inline-link-row">
          <Link to="/features" className="landing-inline-link" aria-label="Explore all proctoring features">
            Explore all features
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="public-shell landing-section" aria-labelledby="workflow-heading">
        <div className="landing-section-title">
          <h2 id="workflow-heading">How It Works</h2>
          <p>Simple and Effective Process</p>
        </div>

        <div className="landing-step-grid" role="list">
          {workflowSteps.map((step) => (
            <article className="landing-step-card" key={step.number} role="listitem">
              <div className={`landing-step-image ${step.imageClass}`} role="img" aria-label={`${step.title} step illustration`} />
              <div className="landing-step-label">
                <span className="landing-step-number" aria-label={`Step ${step.number}`}>{step.number}</span>
                <span>{step.title}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="landing-inline-link-row">
          <Link to="/how-it-works" className="landing-inline-link" aria-label="View complete exam monitoring process">
            View full process
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="public-shell landing-section" aria-labelledby="pricing-heading">
        <div className="landing-section-title">
          <h2 id="pricing-heading">Simple Pricing for Institutions</h2>
          <p>Choose a plan that matches your exam volume and monitoring needs.</p>
        </div>

        <div className="landing-pricing-grid enhanced-home-pricing" role="list">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`landing-pricing-card enhanced-home-pricing-card${plan.highlight ? ' landing-pricing-card-highlight' : ''}`}
              role="listitem"
              aria-labelledby={`plan-${plan.name.toLowerCase()}`}
            >
              {plan.highlight && <span className="landing-pricing-badge">Most Popular</span>}
              <h3 id={`plan-${plan.name.toLowerCase()}`}>{plan.name}</h3>
              <p className="landing-pricing-label">{plan.label}</p>
              <div className="landing-pricing-value">
                <span className="price-currency">₹</span>
                <strong>{plan.price}</strong>
                <span className="price-period">/ month</span>
              </div>
              <div className="landing-pricing-features" role="list">
                {plan.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="pricing-feature-item" role="listitem">
                    <span className="feature-check">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/pricing" className="landing-pricing-button">
                View Full Plan
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>

        <div className="landing-inline-link-row">
          <Link to="/pricing" className="landing-inline-link" aria-label="Compare all pricing plans in detail">
            Compare all pricing plans
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="public-shell landing-dashboard-section enhanced-dashboard-section" aria-labelledby="demo-heading">
        <div className="landing-section-title">
          <h2 id="demo-heading">Powerful Analytics Dashboard</h2>
          <p>Real-time insights and comprehensive monitoring at your fingertips</p>
        </div>
        
        <div className="enhanced-dashboard-container">
          <div className="dashboard-showcase">
            <div className="dashboard-header">
              <div className="dashboard-title">
                <h3>Live Monitoring Dashboard</h3>
                <div className="dashboard-status">
                  <span className="status-indicator active"></span>
                  <span>Live Monitoring Active</span>
                </div>
              </div>
              <div className="dashboard-stats">
                <div className="stat-item">
                  <strong>24</strong>
                  <span>Active Exams</span>
                </div>
                <div className="stat-item">
                  <strong>156</strong>
                  <span>Students Online</span>
                </div>
                <div className="stat-item">
                  <strong>99.9%</strong>
                  <span>System Uptime</span>
                </div>
              </div>
            </div>
            
            <div className="dashboard-content">
              <div className="dashboard-metrics">
                <div className="metric-card">
                  <div className="metric-icon">
                    <Eye size={24} />
                  </div>
                  <div className="metric-info">
                    <h4>Live Monitoring</h4>
                    <p>Real-time video feeds from all exam sessions</p>
                    <span className="metric-value">24 active</span>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <ShieldAlert size={24} />
                  </div>
                  <div className="metric-info">
                    <h4>AI Alerts</h4>
                    <p>Automated violation detection and alerts</p>
                    <span className="metric-value">3 alerts</span>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <FileText size={24} />
                  </div>
                  <div className="metric-info">
                    <h4>Reports</h4>
                    <p>Comprehensive exam reports and analytics</p>
                    <span className="metric-value">12 completed</span>
                  </div>
                </div>
              </div>
              
              <div className="dashboard-preview">
                <div className="preview-header">
                  <h4>Exam Session Overview</h4>
                  <div className="preview-controls">
                    <button className="control-btn active">Live</button>
                    <button className="control-btn">History</button>
                  </div>
                </div>
                <div className="preview-content">
                  <div className="preview-grid">
                    <div className="preview-item">
                      <div className="preview-avatar"></div>
                      <div className="preview-info">
                        <span className="preview-name">Student A</span>
                        <span className="preview-status">In Progress</span>
                      </div>
                      <div className="preview-actions">
                        <button className="action-btn monitor">Monitor</button>
                      </div>
                    </div>
                    <div className="preview-item">
                      <div className="preview-avatar"></div>
                      <div className="preview-info">
                        <span className="preview-name">Student B</span>
                        <span className="preview-status">Completed</span>
                      </div>
                      <div className="preview-actions">
                        <button className="action-btn review">Review</button>
                      </div>
                    </div>
                    <div className="preview-item">
                      <div className="preview-avatar"></div>
                      <div className="preview-info">
                        <span className="preview-name">Student C</span>
                        <span className="preview-status alert">Alert</span>
                      </div>
                      <div className="preview-actions">
                        <button className="action-btn alert">View Alert</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="landing-inline-link-row">
          <Link to="/admin/register" className="landing-inline-link" aria-label="Try the dashboard with a free trial">
            Try Dashboard Demo
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="public-shell landing-cta-section" aria-labelledby="cta-heading">
        <h2 id="cta-heading">Ready to Secure Your Online Exams?</h2>
        <Link to={ctaTarget} className="landing-cta-button" aria-label="Get started with secure exam monitoring">
          Get Started Now
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </PublicLayout>
  );
}
