import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  ArrowUpRight,
  Receipt,
  FileText,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatIST } from '../../utils/timezone';
import './SuperAdmin.css';

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({
    activeRevenue: 0,
    totalVolume: 0,
    activeCount: 0,
    expiredCount: 0,
    totalTransactions: 0,
  });
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'expired'
  const [planFilter, setPlanFilter] = useState('all'); // 'all', 'basic', 'standard', 'premium'

  // Modal State
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordData, setRecordData] = useState({
    college_id: '',
    plan: 'standard',
    amount: '2999',
    payment_gateway: 'bank_transfer',
    payment_id: '',
    duration_days: '30',
    notes: '',
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getPayments({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        plan: planFilter !== 'all' ? planFilter : undefined,
      });
      setPayments(res.data.payments || []);
      if (res.data.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planFilter]);

  const fetchCollegeList = async () => {
    try {
      const res = await superAdminAPI.getColleges({});
      setColleges(res.data.colleges || []);
    } catch (err) {
      console.error('Error fetching colleges for payment dropdown:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPayments, 250);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  useEffect(() => {
    fetchCollegeList();
  }, []);

  const openRecordModal = () => {
    setRecordData({
      college_id: colleges.length > 0 ? colleges[0].id : '',
      plan: 'standard',
      amount: '2999',
      payment_gateway: 'bank_transfer',
      payment_id: 'WIRE-' + Math.floor(100000 + Math.random() * 900000),
      duration_days: '30',
      notes: '',
    });
    setShowRecordModal(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordData.college_id) {
      return toast.error('Please select an institution');
    }
    setSubmitting(true);
    try {
      const res = await superAdminAPI.recordManualPayment(recordData);
      toast.success(res.data.message || 'Payment recorded successfully');
      setShowRecordModal(false);
      fetchPayments();
    } catch (err) {
      console.error('Record payment error:', err);
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ──── PAGE HEADER ──── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.55rem', fontWeight: 800, color: 'var(--sa-text)', margin: '0 0 4px' }}>
            Payment &amp; Financial Ledger
          </h1>
          <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Audit multi-tenant revenue streams, track university subscription renewals, and log manual offline receipts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="sa-action-btn sa-btn-secondary"
            onClick={fetchPayments}
            disabled={loading}
            title="Reload financial records"
          >
            <RefreshCw size={14} className={loading ? 'sa-pulse-bullet' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="sa-action-btn sa-btn-primary"
            onClick={openRecordModal}
            id="sa-record-payment-btn"
          >
            <Plus size={16} />
            <span>Record Offline Transaction</span>
          </button>
        </div>
      </div>

      {/* ──── METRICS CARDS ──── */}
      <div className="sa-stats-grid">
        {/* Active MRR */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <span className="sa-stat-label">Active Platform MRR</span>
            <div className="sa-stat-icon-wrap" style={{ background: 'var(--sa-emerald-light)', color: 'var(--sa-emerald)' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="sa-stat-value" style={{ color: 'var(--sa-emerald)' }}>
            ₹{metrics.activeRevenue.toLocaleString('en-IN')}
          </div>
          <div className="sa-stat-footer">
            <span className="sa-badge sa-badge-active" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
              RECURRING
            </span>
            <span>Across active university contracts</span>
          </div>
        </div>

        {/* All-Time Volume */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <span className="sa-stat-label">All-Time Billed Volume</span>
            <div className="sa-stat-icon-wrap" style={{ background: 'var(--sa-primary-light)', color: 'var(--sa-primary)' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="sa-stat-value">
            ₹{metrics.totalVolume.toLocaleString('en-IN')}
          </div>
          <div className="sa-stat-footer">
            <span>Cumulative gross revenue</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <span className="sa-stat-label">Active Licenses</span>
            <div className="sa-stat-icon-wrap" style={{ background: 'var(--sa-purple-light)', color: 'var(--sa-purple)' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="sa-stat-value">
            {metrics.activeCount}
          </div>
          <div className="sa-stat-footer">
            <span>Active subscription seats</span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <span className="sa-stat-label">Total Transactions</span>
            <div className="sa-stat-icon-wrap" style={{ background: 'var(--sa-amber-light)', color: 'var(--sa-amber)' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="sa-stat-value">
            {metrics.totalTransactions}
          </div>
          <div className="sa-stat-footer">
            <span>Invoices &amp; Gateway events</span>
          </div>
        </div>
      </div>

      {/* ──── SEARCH AND FILTER CONTROLS ──── */}
      <div className="sa-card" style={{ padding: '20px' }}>
        <div className="sa-table-controls">
          <div className="sa-search-wrap">
            <Search className="sa-search-icon" size={17} />
            <input
              type="text"
              className="sa-search-input"
              placeholder="Search by reference ID, institution name, or billing email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sa-filter-pills">
            <button
              type="button"
              className={`sa-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Status
            </button>
            <button
              type="button"
              className={`sa-filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active ({metrics.activeCount})
            </button>
            <button
              type="button"
              className={`sa-filter-pill ${statusFilter === 'expired' ? 'active' : ''}`}
              onClick={() => setStatusFilter('expired')}
            >
              Expired ({metrics.expiredCount})
            </button>
          </div>
        </div>

        {/* ──── DATA TABLE ──── */}
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Payment Ref &amp; Gateway</th>
                <th>Institution</th>
                <th>Tier</th>
                <th>Amount Billed</th>
                <th>Validity Window</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Recorded On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    Loading financial ledger records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    No payment records matched your search parameters.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isActive = p.status === 'active';
                  const amount = parseFloat(p.amount) || 0;

                  return (
                    <tr key={p.id}>
                      {/* Ref & Gateway */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--sa-text)', fontSize: '0.86rem' }}>
                            {p.payment_id || p.id.substring(0, 13)}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase' }}>
                            {p.payment_gateway || 'Manual'}
                          </span>
                        </div>
                      </td>

                      {/* Institution */}
                      <td>
                        <div className="sa-college-cell">
                          <div className="sa-college-avatar">
                            {p.college_name ? p.college_name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="sa-college-name">{p.college_name || 'Direct Tenant'}</div>
                            <div className="sa-college-email">{p.college_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan Tier */}
                      <td>
                        <span className={`sa-badge sa-plan-${p.plan || 'basic'}`}>
                          {(p.plan || 'basic').toUpperCase()}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '0.98rem', color: 'var(--sa-text)' }}>
                          ₹{amount.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Validity Period */}
                      <td>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>
                            From: {p.start_date ? formatIST(p.start_date, 'dateOnly') : '—'}
                          </span>
                          <span style={{ color: isActive ? 'var(--sa-emerald)' : 'var(--sa-rose)', fontWeight: 600 }}>
                            To: {p.end_date ? formatIST(p.end_date, 'dateOnly') : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`sa-badge ${isActive ? 'sa-badge-active' : 'sa-badge-suspended'}`}>
                          {p.status ? p.status.toUpperCase() : 'ACTIVE'}
                        </span>
                      </td>

                      {/* Created On */}
                      <td style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                        {p.created_at ? formatIST(p.created_at, 'dateTime') : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: RECORD OFFLINE PAYMENT
          ═══════════════════════════════════════════════════════════ */}
      {showRecordModal && (
        <div className="sa-modal-backdrop" onClick={() => setShowRecordModal(false)}>
          <div className="sa-modal sa-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">
                  <Receipt size={20} style={{ color: 'var(--sa-primary)' }} />
                  Record Manual / Offline Transaction
                </h3>
                <p className="sa-modal-subtitle">
                  Manually register bank wires, university purchase orders, or direct corporate payments.
                </p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowRecordModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit}>
              <div className="sa-modal-body">
                <div className="sa-form-grid">
                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">Beneficiary Institution *</label>
                    <select
                      className="sa-form-select"
                      required
                      value={recordData.college_id}
                      onChange={(e) => setRecordData({ ...recordData, college_id: e.target.value })}
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Plan Tier *</label>
                    <select
                      className="sa-form-select"
                      value={recordData.plan}
                      onChange={(e) => {
                        const newPlan = e.target.value;
                        const prices = { basic: '999', standard: '2999', premium: '7999' };
                        setRecordData({
                          ...recordData,
                          plan: newPlan,
                          amount: prices[newPlan] || '2999',
                        });
                      }}
                    >
                      <option value="basic">Basic Tier (₹999)</option>
                      <option value="standard">Standard Tier (₹2,999)</option>
                      <option value="premium">Premium Enterprise (₹7,999)</option>
                    </select>
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Amount Received (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      className="sa-form-input"
                      value={recordData.amount}
                      onChange={(e) => setRecordData({ ...recordData, amount: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Payment Channel / Gateway *</label>
                    <select
                      className="sa-form-select"
                      value={recordData.payment_gateway}
                      onChange={(e) => setRecordData({ ...recordData, payment_gateway: e.target.value })}
                    >
                      <option value="bank_transfer">Bank Wire / NEFT / RTGS</option>
                      <option value="cheque">Demand Draft / Cheque</option>
                      <option value="invoice">University Purchase Order / Invoice</option>
                      <option value="cash">Cash / Offline Cash Receipt</option>
                      <option value="razorpay">Razorpay Manual Entry</option>
                    </select>
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">UTR / Transaction Reference ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UTR-98218491823"
                      className="sa-form-input"
                      value={recordData.payment_id}
                      onChange={(e) => setRecordData({ ...recordData, payment_id: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">License Duration (Days)</label>
                    <select
                      className="sa-form-select"
                      value={recordData.duration_days}
                      onChange={(e) => setRecordData({ ...recordData, duration_days: e.target.value })}
                    >
                      <option value="30">30 Days (1 Month)</option>
                      <option value="90">90 Days (Quarterly)</option>
                      <option value="180">180 Days (Semester)</option>
                      <option value="365">365 Days (1 Year)</option>
                    </select>
                  </div>

                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">Administrative Ledger Notes</label>
                    <textarea
                      placeholder="e.g. Received via State Bank of India account, authorized by Finance Officer"
                      className="sa-form-textarea"
                      value={recordData.notes}
                      onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-action-btn sa-btn-secondary"
                  onClick={() => setShowRecordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-action-btn sa-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
