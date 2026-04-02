import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Mic, Monitor, ShieldAlert, CheckCircle, Zap, Lock, Camera, AlertTriangle, FileText, Users, Clock, Award, ChevronRight, Play } from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import { featureItems } from './publicContent';
import './PublicPages.css';

const iconMap = {
  eye: Eye,
  shield: ShieldAlert,
  monitor: Monitor,
  mic: Mic,
};

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const categories = [
    { id: 'all', name: 'All Features', icon: <Zap size={20} /> },
    { id: 'monitoring', name: 'Monitoring', icon: <Eye size={20} /> },
    { id: 'security', name: 'Security', icon: <ShieldAlert size={20} /> },
    { id: 'reporting', name: 'Reporting', icon: <FileText size={20} /> },
  ];

  const enhancedFeatures = [
    {
      ...featureItems[0],
      category: 'monitoring',
      icon: <Eye size={32} />,
      benefits: ['Real-time video feeds', 'Multi-camera support', 'Session recording'],
      stats: '99.9% uptime'
    },
    {
      ...featureItems[1],
      category: 'security',
      icon: <ShieldAlert size={32} />,
      benefits: ['AI-powered detection', 'Multiple violation types', 'Instant alerts'],
      stats: '95% accuracy'
    },
    {
      ...featureItems[2],
      category: 'monitoring',
      icon: <Monitor size={32} />,
      benefits: ['Application tracking', 'Window monitoring', 'Browser control'],
      stats: '100% coverage'
    },
    {
      ...featureItems[3],
      category: 'monitoring',
      icon: <Mic size={32} />,
      benefits: ['Noise detection', 'Voice analysis', 'Background monitoring'],
      stats: '24/7 active'
    },
  ];

  const filteredFeatures = activeCategory === 'all' 
    ? enhancedFeatures 
    : enhancedFeatures.filter(feature => feature.category === activeCategory);

  const advancedFeatures = [
    {
      icon: <Lock size={40} />,
      title: 'End-to-End Encryption',
      description: 'Military-grade encryption protects all exam data and communications',
      highlight: 'Bank-level security'
    },
    {
      icon: <Camera size={40} />,
      title: 'Multi-Angle Monitoring',
      description: 'Support for multiple camera angles and room views',
      highlight: '360° coverage'
    },
    {
      icon: <AlertTriangle size={40} />,
      title: 'Smart Alert System',
      description: 'Intelligent alerts that reduce false positives and focus on real threats',
      highlight: 'AI-powered'
    },
    {
      icon: <FileText size={40} />,
      title: 'Comprehensive Reports',
      description: 'Detailed analytics and reports for audit trails and compliance',
      highlight: 'Audit-ready'
    },
    {
      icon: <Users size={40} />,
      title: 'Scalable Architecture',
      description: 'Handle from small classes to university-wide examinations',
      highlight: 'Unlimited scaling'
    },
    {
      icon: <Clock size={40} />,
      title: 'Real-Time Analytics',
      description: 'Live dashboard with instant insights and monitoring metrics',
      highlight: 'Live data'
    }
  ];

  return (
    <PublicLayout>
      <section className="public-shell public-page-hero features-hero">
        <div className="public-page-copy">
          <div className="features-badge">
            <Award size={16} />
            <span>Enterprise-grade features</span>
          </div>
          <h1>Feature-Rich Proctoring Built for Exam Integrity</h1>
          <p>
            Every feature in Exam Monitoring is designed to reduce manual effort, improve trust,
            and give institutions complete visibility into online assessments.
          </p>
          
          <div className="features-stats">
            <div className="feature-stat">
              <strong>50+</strong>
              <span>Advanced Features</span>
            </div>
            <div className="feature-stat">
              <strong>99.9%</strong>
              <span>Uptime Guarantee</span>
            </div>
            <div className="feature-stat">
              <strong>24/7</strong>
              <span>Support Available</span>
            </div>
          </div>
          
          <div className="public-page-actions">
            <Link to="/pricing" className="public-primary-button">
              View Pricing
              <ArrowRight size={16} />
            </Link>
            <Link to="/admin/register" className="public-secondary-button">
              <Play size={16} />
              Start Free Trial
            </Link>
          </div>
        </div>

        <div className="public-visual-card features-visual">
          <div className="features-showcase">
            <div className="showcase-header">
              <h3>Complete Monitoring Suite</h3>
              <p>All-in-one solution for secure online examinations</p>
            </div>
            <div className="showcase-features">
              <div className="showcase-feature">
                <Eye size={24} />
                <span>Live Monitoring</span>
              </div>
              <div className="showcase-feature">
                <ShieldAlert size={24} />
                <span>AI Detection</span>
              </div>
              <div className="showcase-feature">
                <FileText size={24} />
                <span>Smart Reports</span>
              </div>
              <div className="showcase-feature">
                <Lock size={24} />
                <span>Secure Platform</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section features-categories">
        <div className="public-section-title">
          <h2>Explore Features by Category</h2>
          <p>Find exactly what you need for your institution's exam security requirements</p>
        </div>

        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        <div className="enhanced-features-grid">
          {filteredFeatures.map((feature, index) => (
            <article 
              className="enhanced-feature-card" 
              key={feature.title}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="feature-header">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-stat">{feature.stats}</div>
                </div>
                <div className="feature-category-badge">
                  {categories.find(cat => cat.id === feature.category)?.name}
                </div>
              </div>
              
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              
              <div className="feature-benefits">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <div key={benefitIndex} className="benefit-item">
                    <CheckCircle size={16} className="benefit-check" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="feature-action">
                <Link to="/how-it-works" className="feature-link">
                  Learn more
                  <ChevronRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-shell public-page-section advanced-features">
        <div className="public-section-title">
          <h2>Advanced Features for Enterprise Needs</h2>
          <p>Sophisticated capabilities that scale with your institution's growth</p>
        </div>

        <div className="advanced-features-grid">
          {advancedFeatures.map((feature, index) => (
            <article className="advanced-feature-card" key={feature.title}>
              <div className="advanced-feature-icon">
                {feature.icon}
              </div>
              <div className="advanced-feature-content">
                <div className="feature-highlight">{feature.highlight}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-shell public-page-section capabilities-showcase">
        <div className="public-section-title">
          <h2>Complete Monitoring Capabilities</h2>
          <p>Everything you need to ensure exam integrity and academic honesty</p>
        </div>

        <div className="capabilities-container">
          <div className="capability-metrics">
            <div className="metric-card">
              <div className="metric-icon">
                <Users size={32} />
              </div>
              <div className="metric-content">
                <strong>10,000+</strong>
                <span>Active Students</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <Eye size={32} />
              </div>
              <div className="metric-content">
                <strong>24/7</strong>
                <span>Monitoring</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <ShieldAlert size={32} />
              </div>
              <div className="metric-content">
                <strong>99.9%</strong>
                <span>Detection Rate</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <FileText size={32} />
              </div>
              <div className="metric-content">
                <strong>Instant</strong>
                <span>Reports</span>
              </div>
            </div>
          </div>

          <div className="capability-details">
            <div className="capability-item">
              <div className="capability-icon">
                <CheckCircle size={20} />
              </div>
              <div className="capability-text">
                <h4>Real-Time Monitoring</h4>
                <p>Live video feeds with instant violation detection and alerts</p>
              </div>
            </div>
            <div className="capability-item">
              <div className="capability-icon">
                <CheckCircle size={20} />
              </div>
              <div className="capability-text">
                <h4>AI-Powered Detection</h4>
                <p>Machine learning algorithms identify suspicious behavior patterns</p>
              </div>
            </div>
            <div className="capability-item">
              <div className="capability-icon">
                <CheckCircle size={20} />
              </div>
              <div className="capability-text">
                <h4>Comprehensive Reporting</h4>
                <p>Detailed logs and evidence for academic integrity reviews</p>
              </div>
            </div>
            <div className="capability-item">
              <div className="capability-icon">
                <CheckCircle size={20} />
              </div>
              <div className="capability-text">
                <h4>Secure Platform</h4>
                <p>End-to-end encryption and compliance with data protection regulations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section institution-benefits">
        <div className="public-section-title">
          <h2>Why Institutions Choose This Platform</h2>
          <p>The public experience, proctoring stack, and admin controls are designed to work together.</p>
        </div>

        <div className="benefits-showcase">
          <div className="benefit-column">
            <div className="benefit-card enhanced">
              <div className="benefit-number">01</div>
              <h3>Faster Setup</h3>
              <p>Create exams, publish them, and onboard students without adding complex manual steps.</p>
              <div className="benefit-features">
                <span>5-minute setup</span>
                <span>Zero configuration</span>
                <span>Instant deployment</span>
              </div>
            </div>
          </div>
          
          <div className="benefit-column">
            <div className="benefit-card enhanced highlighted">
              <div className="benefit-number">02</div>
              <h3>Higher Trust</h3>
              <p>Admins get stronger visibility into exam behavior through live signals and evidence.</p>
              <div className="benefit-features">
                <span>Live monitoring</span>
                <span>Evidence collection</span>
                <span>Transparency reports</span>
              </div>
            </div>
          </div>
          
          <div className="benefit-column">
            <div className="benefit-card enhanced">
              <div className="benefit-number">03</div>
              <h3>Professional Reporting</h3>
              <p>Session violations and monitoring outcomes are ready for internal review and decisions.</p>
              <div className="benefit-features">
                <span>Audit-ready reports</span>
                <span>Compliance documentation</span>
                <span>Analytics dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section features-cta">
        <div className="features-cta-content">
          <div className="cta-visual">
            <div className="cta-feature-grid">
              <div className="cta-feature-item">
                <Eye size={24} />
              </div>
              <div className="cta-feature-item">
                <ShieldAlert size={24} />
              </div>
              <div className="cta-feature-item">
                <Monitor size={24} />
              </div>
              <div className="cta-feature-item">
                <FileText size={24} />
              </div>
            </div>
          </div>
          
          <div className="cta-text">
            <h2>Ready to Experience Complete Exam Security?</h2>
            <p>Join thousands of institutions that trust our platform for secure online examinations.</p>
            
            <div className="cta-highlights">
              <div className="cta-highlight">
                <CheckCircle size={16} />
                <span>30-day free trial</span>
              </div>
              <div className="cta-highlight">
                <CheckCircle size={16} />
                <span>No credit card required</span>
              </div>
              <div className="cta-highlight">
                <CheckCircle size={16} />
                <span>Full feature access</span>
              </div>
            </div>
          </div>
          
          <div className="cta-actions">
            <Link to="/admin/register" className="public-primary-button">
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link to="/how-it-works" className="public-secondary-button">
              <Play size={16} />
              See How It Works
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
