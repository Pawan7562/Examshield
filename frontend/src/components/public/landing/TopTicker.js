import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, GraduationCap, ShieldCheck, Building2, CheckCircle2 } from 'lucide-react';
import { TICKER_ITEMS, PORTAL_LINKS } from '../../../content/landingContent';

const getIconForType = (type) => {
  switch (type) {
    case 'release':
      return <Sparkles size={12} className="ticker-icon" aria-hidden="true" />;
    case 'metric':
      return <GraduationCap size={12} className="ticker-icon" aria-hidden="true" />;
    case 'security':
      return <ShieldCheck size={12} className="ticker-icon" aria-hidden="true" />;
    case 'performance':
      return <Building2 size={12} className="ticker-icon" aria-hidden="true" />;
    case 'compliance':
    default:
      return <CheckCircle2 size={12} className="ticker-icon" aria-hidden="true" />;
  }
};

export default function TopTicker() {
  return (
    <aside className="es-top-ticker" aria-label="Live platform status announcement">
      <div className="es-ticker-inner">
        {/* Fixed Left Live Beacon */}
        <div className="es-ticker-badge">
          <span className="es-live-beacon" aria-hidden="true">
            <span className="beacon-ping" />
            <span className="beacon-core" />
          </span>
          <span className="es-ticker-badge-text">LIVE RADAR</span>
        </div>

        {/* Seamless Marquee with CSS Fade Masks */}
        <div className="es-ticker-viewport" role="region" aria-label="Platform telemetry ticker">
          <div className="es-ticker-track">
            {/* Loop 1 */}
            <div className="es-ticker-group">
              {TICKER_ITEMS.map((item, idx) => (
                <span key={`t1-${idx}`} className="es-ticker-item">
                  {getIconForType(item.type)}
                  <strong>{item.badge}</strong>
                  <span className="es-ticker-separator">•</span>
                  <span>{item.text}</span>
                  <span className="es-ticker-bullet" aria-hidden="true">✦</span>
                </span>
              ))}
            </div>

            {/* Loop 2 (Exact Duplicate for continuous 0% to -100% loop) */}
            <div className="es-ticker-group" aria-hidden="true">
              {TICKER_ITEMS.map((item, idx) => (
                <span key={`t2-${idx}`} className="es-ticker-item">
                  {getIconForType(item.type)}
                  <strong>{item.badge}</strong>
                  <span className="es-ticker-separator">•</span>
                  <span>{item.text}</span>
                  <span className="es-ticker-bullet" aria-hidden="true">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Right CTA Action */}
        <div className="es-ticker-action">
          <Link to={PORTAL_LINKS.pilotRequest} className="es-ticker-action-link" aria-label="Request campus pilot">
            <span>Request Campus Pilot</span>
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
