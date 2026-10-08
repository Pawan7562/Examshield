import React from 'react';
import {
  LockKeyhole,
  ShieldCheck,
  Laptop,
  Users,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { SECURITY_PILLARS, ACCREDITATION_BADGES } from '../../../content/landingContent';

const getSecurityIcon = (iconName) => {
  switch (iconName) {
    case 'LockKeyhole':
      return <LockKeyhole size={24} className="es-sec-icon" aria-hidden="true" />;
    case 'ShieldCheck':
      return <ShieldCheck size={24} className="es-sec-icon" aria-hidden="true" />;
    case 'Laptop':
      return <Laptop size={24} className="es-sec-icon" aria-hidden="true" />;
    case 'Users':
    default:
      return <Users size={24} className="es-sec-icon" aria-hidden="true" />;
  }
};

export default function SecurityCompliance() {
  return (
    <section id="security" className="es-section es-security-section" aria-labelledby="security-heading">
      <div className="es-container">
        {/* Section Header */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <LockKeyhole size={15} aria-hidden="true" />
            <span>SECURITY &amp; COMPLIANCE</span>
          </div>
          <h2 id="security-heading" className="es-section-title">
            Enterprise data privacy without compromise
          </h2>
          <p className="es-section-desc">
            Institutions trust Nexify Examina because academic integrity must never come at the expense of student safety, privacy rights, or system security.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="es-security-grid" role="list">
          {SECURITY_PILLARS.map((pillar) => (
            <article key={pillar.id} className="es-security-card" role="listitem">
              <div className="es-sec-card-top">
                <div className="es-sec-icon-box" aria-hidden="true">
                  {getSecurityIcon(pillar.iconName)}
                </div>
                <span className="es-sec-badge">{pillar.badge}</span>
              </div>
              <h3 className="es-sec-title">{pillar.title}</h3>
              <p className="es-sec-desc">{pillar.description}</p>
            </article>
          ))}
        </div>

        {/* Accreditation & Compliance Badge Row */}
        <div className="es-accreditation-banner">
          <div className="es-accred-label">
            <ShieldCheck size={18} className="es-accred-icon" aria-hidden="true" />
            <span>ACCREDITATION &amp; COMPLIANCE STANDARDS:</span>
          </div>
          <div className="es-accred-badges-row" role="list">
            {ACCREDITATION_BADGES.map((badge) => (
              <span key={badge} className="es-accred-chip" role="listitem">
                <CheckCircle2 size={13} className="es-chip-check" aria-hidden="true" />
                <span>{badge}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
