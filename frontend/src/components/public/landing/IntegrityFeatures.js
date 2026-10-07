import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanFace,
  LockKeyhole,
  Mic,
  Monitor,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { PROCTORING_ENGINES, PORTAL_LINKS } from '../../../content/landingContent';
import kioskImg from '../../../assets/kiosk-security-3d.jpg';
import dossierImg from '../../../assets/forensic-dossier-3d.jpg';

const getEngineIcon = (iconName) => {
  switch (iconName) {
    case 'ScanFace':
      return <ScanFace size={24} className="es-engine-icon" aria-hidden="true" />;
    case 'LockKeyhole':
      return <LockKeyhole size={24} className="es-engine-icon" aria-hidden="true" />;
    case 'Mic':
      return <Mic size={24} className="es-engine-icon" aria-hidden="true" />;
    case 'Monitor':
      return <Monitor size={24} className="es-engine-icon" aria-hidden="true" />;
    case 'FileText':
      return <FileText size={24} className="es-engine-icon" aria-hidden="true" />;
    case 'Layers':
    default:
      return <Layers size={24} className="es-engine-icon" aria-hidden="true" />;
  }
};

export default function IntegrityFeatures() {
  const [mousePos, setMousePos] = useState({});

  const handleMouseMove = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos((prev) => ({
      ...prev,
      [id]: { x: e.clientX - rect.left, y: e.clientY - rect.top },
    }));
  };

  return (
    <section id="integrity-layers" className="es-section es-features-section" aria-labelledby="engines-heading">
      <div className="es-container">
        {/* Section Title */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>ENGINEERING EXCELLENCE</span>
          </div>
          <h2 id="engines-heading" className="es-section-title">
            Six layers of examination integrity
          </h2>
          <p className="es-section-desc">
            An end-to-end defense matrix engineered to detect unfair advantages without placing undue technical burden on candidates.
          </p>
        </div>

        {/* Bento Grid with Varied Card Sizes */}
        <div className="es-bento-grid" role="list">
          {PROCTORING_ENGINES.map((engine) => {
            const pos = mousePos[engine.id] || { x: -100, y: -100 };
            return (
              <article
                key={engine.id}
                className={`es-bento-card ${engine.span} ${engine.accent === 'lime' ? 'highlight-border' : ''}`}
                onMouseMove={(e) => handleMouseMove(e, engine.id)}
                role="listitem"
              >
                {/* Dynamic Cursor Spotlight Effect */}
                <div
                  className="es-card-spotlight"
                  style={{
                    background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, rgba(184, 242, 107, 0.12), transparent 70%)`,
                  }}
                  aria-hidden="true"
                />

                {/* 3D Visual Media Preview */}
                {(engine.id === 'kiosk-lockdown' || engine.id === 'browser-kiosk') && (
                  <div className="es-bento-media-preview">
                    <img
                      src={kioskImg}
                      alt="3D Kiosk Browser & System Lockdown sandbox architecture"
                      loading="lazy"
                    />
                    <div className="es-media-preview-glow" aria-hidden="true" />
                  </div>
                )}

                {(engine.id === 'forensic-dossier' || engine.id === 'dossier') && (
                  <div className="es-bento-media-preview">
                    <img
                      src={dossierImg}
                      alt="3D Cryptographic examination incident forensic dossier"
                      loading="lazy"
                    />
                    <div className="es-media-preview-glow" aria-hidden="true" />
                  </div>
                )}

                <div className="es-bento-top">
                  <div className="es-bento-icon-wrapper">
                    {getEngineIcon(engine.iconName)}
                  </div>
                  <span className="es-bento-badge">{engine.badge}</span>
                </div>

                <div className="es-bento-content">
                  <h3 className="es-bento-title">{engine.title}</h3>
                  <h4 className="es-bento-subtitle">{engine.subtitle}</h4>
                  <p className="es-bento-desc">{engine.description}</p>
                </div>

                <div className="es-bento-tags" role="list">
                  {engine.tags.map((tag) => (
                    <span key={tag} className="es-bento-tag-chip" role="listitem">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {/* Section Footer Link */}
        <div className="es-section-action-center">
          <Link
            to={PORTAL_LINKS.features}
            className="es-link-inline-cta"
            aria-label="Explore all proctoring features in detail"
          >
            <span>Explore all security &amp; proctoring features</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
