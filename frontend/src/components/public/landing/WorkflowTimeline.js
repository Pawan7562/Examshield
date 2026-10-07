import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanFace,
  LockKeyhole,
  Eye,
  FileText,
  Check,
  ArrowRight,
  Layers
} from 'lucide-react';
import { LIFECYCLE_STEPS, PORTAL_LINKS } from '../../../content/landingContent';

const getStepIcon = (iconName) => {
  switch (iconName) {
    case 'ScanFace':
      return <ScanFace size={24} className="es-step-icon" aria-hidden="true" />;
    case 'LockKeyhole':
      return <LockKeyhole size={24} className="es-step-icon" aria-hidden="true" />;
    case 'Eye':
      return <Eye size={24} className="es-step-icon" aria-hidden="true" />;
    case 'FileText':
    default:
      return <FileText size={24} className="es-step-icon" aria-hidden="true" />;
  }
};

export default function WorkflowTimeline() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="workflow" className="es-section es-workflow-section" aria-labelledby="workflow-heading">
      <div className="es-container">
        {/* Section Header */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <Layers size={15} aria-hidden="true" />
            <span>SEAMLESS WORKFLOW</span>
          </div>
          <h2 id="workflow-heading" className="es-section-title">
            From candidate check-in to certified audit
          </h2>
          <p className="es-section-desc">
            A streamlined 4-phase examination journey that guarantees smooth student entry and indisputable administrative accountability.
          </p>
        </div>

        {/* 4-Step Timeline Container */}
        <div className="es-timeline-container">
          {/* Desktop Connecting Progress Track */}
          <div className="es-timeline-track" aria-hidden="true">
            <div
              className="es-timeline-fill"
              style={{ width: `${((activeStep + 1) / LIFECYCLE_STEPS.length) * 100}%` }}
            />
          </div>

          {/* 4 Step Cards (Equal 4-Column Layout on Desktop, Vertical on Mobile) */}
          <div className="es-timeline-grid" role="list">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <article
                  key={step.number}
                  className={`es-step-card ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setActiveStep(idx)}
                  onClick={() => setActiveStep(idx)}
                  role="listitem"
                >
                  {/* Step Top Badge with Icon & Step Number */}
                  <div className="es-step-header">
                    <div className="es-step-icon-bubble" aria-hidden="true">
                      {getStepIcon(step.iconName)}
                    </div>
                    <span className="es-step-num">STEP {step.number}</span>
                  </div>

                  <div className="es-step-body">
                    <span className="es-step-phase">{step.phase}</span>
                    <h3 className="es-step-title">{step.title}</h3>
                    <p className="es-step-desc">{step.description}</p>

                    {/* Step Checklist Items */}
                    <div className="es-step-checklist" role="list">
                      {step.details.map((detail) => (
                        <div key={detail} className="es-step-check-item" role="listitem">
                          <Check size={13} className="es-check-bullet" aria-hidden="true" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="es-step-footer">
                    <span className="es-step-duration">Duration: {step.duration}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Section Footer Link */}
        <div className="es-section-action-center">
          <Link
            to={PORTAL_LINKS.howItWorks}
            className="es-link-inline-cta"
            aria-label="View the complete examination lifecycle guide"
          >
            <span>View the complete examination lifecycle guide</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
