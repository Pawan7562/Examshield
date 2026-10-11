// src/pages/admin/Support.js — College Admin Support & Helpdesk Center
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Headphones, 
  MessageSquare, 
  HelpCircle, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Send, 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  X,
  Radio,
  LifeBuoy
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

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

export default function Support() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });
  const [faqs, setFaqs] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Ticket creation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'technical_issue',
    priority: 'medium',
    message: '',
    contact_phone: '',
    contact_email: ''
  });

  // Ticket detail view modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      const res = await adminAPI.getSupportTickets();
      if (res.data?.data) {
        setTickets(res.data.data.tickets || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    }
  };

  const fetchFaqs = async () => {
    try {
      const res = await adminAPI.getSupportFaqs();
      if (res.data?.data?.faqs) {
        setFaqs(res.data.data.faqs);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await adminAPI.getSystemStatus();
      if (res.data?.data) {
        setSystemStatus(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching system status:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTickets(), fetchFaqs(), fetchStatus()]).finally(() => setLoading(false));
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      return toast.error('Please enter a subject and message');
    }

    setSubmitting(true);
    try {
      const res = await adminAPI.createSupportTicket(ticketForm);
      toast.success(res.data?.message || 'Support ticket submitted successfully!');
      setCreateModalOpen(false);
      setTicketForm({
        subject: '',
        category: 'technical_issue',
        priority: 'medium',
        message: '',
        contact_phone: '',
        contact_email: ''
      });
      fetchTickets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    if (!faqSearch.trim()) return true;
    const q = faqSearch.toLowerCase();
    return faq.question.toLowerCase().includes(q) || 
           faq.answer.toLowerCase().includes(q) || 
           faq.category.toLowerCase().includes(q);
  });

  const getPriorityBadge = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    const config = {
      urgent: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', label: 'URGENT' },
      high: { color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)', label: 'HIGH' },
      medium: { color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', label: 'MEDIUM' },
      low: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', label: 'LOW' }
    };
    const c = config[p] || config.medium;
    return (
      <span style={{ 
        background: c.bg, 
        color: c.color, 
        border: `1px solid ${c.color}30`, 
        fontWeight: 700, 
        padding: '3px 8px', 
        borderRadius: 6, 
        fontSize: '0.72rem',
        letterSpacing: '0.04em'
      }}>
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || 'open').toLowerCase();
    const config = {
      open: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)', label: 'OPEN' },
      in_progress: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', label: 'IN PROGRESS' },
      resolved: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', label: 'RESOLVED' },
      closed: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', label: 'CLOSED' }
    };
    const c = config[s] || config.open;
    return (
      <span style={{ 
        background: c.bg, 
        color: c.color, 
        border: `1px solid ${c.color}30`, 
        fontWeight: 800, 
        padding: '4px 10px', 
        borderRadius: 6, 
        fontSize: '0.75rem',
        letterSpacing: '0.04em'
      }}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="admin-pages-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10, 116, 218, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a74da' }}>
              <Headphones size={22} />
            </div>
            <h1 className="admin-page-title">Support & Helpdesk Command</h1>
          </div>
          <p className="admin-page-subtitle">
            24/7 institutional exam technical assistance, ticket resolution, and live system monitoring
          </p>
        </div>
        <div className="admin-header-actions">
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            background: 'rgba(34, 197, 94, 0.08)', 
            border: '1px solid rgba(34, 197, 94, 0.25)', 
            padding: '8px 14px', 
            borderRadius: 10,
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#16a34a'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span>Uptime: 99.98% Operational</span>
          </div>
          <Button 
            variant="primary" 
            icon={Plus} 
            onClick={() => setCreateModalOpen(true)}
          >
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Emergency Live Exam Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0b1329 0%, #1e293b 100%)', 
        borderRadius: 16, 
        padding: '20px 26px', 
        color: '#ffffff', 
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 8px 24px rgba(11, 19, 41, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
            <Radio size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Need Urgent Exam-Day Emergency Support?</h4>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>PRIORITY SLA &lt; 5 MIN</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              If students are currently in an active examination window and facing connectivity or proctoring issues, contact our emergency escalation line immediately.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a 
            href="tel:+918001234567" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              background: '#0a74da', 
              color: '#ffffff', 
              padding: '10px 18px', 
              borderRadius: 10, 
              fontSize: '0.88rem', 
              fontWeight: 700, 
              textDecoration: 'none' 
            }}
          >
            <Phone size={16} /> Call Emergency Desk
          </a>
          <a 
            href="mailto:support@nexifyforge.in?subject=URGENT:%20Live%20Exam%20Support" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              background: 'rgba(255, 255, 255, 0.08)', 
              color: '#ffffff', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              padding: '10px 18px', 
              borderRadius: 10, 
              fontSize: '0.88rem', 
              fontWeight: 700, 
              textDecoration: 'none' 
            }}
          >
            <Mail size={16} /> support@nexifyforge.in
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`admin-filter-pill ${activeTab === 'tickets' ? 'active' : ''}`}
          style={{ padding: '8px 18px', fontSize: '0.88rem' }}
        >
          <MessageSquare size={16} style={{ display: 'inline', marginRight: 6 }} /> 
          Support Tickets ({stats.total || tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`admin-filter-pill ${activeTab === 'faqs' ? 'active' : ''}`}
          style={{ padding: '8px 18px', fontSize: '0.88rem' }}
        >
          <HelpCircle size={16} style={{ display: 'inline', marginRight: 6 }} /> 
          Knowledge Base & FAQs
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`admin-filter-pill ${activeTab === 'system' ? 'active' : ''}`}
          style={{ padding: '8px 18px', fontSize: '0.88rem' }}
        >
          <Activity size={16} style={{ display: 'inline', marginRight: 6 }} /> 
          System Health & Status
        </button>
      </div>

      {/* TAB 1: TICKETS */}
      {activeTab === 'tickets' && (
        <>
          {/* Ticket Stats */}
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            <div className="admin-content-card admin-stat-card">
              <div className="admin-stat-value">{stats.total}</div>
              <div className="admin-stat-label">Total Tickets</div>
            </div>
            <div className="admin-content-card admin-stat-card">
              <div className="admin-stat-value" style={{ color: '#2563eb' }}>{stats.open}</div>
              <div className="admin-stat-label">Open</div>
            </div>
            <div className="admin-content-card admin-stat-card">
              <div className="admin-stat-value" style={{ color: '#d97706' }}>{stats.in_progress}</div>
              <div className="admin-stat-label">In Progress</div>
            </div>
            <div className="admin-content-card admin-stat-card">
              <div className="admin-stat-value" style={{ color: '#16a34a' }}>{stats.resolved}</div>
              <div className="admin-stat-label">Resolved</div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="admin-content-card">
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject & Details</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="admin-table-loading">
                        <div className="admin-loading-spinner"></div>
                        Loading tickets...
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="admin-table-empty">
                        <LifeBuoy size={48} />
                        <h3>No support tickets yet</h3>
                        <p>Have an inquiry or experiencing an issue? Click "Create Ticket" to get in touch with our team.</p>
                        <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
                          Create First Ticket
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    tickets.map(t => (
                      <tr key={t.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0a74da' }}>
                            {t.ticket_number}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                            {t.subject}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.message}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
                            {(t.category || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          {getPriorityBadge(t.priority)}
                        </td>
                        <td>
                          {getStatusBadge(t.status)}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedTicket(t)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: FAQS */}
      {activeTab === 'faqs' && (
        <div className="admin-content-card">
          <div style={{ marginBottom: 20 }}>
            <div className="admin-search-input" style={{ width: '100%', maxWidth: 500 }}>
              <Search size={20} />
              <input 
                value={faqSearch}
                onChange={e => setFaqSearch(e.target.value)}
                placeholder="Search troubleshooting guides, proctoring rules, setup..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredFaqs.map(faq => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div 
                  key={faq.id}
                  style={{
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div 
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    style={{
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isExpanded ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0a74da', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {faq.category}
                      </span>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                        {faq.question}
                      </h4>
                    </div>
                    {isExpanded ? <ChevronUp size={20} style={{ color: '#64748b' }} /> : <ChevronDown size={20} style={{ color: '#64748b' }} />}
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '16px 22px', borderTop: '1px solid #f1f5f9', background: '#ffffff', color: '#475569', fontSize: '0.9rem', lineHeight: 1.7 }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM STATUS */}
      {activeTab === 'system' && (
        <div className="admin-content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '16px 20px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: 12, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <CheckCircle2 size={24} style={{ color: '#16a34a' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>All Institutional Subsystems Operational</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#4b5563' }}>Nexify Examina high-availability clusters and AI proctoring vision nodes are responding normally.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {systemStatus?.services?.map((svc, i) => (
              <div 
                key={i} 
                style={{ 
                  background: '#ffffff', 
                  border: '1.5px solid #e2e8f0', 
                  borderRadius: 12, 
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{svc.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Latency: {svc.latency}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: '0.82rem', fontWeight: 700 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                  {svc.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {createModalOpen && (
        <div className="admin-modal-overlay" onClick={() => !submitting && setCreateModalOpen(false)}>
          <div 
            className="admin-modal" 
            style={{ maxWidth: 600, borderRadius: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10, 116, 218, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a74da' }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ fontSize: '1.15rem' }}>Create Support Ticket</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Our technical engineers respond within 15 minutes during active exams</p>
                </div>
              </div>
              <button 
                onClick={() => !submitting && setCreateModalOpen(false)} 
                className="admin-modal-close"
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="admin-modal-content" style={{ padding: '24px 28px' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Subject *
                  </label>
                  <input 
                    type="text" 
                    value={ticketForm.subject}
                    onChange={e => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. Issue with candidate webcam verification in Exam room"
                    required
                    className="admin-form-input"
                    style={{ fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                      Issue Category
                    </label>
                    <select 
                      value={ticketForm.category}
                      onChange={e => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                      className="admin-form-input"
                      style={{ fontWeight: 600 }}
                    >
                      <option value="technical_issue">Technical / Server Issue</option>
                      <option value="proctoring">Proctoring & Anti-Cheat</option>
                      <option value="ai_questions">AI Question Studio</option>
                      <option value="exam_setup">Exam Creation & Settings</option>
                      <option value="candidate_registration">Candidate Registry</option>
                      <option value="billing">License & Billing</option>
                      <option value="other">General Question</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                      Urgency / Priority
                    </label>
                    <select 
                      value={ticketForm.priority}
                      onChange={e => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="admin-form-input"
                      style={{ fontWeight: 600 }}
                    >
                      <option value="low">Low (General Query)</option>
                      <option value="medium">Medium (Standard Issue)</option>
                      <option value="high">High (Feature Impacting)</option>
                      <option value="urgent">Urgent (Live Exam in Progress!)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Detailed Description *
                  </label>
                  <textarea 
                    value={ticketForm.message}
                    onChange={e => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe what happened, error messages, student roll numbers or exam titles affected..."
                    rows={4}
                    required
                    className="admin-form-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                      Direct Callback Phone
                    </label>
                    <input 
                      type="text" 
                      value={ticketForm.contact_phone}
                      onChange={e => setTicketForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+91 9876543210"
                      className="admin-form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                      Notification Email
                    </label>
                    <input 
                      type="email" 
                      value={ticketForm.contact_email}
                      onChange={e => setTicketForm(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="admin@college.edu"
                      className="admin-form-input"
                    />
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: '16px 28px', 
                background: '#f8fafc', 
                borderTop: '1px solid #e2e8f0', 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: 12
              }}>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="md" 
                  disabled={submitting}
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="primary" 
                  size="md" 
                  icon={Send}
                  loading={submitting}
                >
                  Submit Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div 
            className="admin-modal" 
            style={{ maxWidth: 560, borderRadius: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0a74da', fontSize: '0.9rem' }}>
                  {selectedTicket.ticket_number}
                </span>
                <h3 className="admin-modal-title" style={{ fontSize: '1.1rem', marginTop: 2 }}>
                  {selectedTicket.subject}
                </h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="admin-modal-close">
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-content" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Submitted on {new Date(selectedTicket.created_at).toLocaleString()}
                </span>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 18 }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Issue Description
                </h5>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.message}
                </p>
              </div>

              {selectedTicket.admin_reply ? (
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 10, padding: 16 }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: 800 }}>
                    Support Engineering Reply
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.6 }}>
                    {selectedTicket.admin_reply}
                  </p>
                </div>
              ) : (
                <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 14, fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} style={{ color: '#0a74da' }} />
                  <span>Ticket received and assigned to on-call examination engineering team.</span>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
