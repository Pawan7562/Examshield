import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MessageCircle, Phone, MapPin, Clock } from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import './Contact.css';

export default function Contact() {
  return (
    <PublicLayout>
      <section className="public-shell contact-hero-section" aria-labelledby="contact-hero-heading">
        <div className="contact-hero-content">
          <h1 id="contact-hero-heading">Get in Touch</h1>
          <p>Have questions about our exam monitoring platform? We're here to help you secure your online examinations with confidence.</p>
          <div className="contact-hero-stats">
            <div className="hero-stat">
              <strong>24/7</strong>
              <span>Support Available</span>
            </div>
            <div className="hero-stat">
              <strong>&lt;2hr</strong>
              <span>Response Time</span>
            </div>
            <div className="hero-stat">
              <strong>10,000+</strong>
              <span>Happy Institutions</span>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell contact-main-section" aria-labelledby="contact-main-heading">
        <div className="contact-content-grid">
          <div className="contact-info-section">
            <h2 id="contact-main-heading">Ways to Reach Us</h2>
            <p>Choose the most convenient way to connect with our team.</p>
            
            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-method-icon">
                  <Mail size={32} />
                </div>
                <div className="contact-method-content">
                  <h3>Email Support</h3>
                  <p>support@exammonitoring.com</p>
                  <span className="contact-response-time">Response within 24 hours</span>
                  <Link to="mailto:support@exammonitoring.com" className="contact-action-link">
                    Send Email
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <Phone size={32} />
                </div>
                <div className="contact-method-content">
                  <h3>Phone Support</h3>
                  <p>+91 98765 43210</p>
                  <span className="contact-response-time">Mon-Fri, 9AM-6PM IST</span>
                  <Link to="tel:+919876543210" className="contact-action-link">
                    Call Now
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <MessageCircle size={32} />
                </div>
                <div className="contact-method-content">
                  <h3>Live Chat</h3>
                  <p>Instant support with our team</p>
                  <span className="contact-response-time">Available 24/7</span>
                  <button className="contact-action-link">
                    Start Chat
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="contact-office-info">
              <div className="office-card">
                <div className="office-icon">
                  <MapPin size={24} />
                </div>
                <div className="office-details">
                  <h4>Head Office</h4>
                  <p>123 Tech Park, Bangalore<br />Karnataka 560001, India</p>
                </div>
              </div>
              
              <div className="office-card">
                <div className="office-icon">
                  <Clock size={24} />
                </div>
                <div className="office-details">
                  <h4>Business Hours</h4>
                  <p>Monday - Friday: 9AM - 6PM<br />Saturday: 10AM - 2PM<br />Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-section">
            <div className="contact-form-card">
              <h2>Send us a Message</h2>
              <p>Fill out the form below and we'll get back to you as soon as possible.</p>
              
              <form className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input type="text" id="name" name="name" placeholder="Enter your full name" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input type="email" id="email" name="email" placeholder="your@email.com" required />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="institution">Institution Name</label>
                    <input type="text" id="institution" name="institution" placeholder="Your institution name" />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <select id="subject" name="subject" required>
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="demo">Request Demo</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership Opportunity</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea id="message" name="message" rows="6" placeholder="Tell us about your exam monitoring needs or questions..." required></textarea>
                </div>
                
                <div className="form-checkbox">
                  <input type="checkbox" id="newsletter" name="newsletter" />
                  <label htmlFor="newsletter">I'd like to receive updates about Exam Monitoring</label>
                </div>
                
                <button type="submit" className="contact-submit-button">
                  Send Message
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell contact-cta-section" aria-labelledby="contact-cta-heading">
        <div className="contact-cta-content">
          <h2 id="contact-cta-heading">Ready to Get Started?</h2>
          <p>Join thousands of institutions using our secure exam monitoring platform.</p>
          <div className="contact-cta-actions">
            <Link to="/admin/register" className="contact-cta-primary">
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="contact-cta-secondary">
              View Pricing
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
