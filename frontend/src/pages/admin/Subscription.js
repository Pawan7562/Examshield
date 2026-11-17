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
import './LicenseQuotas.css';

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

const DEFAULT_PLANS = {
  monthly: {
    basic: {
      id: 'basic',
      name: 'Basic Quota',
      tier: 'Departmental',
      tagline: 'Ideal for single departments & basic classroom proctoring',
      price: 999,
      annualTotal: 999,
      billingCycle: 'monthly',
      periodLabel: '/ month',
      originalPrice: null,
      savingsLabel: null,
      maxStudents: 50,
      maxExams: 10,
      duration: 30,
      popular: false,
      features: [
        '50 Candidate Seats Quota',
        '10 Assessment Slots / Month',
        'Standard MCQ & Subjective Formats',
        'Proctor Lockdown (Anti-Tab Switch & Fullscreen)',
        'Basic Result Card & Gradebook Export',
        'Standard Helpdesk Email Support'
      ]
    },
    standard: {
      id: 'standard',
      name: 'Standard Quota',
      tier: 'Institutional Growth',
      tagline: 'Best for growing faculties, mid-size institutions & tech colleges',
      price: 2999,
      annualTotal: 2999,
      billingCycle: 'monthly',
      periodLabel: '/ month',
      originalPrice: null,
      savingsLabel: null,
      maxStudents: 200,
      maxExams: 50,
      duration: 30,
      popular: true,
      features: [
        '200 Candidate Seats Quota',
        '50 Assessment Slots / Month',
        'All Exam Types: MCQ, Coding & Subjective',
        'Interactive Python/Java/C++ Code Sandbox',
        'AI Proctoring Lite (Audio + Tab + Device Telemetry)',
        'Live Active Proctor Room & Monitor Grid',
        'Priority Technical Hotline Support (4h SLA)'
      ]
    },
    premium: {
      id: 'premium',
      name: 'Premium Enterprise',
      tier: 'University Accreditation',
      tagline: 'For full university campuses, multi-department certifications & autonomous institutions',
      price: 7999,
      annualTotal: 7999,
      billingCycle: 'monthly',
      periodLabel: '/ month',
      originalPrice: null,
      savingsLabel: null,
      maxStudents: null,
      maxExams: null,
      duration: 30,
      popular: false,
      features: [
        'Unlimited Candidate Enrollment Seats',
        'Unlimited Monthly Assessment Slots',
        'Deep AI Proctoring: Multi-face, Gaze, Voice & Secondary Cam',
        'Real-time Plagiarism & Code Diff Detection',
        'Custom College Subdomain & Institutional White-Labeling',
        'Dedicated Technical Account Manager & 24/7 Priority Emergency Support',
        'Direct REST API & LMS Webhook Integrations'
      ]
    }
  },
  annually: {
    basic: {
      id: 'basic',
      name: 'Basic Quota',
      tier: 'Departmental',
      tagline: 'Ideal for single departments & basic classroom proctoring',
      price: 799,
      annualTotal: 9588,
      billingCycle: 'annually',
      periodLabel: '/ mo',
      originalPrice: 999,
      savingsLabel: 'Save 20%',
      maxStudents: 50,
      maxExams: 10,
      duration: 365,
      popular: false,
      features: [
        '50 Candidate Seats Quota',
        '10 Assessment Slots / Month',
        'Standard MCQ & Subjective Formats',
        'Proctor Lockdown (Anti-Tab Switch & Fullscreen)',
        'Basic Result Card & Gradebook Export',
        'Standard Helpdesk Email Support',
        '2 Months Free Included (Annual License)'
      ]
    },
    standard: {
      id: 'standard',
      name: 'Standard Quota',
      tier: 'Institutional Growth',
      tagline: 'Best for growing faculties, mid-size institutions & tech colleges',
      price: 2399,
      annualTotal: 28788,
      billingCycle: 'annually',
      periodLabel: '/ mo',
      originalPrice: 2999,
      savingsLabel: 'Save 20%',
      maxStudents: 200,
      maxExams: 50,
      duration: 365,
      popular: true,
      features: [
        '200 Candidate Seats Quota',
        '50 Assessment Slots / Month',
        'All Exam Types: MCQ, Coding & Subjective',
        'Interactive Python/Java/C++ Code Sandbox',
        'AI Proctoring Lite (Audio + Tab + Device Telemetry)',
        'Live Active Proctor Room & Monitor Grid',
        'Priority Technical Hotline Support (4h SLA)',
        '2 Months Free Included (Annual License)'
      ]
    },
    premium: {
      id: 'premium',
      name: 'Premium Enterprise',
      tier: 'University Accreditation',
      tagline: 'For full university campuses, multi-department certifications & autonomous institutions',
      price: 6399,
      annualTotal: 76788,
      billingCycle: 'annually',
      periodLabel: '/ mo',
      originalPrice: 7999,
      savingsLabel: 'Save 20%',
      maxStudents: null,
      maxExams: null,
      duration: 365,
      popular: false,
      features: [
        'Unlimited Candidate Enrollment Seats',
        'Unlimited Monthly Assessment Slots',
        'Deep AI Proctoring: Multi-face, Gaze, Voice & Secondary Cam',
        'Real-time Plagiarism & Code Diff Detection',
        'Custom College Subdomain & Institutional White-Labeling',
        'Dedicated Technical Account Manager & 24/7 Priority Emergency Support',
        'Direct REST API & LMS Webhook Integrations',
        '2 Months Free Included (Annual License)'
      ]
    }
  }
};

const CACHE_KEY = 'cached_admin_subscription';

export default function Subscription() {
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem(CACHE_KEY);
    } catch (_) {
      return true;
    }
  });
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
    fetchSubscriptionData(!!data);
  }, []);

  const fetchSubscriptionData = (isBackground = false) => {
    if (!isBackground) setLoading(true);
    subscriptionAPI.getCurrent()
      .then(r => {
        setData(r.data);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(r.data));
        } catch (_) {}
      })
      .catch(() => {
        if (!isBackground) toast.error('Failed to load institutional license quotas');
      })
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
        name: 'Nexify Examina Enterprise',
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
      toast.success(res?.message || res?.data?.message || 'Quote request submitted successfully!');
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

  if (loading && !data) return (
    <div className="admin-loading-container">
      <div className="admin-loading-spinner"></div>
      <p style={{ marginTop: '14px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
        Synchronizing Institutional License & Quotas...
      </p>
    </div>
  );

  const { subscription, usage, plansMonthly, plansAnnually, college } = data || {};

  // Active plans based on toggle with instant defaults
  const currentPlans = billingCycle === 'annually' 
    ? (plansAnnually || DEFAULT_PLANS.annually) 
    : (plansMonthly || DEFAULT_PLANS.monthly);

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
      a: "Nexify Examina ensures zero exam interruptions for candidates. If you temporarily exceed capacity, candidates can complete tests smoothly, and your administrator dashboard will prompt you to expand seats or upgrade your tier with 1-click."
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
    <div className="lq-container">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="lq-header">
        <div className="lq-header-left">
          <div className="lq-eyebrow">
            <span className="lq-eyebrow-dot" />
            <Layers size={13} />
            Institutional Capacity & Licensing
          </div>
          <h1 className="lq-title">Licenses & Capacity Quotas</h1>
          <p className="lq-subtitle">
            Manage your university proctoring accreditation, candidate seat allocations, and scale monthly or annual throughput.
          </p>
        </div>
        <div className="lq-header-actions">
          <button 
            type="button"
            className="lq-btn lq-btn-secondary" 
            onClick={() => setShowInvoiceModal(true)}
          >
            <FileText size={16} />
            License Certificate
          </button>
          <button 
            type="button"
            className="lq-btn lq-btn-primary" 
            onClick={() => setShowQuoteModal(true)}
          >
            <Building size={16} />
            Custom Enterprise Quote
          </button>
        </div>
      </div>

      {/* ── Executive Metric KPI Cards Strip ──────────────────── */}
      <div className="lq-metrics-grid">
        {/* Metric 1: Active Tier */}
        <div className="lq-metric-card">
          <div className="lq-metric-top">
            <span className="lq-metric-label">
              <Crown size={14} color="#f59e0b" />
              Active Tier
            </span>
            <span className="lq-days-badge">{daysRemaining} days left</span>
          </div>
          <div className="lq-metric-val-row">
            <span className="lq-metric-val" style={{ textTransform: 'capitalize' }}>
              {subscription?.plan || 'Standard'}
            </span>
          </div>
          <div className="lq-metric-footer">
            <span>{planConfig[subscription?.plan]?.badge || 'Accredited Faculty License'}</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>● Active</span>
          </div>
        </div>

        {/* Metric 2: Candidate Seats */}
        <div className="lq-metric-card">
          <div className="lq-metric-top">
            <span className="lq-metric-label">
              <Users size={14} color="#0a74da" />
              Candidate Seats
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0a74da' }}>
              {isUnlimitedStudents ? 'Unlimited' : `${studentPercent}%`}
            </span>
          </div>
          <div className="lq-metric-val-row">
            <span className="lq-metric-val">{currentStudents}</span>
            <span className="lq-metric-limit">
              / {isUnlimitedStudents ? '∞ Unlimited' : `${maxStudents} enrolled`}
            </span>
          </div>
          <div className="lq-metric-track">
            <div 
              className="lq-metric-fill" 
              style={{ 
                width: `${studentPercent}%`,
                background: studentPercent > 90 ? '#ef4444' : studentPercent > 70 ? '#f59e0b' : '#0a74da'
              }} 
            />
          </div>
          <div className="lq-metric-footer">
            <span>
              {isUnlimitedStudents ? 'Campus-wide seat expansion' : `${Math.max(0, maxStudents - currentStudents)} seats left`}
            </span>
            <a href="/admin/students" className="lq-metric-link">Roster →</a>
          </div>
        </div>

        {/* Metric 3: Monthly Assessment Slots */}
        <div className="lq-metric-card">
          <div className="lq-metric-top">
            <span className="lq-metric-label">
              <FileText size={14} color="#6366f1" />
              Monthly Tests
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6366f1' }}>
              {isUnlimitedExams ? 'Unlimited' : `${examPercent}%`}
            </span>
          </div>
          <div className="lq-metric-val-row">
            <span className="lq-metric-val">{currentExams}</span>
            <span className="lq-metric-limit">
              / {isUnlimitedExams ? '∞ Unlimited' : `${maxExams} slots`}
            </span>
          </div>
          <div className="lq-metric-track">
            <div 
              className="lq-metric-fill" 
              style={{ 
                width: `${examPercent}%`,
                background: examPercent > 90 ? '#ef4444' : '#6366f1'
              }} 
            />
          </div>
          <div className="lq-metric-footer">
            <span>
              {isUnlimitedExams ? 'Unlimited concurrent tests' : `${Math.max(0, maxExams - currentExams)} slots left`}
            </span>
            <a href="/admin/exams" className="lq-metric-link">Exams →</a>
          </div>
        </div>

        {/* Metric 4: Verified Audited Submissions */}
        <div className="lq-metric-card">
          <div className="lq-metric-top">
            <span className="lq-metric-label">
              <Trophy size={14} color="#10b981" />
              Audited Logs
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>100% Valid</span>
          </div>
          <div className="lq-metric-val-row">
            <span className="lq-metric-val" style={{ color: '#10b981' }}>{currentResults}</span>
            <span className="lq-metric-limit">transcripts</span>
          </div>
          <div className="lq-metric-track">
            <div className="lq-metric-fill" style={{ width: '100%', background: '#10b981' }} />
          </div>
          <div className="lq-metric-footer">
            <span>Encrypted anti-cheat logs</span>
            <a href="/admin/results" className="lq-metric-link">Gradebook →</a>
          </div>
        </div>
      </div>

      {/* ── Active Institutional License Hero Card ─────────── */}
      {subscription && (
        <div className="lq-hero-card">
          <div className="lq-hero-info">
            <div className="lq-hero-badge">
              <Sparkles size={14} /> Active Institutional Accreditation
            </div>
            
            <div className="lq-hero-title-row">
              <div 
                className="lq-hero-plan-icon" 
                style={{ background: planConfig[subscription.plan]?.gradient || '#0a74da' }}
              >
                {React.createElement(planConfig[subscription.plan]?.icon || ShieldCheck, { size: 24 })}
              </div>
              <div>
                <div className="lq-hero-tier-name">
                  {(subscription.plan || 'Standard').toUpperCase()} TIER
                </div>
                <div className="lq-hero-tier-tagline">
                  {planConfig[subscription.plan]?.badge || 'Accredited Faculty License'}
                </div>
              </div>
            </div>

            {/* License Key & Verification Row */}
            <div className="lq-key-pill">
              <span className="lq-key-label">LICENSE KEY:</span>
              <code className="lq-key-code">{licenseKey}</code>
              <button 
                type="button" 
                className="lq-copy-btn" 
                onClick={() => handleCopyLicenseKey(licenseKey)}
                title="Copy License Key"
              >
                {copiedKey ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="lq-hero-meta">
              <div className="lq-meta-item">
                <Calendar size={15} color="#38bdf8" />
                Valid Until: <strong>{formatIST(expirationDate, 'dateOnly')}</strong>
                <span className="lq-days-badge">{daysRemaining} days remaining</span>
              </div>
              <span className="dot-divider">•</span>
              <div className="lq-meta-item">
                <Users size={15} color="#38bdf8" />
                Enrolled Capacity: <strong>{isUnlimitedStudents ? 'Unlimited Seats' : `${maxStudents} Candidate Seats`}</strong>
              </div>
              <span className="dot-divider">•</span>
              <div className="lq-meta-item">
                <MonitorCheck size={15} color="#38bdf8" />
                Auto-Renewal: <strong>Active & Compliant</strong>
              </div>
            </div>
          </div>

          <div className="lq-hero-pricing">
            <div className="lq-hero-price">
              ₹{Number(subscription.amount || 2999).toLocaleString('en-IN')} 
              <span className="lq-hero-cycle">/ cycle</span>
            </div>
            <StatusBadge status={subscription.status} />
            <div className="lq-invoice-link" onClick={() => setShowInvoiceModal(true)}>
              View Billing & GST Receipt →
            </div>
          </div>
        </div>
      )}

      {/* ── Plans & Capacity Switcher Section ───────────────── */}
      <div className="lq-card">
        <div className="lq-card-head">
          <div>
            <h2 className="lq-card-title">
              <Rocket size={22} color="#0a74da" />
              Scale Institutional Capacity & Licensing
            </h2>
            <p className="lq-card-desc">
              Choose the license tier that fits your institution. Switch between Monthly and Annual billing anytime.
            </p>
          </div>

          {/* Monthly / Annual Billing Toggle */}
          <div className="lq-switcher-wrap">
            <div className="lq-cycle-switcher">
              <button
                type="button"
                className={`lq-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                className={`lq-cycle-btn ${billingCycle === 'annually' ? 'active' : ''}`}
                onClick={() => setBillingCycle('annually')}
              >
                Annual Billing
                <span className="lq-savings-tag">Save 20% ✨</span>
              </button>
            </div>
            <div className="lq-cycle-callout">
              {billingCycle === 'annually' ? '⚡ 2 Months Free applied to all annual plans' : 'Pay as you go monthly'}
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="lq-plans-grid">
          {Object.entries(currentPlans).map(([key, plan]) => {
            const config = planConfig[key] || planConfig.standard;
            const isCurrentPlan = subscription?.plan === key;
            const isPopular = plan.popular;
            
            return (
              <div 
                key={key} 
                className={`lq-plan-card ${isCurrentPlan ? 'current' : ''} ${isPopular ? 'popular' : ''}`}
              >
                {isPopular && (
                  <div className="lq-popular-pill">
                    <Star size={12} fill="#ffffff" />
                    RECOMMENDED FOR INSTITUTIONS
                  </div>
                )}
                
                <div className="lq-plan-top">
                  <div className="admin-plan-icon" style={{ background: config.gradient }}>
                    {React.createElement(config.icon, { size: 24 })}
                  </div>
                  <div>
                    <h3 className="lq-plan-name">{plan.name}</h3>
                    <span className="lq-plan-tier-label">{plan.tier || 'Academic'}</span>
                  </div>
                </div>

                <p className="lq-plan-tagline">{plan.tagline}</p>
                
                <div className="lq-plan-pricing-box">
                  <div className="lq-plan-num-row">
                    <div className="lq-plan-num">
                      ₹{Number(plan.price).toLocaleString('en-IN')}
                    </div>
                    <div className="lq-plan-billing-label">
                      {plan.periodLabel || (billingCycle === 'annually' ? '/ mo' : '/ month')}
                    </div>
                  </div>

                  {billingCycle === 'annually' && plan.originalPrice && (
                    <div className="lq-annual-detail">
                      <span className="lq-strike-price">₹{plan.originalPrice}/mo</span>
                      <span className="lq-annual-billed">Billed ₹{Number(plan.annualTotal).toLocaleString('en-IN')}/year</span>
                    </div>
                  )}

                  {plan.savingsLabel && (
                    <div className="lq-discount-badge">
                      <Sparkles size={12} /> {plan.savingsLabel}
                    </div>
                  )}
                </div>

                {/* Quota Highlights */}
                <div className="lq-quota-mini-grid">
                  <div className="quota-summary-item">
                    <span className="lq-mini-label">Candidate Seats</span>
                    <span className="lq-mini-val">
                      {plan.maxStudents ? `${plan.maxStudents} Students` : 'Unlimited'}
                    </span>
                  </div>
                  <div className="quota-summary-item">
                    <span className="lq-mini-label">Monthly Exams</span>
                    <span className="lq-mini-val">
                      {plan.maxExams ? `${plan.maxExams} Exams` : 'Unlimited'}
                    </span>
                  </div>
                </div>
                
                {/* Feature Checklist */}
                <div className="lq-features-list">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="lq-feature-row">
                      <CheckCircle2 size={16} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={() => handleUpgrade(key)}
                  disabled={isCurrentPlan || upgrading === key}
                  className={`lq-btn lq-action-btn ${isCurrentPlan ? 'lq-btn-secondary' : isPopular ? 'lq-btn-primary' : 'lq-btn-secondary'}`}
                  style={{ opacity: upgrading === key ? 0.7 : 1 }}
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
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Feature Comparison Matrix ───────────────────────── */}
      <div className="lq-card">
        <div className="lq-card-head" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="lq-card-title">
              <Cpu size={22} color="#0a74da" />
              Institutional Capability Matrix
            </h2>
            <p className="lq-card-desc">
              Detailed quota breakdown and proctoring depth comparison across academic license tiers
            </p>
          </div>
        </div>

        <div className="lq-matrix-wrap">
          <table className="lq-matrix-table">
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
      <div className="lq-enterprise-banner">
        <div className="lq-enterprise-info">
          <div className="lq-enterprise-pill">
            <Building size={16} /> University-Wide Accreditation
          </div>
          <h3>Need over 1,000+ candidate seats or private campus cloud hosting?</h3>
          <p>
            Nexify Examina delivers customized solutions for large state universities, autonomous institutes, 
            and recruitment agencies with high concurrency requirements, on-premise deployments, and custom LMS integrations.
          </p>
        </div>
        <div>
          <button 
            type="button" 
            className="lq-enterprise-action-btn"
            onClick={() => setShowQuoteModal(true)}
          >
            <Send size={16} /> Request Custom University Quote
          </button>
        </div>
      </div>

      {/* ── FAQ Accordion Section ───────────────────────────── */}
      <div className="lq-card">
        <div className="lq-card-head" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="lq-card-title">
              <HelpCircle size={22} color="#0a74da" />
              Institutional Licensing & Quota FAQs
            </h2>
            <p className="lq-card-desc">Common questions regarding quota expansion, billing cycles, and university audits</p>
          </div>
        </div>

        <div className="lq-faqs-grid">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`lq-faq-item ${isOpen ? 'open' : ''}`}>
                <button 
                  type="button" 
                  className="lq-faq-trigger"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div className="lq-faq-body">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Security & Encrypted Payments Footer ────────────── */}
      <div className="lq-security-card">
        <div className="lq-security-icon">
          <Lock size={24} />
        </div>
        <div className="lq-security-content">
          <h3>Enterprise Bank-Grade 256-Bit TLS Payment Security</h3>
          <p>
            All subscriptions, renewals, and invoice transactions are processed directly with PCI-DSS Level 1 certified 
            Razorpay banking gateways. Automated receipts and tax invoices are issued immediately upon transaction clearance.
          </p>
          <div className="lq-badges-row">
            <span className="lq-badge-item"><CheckCircle2 size={14} /> 100% High-Availability SLA</span>
            <span className="lq-badge-item"><CheckCircle2 size={14} /> Indian GST Compliant Invoices</span>
            <span className="lq-badge-item"><CheckCircle2 size={14} /> SOC2 / ISO-27001 Data Encryption</span>
          </div>
        </div>
      </div>

      {/* ── MODAL: Request Custom Enterprise Quote ─────────── */}
      {showQuoteModal && (
        <div className="lq-modal-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="lq-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="lq-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={20} color="#0a74da" />
                <h3 className="lq-modal-title">Request Custom Institutional Quote</h3>
              </div>
              <button 
                type="button" 
                className="lq-close-btn" 
                onClick={() => setShowQuoteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="lq-form">
              <p style={{ fontSize: '0.9rem', color: 'var(--mu, #64748b)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Tell us about your university assessment requirements. Our institutional solutions team will create a tailored proposal within 4 business hours.
              </p>

              <div className="lq-form-group">
                <label className="lq-form-label">Required Candidate Seat Capacity</label>
                <select
                  className="lq-select"
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

              <div className="lq-form-group">
                <label className="lq-form-label">Estimated Monthly Examinations</label>
                <select
                  className="lq-select"
                  value={quoteForm.examsPerMonth}
                  onChange={(e) => setQuoteForm({ ...quoteForm, examsPerMonth: e.target.value })}
                >
                  <option value="50">Up to 50 Exams / Month</option>
                  <option value="150">50 – 150 Exams / Month</option>
                  <option value="500">150 – 500 Exams / Month</option>
                  <option value="unlimited">Continuous High-Frequency Testing</option>
                </select>
              </div>

              <div className="lq-form-row">
                <div className="lq-form-group">
                  <label className="lq-form-label">Institutional Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Sharma, Dean"
                    className="lq-input"
                    value={quoteForm.contactPerson}
                    onChange={(e) => setQuoteForm({ ...quoteForm, contactPerson: e.target.value })}
                  />
                </div>
                <div className="lq-form-group">
                  <label className="lq-form-label">Contact Phone / Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="lq-input"
                    value={quoteForm.contactPhone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="lq-form-group">
                <label className="lq-form-label">Special Requirements / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Specify any ERP/Moodle integrations, custom proctoring policies, or RFP deadlines..."
                  className="lq-textarea"
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                />
              </div>

              <div className="lq-modal-foot">
                <button 
                  type="button" 
                  className="lq-btn lq-btn-secondary" 
                  onClick={() => setShowQuoteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="lq-btn lq-btn-primary" 
                  disabled={submittingQuote}
                >
                  {submittingQuote ? 'Submitting...' : (
                    <>
                      <Send size={16} />
                      Submit Quote Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Institutional Invoicing & Certificate ───── */}
      {showInvoiceModal && (
        <div className="lq-modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="lq-modal-dialog lq-cert-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="lq-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#10b981" />
                <h3 className="lq-modal-title">Institutional License Certificate & Billing Summary</h3>
              </div>
              <button 
                type="button" 
                className="lq-close-btn" 
                onClick={() => setShowInvoiceModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <div className="lq-cert-frame">
                <div className="lq-cert-header">
                  <span className="lq-cert-org">NEXIFY EXAMINA GLOBAL ACCREDITATION</span>
                  <h4 className="lq-cert-title">CERTIFICATE OF PROCTORING LICENSE</h4>
                  <p className="lq-cert-subtitle">Valid Institutional Examination Center Authorization</p>
                </div>

                <div>
                  <div className="lq-cert-grid">
                    <div className="lq-cert-item">
                      <span className="lq-cert-lbl">Licensed Institution:</span>
                      <span className="lq-cert-val">{college?.name || 'Accredited Institution'}</span>
                    </div>
                    <div className="lq-cert-item">
                      <span className="lq-cert-lbl">License Key:</span>
                      <span className="lq-cert-val"><code>{licenseKey}</code></span>
                    </div>
                    <div className="lq-cert-item">
                      <span className="lq-cert-lbl">Subscription Tier:</span>
                      <span className="lq-cert-val" style={{ textTransform: 'uppercase', fontWeight: 800, color: '#0a74da' }}>
                        {subscription?.plan || 'Standard'} Tier
                      </span>
                    </div>
                    <div className="lq-cert-item">
                      <span className="lq-cert-lbl">Status:</span>
                      <span className="lq-cert-val" style={{ color: '#10b981', fontWeight: 700 }}>
                        Active & Verified
                      </span>
                    </div>
                    <div className="lq-cert-item">
                      <span className="lq-cert-lbl">Valid Period:</span>
                      <span className="lq-cert-val">
                        {formatIST(subscription?.start_date || Date.now(), 'dateOnly')} — {formatIST(expirationDate, 'dateOnly')}
                      </span>
                    </div>
                    <div className="lq-cert-item">
                      <span className="lq-cert-lbl">Seat Quota:</span>
                      <span className="lq-cert-val">
                        {isUnlimitedStudents ? 'Unlimited Candidates' : `${maxStudents} Enrolled Candidates`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lq-cert-footer">
                  <div className="lq-cert-seal">
                    <ShieldCheck size={36} color="#0a74da" />
                    <span>DIGITALLY VERIFIED</span>
                  </div>
                  <div className="lq-cert-meta">
                    <span>Tax Invoice Ref: INV-{Date.now().toString().slice(-8)}</span>
                    <span>GSTIN Status: Registered Educational Provider</span>
                  </div>
                </div>
              </div>

              <div className="lq-modal-foot" style={{ marginTop: '20px' }}>
                <button 
                  type="button"
                  className="lq-btn lq-btn-secondary" 
                  onClick={() => setShowInvoiceModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button"
                  className="lq-btn lq-btn-primary" 
                  onClick={() => {
                    window.print();
                    toast.success('Ready to print or save as PDF!');
                  }}
                >
                  <Download size={16} />
                  Print / Save Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
