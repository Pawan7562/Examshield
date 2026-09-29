import React, { useState } from 'react';
import { ArrowRight, Mail, Phone, MessageCircle, MapPin, Clock, CheckCircle2, Building2, Users, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import SEOHead from '../../components/common/SEOHead';
import './Contact.css';

const contactReasons = [
  { value: '', label: 'Select a reason' },
  { value: 'institutional-trial', label: 'Start Institutional Trial' },
  { value: 'demo', label: 'Schedule a Campus Demo' },
  { value: 'lms-integration', label: 'LMS Integration Support' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'enterprise', label: 'Enterprise / Large Campus Inquiry' },
  { value: 'partnership', label: 'Partnership Opportunity' },
  { value: 'general', label: 'General Inquiry' },
];

const teamCards = [
  {
    icon: Building2,
    name: 'Institutional Sales',
    description: 'For university registrars, exam controllers, and academic IT teams exploring ExamShield for their campus.',
    contact: 'sales@examshield.io',
    response: 'Within 4 business hours',
    color: 'green',
  },
  {
    icon: Users,
    name: 'Technical Support',
    description: 'For existing institutional admins, faculty invigilators, or IT teams with integration or platform questions.',
    contact: 'support@examshield.io',
    response: '24/7 · Within 2 hours',
    color: 'blue',
  },
  {
    icon: ShieldCheck,
    name: 'Enterprise & Compliance',
    description: 'For data protection officers, legal teams, and enterprise buyers requiring FERPA, GDPR, and ISO compliance documentation.',
    contact: 'enterprise@examshield.io',
    response: 'Within 1 business day',
    color: 'orange',
  },
];

const officeLocations = [
  {
    city: 'Bangalore',
    country: 'India (HQ)',
    address: '12th Floor, Prestige Tech Park,\nOuter Ring Road, Bangalore — 560103',
    phone: '+91 80 4567 8900',
    hours: 'Mon–Fri: 9AM–7PM IST',
  },
  {
    city: 'Singapore',
    country: 'Asia-Pacific',
    address: 'Level 30, Ocean Financial Centre,\n10 Collyer Quay, Singapore — 049315',
    phone: '+65 6801 2345',
    hours: 'Mon–Fri: 9AM–6PM SGT',
  },
];

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '', email: '', phone: '', institution: '', role: '', reason: '', message: '', newsletter: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Contact ExamShield & Nexify Forge | University Pilot & Support"
        description="Get in touch with ExamShield by Nexify Forge. Request an institutional university pilot, schedule a live AI proctoring demo, or speak with our academic technology solutions engineers."
        canonical="https://exam.nexifyforge.in/contact"
      />
      {/* Hero */}
      <section className="contact-hero-section public-shell" aria-labelledby="contact-hero-h1">
        <div className="contact-hero-eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          <span>Enterprise Sales & Support</span>
        </div>
        <h1 id="contact-hero-h1">
          Talk to the ExamShield<br /><span>institutional team</span>
        </h1>
        <p className="contact-hero-sub">
          Whether you're a university registrar exploring our platform, an IT administrator setting up LMS integration, or a compliance officer reviewing our data governance posture — the right team is waiting.
        </p>
        <div className="contact-hero-trust">
          <div className="contact-trust-item">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>No-pressure evaluation</span>
          </div>
          <div className="contact-trust-item">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Response within 4 hours</span>
          </div>
          <div className="contact-trust-item">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Dedicated onboarding engineer</span>
          </div>
        </div>
      </section>

      {/* Team Contact Cards */}
      <section className="public-shell contact-teams-section" aria-labelledby="contact-teams-heading">
        <p className="contact-kicker">WHO SHOULD YOU CONTACT?</p>
        <h2 id="contact-teams-heading">Connect with the right team directly</h2>
        <div className="contact-teams-grid" role="list">
          {teamCards.map(team => {
            const Icon = team.icon;
            return (
              <article key={team.name} className={`contact-team-card contact-team-${team.color}`} role="listitem">
                <div className={`contact-team-icon contact-icon-${team.color}`} aria-hidden="true">
                  <Icon size={24} strokeWidth={2} />
                </div>
                <h3>{team.name}</h3>
                <p>{team.description}</p>
                <a href={`mailto:${team.contact}`} className={`contact-team-email contact-email-${team.color}`}>
                  <Mail size={14} aria-hidden="true" />
                  {team.contact}
                </a>
                <div className="contact-team-response">
                  <Clock size={13} aria-hidden="true" />
                  <span>{team.response}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Main Content: Form + Info */}
      <section className="public-shell contact-main-section" aria-labelledby="contact-form-heading">
        <div className="contact-content-grid">
          {/* Info Column */}
          <div className="contact-info-col">
            <h2 id="contact-form-heading">Send us a detailed inquiry</h2>
            <p>Our institutional team will route your message to the right specialist and respond within one business day.</p>

            <div className="contact-methods-list">
              <a href="tel:+918045678900" className="contact-method-row" aria-label="Call ExamShield support">
                <div className="contact-method-icon-wrap green" aria-hidden="true">
                  <Phone size={18} />
                </div>
                <div>
                  <strong>Phone Support</strong>
                  <span>+91 80 4567 8900</span>
                  <small>Mon–Fri, 9AM–7PM IST</small>
                </div>
                <ChevronRight size={16} className="contact-method-arrow" aria-hidden="true" />
              </a>
              <a href="mailto:hello@examshield.io" className="contact-method-row" aria-label="Email ExamShield">
                <div className="contact-method-icon-wrap blue" aria-hidden="true">
                  <Mail size={18} />
                </div>
                <div>
                  <strong>Email Sales</strong>
                  <span>hello@examshield.io</span>
                  <small>Response within 4 hours</small>
                </div>
                <ChevronRight size={16} className="contact-method-arrow" aria-hidden="true" />
              </a>
              <button className="contact-method-row" aria-label="Start live chat">
                <div className="contact-method-icon-wrap orange" aria-hidden="true">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <strong>Live Chat</strong>
                  <span>Instant response</span>
                  <small>Available 24 / 7</small>
                </div>
                <ChevronRight size={16} className="contact-method-arrow" aria-hidden="true" />
              </button>
            </div>

            {/* Office Locations */}
            <div className="contact-offices-section">
              <h3>Our Offices</h3>
              {officeLocations.map(office => (
                <div key={office.city} className="contact-office-card">
                  <div className="contact-office-header">
                    <MapPin size={16} aria-hidden="true" />
                    <div>
                      <strong>{office.city}</strong>
                      <span>{office.country}</span>
                    </div>
                  </div>
                  <p className="contact-office-address">{office.address}</p>
                  <div className="contact-office-meta">
                    <span><Phone size={12} /> {office.phone}</span>
                    <span><Clock size={12} /> {office.hours}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Column */}
          <div className="contact-form-col">
            {submitted ? (
              <div className="contact-success-card">
                <div className="contact-success-icon" aria-hidden="true">
                  <CheckCircle2 size={48} />
                </div>
                <h3>Message received!</h3>
                <p>Our institutional team will reach out within 4 business hours. Meanwhile, feel free to explore our platform.</p>
                <Link to="/features" className="feat-cta-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                  Explore Features
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <form className="contact-pro-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-form-header">
                  <h3>Inquiry Form</h3>
                  <p>Fields marked <span className="required-star">*</span> are required</p>
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="c-name">Full Name <span className="required-star">*</span></label>
                    <input
                      id="c-name" name="name" type="text"
                      placeholder="Dr. Jane Smith"
                      value={formState.name} onChange={handleChange} required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="c-email">Official Email <span className="required-star">*</span></label>
                    <input
                      id="c-email" name="email" type="email"
                      placeholder="jane@university.edu"
                      value={formState.email} onChange={handleChange} required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="c-institution">Institution Name <span className="required-star">*</span></label>
                    <input
                      id="c-institution" name="institution" type="text"
                      placeholder="Apex University"
                      value={formState.institution} onChange={handleChange} required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="c-role">Your Role</label>
                    <input
                      id="c-role" name="role" type="text"
                      placeholder="Dean / Exam Controller / IT Admin"
                      value={formState.role} onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="c-phone">Phone Number</label>
                    <input
                      id="c-phone" name="phone" type="tel"
                      placeholder="+91 98765 43210"
                      value={formState.phone} onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="c-reason">Reason for Contact <span className="required-star">*</span></label>
                    <select
                      id="c-reason" name="reason"
                      value={formState.reason} onChange={handleChange} required
                    >
                      {contactReasons.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="c-message">Message <span className="required-star">*</span></label>
                  <textarea
                    id="c-message" name="message" rows={5}
                    placeholder="Tell us about your institution's exam setup, scale, current challenges, and what you'd like to achieve with ExamShield..."
                    value={formState.message} onChange={handleChange} required
                  />
                </div>

                <label className="contact-newsletter-check">
                  <input
                    type="checkbox" name="newsletter"
                    checked={formState.newsletter} onChange={handleChange}
                  />
                  <span>Receive platform updates, new feature announcements, and academic integrity insights</span>
                </label>

                <button type="submit" className="contact-submit-btn">
                  Send Inquiry
                  <ArrowRight size={16} aria-hidden="true" />
                </button>

                <p className="contact-form-privacy">
                  <ShieldCheck size={13} aria-hidden="true" />
                  Your data is protected under GDPR and FERPA. We never share institutional details with third parties.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="public-shell contact-final-cta" aria-labelledby="contact-final-cta-heading">
        <div className="contact-final-inner">
          <h2 id="contact-final-cta-heading">Prefer to start immediately?</h2>
          <p>Register your institution and configure your first exam in under 15 minutes — no sales call required.</p>
          <div className="contact-final-actions">
            <Link to="/admin/register" className="feat-cta-primary">
              <Building2 size={16} aria-hidden="true" />
              Start Institutional Trial
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/features" className="feat-cta-secondary">
              Explore Platform Features
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
