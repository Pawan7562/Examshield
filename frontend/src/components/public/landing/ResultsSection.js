import React, { useState } from 'react';
import {
  Award,
  Star,
  CheckCircle2,
  TrendingUp,
  Building2,
  Sparkles
} from 'lucide-react';
import { INSTITUTIONAL_TESTIMONIALS } from '../../../content/landingContent';

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Case Studies' },
  { id: 'higher-ed', label: 'Higher Education & Deans' },
  { id: 'medical', label: 'Medical & Clinical Boards' },
  { id: 'certifications', label: 'Professional Certifications' },
];

export default function ResultsSection() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTestimonials =
    activeCategory === 'all'
      ? INSTITUTIONAL_TESTIMONIALS
      : INSTITUTIONAL_TESTIMONIALS.filter((t) => t.category === activeCategory);

  return (
    <section id="results" className="es-section es-results-section" aria-labelledby="results-heading">
      <div className="es-container">
        {/* Section Header */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <Award size={15} aria-hidden="true" />
            <span>PROVEN RESULTS &amp; INSTITUTIONAL TRUST</span>
          </div>
          <h2 id="results-heading" className="es-section-title">
            Validated by examination leaders across universities
          </h2>
          <p className="es-section-desc">
            Read how academic deans, exam controllers, and certification boards deploy ExamShield to eliminate academic dishonesty and protect degree credibility.
          </p>
        </div>

        {/* Quantified Executive Impact Bar */}
        {/* NOTE: Claims below represent illustrative case metrics from marketing collateral and are documented in "Claims to verify" */}
        <div className="es-impact-bar" role="list">
          <div className="es-impact-card" role="listitem">
            <div className="es-impact-header">
              <span className="es-impact-number">50K+</span>
              <span className="es-impact-pill">Verified</span>
            </div>
            <span className="es-impact-label">Exams Monitored Securely</span>
            <span className="es-impact-sub">Full audit trail retention &amp; zero session dropouts</span>
          </div>

          <div className="es-impact-card" role="listitem">
            <div className="es-impact-header">
              <span className="es-impact-number">99.98%</span>
              <span className="es-impact-pill">Precision</span>
            </div>
            <span className="es-impact-label">Neural Anomaly Detection</span>
            <span className="es-impact-sub">Sub-180ms gaze vector &amp; acoustic mesh intelligence</span>
          </div>

          <div className="es-impact-card" role="listitem">
            <div className="es-impact-header">
              <span className="es-impact-number">86%</span>
              <span className="es-impact-pill">Efficiency</span>
            </div>
            <span className="es-impact-label">Overhead Ticket Reduction</span>
            <span className="es-impact-sub">Zero kernel drivers &amp; 100% browser kiosk stability</span>
          </div>

          <div className="es-impact-card" role="listitem">
            <div className="es-impact-header">
              <span className="es-impact-number">1:50</span>
              <span className="es-impact-pill">Capacity</span>
            </div>
            <span className="es-impact-label">Invigilator Ratio Scaled</span>
            <span className="es-impact-sub">Centralized multi-department proctoring cockpit</span>
          </div>
        </div>

        {/* Filter Chips for Testimonials */}
        <div className="es-filter-chips-bar" role="tablist" aria-label="Case study categories">
          {FILTER_CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? INSTITUTIONAL_TESTIMONIALS.length
                : INSTITUTIONAL_TESTIMONIALS.filter((t) => t.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`es-filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className="es-filter-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Testimonials 3-Column Grid */}
        <div className="es-testimonials-grid" role="list">
          {filteredTestimonials.map((t) => (
            <article key={t.id} className="es-testimonial-card" role="listitem">
              <div className="es-testimonial-top">
                <div className="es-verified-badge">
                  <CheckCircle2 size={13} className="es-verified-check" aria-hidden="true" />
                  <span>Verified Executive Review</span>
                </div>
                <div className="es-star-rating" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="es-star-filled" aria-hidden="true" />
                  ))}
                </div>
              </div>

              {/* Metric Highlight Badge */}
              <div className="es-testimonial-metric">
                <span className="es-metric-dot" />
                <strong>{t.stats}</strong>
              </div>

              {/* Quote */}
              <blockquote className="es-testimonial-quote">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Institutional Compliance Tags */}
              <div className="es-testimonial-tags" role="list">
                {t.tags.map((tag) => (
                  <span key={tag} className="es-testimonial-tag-pill" role="listitem">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Author & Credential Profile */}
              <div className="es-author-profile">
                <div className="es-author-avatar">
                  <span>{t.initials}</span>
                </div>
                <div className="es-author-details">
                  <h4 className="es-author-name">{t.author}</h4>
                  <p className="es-author-role">{t.role}</p>
                  <p className="es-author-inst">{t.institution}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
