import React, { useState, useEffect, useRef } from 'react';
import { PROOF_METRICS, TRUSTED_INSTITUTIONS } from '../../../content/landingContent';
import { Building2, Award, ShieldCheck } from 'lucide-react';

export default function StatsProofBand() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const bandRef = useRef(null);

  // Trigger count-up animation once when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.25 }
    );

    if (bandRef.current) {
      observer.observe(bandRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section ref={bandRef} className="es-stats-proof-section" aria-label="Institutional scale and validation">
      {/* Metrics Row */}
      <div className="es-container">
        <div className="es-metrics-grid" role="list">
          {PROOF_METRICS.map((metric, idx) => (
            <div key={metric.label} className="es-metric-card" role="listitem">
              <div className="es-metric-value-wrap">
                <span className="es-metric-value">{metric.value}</span>
              </div>
              <h3 className="es-metric-label">{metric.label}</h3>
              <p className="es-metric-caption">{metric.caption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slow Marquee of Verified Institutions & Accreditation Bodies */}
      <div className="es-trusted-marquee-wrap" aria-label="Trusted by institutions">
        <div className="es-trusted-header">
          <p className="es-trusted-kicker">
            TRUSTED BY UNIVERSITIES, STATE EXAM BOARDS &amp; CERTIFICATION AUTHORITIES
          </p>
        </div>

        <div className="es-marquee-viewport" tabIndex="0" aria-label="Partner institutions list">
          <div className="es-marquee-track">
            {/* Group 1 */}
            <div className="es-marquee-group" role="list">
              {TRUSTED_INSTITUTIONS.map((inst, i) => (
                <div key={`inst1-${i}`} className="es-inst-chip" role="listitem">
                  <Building2 size={14} className="es-inst-icon" aria-hidden="true" />
                  <span className="es-inst-name">{inst.name}</span>
                  <span className="es-inst-dot">•</span>
                  <span className="es-inst-domain">{inst.domain}</span>
                </div>
              ))}
            </div>

            {/* Group 2 (Duplicate for seamless continuous loop) */}
            <div className="es-marquee-group" aria-hidden="true" role="list">
              {TRUSTED_INSTITUTIONS.map((inst, i) => (
                <div key={`inst2-${i}`} className="es-inst-chip" role="listitem">
                  <Building2 size={14} className="es-inst-icon" aria-hidden="true" />
                  <span className="es-inst-name">{inst.name}</span>
                  <span className="es-inst-dot">•</span>
                  <span className="es-inst-domain">{inst.domain}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
