import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import SEOHead from '../../components/common/SEOHead';
import InstitutionalDemoForm from '../../components/public/InstitutionalDemoForm';
import { institutionalPages } from './institutionalPagesData';
import { 
  ShieldCheck, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  Cpu, 
  Lock, 
  Users, 
  FileText, 
  Award,
  Sparkles,
  Building,
  GraduationCap,
  Terminal,
  HelpCircle
} from 'lucide-react';
import './InstitutionalLandingPage.css';

export default function InstitutionalLandingPage({ forcedSlug = null }) {
  const { slug: routeSlug } = useParams();
  const slug = forcedSlug || routeSlug;
  const [openFaq, setOpenFaq] = useState(0);

  const page = institutionalPages[slug];

  if (!page) {
    return <Navigate to="/" replace />;
  }

  // Generate dynamic Schema.org JSON-LD
  const canonicalUrl = `https://exam.nexifyforge.in/${page.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: page.h1,
        description: page.metaDesc,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://exam.nexifyforge.in/'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: page.badge,
              item: canonicalUrl
            }
          ]
        }
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${canonicalUrl}#software`,
        name: `Nexify Examina — ${page.badge}`,
        applicationCategory: 'EducationalSoftware',
        applicationSubCategory: 'Examination & Proctoring Platform',
        operatingSystem: 'Modern Web Browsers (Chrome, Edge, Safari, Firefox)',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
          description: 'Institutional demonstration and trial available'
        }
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: page.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a
          }
        }))
      }
    ]
  };

  const toggleFaq = (index) => {
    setOpenFaq(prev => prev === index ? -1 : index);
  };

  return (
    <PublicLayout>
      <SEOHead
        title={page.seoTitle}
        description={page.metaDesc}
        keywords={page.keywords}
        canonical={canonicalUrl}
        jsonLd={jsonLd}
      />

      <div className="inst-page-container">
        {/* Breadcrumb Navigation */}
        <nav className="inst-breadcrumbs" aria-label="Breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="current-crumb">{page.badge}</span>
        </nav>

        {/* Hero Section */}
        <header className="inst-hero-section">
          <div className="inst-hero-badge">
            <Sparkles size={14} />
            <span>{page.badge}</span>
          </div>

          <h1 className="inst-hero-title">
            {page.h1}
          </h1>

          <p className="inst-hero-subtitle">
            {page.subtitle}
          </p>

          <div className="inst-hero-ctas">
            <a href="#request-demo" className="btn-primary-action">
              <span>Book Institutional Demo & Proposal</span>
              <ArrowRight size={16} />
            </a>
            <Link to="/features" className="btn-secondary-action">
              <span>Explore 6 Layers of Integrity</span>
            </Link>
          </div>

          <div className="inst-target-audience">
            <Building size={16} color="#10b981" />
            <span>Engineered specifically for: <strong>{page.targetAudience}</strong></span>
          </div>
        </header>

        {/* Verified Performance Metrics Bar */}
        <section className="inst-metrics-bar" aria-label="Key Performance Metrics">
          <div className="inst-metrics-grid">
            {page.metrics.map((m, idx) => (
              <div key={idx} className="inst-metric-card">
                <div className="metric-val">{m.value}</div>
                <div className="metric-label">{m.label}</div>
                <div className="metric-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Content Layout: Features + Demo Form */}
        <section className="inst-main-content">
          <div className="inst-grid-split">
            {/* Left Column: Core Features & Architecture */}
            <div className="inst-left-content">
              <div className="section-eyebrow">
                <ShieldCheck size={16} /> Product Architecture
              </div>
              <h2 className="section-heading">
                Engineered for High-Stakes Institutional Reliability
              </h2>
              <p className="section-desc">
                Unlike generic survey tools, Nexify Examina delivers a purpose-built examination infrastructure tested for high concurrency, zero software downloads, and court-admissible audit logs.
              </p>

              <div className="inst-features-list">
                {page.features.map((f, idx) => (
                  <div key={idx} className="inst-feature-item">
                    <div className="feature-icon-box">
                      {idx === 0 && <Terminal size={22} color="#10b981" />}
                      {idx === 1 && <Lock size={22} color="#10b981" />}
                      {idx === 2 && <Cpu size={22} color="#10b981" />}
                      {idx === 3 && <Award size={22} color="#10b981" />}
                    </div>
                    <div className="feature-details">
                      <h3>{f.title}</h3>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Use Cases Grid */}
              <div className="inst-use-cases-box">
                <h3>Primary Institutional Use Cases</h3>
                <div className="use-cases-grid">
                  {page.useCases.map((u, idx) => (
                    <div key={idx} className="use-case-card">
                      <div className="use-case-title">
                        <CheckCircle size={16} color="#10b981" />
                        <span>{u.title}</span>
                      </div>
                      <p>{u.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Lead Capture Form */}
            <div className="inst-right-form" id="request-demo">
              <div className="form-sticky-wrap">
                <InstitutionalDemoForm
                  sourcePage={`/${page.slug}`}
                  title="Request Institutional Demo & Proposal"
                  subtitle={`Connect with our exam solutions engineer for ${page.badge.toLowerCase()} deployment.`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Accordion FAQ Section */}
        <section className="inst-faq-section" aria-labelledby="faq-heading">
          <div className="faq-header">
            <div className="section-eyebrow">
              <HelpCircle size={16} /> Knowledge & Compliance
            </div>
            <h2 id="faq-heading" className="section-heading">
              Frequently Asked Questions
            </h2>
            <p className="section-desc">
              Clear answers to institutional, technical, and regulatory questions regarding {page.badge.toLowerCase()}.
            </p>
          </div>

          <div className="faq-accordion-list">
            {page.faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={`faq-accordion-item ${isOpen ? 'active' : ''}`}>
                  <button
                    className="faq-question-btn"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className="faq-toggle-icon" />
                  </button>
                  {isOpen && (
                    <div className="faq-answer-panel">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Related Solutions Cross-Linking (SEO Internal Links) */}
        <section className="inst-related-solutions">
          <h3>Explore Specialized Solutions for Indian Institutions</h3>
          <div className="solutions-pills-wrap">
            {Object.values(institutionalPages)
              .filter(p => p.slug !== page.slug)
              .map(p => (
                <Link key={p.slug} to={`/${p.slug}`} className="solution-pill-link">
                  <GraduationCap size={14} />
                  <span>{p.badge}</span>
                  <ArrowRight size={12} />
                </Link>
              ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
