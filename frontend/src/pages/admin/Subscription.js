// src/pages/admin/Subscription.js
import React, { useEffect, useState } from 'react';
import { subscriptionAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Crown, 
  Star, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  Calendar, 
  CreditCard, 
  Shield, 
  TrendingUp,
  Clock,
  Gift,
  Rocket,
  FileText,
  Trophy
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

const planConfig = {
  basic: { 
    color: '#64748b', 
    bg: 'rgba(100, 116, 139, 0.1)', 
    icon: Shield,
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
  },
  standard: { 
    color: '#e94560', 
    bg: 'rgba(233, 69, 96, 0.1)', 
    icon: Star,
    gradient: 'linear-gradient(135deg, #e94560 0%, #9b2335 100%)'
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
    active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'ACTIVE' },
    expired: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'EXPIRED' },
    cancelled: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', label: 'CANCELLED' }
  };
  
  const statusConfig = config[status] || config.active;
  return (
    <span className="admin-status-badge" style={{ 
      background: statusConfig.bg, 
      color: statusConfig.color,
      border: `1px solid ${statusConfig.color}20`
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
    subscriptionAPI.getCurrent().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan) => {
    setUpgrading(plan);
    try {
      const orderRes = await subscriptionAPI.createOrder({ plan });
      const { orderId, amount, keyId, planDetails } = orderRes.data;

      if (!window.Razorpay) {
        return toast.error('Razorpay SDK not loaded. Configure RAZORPAY_KEY_ID in production.');
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency: 'INR',
        order_id: orderId,
        name: 'ExamShield',
        description: `${planDetails.name} Plan`,
        theme: { color: '#e94560' },
        handler: async (response) => {
          try {
            await subscriptionAPI.verifyPayment({ ...response, plan, razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature });
            toast.success('Subscription activated successfully!');
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
      Loading subscription details...
    </div>
  );

  const { subscription, usage, plans } = data || {};

  return (
    <div className="admin-pages-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <h1 className="admin-page-title">Subscription Management</h1>
          <p className="admin-page-subtitle">Manage your ExamShield subscription and billing</p>
        </div>
        <div className="admin-header-actions">
          <Button variant="secondary" icon={CreditCard}>
            Billing History
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      {subscription && (
        <div className="admin-content-card admin-current-plan-card">
          <div className="admin-current-plan-header">
            <div className="admin-current-plan-info">
              <div className="admin-current-plan-label">Current Plan</div>
              <div className="admin-current-plan-name">
                <div className="admin-plan-icon" style={{ background: planConfig[subscription.plan]?.gradient }}>
                  {React.createElement(planConfig[subscription.plan]?.icon, { size: 24 })}
                </div>
                <span>{subscription.plan.toUpperCase()}</span>
              </div>
              <div className="admin-current-plan-details">
                <div className="admin-plan-detail-item">
                  <Calendar size={14} />
                  Expires: {format(new Date(subscription.end_date), 'dd MMM yyyy')}
                </div>
                <div className="admin-plan-detail-item">
                  <Users size={14} />
                  {subscription.max_students ? ` ${usage?.students || 0}/${subscription.max_students} students used` : ' Unlimited students'}
                </div>
              </div>
            </div>
            <div className="admin-current-plan-pricing">
              <div className="admin-plan-price">₹{subscription.amount}/mo</div>
              <StatusBadge status={subscription.status} />
            </div>
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      {usage && (
        <div className="admin-content-card">
          <h2 className="admin-card-title">Usage Overview</h2>
          <div className="admin-usage-grid">
            <div className="admin-usage-item">
              <div className="admin-usage-icon" style={{ background: 'linear-gradient(135deg, #e94560 0%, #9b2335 100%)' }}>
                <Users size={20} />
              </div>
              <div className="admin-usage-info">
                <div className="admin-usage-value">{usage.students || 0}</div>
                <div className="admin-usage-label">Active Students</div>
              </div>
            </div>
            <div className="admin-usage-item">
              <div className="admin-usage-icon" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #047857 100%)' }}>
                <FileText size={20} />
              </div>
              <div className="admin-usage-info">
                <div className="admin-usage-value">{usage.exams || 0}</div>
                <div className="admin-usage-label">Exams Created</div>
              </div>
            </div>
            <div className="admin-usage-item">
              <div className="admin-usage-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                <Trophy size={20} />
              </div>
              <div className="admin-usage-info">
                <div className="admin-usage-value">{usage.results || 0}</div>
                <div className="admin-usage-label">Results Generated</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="admin-content-card">
        <h2 className="admin-card-title">Available Plans</h2>
        <div className="admin-plans-grid">
          {plans && Object.entries(plans).map(([key, plan]) => {
            const config = planConfig[key];
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
                    MOST POPULAR
                  </div>
                )}
                
                <div className="admin-plan-header">
                  <div className="admin-plan-icon" style={{ background: config.gradient }}>
                    {React.createElement(config.icon, { size: 28 })}
                  </div>
                  <h3 className="admin-plan-name">{plan.name}</h3>
                </div>
                
                <div className="admin-plan-pricing">
                  <div className="admin-plan-price">₹{plan.price}</div>
                  <div className="admin-plan-billing">per month</div>
                </div>
                
                <div className="admin-plan-features">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="admin-plan-feature">
                      <CheckCircle size={14} />
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
                      Current Plan
                    </>
                  ) : upgrading === key ? (
                    'Processing...'
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

      {/* Payment Info */}
      <div className="admin-content-card">
        <div className="admin-payment-info">
          <div className="admin-payment-icon">
            <Shield size={24} />
          </div>
          <div className="admin-payment-content">
            <h3>Secure Payment Processing</h3>
            <p>All payments are processed securely through Razorpay. Your payment information is encrypted and never stored on our servers.</p>
            <div className="admin-payment-note">
              <AlertCircle size={16} />
              Configure RAZORPAY_KEY_ID in your environment to enable payments.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
