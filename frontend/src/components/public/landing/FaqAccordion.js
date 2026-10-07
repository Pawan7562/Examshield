import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { INSTITUTIONAL_FAQS } from '../../../content/landingContent';

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="es-section es-faq-section" aria-labelledby="faq-heading">
      <div className="es-container">
        {/* Section Header */}
        <div className="es-section-header">
          <div className="es-section-eyebrow">
            <HelpCircle size={15} aria-hidden="true" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 id="faq-heading" className="es-section-title">
            Everything you need to know about ExamShield
          </h2>
          <p className="es-section-desc">
            Common questions from academic deans, IT administrators, and testing coordinators.
          </p>
        </div>

        {/* Accessible Accordion List */}
        <div className="es-faq-accordion-list" role="region" aria-label="Frequently asked questions list">
          {INSTITUTIONAL_FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className={`es-faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  id={`faq-btn-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  className="es-faq-trigger"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="es-faq-question-text">{faq.q}</span>
                  <span className={`es-faq-icon-wrap ${isOpen ? 'rotate' : ''}`} aria-hidden="true">
                    <ChevronDown size={18} />
                  </span>
                </button>

                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-btn-${index}`}
                  className={`es-faq-answer-panel ${isOpen ? 'expanded' : 'collapsed'}`}
                  hidden={!isOpen}
                >
                  <div className="es-faq-answer-content">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
