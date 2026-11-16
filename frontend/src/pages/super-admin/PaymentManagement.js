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
  IndianRupee,
  Clock,
  Check,
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
      setPayments(res?.payments || res?.data?.payments || []);
      const m = res?.metrics || res?.data?.metrics;
      if (m) {
        setMetrics(m);
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
      setColleges(res?.colleges || res?.data?.colleges || []);
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
      toast.success(res?.message || res?.data?.message || 'Payment recorded successfully');
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
    <div className="sa-page-shell">
      {/* ──── PAGE HEADER ──── */}
      <div className="sa-page-header">
        <div className="sa-page-title-stack">
          <h1 className="sa-page-title">Payment &amp; Financial Ledger</h1>
          <p className="sa-page-subtitle">
            Audit multi-tenant revenue streams, track university subscription renewals, and log manual offline receipts with real-time MRR analytics.
          </p>
        </div>

        <div className="sa-page-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={fetchPayments}
            disabled={loading}
            title="Reload financial records"
          >
            <RefreshCw size={14} className={loading ? 'sa-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="sa-coral-pill-btn"
            onClick={openRecordModal}
            id="sa-record-payment-btn"
          >
            <Plus size={16} />
            <span>Record Offline Transaction</span>
          </button>
        </div>
      </div>

      {/* ──── METRICS CARDS ──── */}
      <div className="sa-kpi-grid">
        {/* Active MRR */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Active Platform MRR</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-mint">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={{ color: 'var(--sa-mint)' }}>
            ₹{(metrics.activeRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">RECURRING</span>
            <span>Active university contracts</span>
          </div>
        </div>

        {/* All-Time Volume */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">All-Time Billed Volume</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-coral">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="sa-kpi-value">
            ₹{(metrics.totalVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-pending">CUMULATIVE</span>
            <span>Gross processed volume</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Active Licenses</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-forest">
              <Building2 size={18} />
            </div>
          </div>
          <div className="sa-kpi-value">
            {metrics.activeCount || 0}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">ACTIVE SEATS</span>
            <span>Institutions on active tiers</span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Total Transactions</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-amber">
              <Receipt size={18} />
            </div>
          </div>
          <div className="sa-kpi-value">
            {metrics.totalTransactions || 0}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-pending">INVOICES</span>
            <span>Invoices &amp; gateway events</span>
          </div>
        </div>
      </div>

      {/* ──── SEARCH AND FILTER CONTROLS ──── */}
      <div className="sa-toolbar-card">
        <div className="sa-search-box">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            className="sa-search-input"
            placeholder="Search by reference ID, institution name, or billing email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sa-filter-tabs">
          <button
            type="button"
            className={`sa-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>All Status</span>
          </button>
          <button
            type="button"
            className={`sa-filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span>Active</span>
          </button>
          <button
            type="button"
            className={`sa-filter-tab ${statusFilter === 'expired' ? 'active' : ''}`}
            onClick={() => setStatusFilter('expired')}
          >
            <span>Expired</span>
          </button>

          <span style={{ width: '1px', height: '18px', background: 'var(--sa-card-border)', margin: '0 4px' }} />

          <button
            type="button"
            className={`sa-filter-tab ${planFilter === 'all' ? 'active' : ''}`}
            onClick={() => setPlanFilter('all')}
          >
            <span>All Tiers</span>
          </button>
          <button
            type="button"
            className={`sa-filter-tab ${planFilter === 'basic' ? 'active' : ''}`}
            onClick={() => setPlanFilter('basic')}
          >
            <span>Basic</span>
          </button>
          <button
            type="button"
            className={`sa-filter-tab ${planFilter === 'standard' ? 'active' : ''}`}
            onClick={() => setPlanFilter('standard')}
          >
            <span>Standard</span>
          </button>
          <button
            type="button"
            className={`sa-filter-tab ${planFilter === 'premium' ? 'active' : ''}`}
            onClick={() => setPlanFilter('premium')}
          >
            <span>Premium</span>
          </button>
        </div>
      </div>

      {/* ──── FINANCIAL LEDGER TABLE ──── */}
      <div className="sa-table-card">
        <div className="sa-table-scroll">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Institution</th>
                <th>Plan Tier</th>
                <th>Amount Billed</th>
                <th>Gateway / Mode</th>
                <th>Payment Date (IST)</th>
                <th>License Validity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="sa-table-empty">
                      <div className="sa-table-empty-icon sa-spin">
                        <RefreshCw size={22} />
                      </div>
                      <p style={{ margin: 0, fontWeight: 600 }}>Streaming transaction records...</p>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="sa-table-empty">
                      <div className="sa-table-empty-icon">
                        <CreditCard size={24} />
                      </div>
                      <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--sa-forest)' }}>
                        No financial records found
                      </p>
                      <p style={{ margin: 0, fontSize: '13px' }}>
                        No transactions match your current search filters or date range.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => {
                  const isExpired = p.end_date && new Date(p.end_date) < new Date();
                  return (
                    <tr key={p.id || idx}>
                      {/* Ref ID */}
                      <td>
                        <span style={{ fontFamily: 'Space Grotesk, monospace', fontSize: '12.5px', fontWeight: 700, color: 'var(--sa-forest)' }}>
                          {p.payment_id || `TXN-${p.id?.slice(0, 8)}`}
                        </span>
                      </td>

                      {/* Institution */}
                      <td>
                        <div className="sa-tenant-cell">
                          <div className={`sa-tenant-avatar-circle sa-avatar-bg-${idx % 4}`}>
                            {(p.college_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="sa-tenant-name">{p.college_name || 'University Tenant'}</div>
                            <div className="sa-tenant-subline">{p.college_email || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td>
                        <span className={`sa-badge sa-plan-${p.plan || 'basic'}`}>
                          {(p.plan || 'basic').toUpperCase()}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <span style={{ fontFamily: 'Space Grotesk', fontSize: '15px', fontWeight: 800, color: 'var(--sa-forest)' }}>
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Gateway */}
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sa-text-muted)', textTransform: 'capitalize' }}>
                          {(p.payment_gateway || 'bank_transfer').replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--sa-text-muted)' }}>
                          {p.created_at ? formatIST(p.created_at, 'dateTime') : '—'}
                        </span>
                      </td>

                      {/* Validity */}
                      <td>
                        <span style={{ fontSize: '12px', color: isExpired ? 'var(--sa-rose)' : 'var(--sa-text)' }}>
                          {p.end_date ? formatIST(p.end_date, 'dateOnly') : 'Permanent'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`sa-badge ${!isExpired ? 'sa-badge-active' : 'sa-badge-suspended'}`}>
                          {!isExpired ? 'PAID / ACTIVE' : 'EXPIRED'}
                        </span>
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
          MODAL: RECORD OFFLINE TRANSACTION
          ═══════════════════════════════════════════════════════════ */}
      {showRecordModal && (
        <div className="sa-modal-backdrop" onClick={() => setShowRecordModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">
                  <CreditCard size={20} style={{ color: 'var(--sa-mint)' }} />
                  Record Offline Transaction
                </h3>
                <p className="sa-modal-subtitle">
                  Manually register bank transfers, cheques, or enterprise PO billing.
                </p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowRecordModal(false)}>
                ✕
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
                      <option value="">Select an enrolled institution...</option>
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Subscription Tier *</label>
                    <select
                      className="sa-form-select"
                      value={recordData.plan}
                      onChange={(e) => setRecordData({ ...recordData, plan: e.target.value })}
                    >
                      <option value="basic">Basic Tier (₹999)</option>
                      <option value="standard">Standard Growth (₹2,999)</option>
                      <option value="premium">Premium Enterprise (₹7,999)</option>
                    </select>
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Amount Received (₹) *</label>
                    <input
                      type="number"
                      required
                      className="sa-form-input"
                      value={recordData.amount}
                      onChange={(e) => setRecordData({ ...recordData, amount: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Payment Channel *</label>
                    <select
                      className="sa-form-select"
                      value={recordData.payment_gateway}
                      onChange={(e) => setRecordData({ ...recordData, payment_gateway: e.target.value })}
                    >
                      <option value="bank_transfer">Direct Bank / NEFT / RTGS</option>
                      <option value="cheque">Institutional Cheque / DD</option>
                      <option value="razorpay">Razorpay Manual Hook</option>
                      <option value="stripe">Stripe Global Invoicing</option>
                      <option value="cash">Direct Cash / Counter Receipt</option>
                    </select>
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Transaction / UTR Reference *</label>
                    <input
                      type="text"
                      required
                      className="sa-form-input"
                      value={recordData.payment_id}
                      onChange={(e) => setRecordData({ ...recordData, payment_id: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">License Duration (Days)</label>
                    <input
                      type="number"
                      className="sa-form-input"
                      value={recordData.duration_days}
                      onChange={(e) => setRecordData({ ...recordData, duration_days: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">Audit Notes &amp; Remittance Reference</label>
                    <input
                      type="text"
                      className="sa-form-input"
                      placeholder="e.g. Approved purchase order PO-2026-993"
                      value={recordData.notes}
                      onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setShowRecordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-coral-pill-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Register Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
