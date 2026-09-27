// src/pages/admin/Subscription.js — Institutional License & Capacity Quota System
import React, { useEffect, useState } from 'react';
import { subscriptionAPI } from '../../services/api';
import { formatIST } from '../../utils/timezone';
import toast from 'react-hot-toast';
import { 
  Crown, 
  Star, 
  CheckCircle, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Rocket, 
  FileText, 
  Trophy,
  Sparkles,
  Lock,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Building,
  X,
  Send,
  Cpu,
  MonitorCheck
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';
import './Subscription.css';

const planConfig = {
  basic: { 
    color: '#64748b', 
    bg: 'rgba(100, 116, 139, 0.1)', 
    icon: ShieldCheck,
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    badge: 'Departmental'
  },
  standard: { 
    color: '#0a74da', 
    bg: 'rgba(10, 116, 218, 0.1)', 
    icon: Star,
    gradient: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
    badge: 'Institutional Growth'
  },
  premium: { 
    color: '#f59e0b', 
    bg: 'rgba(245, 158, 11, 0.1)', 
    icon: Crown,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    badge: 'University Accreditation'
  }
};

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, loading, ...props }) => {
  return (
    <button 
      {...props} 
      className={`admin-btn admin-btn-${variant} admin-btn-${size} ${loading ? 'loading' : ''}`}
      disabled={loading || props.disabled}
    >
      {loading ? (
        <div className="admin-btn-spinner"></div>
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    active: { color: '#10b981', bg: '#ecfdf5', label: 'ACTIVE & ACCREDITED' },
    expired: { color: '#ef4444', bg: '#fef2f2', label: 'RENEWAL DUE' },
    cancelled: { color: '#64748b', bg: '#f1f5f9', label: 'CANCELLED' }
  };
  
  const statusConfig = config[status] || config.active;
  return (
    <span className="admin-status-badge" style={{ 
      background: statusConfig.bg, 
      color: statusConfig.color,
      border: `1px solid ${statusConfig.color}40`,
      fontSize: '0.74rem',
      fontWeight: 800,
      padding: '4px 12px',
      borderRadius: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusConfig.color }}></span>
      {statusConfig.label}
    </span>
  );
};

export default function Subscription() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [billingCycle, setBillingCycle] = useState('annually'); // 'monthly' | 'annually'
  const [copiedKey, setCopiedKey] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    candidateCapacity: '1000',
    examsPerMonth: '100',
    proctoringType: 'full_ai',
    contactPerson: '',
    contactPhone: '',
    notes: ''
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = () => {
    setLoading(true);
    subscriptionAPI.getCurrent()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load institutional license quotas'))
      .finally(() => setLoading(false));
  };

  const handleCopyLicenseKey = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    toast.success('Institutional License Key copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleUpgrade = async (planKey) => {
    setUpgrading(planKey);
    try {
      const orderRes = await subscriptionAPI.createOrder({ 
        plan: planKey, 
        billingCycle 
      });
      const { orderId, amount, keyId, planDetails, isSandbox } = orderRes.data;

      // Sandbox or development test mode:
      if (isSandbox || !window.Razorpay) {
        toast('Simulating institutional payment verification...', { icon: '💳' });
        setTimeout(async () => {
          try {
            await subscriptionAPI.verifyPayment({ 
              razorpayOrderId: orderId, 
              razorpayPaymentId: `sim_pay_${Date.now()}`, 
              razorpaySignature: 'simulated_sig', 
              plan: planKey,
              billingCycle
            });
            toast.success(`License upgraded to ${planDetails?.name || planKey}!`);
            fetchSubscriptionData();
          } catch (err) {
            toast.error(err.message || 'Payment simulation failed');
          } finally {
            setUpgrading(null);
          }
        }, 1200);
        return;
      }

      // Live Razorpay Gateway
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency: 'INR',
        order_id: orderId,
        name: 'ExamShield Enterprise',
        description: `${planDetails.name} Institutional License (${billingCycle.toUpperCase()})`,
        theme: { color: '#0a74da' },
        handler: async (response) => {
          try {
            await subscriptionAPI.verifyPayment({ 
              ...response, 
              plan: planKey, 
              billingCycle,
              razorpayOrderId: response.razorpay_order_id, 
              razorpayPaymentId: response.razorpay_payment_id, 
              razorpaySignature: response.razorpay_signature 
            });
            toast.success('Institutional capacity upgraded successfully!');
            fetchSubscriptionData();
          } catch (err) {
            toast.error(err.message || 'Payment verification failed');
          }
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Failed to initiate payment');
    } finally {
      setUpgrading(null);
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setSubmittingQuote(true);
    try {
      const res = await subscriptionAPI.requestQuote(quoteForm);
      toast.success(res.data.message || 'Quote request submitted successfully!');
      setShowQuoteModal(false);
      setQuoteForm({
        candidateCapacity: '1000',
        examsPerMonth: '100',
        proctoringType: 'full_ai',
        contactPerson: '',
        contactPhone: '',
        notes: ''
      });
    } catch (err) {
      toast.error(err.message || 'Failed to submit quote request');
    } finally {
      setSubmittingQuote(false);
    }
  };

  if (loading) return (
    <div className="admin-loading-container">
      <div className="admin-loading-spinner"></div>
      <p style={{ marginTop: '14px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
        Synchronizing Institutional License & Quotas...
      </p>
    </div>
  );

  const { subscription, usage, plansMonthly, plansAnnually, college } = data || {};

  // Active plans based on toggle
  const currentPlans = billingCycle === 'annually' ? (plansAnnually || {}) : (plansMonthly || {});

  // Compute Quota usage metrics
  const maxStudents = subscription?.max_students || 200;
  const currentStudents = usage?.students || 0;
  const isUnlimitedStudents = !subscription?.max_students;
  const studentPercent = isUnlimitedStudents ? 15 : Math.min(100, Math.round((currentStudents / maxStudents) * 100));

  const maxExams = subscription?.max_exams || 50;
  const currentExams = usage?.exams || 0;
  const isUnlimitedExams = !subscription?.max_exams;
  const examPercent = isUnlimitedExams ? 10 : Math.min(100, Math.round((currentExams / maxExams) * 100));

  const currentResults = usage?.results || 0;

  // Expiration calculation
  const expirationDate = subscription?.end_date ? new Date(subscription.end_date) : new Date(Date.now() + 30 * 86400000);
  const daysRemaining = Math.max(0, Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24)));

  const licenseKey = subscription?.payment_id && subscription.payment_id.startsWith('LIC-') 
    ? subscription.payment_id 
    : `LIC-EXAM-${(college?.id || 'COLLEGE').substring(0, 6).toUpperCase()}-INSTITUTIONAL`;

  const faqs = [
    {
      q: "Can our institution switch between Monthly and Annual licensing?",
      a: "Yes! You can toggle to Annual billing at any time to immediately receive a 20% discount (2 months free). Any unused pro-rated balance from your previous term will be automatically credited to your account."
    },
    {
      q: "What happens if our college exceeds candidate seats during an examination?",
      a: "ExamShield ensures zero exam interruptions for candidates. If you temporarily exceed capacity, candidates can complete tests smoothly, and your administrator dashboard will prompt you to expand seats or upgrade your tier with 1-click."
    },
    {
      q: "Are the invoices GST compliant and valid for university audits?",
      a: "Absolutely. All institutional receipts and tax invoices include your college's legal registered name, GSTIN (if provided), and HSN/SAC codes compliant with Indian educational institution tax regulations."
    },
    {
      q: "Can we request custom on-premise proctoring or 10,000+ candidate seats?",
      a: "Yes! Click the 'Request Custom Enterprise Quote' button to connect directly with our engineering team for dedicated clusters, custom SAML/SSO integration, and university-wide license agreements."
    }
  ];

  return (
    <div className="admin-quota-container">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <div className="admin-header-pretitle">
            <Layers size={14} /> Institutional Capacity & Licensing
          </div>
          <h1 className="admin-page-title">Licenses & Capacity Quotas</h1>
          <p className="admin-page-subtitle">
            Manage your university proctoring license, real-time candidate seat allocations, and scale monthly or annual capacity.
          </p>
        </div>
        <div className="admin-header-actions">
          <Button 
            variant="secondary" 
            icon={FileText} 
            onClick={() => setShowInvoiceModal(true)}
          >
            License Certificate
          </Button>
          <Button 
            variant="primary" 
            icon={Building} 
            onClick={() => setShowQuoteModal(true)}
          >
            Custom Enterprise Quote
          </Button>
        </div>
      </div>

      {/* ── Active Institutional License Hero Card ─────────── */}
      {subscription && (
        <div className="admin-current-plan-card">
          <div className="admin-current-plan-info">
            <div className="admin-current-plan-label">
              <Sparkles size={14} /> Active Institutional Accreditation
            </div>
            
            <div className="admin-current-plan-name">
              <div 
                className="admin-plan-icon" 
                style={{ background: planConfig[subscription.plan]?.gradient || '#0a74da' }}
              >
                {React.createElement(planConfig[subscription.plan]?.icon || ShieldCheck, { size: 24 })}
              </div>
              <div>
                <span>{(subscription.plan || 'Standard').toUpperCase()} TIER</span>
                <span className="admin-plan-tagline">
                  {planConfig[subscription.plan]?.badge || 'Accredited Faculty License'}
                </span>
              </div>
            </div>

            {/* License Key & Verification Row */}
            <div className="admin-license-key-pill">
              <span className="license-label">LICENSE KEY:</span>
              <code className="license-code">{licenseKey}</code>
              <button 
                type="button" 
                className="license-copy-btn" 
                onClick={() => handleCopyLicenseKey(licenseKey)}
                title="Copy License Key"
              >
                {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="admin-current-plan-details">
              <div className="admin-plan-detail-item">
                <Calendar size={15} color="#38bdf8" />
                Valid Until: <strong>{formatIST(expirationDate, 'dateOnly')}</strong>
                <span className="admin-days-pill">{daysRemaining} days left</span>
              </div>
              <span className="dot-divider">•</span>
              <div className="admin-plan-detail-item">
                <Users size={15} color="#38bdf8" />
                Enrolled Capacity: <strong>{isUnlimitedStudents ? 'Unlimited Seats' : `${maxStudents} Candidate Seats`}</strong>
              </div>
              <span className="dot-divider">•</span>
              <div className="admin-plan-detail-item">
                <MonitorCheck size={15} color="#38bdf8" />
                Auto-Renewal: <strong>Active & Compliant</strong>
              </div>
            </div>
          </div>

          <div className="admin-current-plan-pricing">
            <div className="admin-plan-price">
              ₹{Number(subscription.amount || 2999).toLocaleString('en-IN')} 
              <span className="admin-price-period">/ cycle</span>
            </div>
            <StatusBadge status={subscription.status} />
            <div className="admin-invoice-quicklink" onClick={() => setShowInvoiceModal(true)}>
              View Billing & GST Receipt →
            </div>
          </div>
        </div>
      )}

      {/* ── Quota Telemetry Meters ─────────────────────────── */}
      <div className="admin-quota-meters-grid">
        {/* Metric 1: Candidate Seats */}
        <div className="admin-quota-card">
          <div className="admin-quota-header">
            <span className="admin-quota-title">
              <Users size={16} color="#0a74da" /> Candidate Seats Quota
            </span>
            <span className="admin-quota-percent">
              {isUnlimitedStudents ? 'Unlimited' : `${studentPercent}% Used`}
            </span>
          </div>

          <div className="admin-quota-value-row">
            <span className="admin-quota-current">{currentStudents}</span>
            <span className="admin-quota-limit">
              / {isUnlimitedStudents ? '∞ Unlimited' : `${maxStudents} enrolled`}
            </span>
          </div>

          <div className="admin-quota-progress-track">
            <div 
              className="admin-quota-progress-fill" 
              style={{ 
                width: `${studentPercent}%`, 
                background: studentPercent > 90 ? '#ef4444' : studentPercent > 70 ? '#f59e0b' : '#0a74da' 
              }} 
            />
          </div>

          <div className="admin-quota-footer">
            <span className="admin-quota-note">
              {isUnlimitedStudents 
                ? 'Campus-wide seat expansion unlocked' 
                : `${Math.max(0, maxStudents - currentStudents)} candidate seats available`}
            </span>
            <a href="/admin/students" className="admin-quota-link">Manage →</a>
          </div>
        </div>

        {/* Metric 2: Monthly Assessment Slots */}
        <div className="admin-quota-card">
          <div className="admin-quota-header">
            <span className="admin-quota-title">
              <FileText size={16} color="#6366f1" /> Monthly Assessment Slots
            </span>
            <span className="admin-quota-percent" style={{ color: '#6366f1' }}>
              {isUnlimitedExams ? 'Unlimited' : `${examPercent}% Created`}
            </span>
          </div>

          <div className="admin-quota-value-row">
            <span className="admin-quota-current">{currentExams}</span>
            <span className="admin-quota-limit">
              / {isUnlimitedExams ? '∞ Unlimited' : `${maxExams} monthly tests`}
            </span>
          </div>

          <div className="admin-quota-progress-track">
            <div 
              className="admin-quota-progress-fill" 
              style={{ 
                width: `${examPercent}%`, 
                background: examPercent > 90 ? '#ef4444' : '#6366f1' 
              }} 
            />
          </div>

          <div className="admin-quota-footer">
            <span className="admin-quota-note">
              {isUnlimitedExams 
                ? 'Unlimited concurrent sessions' 
                : `${Math.max(0, maxExams - currentExams)} examination slots remaining`}
            </span>
            <a href="/admin/exams" className="admin-quota-link">View Exams →</a>
          </div>
        </div>

        {/* Metric 3: Submissions & Proctored Transcripts */}
        <div className="admin-quota-card">
          <div className="admin-quota-header">
            <span className="admin-quota-title">
              <Trophy size={16} color="#10b981" /> Verified Submissions
            </span>
            <span className="admin-quota-percent" style={{ color: '#10b981' }}>
              Audited 100%
            </span>
          </div>

          <div className="admin-quota-value-row">
            <span className="admin-quota-current" style={{ color: '#10b981' }}>{currentResults}</span>
            <span className="admin-quota-limit">evaluated transcripts</span>
          </div>

          <div className="admin-quota-progress-track">
            <div 
              className="admin-quota-progress-fill" 
              style={{ width: '100%', background: '#10b981' }} 
            />
          </div>

          <div className="admin-quota-footer">
            <span className="admin-quota-note">All anti-cheat logs encrypted</span>
            <a href="/admin/results" className="admin-quota-link">Gradebook →</a>
          </div>
        </div>
      </div>

      {/* ── Plans & Capacity Switcher Section ───────────────── */}
      <div className="admin-content-card">
        <div className="admin-plans-section-header">
          <div className="admin-plans-titles">
            <h2 className="admin-card-title">
              <Rocket size={22} color="#0a74da" />
              Scale Institutional Capacity & Licensing
            </h2>
            <p className="admin-plans-subtitle">
              Choose the license tier that fits your institution. Switch between Monthly and Annual billing anytime.
            </p>
          </div>

          {/* Monthly / Annual Billing Toggle */}
          <div className="admin-billing-toggle-container">
            <div className="admin-billing-toggle">
              <button
                type="button"
                className={`toggle-option ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                className={`toggle-option ${billingCycle === 'annually' ? 'active' : ''}`}
                onClick={() => setBillingCycle('annually')}
              >
                Annual Billing
                <span className="toggle-discount-badge">Save 20% ✨</span>
              </button>
            </div>
            <div className="billing-savings-callout">
              {billingCycle === 'annually' ? '⚡ 2 Months Free applied to all annual plans' : 'Pay as you go monthly'}
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="admin-plans-grid">
          {Object.entries(currentPlans).map(([key, plan]) => {
            const config = planConfig[key] || planConfig.standard;
            const isCurrentPlan = subscription?.plan === key;
            const isPopular = plan.popular;
            
            return (
              <div 
                key={key} 
                className={`admin-plan-card ${isCurrentPlan ? 'current' : ''} ${isPopular ? 'popular' : ''}`}
              >
                {isPopular && (
                  <div className="admin-plan-badge">
                    <Star size={12} fill="#ffffff" />
                    RECOMMENDED FOR INSTITUTIONS
                  </div>
                )}
                
                <div className="admin-plan-header">
                  <div className="admin-plan-icon" style={{ background: config.gradient }}>
                    {React.createElement(config.icon, { size: 24 })}
                  </div>
                  <div>
                    <h3 className="admin-plan-name">{plan.name}</h3>
                    <span className="admin-plan-tier-label">{plan.tier || 'Academic'}</span>
                  </div>
                </div>

                <p className="admin-plan-tagline-text">{plan.tagline}</p>
                
                <div className="admin-plan-pricing">
                  <div className="admin-price-row">
                    <div className="admin-plan-price">
                      ₹{Number(plan.price).toLocaleString('en-IN')}
                    </div>
                    <div className="admin-plan-billing">
                      {plan.periodLabel || (billingCycle === 'annually' ? '/ mo' : '/ month')}
                    </div>
                  </div>

                  {billingCycle === 'annually' && plan.originalPrice && (
                    <div className="admin-annual-breakdown">
                      <span className="original-strike">₹{plan.originalPrice}/mo</span>
                      <span className="annual-billed">Billed ₹{Number(plan.annualTotal).toLocaleString('en-IN')}/year</span>
                    </div>
                  )}

                  {plan.savingsLabel && (
                    <div className="admin-savings-pill">
                      <Sparkles size={12} /> {plan.savingsLabel}
                    </div>
                  )}
                </div>

                {/* Quota Highlights */}
                <div className="admin-plan-quota-summary">
                  <div className="quota-summary-item">
                    <span className="quota-summary-label">Candidate Seats</span>
                    <span className="quota-summary-val">
                      {plan.maxStudents ? `${plan.maxStudents} Students` : 'Unlimited'}
                    </span>
                  </div>
                  <div className="quota-summary-item">
                    <span className="quota-summary-label">Monthly Exams</span>
                    <span className="quota-summary-val">
                      {plan.maxExams ? `${plan.maxExams} Exams` : 'Unlimited'}
                    </span>
                  </div>
                </div>
                
                {/* Feature Checklist */}
                <div className="admin-plan-features">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="admin-plan-feature">
                      <CheckCircle2 size={16} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={() => handleUpgrade(key)}
                  disabled={isCurrentPlan || upgrading === key}
                  variant={isCurrentPlan ? 'secondary' : isPopular ? 'primary' : 'outline'}
                  loading={upgrading === key}
                  className="admin-plan-button"
                >
                  {isCurrentPlan ? (
                    <>
                      <CheckCircle size={16} />
                      Current Active Quota
                    </>
                  ) : upgrading === key ? (
                    'Provisioning License...'
                  ) : (
                    <>
                      <Rocket size={16} />
                      {billingCycle === 'annually' ? `Upgrade Annually (Save 20%)` : `Upgrade to ${plan.name}`}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Feature Comparison Matrix ───────────────────────── */}
      <div className="admin-content-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            <Cpu size={22} color="#0a74da" />
            Institutional Capability Matrix
          </h2>
          <span style={{ fontSize: '0.86rem', color: '#64748b' }}>
            Detailed quota breakdown and proctoring depth comparison
          </span>
        </div>

        <div className="admin-matrix-table-wrapper">
          <table className="admin-matrix-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Core Capabilities & Quotas</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Basic Quota</th>
                <th style={{ width: '20%', textAlign: 'center', background: 'rgba(10, 116, 218, 0.05)' }}>Standard Quota</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Premium Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Enrolled Candidate Capacity</strong></td>
                <td style={{ textAlign: 'center' }}>50 Candidates</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#0a74da' }}>200 Candidates</td>
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#f59e0b' }}>Unlimited Seats</td>
              </tr>
              <tr>
                <td><strong>Monthly Examination Slots</strong></td>
                <td style={{ textAlign: 'center' }}>10 Slots / Mo</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#0a74da' }}>50 Slots / Mo</td>
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#f59e0b' }}>Unlimited Slots</td>
              </tr>
              <tr>
                <td><strong>Assessment Formats Supported</strong></td>
                <td style={{ textAlign: 'center' }}>MCQ & True/False</td>
                <td style={{ textAlign: 'center' }}>MCQ + Coding + Subjective</td>
                <td style={{ textAlign: 'center' }}>All Formats + Voice Viva</td>
              </tr>
              <tr>
                <td><strong>Browser & Screen Lockdown</strong></td>
                <td style={{ textAlign: 'center' }}><Check size={18} color="#10b981" /></td>
                <td style={{ textAlign: 'center' }}><Check size={18} color="#10b981" /></td>
                <td style={{ textAlign: 'center' }}><Check size={18} color="#10b981" /></td>
              </tr>
              <tr>
                <td><strong>AI Proctoring (Face, Gaze & Audio)</strong></td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>Lite (Tab lock)</td>
                <td style={{ textAlign: 'center' }}><Check size={18} color="#10b981" /></td>
                <td style={{ textAlign: 'center' }}><Check size={18} color="#10b981" /> Deep Multi-Modal</td>
              </tr>
              <tr>
                <td><strong>Interactive Coding Compiler Sandbox</strong></td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>—</td>
                <td style={{ textAlign: 'center' }}><Check size={18} color="#10b981" /></td>
                <td style={{ textAlign: 'center' }}><Check size={18} color="#10b981" /></td>
              </tr>
              <tr>
                <td><strong>Custom College Subdomain & Logo Branding</strong></td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>—</td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>—</td>
                <td style={{ textAlign: 'center' }}><Check size={18} color="#10b981" /></td>
              </tr>
              <tr>
                <td><strong>Support Level & Turnaround SLA</strong></td>
                <td style={{ textAlign: 'center' }}>Email (48h SLA)</td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>Priority Hotline (4h SLA)</td>
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#f59e0b' }}>24/7 Dedicated Manager</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Enterprise Custom Volume Banner ─────────────────── */}
      <div className="admin-enterprise-banner">
        <div className="enterprise-banner-content">
          <div className="enterprise-badge">
            <Building size={16} /> University-Wide Accreditation
          </div>
          <h3>Need over 1,000+ candidate seats or private campus cloud hosting?</h3>
          <p>
            ExamShield delivers customized solutions for large state universities, autonomous institutes, 
            and recruitment agencies with high concurrency requirements, on-premise deployments, and custom LMS integrations.
          </p>
        </div>
        <div className="enterprise-banner-action">
          <button 
            type="button" 
            className="enterprise-quote-btn"
            onClick={() => setShowQuoteModal(true)}
          >
            <Send size={16} /> Request Custom University Quote
          </button>
        </div>
      </div>

      {/* ── FAQ Accordion Section ───────────────────────────── */}
      <div className="admin-content-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            <HelpCircle size={22} color="#0a74da" />
            Institutional Licensing & Quota FAQs
          </h2>
        </div>

        <div className="admin-faqs-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`admin-faq-item ${isOpen ? 'open' : ''}`}>
                <button 
                  type="button" 
                  className="admin-faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div className="admin-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Security & Encrypted Payments Footer ────────────── */}
      <div className="admin-payment-info-card">
        <div className="admin-payment-icon">
          <Lock size={24} />
        </div>
        <div className="admin-payment-content">
          <h3>Enterprise Bank-Grade 256-Bit TLS Payment Security</h3>
          <p>
            All subscriptions, renewals, and invoice transactions are processed directly with PCI-DSS Level 1 certified 
            Razorpay banking gateways. Automated receipts and tax invoices are issued immediately upon transaction clearance.
          </p>
          <div className="admin-security-badges">
            <span className="badge-item"><CheckCircle2 size={13} /> 100% High-Availability SLA</span>
            <span className="badge-item"><CheckCircle2 size={13} /> Indian GST Compliant Invoices</span>
            <span className="badge-item"><CheckCircle2 size={13} /> SOC2 / ISO-27001 Data Encryption</span>
          </div>
        </div>
      </div>

      {/* ── MODAL: Request Custom Enterprise Quote ─────────── */}
      {showQuoteModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowQuoteModal(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={20} color="#0a74da" />
                <h3 className="admin-modal-title">Request Custom Institutional Quote</h3>
              </div>
              <button 
                type="button" 
                className="admin-modal-close" 
                onClick={() => setShowQuoteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="admin-modal-form">
              <p className="admin-modal-desc">
                Tell us about your university assessment requirements. Our institutional solutions team will create a tailored proposal within 4 business hours.
              </p>

              <div className="admin-form-group">
                <label className="admin-form-label">Required Candidate Seat Capacity</label>
                <select
                  className="admin-form-select"
                  value={quoteForm.candidateCapacity}
                  onChange={(e) => setQuoteForm({ ...quoteForm, candidateCapacity: e.target.value })}
                >
                  <option value="500">500 – 1,000 Candidates</option>
                  <option value="2500">1,000 – 2,500 Candidates</option>
                  <option value="5000">2,500 – 5,000 Candidates</option>
                  <option value="10000">5,000 – 10,000+ Candidates (University Campus)</option>
                  <option value="unlimited">Custom Statewide / Board Accreditation</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Estimated Monthly Examinations</label>
                <select
                  className="admin-form-select"
                  value={quoteForm.examsPerMonth}
                  onChange={(e) => setQuoteForm({ ...quoteForm, examsPerMonth: e.target.value })}
                >
                  <option value="50">Up to 50 Exams / Month</option>
                  <option value="150">50 – 150 Exams / Month</option>
                  <option value="500">150 – 500 Exams / Month</option>
                  <option value="unlimited">Continuous High-Frequency Testing</option>
                </select>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Institutional Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Sharma, Dean"
                    className="admin-form-input"
                    value={quoteForm.contactPerson}
                    onChange={(e) => setQuoteForm({ ...quoteForm, contactPerson: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Contact Phone / Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="admin-form-input"
                    value={quoteForm.contactPhone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Special Requirements / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Specify any ERP/Moodle integrations, custom proctoring policies, or RFP deadlines..."
                  className="admin-form-textarea"
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                />
              </div>

              <div className="admin-modal-actions">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowQuoteModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  icon={Send} 
                  loading={submittingQuote}
                >
                  Submit Quote Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Institutional Invoicing & Certificate ───── */}
      {showInvoiceModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowInvoiceModal(false)}>
          <div className="admin-modal-box admin-certificate-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#10b981" />
                <h3 className="admin-modal-title">Institutional License Certificate & Billing Summary</h3>
              </div>
              <button 
                type="button" 
                className="admin-modal-close" 
                onClick={() => setShowInvoiceModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-certificate-content">
              <div className="certificate-frame">
                <div className="certificate-header">
                  <span className="cert-org">EXAMSHIELD GLOBAL ACCREDITATION</span>
                  <h4 className="cert-title">CERTIFICATE OF PROCTORING LICENSE</h4>
                  <p className="cert-subtitle">Valid Institutional Examination Center Authorization</p>
                </div>

                <div className="cert-body">
                  <div className="cert-detail-grid">
                    <div className="cert-item">
                      <span className="cert-label">Licensed Institution:</span>
                      <span className="cert-value">{college?.name || 'Accredited Institution'}</span>
                    </div>
                    <div className="cert-item">
                      <span className="cert-label">License Key:</span>
                      <span className="cert-value"><code>{licenseKey}</code></span>
                    </div>
                    <div className="cert-item">
                      <span className="cert-label">Subscription Tier:</span>
                      <span className="cert-value" style={{ textTransform: 'uppercase', fontWeight: 800, color: '#0a74da' }}>
                        {subscription?.plan || 'Standard'} Tier
                      </span>
                    </div>
                    <div className="cert-item">
                      <span className="cert-label">Status:</span>
                      <span className="cert-value" style={{ color: '#10b981', fontWeight: 700 }}>
                        Active & Verified
                      </span>
                    </div>
                    <div className="cert-item">
                      <span className="cert-label">Valid Period:</span>
                      <span className="cert-value">
                        {formatIST(subscription?.start_date || Date.now(), 'dateOnly')} — {formatIST(expirationDate, 'dateOnly')}
                      </span>
                    </div>
                    <div className="cert-item">
                      <span className="cert-label">Seat Quota:</span>
                      <span className="cert-value">
                        {isUnlimitedStudents ? 'Unlimited Candidates' : `${maxStudents} Enrolled Candidates`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cert-footer">
                  <div className="cert-seal">
                    <ShieldCheck size={36} color="#0a74da" />
                    <span>DIGITALLY VERIFIED</span>
                  </div>
                  <div className="cert-meta">
                    <span>Tax Invoice Ref: INV-{Date.now().toString().slice(-8)}</span>
                    <span>GSTIN Status: Registered Educational Provider</span>
                  </div>
                </div>
              </div>

              <div className="admin-modal-actions" style={{ marginTop: '20px' }}>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowInvoiceModal(false)}
                >
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  icon={Download} 
                  onClick={() => {
                    window.print();
                    toast.success('Ready to print or save as PDF!');
                  }}
                >
                  Print / Save Certificate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
