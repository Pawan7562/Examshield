// src/pages/admin/Subscription.js
import React, { useEffect, useState } from 'react';
import { subscriptionAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const planColors = { basic: '#718096', standard: '#e94560', premium: '#f59e0b' };

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
            toast.success('Subscription activated!');
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

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#4a5568' }}>Loading...</div>;
  const { subscription, usage, plans } = data || {};

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Subscription</h1>
      <p style={{ fontSize: 13, color: '#4a5568', marginBottom: 24 }}>Manage your ExamShield subscription</p>

      {/* Current Plan */}
      {subscription && (
        <div style={{ background: 'rgba(233,69,96,0.08)', border: '1px solid rgba(233,69,96,0.25)', borderRadius: 12, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Current Plan</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: planColors[subscription.plan], textTransform: 'uppercase' }}>{subscription.plan}</div>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                Expires: {format(new Date(subscription.end_date), 'dd MMM yyyy')} ·
                {subscription.max_students ? ` ${usage?.students}/${subscription.max_students} students used` : ' Unlimited students'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0' }}>₹{subscription.amount}/mo</div>
              <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 12px', borderRadius: 20, background: subscription.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: subscription.status === 'active' ? '#22c55e' : '#ef4444', display: 'inline-block', marginTop: 4 }}>
                {subscription.status?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {plans && Object.entries(plans).map(([key, plan]) => (
          <div key={key} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${key === 'standard' ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: 24, position: 'relative' }}>
            {key === 'standard' && <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: '#e94560', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 16px', borderRadius: '0 0 8px 8px', letterSpacing: 1 }}>POPULAR</div>}
            <div style={{ fontSize: 13, fontWeight: 700, color: planColors[key], textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{plan.name}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>₹{plan.price}</div>
            <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 20 }}>per month</div>
            <div style={{ marginBottom: 20 }}>
              {plan.features?.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: '#a0aec0' }}>
                  <span style={{ color: '#22c55e', fontSize: 10 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={() => handleUpgrade(key)} disabled={subscription?.plan === key || upgrading === key}
              style={{ width: '100%', background: subscription?.plan === key ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#e94560,#c62a47)', border: 'none', borderRadius: 8, padding: '12px', color: subscription?.plan === key ? '#4a5568' : 'white', fontWeight: 700, fontSize: 13, cursor: subscription?.plan === key ? 'default' : 'pointer', fontFamily: 'Sora, sans-serif' }}>
              {subscription?.plan === key ? '✓ Current Plan' : upgrading === key ? 'Loading...' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: '#4a5568', marginTop: 20, textAlign: 'center' }}>
        Payments processed securely via Razorpay. Configure RAZORPAY_KEY_ID to enable payments.
      </p>
    </div>
  );
}
