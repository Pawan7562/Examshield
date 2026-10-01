import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, Star, Zap, Shield, Headphones } from 'lucide-react';
import PublicLayout from '../../components/public/PublicLayout';
import { pricingPlans } from './publicContent';
import './PublicPages.css';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const enhancedPlans = pricingPlans.map((plan, index) => ({
    ...plan,
    icon: index === 0 ? <Shield size={24} /> : index === 1 ? <Star size={24} /> : <Zap size={24} />,
    yearlyPrice: plan.price === '999' ? '9990' : plan.price === '2999' ? '29990' : '79990',
    savings: plan.price === '999' ? 'Save 10%' : plan.price === '2999' ? 'Save 15%' : 'Save 20%'
  }));

  const displayPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.price : plan.yearlyPrice;
  };

  const billingLabel = billingCycle === 'monthly' ? 'INR / month' : 'INR / year';

  return (
    <PublicLayout>
      <section className="public-shell public-page-hero pricing-hero">
        <div className="public-page-copy">
          <div className="pricing-badge">
            <Star size={16} />
            <span>30-day free trial • No credit card required</span>
          </div>
          <h1>Flexible Pricing for Institutions of Every Size</h1>
          <p>
            Start small, scale gradually, or choose an unlimited plan for large exam programs and
            intensive monitoring needs.
          </p>
          
          <div className="billing-toggle">
            <button
              className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <span className="savings-badge">Save up to 20%</span>
            </button>
          </div>

          <div className="public-page-actions">
            <Link to="/admin/register" className="public-primary-button">
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link to="/features" className="public-secondary-button">
              <Check size={16} />
              Compare Features
            </Link>
          </div>
        </div>

        <div className="public-visual-card pricing-visual">
          <div className="pricing-showcase">
            <div className="price-display">
              <span className="price-currency">₹</span>
              <span className="price-amount">{displayPrice(enhancedPlans[1])}</span>
              <span className="price-period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <div className="price-features">
              <div className="price-feature">
                <Check size={16} className="feature-icon" />
                <span>Live Proctoring</span>
              </div>
              <div className="price-feature">
                <Check size={16} className="feature-icon" />
                <span>AI Detection</span>
              </div>
              <div className="price-feature">
                <Check size={16} className="feature-icon" />
                <span>Advanced Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section pricing-plans-section">
        <div className="public-section-title">
          <h2>Choose the Right Plan</h2>
          <p>Clear pricing with features that align to your student count and exam volume.</p>
        </div>

        <div className="public-plan-grid enhanced-plans">
          {enhancedPlans.map((plan, index) => (
            <article
              key={plan.name}
              className={`public-plan-card enhanced-plan-card${plan.highlight ? ' public-plan-card-highlight' : ''}`}
            >
              {plan.highlight && (
                <div className="plan-header-badge">
                  <Star size={16} />
                  <span>Most Popular</span>
                </div>
              )}
              
              <div className="plan-icon-wrapper">
                <div className="plan-icon">{plan.icon}</div>
              </div>
              
              <h3>{plan.name}</h3>
              <div className="public-plan-label">{plan.label}</div>
              
              <div className="public-plan-price enhanced-price">
                <div className="price-main">
                  <span className="price-currency">₹</span>
                  <strong>{displayPrice(plan)}</strong>
                  <span className="price-period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="yearly-savings">{plan.savings}</div>
                )}
              </div>

              <div className="public-plan-features enhanced-features">
                {plan.features.map((feature) => (
                  <div className="plan-feature-item" key={feature}>
                    <Check size={16} className="feature-check" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                to="/admin/register" 
                className={`public-plan-button enhanced-plan-button${plan.highlight ? ' highlight-button' : ''}`}
              >
                {plan.highlight ? 'Get Started Now' : 'Get Started'}
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="public-shell public-page-section pricing-comparison">
        <div className="public-section-title">
          <h2>Compare Plans at a Glance</h2>
          <p>Find the perfect fit for your institution's needs</p>
        </div>

        <div className="comparison-table">
          <div className="comparison-header">
            <div className="feature-column">Features</div>
            {enhancedPlans.map((plan) => (
              <div key={plan.name} className="plan-column">
                <div className="plan-header">
                  <span>{plan.name}</span>
                  <div className="plan-price-small">₹{displayPrice(plan)}/{billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="comparison-rows">
            <div className="comparison-row">
              <div className="feature-name">Students</div>
              <div className="feature-value">50</div>
              <div className="feature-value">200</div>
              <div className="feature-value">Unlimited</div>
            </div>
            <div className="comparison-row">
              <div className="feature-name">Exams / month</div>
              <div className="feature-value">10</div>
              <div className="feature-value">50</div>
              <div className="feature-value">Unlimited</div>
            </div>
            <div className="comparison-row">
              <div className="feature-name">Live Monitoring</div>
              <div className="feature-value"><X size={16} className="no-icon" /></div>
              <div className="feature-value"><Check size={16} className="yes-icon" /></div>
              <div className="feature-value"><Check size={16} className="yes-icon" /></div>
            </div>
            <div className="comparison-row">
              <div className="feature-name">AI Proctoring</div>
              <div className="feature-value"><X size={16} className="no-icon" /></div>
              <div className="feature-value"><X size={16} className="no-icon" /></div>
              <div className="feature-value"><Check size={16} className="yes-icon" /></div>
            </div>
            <div className="comparison-row">
              <div className="feature-name">Support</div>
              <div className="feature-value">Email</div>
              <div className="feature-value">Priority</div>
              <div className="feature-value">24/7</div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section pricing-faq">
        <div className="public-section-title">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about our pricing</p>
        </div>

        <div className="faq-grid">
          <div className="faq-item">
            <h3>Can I change plans anytime?</h3>
            <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.</p>
          </div>
          <div className="faq-item">
            <h3>What happens after the free trial?</h3>
            <p>After 30 days, you'll be prompted to choose a plan. No credit card is required to start the trial.</p>
          </div>
          <div className="faq-item">
            <h3>Do you offer custom plans?</h3>
            <p>Yes! Contact our sales team for custom enterprise plans tailored to your specific needs.</p>
          </div>
          <div className="faq-item">
            <h3>Is there a setup fee?</h3>
            <p>No, there are no setup fees. You only pay for the monthly or yearly subscription you choose.</p>
          </div>
        </div>
      </section>

      <section className="public-shell public-page-section pricing-cta">
        <div className="pricing-cta-content">
          <div className="cta-icon">
            <Headphones size={48} />
          </div>
          <div className="cta-text">
            <h2>Need Help Choosing the Right Plan?</h2>
            <p>Our team is here to help you find the perfect solution for your institution.</p>
          </div>
          <div className="cta-actions">
            <Link to="/admin/register" className="public-primary-button">
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="public-secondary-button">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
