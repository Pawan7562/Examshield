import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Award,
  Monitor,
  Laptop,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AUDIENCE_SOLUTIONS, PORTAL_LINKS } from '../../../content/landingContent';

const getAudienceIcon = (iconName) => {
  switch (iconName) {
    case 'Building2':
      return <Building2 size={18} aria-hidden="true" />;
    case 'Award':
      return <Award size={18} aria-hidden="true" />;
    case 'Monitor':
      return <Monitor size={18} aria-hidden="true" />;
    case 'Laptop':
    default:
      return <Laptop size={18} aria-hidden="true" />;
  }
};

export default function SolutionsMatrix() {
  const [activeAudienceId, setActiveAudienceId] = useState('universities');

  const selectedAudience =
    AUDIENCE_SOLUTIONS.find((item) => item.id === activeAudienceId) || AUDIENCE_SOLUTIONS[0];

  return (
    <section id="solutions" className="es-section es-solutions-section" aria-labelledby="solutions-heading">
      <div className="es-container">
        {/* Section Header */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            <span>BUILT FOR YOUR ECOSYSTEM</span>
          </div>
          <h2 id="solutions-heading" className="es-section-title">
            Tailored solutions for every stakeholder
          </h2>
          <p className="es-section-desc">
            Whether managing university finals, high-stakes licensing, live invigilation, or taking an assessment, Nexify Examina is tuned to your workflow.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="es-solutions-tab-bar" role="tablist" aria-label="Stakeholder solution options">
          {AUDIENCE_SOLUTIONS.map((item) => {
            const isActive = activeAudienceId === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                className={`es-sol-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveAudienceId(item.id)}
              >
                {getAudienceIcon(item.iconName)}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Stakeholder Solution Card */}
        <article className="es-solution-active-card" role="tabpanel">
          {/* Left Column: Solution Detail & Features List */}
          <div className="es-sol-copy-col">
            <span className="es-sol-badge">{selectedAudience.badge}</span>
            <h3 className="es-sol-title">{selectedAudience.title}</h3>
            <p className="es-sol-desc">{selectedAudience.description}</p>

            <div className="es-sol-features-list" role="list">
              {selectedAudience.features.map((feature) => (
                <div key={feature} className="es-sol-feature-item" role="listitem">
                  <Check size={16} className="es-sol-check-icon" aria-hidden="true" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="es-sol-cta-wrap">
              <Link to={selectedAudience.ctaLink} className="es-btn es-btn-lime">
                <span>{selectedAudience.ctaText}</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right Column: Institutional Highlights Metrics */}
          <div className="es-sol-metrics-col">
            <h4 className="es-sol-metrics-title">Institutional Highlights</h4>
            <div className="es-sol-metrics-grid" role="list">
              {selectedAudience.metrics.map((metric) => (
                <div key={metric.label} className="es-sol-metric-box" role="listitem">
                  <strong className="es-metric-val">{metric.value}</strong>
                  <span className="es-metric-lbl">{metric.label}</span>
                </div>
              ))}
            </div>

            <div className="es-sol-assurance-callout">
              <ShieldCheck size={20} className="es-assurance-icon" aria-hidden="true" />
              <div>
                <strong>Enterprise Reliability Guarantee</strong>
                <span>Guaranteed 99.9% uptime SLA with real-time failover redundancy.</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
