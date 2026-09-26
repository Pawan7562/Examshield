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
  CreditCard, 
  ShieldCheck, 
  Rocket, 
  FileText, 
  Trophy,
  Sparkles,
  Lock,
  Layers,
  CheckCircle2
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';
import './Subscription.css';

const planConfig = {
  basic: { 
    color: '#64748b', 
    bg: 'rgba(100, 116, 139, 0.1)', 
    icon: ShieldCheck,
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
  },
  standard: { 
    color: '#0a74da', 
    bg: 'rgba(10, 116, 218, 0.1)', 
    icon: Star,
    gradient: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)'
  },
  premium: { 
    color: '#f59e0b', 
    bg: 'rgba(245, 158, 11, 0.1)', 
    icon: Crown,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
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
    active: { color: '#10b981', bg: '#ecfdf5', label: 'ACTIVE & VERIFIED' },
    expired: { color: '#ef4444', bg: '#fef2f2', label: 'RENEWAL REQUIRED' },
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
      padding: '4px 10px',
      borderRadius: '20px'
    }}>
      {statusConfig.label}
    </span>
  );
};

export default function Subscription() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    subscriptionAPI.getCurrent()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load institutional license quotas'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan) => {
    setUpgrading(plan);
    try {
      const orderRes = await subscriptionAPI.createOrder({ plan });
      const { orderId, amount, keyId, planDetails } = orderRes.data;

      if (!window.Razorpay) {
        return toast.error('Razorpay SDK unavailable. Contact ExamShield Support.');
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency: 'INR',
        order_id: orderId,
        name: 'ExamShield Enterprise',
        description: `${planDetails.name} Institutional License`,
        theme: { color: '#0a74da' },
        handler: async (response) => {
          try {
            await subscriptionAPI.verifyPayment({ 
              ...response, 
              plan, 
              razorpayOrderId: response.razorpay_order_id, 
              razorpayPaymentId: response.razorpay_payment_id, 
              razorpaySignature: response.razorpay_signature 
            });
            toast.success('Institutional capacity upgraded successfully!');
            const r = await subscriptionAPI.getCurrent();
            setData(r.data);
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

  if (loading) return (
    <div className="admin-loading-container">
      <div className="admin-loading-spinner"></div>
    </div>
  );

  const { subscription, usage, plans } = data || {};

  // Compute Quota usage percentages
  const maxStudents = subscription?.max_students || 500;
  const currentStudents = usage?.students || 0;
  const studentPercent = Math.min(100, Math.round((currentStudents / maxStudents) * 100));

  const maxExams = subscription?.max_exams || 50;
  const currentExams = usage?.exams || 0;
  const examPercent = Math.min(100, Math.round((currentExams / maxExams) * 100));

  const currentResults = usage?.results || 0;

  return (
    <div className="admin-quota-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0a74da', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            <Layers size={14} /> Institutional Capacity & Licensing
          </div>
          <h1 className="admin-page-title">License & Capacity Quotas</h1>
          <p className="admin-page-subtitle">
            Monitor real-time candidate seat allocations, active assessment slots, and scale your institutional plan.
          </p>
        </div>
        <div className="admin-header-actions">
          <Button variant="secondary" icon={CreditCard} onClick={() => toast('Institutional Billing is active & compliant', { icon: '🛡️' })}>
            Invoicing Details
          </Button>
        </div>
      </div>

      {/* Current Active Plan Card */}
      {subscription && (
        <div className="admin-current-plan-card">
          <div className="admin-current-plan-info">
            <div className="admin-current-plan-label">
              <Sparkles size={14} /> Active Institutional Plan
            </div>
            <div className="admin-current-plan-name">
              <div className="admin-plan-icon" style={{ background: planConfig[subscription.plan]?.gradient || '#0a74da' }}>
                {React.createElement(planConfig[subscription.plan]?.icon || ShieldCheck, { size: 24 })}
              </div>
              <span>{(subscription.plan || 'Standard').toUpperCase()} TIER</span>
            </div>
            <div className="admin-current-plan-details">
              <div className="admin-plan-detail-item">
                <Calendar size={15} color="#38bdf8" />
                Active Term Expiration: <strong>{formatIST(subscription.end_date || Date.now() + 30*86400000, 'dateOnly')}</strong>
              </div>
              <span>•</span>
              <div className="admin-plan-detail-item">
                <Users size={15} color="#38bdf8" />
                Capacity: <strong>{subscription.max_students ? `${subscription.max_students} Candidate Seats` : 'Unlimited Seats'}</strong>
              </div>
            </div>
          </div>

          <div className="admin-current-plan-pricing">
            <div className="admin-plan-price">₹{subscription.amount || '4,999'} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>/ month</span></div>
            <StatusBadge status={subscription.status} />
          </div>
        </div>
      )}

      {/* Quota Usage Meters */}
      <div className="admin-quota-meters-grid">
        {/* Metric 1: Candidate Seats */}
        <div className="admin-quota-card">
          <div className="admin-quota-header">
            <span className="admin-quota-title">
              <Users size={16} color="#0a74da" /> Candidate Seats Quota
            </span>
            <span className="admin-quota-percent">{studentPercent}% Allocated</span>
          </div>

          <div className="admin-quota-value-row">
            <span className="admin-quota-current">{currentStudents}</span>
            <span className="admin-quota-limit">/ {maxStudents} enrolled</span>
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
        </div>

        {/* Metric 2: Examination Capacity */}
        <div className="admin-quota-card">
          <div className="admin-quota-header">
            <span className="admin-quota-title">
              <FileText size={16} color="#6366f1" /> Monthly Assessment Slots
            </span>
            <span className="admin-quota-percent" style={{ color: '#6366f1' }}>{examPercent}% Created</span>
          </div>

          <div className="admin-quota-value-row">
            <span className="admin-quota-current">{currentExams}</span>
            <span className="admin-quota-limit">/ {maxExams} assessments</span>
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
        </div>

        {/* Metric 3: Submissions & Proctored Transcripts */}
        <div className="admin-quota-card">
          <div className="admin-quota-header">
            <span className="admin-quota-title">
              <Trophy size={16} color="#10b981" /> Completed Submissions
            </span>
            <span className="admin-quota-percent" style={{ color: '#10b981' }}>Active Audits</span>
          </div>

          <div className="admin-quota-value-row">
            <span className="admin-quota-current" style={{ color: '#10b981' }}>{currentResults}</span>
            <span className="admin-quota-limit">verified evaluations</span>
          </div>

          <div className="admin-quota-progress-track">
            <div 
              className="admin-quota-progress-fill" 
              style={{ width: '100%', background: '#10b981' }} 
            />
          </div>
        </div>
      </div>

      {/* Available Plans Comparison */}
      <div className="admin-content-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            <Rocket size={22} color="#0a74da" />
            Expand Institutional Quotas & Scale Capacity
          </h2>
          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Instant activation with automated Razorpay billing
          </span>
        </div>

        <div className="admin-plans-grid">
          {plans && Object.entries(plans).map(([key, plan]) => {
            const config = planConfig[key] || planConfig.standard;
            const isCurrentPlan = subscription?.plan === key;
            const isPopular = key === 'standard';
            
            return (
              <div 
                key={key} 
                className={`admin-plan-card ${isCurrentPlan ? 'current' : ''} ${isPopular ? 'popular' : ''}`}
              >
                {isPopular && (
                  <div className="admin-plan-badge">
                    <Star size={12} />
                    RECOMMENDED TIER
                  </div>
                )}
                
                <div className="admin-plan-header">
                  <div className="admin-plan-icon" style={{ background: config.gradient }}>
                    {React.createElement(config.icon, { size: 24 })}
                  </div>
                  <h3 className="admin-plan-name">{plan.name}</h3>
                </div>
                
                <div className="admin-plan-pricing">
                  <div className="admin-plan-price">₹{plan.price}</div>
                  <div className="admin-plan-billing">per calendar month</div>
                </div>
                
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
                  variant={isCurrentPlan ? 'secondary' : 'primary'}
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
                      Upgrade to {plan.name}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Payment Processing Note */}
      <div className="admin-content-card">
        <div className="admin-payment-info">
          <div className="admin-payment-icon">
            <Lock size={24} />
          </div>
          <div className="admin-payment-content">
            <h3>Enterprise PCI-DSS Encrypted Payments</h3>
            <p>
              Transactions and billing invoices are processed under 256-bit TLS encryption with Razorpay. 
              College license orders include GST invoices formatted for educational institutions and university accreditation.
            </p>
            <div className="admin-payment-note">
              <CheckCircle2 size={14} /> 100% SLA Guarantee for Live Assessment Proctors
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
