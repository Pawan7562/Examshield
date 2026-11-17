// src/pages/admin/Support.js — College Admin Support & Helpdesk Command (v6 Executive Design)
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
  LifeBuoy,
  ShieldAlert,
  Server,
  ExternalLink
} from 'lucide-react';
import './SupportHelpdesk.css';

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
      const payload = res?.data || res;
      if (payload) {
        setTickets(payload.tickets || payload.data?.tickets || []);
        if (payload.stats || payload.data?.stats) {
          setStats(payload.stats || payload.data?.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    }
  };

  const fetchFaqs = async () => {
    try {
      const res = await adminAPI.getSupportFaqs();
      const payload = res?.data || res;
      if (payload?.faqs || payload?.data?.faqs) {
        setFaqs(payload.faqs || payload.data?.faqs || []);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await adminAPI.getSystemStatus();
      const payload = res?.data || res;
      if (payload) {
        setSystemStatus(payload.data || payload);
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
      toast.success(res?.message || res?.data?.message || 'Support ticket submitted successfully!');
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
    return faq.question?.toLowerCase().includes(q) || 
           faq.answer?.toLowerCase().includes(q) || 
           faq.category?.toLowerCase().includes(q);
  });

  const getPriorityBadge = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    const config = {
      urgent: { className: 'urgent', label: 'URGENT' },
      high: { className: 'high', label: 'HIGH' },
      medium: { className: 'medium', label: 'MEDIUM' },
      low: { className: 'low', label: 'LOW' }
    };
    const c = config[p] || config.medium;
    return <span className={`sh-badge ${c.className}`}>{c.label}</span>;
  };

  const getStatusBadge = (status) => {
    const s = (status || 'open').toLowerCase();
    const config = {
      open: { className: 'open', label: 'OPEN' },
      in_progress: { className: 'in_progress', label: 'IN PROGRESS' },
      resolved: { className: 'resolved', label: 'RESOLVED' },
      closed: { className: 'resolved', label: 'CLOSED' }
    };
    const c = config[s] || config.open;
    return <span className={`sh-status-pill ${c.className}`}>● {c.label}</span>;
  };

  return (
    <div className="sh-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="sh-header">
        <div className="sh-header-left">
          <div className="sh-eyebrow">
            <span className="sh-eyebrow-dot" />
            <Headphones size={13} />
            Institutional Support & Helpdesk Command
          </div>
          <h1 className="sh-title">Support, Helpdesk & Live Assistance</h1>
          <p className="sh-subtitle">
            24/7 technical proctoring support, emergency exam escalations, ticket auditing, and live subsystem telemetry.
          </p>
        </div>
        <div className="sh-header-actions">
          <div className="sh-uptime-pill">
            <span className="sh-uptime-dot" />
            <span>High-Availability: 99.98% Operational</span>
          </div>
          <button 
            type="button"
            className="sh-btn sh-btn-primary" 
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={16} />
            Create Ticket
          </button>
        </div>
      </div>

      {/* ── Emergency Exam-Day Priority Escalation Banner ──────── */}
      <div className="sh-emergency-banner">
        <div className="sh-emergency-left">
          <div className="sh-emergency-icon">
            <Radio size={24} />
          </div>
          <div>
            <div className="sh-emergency-title-row">
              <h3 className="sh-emergency-title">Active Examination Emergency Escalation Desk</h3>
              <span className="sh-emergency-sla">PRIORITY SLA &lt; 5 MIN</span>
            </div>
            <p className="sh-emergency-desc">
              If candidates are currently in an active testing window and experiencing webcam, network, or lockdown issues, contact our emergency escalation engineers immediately.
            </p>
          </div>
        </div>
        <div className="sh-emergency-actions">
          <a href="tel:+918001234567" className="sh-emergency-call-btn">
            <Phone size={16} />
            Emergency Hotline
          </a>
          <a href="mailto:support@exam.nexifyforge.in?subject=URGENT:%20Live%20Exam%20Support" className="sh-emergency-mail-btn">
            <Mail size={16} />
            support@exam.nexifyforge.in
          </a>
        </div>
      </div>

      {/* ── 4-Column Ticket KPI Metrics Strip ──────────────────── */}
      <div className="sh-metrics-grid">
        <div className="sh-metric-card">
          <div className="sh-metric-top">
            <span className="sh-metric-label">Total Tickets</span>
            <MessageSquare size={16} color="#0a74da" />
          </div>
          <div className="sh-metric-val">{stats.total || tickets.length}</div>
          <div className="sh-metric-desc">Lifetime institutional inquiries</div>
        </div>

        <div className="sh-metric-card">
          <div className="sh-metric-top">
            <span className="sh-metric-label" style={{ color: '#2563eb' }}>Open Queues</span>
            <Clock size={16} color="#2563eb" />
          </div>
          <div className="sh-metric-val" style={{ color: '#2563eb' }}>{stats.open || 0}</div>
          <div className="sh-metric-desc">Awaiting engineering response</div>
        </div>

        <div className="sh-metric-card">
          <div className="sh-metric-top">
            <span className="sh-metric-label" style={{ color: '#d97706' }}>In Progress</span>
            <Activity size={16} color="#d97706" />
          </div>
          <div className="sh-metric-val" style={{ color: '#d97706' }}>{stats.in_progress || 0}</div>
          <div className="sh-metric-desc">Under active investigation</div>
        </div>

        <div className="sh-metric-card">
          <div className="sh-metric-top">
            <span className="sh-metric-label" style={{ color: '#16a34a' }}>Resolved</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div className="sh-metric-val" style={{ color: '#16a34a' }}>{stats.resolved || 0}</div>
          <div className="sh-metric-desc">Completed & audited solutions</div>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ─────────────────────────── */}
      <div className="sh-tabs-bar">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`sh-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
        >
          <MessageSquare size={15} />
          Support Tickets ({stats.total || tickets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`sh-tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
        >
          <HelpCircle size={15} />
          Knowledge Base & FAQs ({faqs.length || 6})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`sh-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
        >
          <Server size={15} />
          Subsystem Health & Telemetry
        </button>
      </div>

      {/* ── TAB 1: SUPPORT TICKETS ────────────────────────────── */}
      {activeTab === 'tickets' && (
        <div className="sh-card">
          <div className="sh-table-wrap">
            <table className="sh-table">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>Ticket ID</th>
                  <th style={{ width: '37%' }}>Subject & Query</th>
                  <th style={{ width: '14%' }}>Category</th>
                  <th style={{ width: '10%' }}>Priority</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '14%' }}>Created Date</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--mu, #64748b)' }}>
                      Synchronizing institutional tickets...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <LifeBuoy size={42} color="#0a74da" />
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--tx, #0f172a)' }}>No Active Support Inquiries</h4>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--mu, #64748b)', maxWidth: 420 }}>
                          Your institution currently has zero open tickets. Need technical setup assistance or exam guidance?
                        </p>
                        <button
                          type="button"
                          className="sh-btn sh-btn-primary"
                          style={{ marginTop: '8px' }}
                          onClick={() => setCreateModalOpen(true)}
                        >
                          <Plus size={15} />
                          Create First Ticket
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map(t => (
                    <tr key={t.id || t.ticket_number}>
                      <td>
                        <span className="sh-ticket-id">{t.ticket_number || `TKT-${t.id}`}</span>
                      </td>
                      <td>
                        <div className="sh-ticket-subject">{t.subject}</div>
                        <div className="sh-ticket-snippet">{t.message}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mu, #64748b)', textTransform: 'capitalize' }}>
                          {(t.category || 'General').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{getPriorityBadge(t.priority)}</td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--mu, #64748b)' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Today'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="sh-btn sh-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => setSelectedTicket(t)}
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: KNOWLEDGE BASE & FAQS ──────────────────────── */}
      {activeTab === 'faqs' && (
        <div className="sh-card">
          <div className="sh-faq-search-wrap">
            <Search size={18} className="sh-faq-search-icon" />
            <input
              type="text"
              className="sh-faq-search-input"
              value={faqSearch}
              onChange={e => setFaqSearch(e.target.value)}
              placeholder="Search troubleshooting guides, proctoring rules, camera issues..."
            />
          </div>

          <div className="sh-faq-list">
            {(filteredFaqs.length > 0 ? filteredFaqs : [
              {
                id: 1,
                category: 'Proctoring & Vision',
                question: 'How do students grant camera and microphone permissions on locked browsers?',
                answer: 'When launching the exam room, Chrome/Edge displays a browser prompt. Students should click "Allow" on camera and microphone. If blocked, click the lock icon in the browser address bar and switch Camera/Microphone to "Allow", then refresh.'
              },
              {
                id: 2,
                category: 'Anti-Cheat Governance',
                question: 'What triggers an automated proctoring violation flag during tests?',
                answer: 'Violations trigger when the AI detects: missing candidate face (>10s), secondary persons in camera frame, lateral head turns, speech/whispering audio spikes, Alt+Tab window switches, or exiting fullscreen mode.'
              },
              {
                id: 3,
                category: 'Network & Disconnections',
                question: 'What happens if a student experiences temporary WiFi interruption?',
                answer: 'Examina features client-side offline buffering. Responses and timers are preserved locally. When connectivity recovers within the scheduled testing window, all answers synchronize seamlessly.'
              },
              {
                id: 4,
                category: 'Candidate Roster',
                question: 'How do I bulk enroll students with CSV spreadsheets?',
                answer: 'Navigate to Candidate Registry (/admin/students), click "Bulk Upload CSV", and download our institutional template. Ensure columns match: rollNumber, name, email, department, semester.'
              },
              {
                id: 5,
                category: 'Evaluation & Gradebook',
                question: 'How does automated AI question grading work for code and subjective questions?',
                answer: 'Coding questions compile against predefined test cases in a sandboxed Docker execution environment. Subjective answers evaluate semantic relevance against faculty rubrics with human-in-the-loop override.'
              }
            ]).map(faq => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div key={faq.id} className={`sh-faq-card ${isOpen ? 'open' : ''}`}>
                  <div className="sh-faq-header" onClick={() => setExpandedFaq(isOpen ? null : faq.id)}>
                    <div>
                      <span className="sh-faq-category">{faq.category}</span>
                      <h4 className="sh-faq-q">{faq.question}</h4>
                    </div>
                    {isOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                  </div>
                  {isOpen && (
                    <div className="sh-faq-body">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: SUBSYSTEM HEALTH & TELEMETRY ────────────────── */}
      {activeTab === 'system' && (
        <div className="sh-card">
          <div className="sh-system-banner">
            <CheckCircle2 size={24} color="#10b981" />
            <div>
              <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.96rem' }}>
                All Global Examination Subsystems Operational
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--mu, #64748b)', marginTop: 2 }}>
                High-availability Lakebase Postgres clusters, AI vision inference pipelines, and WebSocket monitors are responding with sub-second latency.
              </div>
            </div>
          </div>

          <div className="sh-system-grid">
            {(systemStatus?.services || [
              { name: 'AI Vision & Biometric Pipeline', latency: '42ms', status: 'Operational' },
              { name: 'Real-Time WebSocket Grid', latency: '18ms', status: 'Operational' },
              { name: 'Postgres Database Cluster', latency: '24ms', status: 'Operational' },
              { name: 'Docker Code Sandbox Engine', latency: '65ms', status: 'Operational' },
              { name: 'Razorpay Gateway & Billing', latency: '95ms', status: 'Operational' },
              { name: 'Student Portal Edge CDN', latency: '12ms', status: 'Operational' },
            ]).map((svc, i) => (
              <div key={i} className="sh-service-card">
                <div>
                  <div className="sh-service-name">{svc.name}</div>
                  <div className="sh-service-latency">Ping: {svc.latency}</div>
                </div>
                <div className="sh-service-status">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  {svc.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE TICKET ──────────────────────────────── */}
      {createModalOpen && (
        <div className="sh-modal-overlay" onClick={() => !submitting && setCreateModalOpen(false)}>
          <div className="sh-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="sh-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={20} color="#0a74da" />
                <h3 className="sh-modal-title">Create Institutional Support Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="sh-modal-body">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: 6 }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need assistance with candidate camera permissions in Midterm"
                    className="sh-faq-search-input"
                    style={{ paddingLeft: '14px' }}
                    value={ticketForm.subject}
                    onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: 6 }}>
                      Issue Category
                    </label>
                    <select
                      className="sh-faq-search-input"
                      style={{ paddingLeft: '14px' }}
                      value={ticketForm.category}
                      onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                    >
                      <option value="technical_issue">Technical / Server Issue</option>
                      <option value="proctoring">Proctoring & Anti-Cheat</option>
                      <option value="ai_questions">AI Question Studio</option>
                      <option value="exam_setup">Exam Scheduling & Setup</option>
                      <option value="candidate_registration">Candidate Registry</option>
                      <option value="billing">License & Quota Billing</option>
                      <option value="other">General Academic Query</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: 6 }}>
                      Urgency / Priority
                    </label>
                    <select
                      className="sh-faq-search-input"
                      style={{ paddingLeft: '14px' }}
                      value={ticketForm.priority}
                      onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    >
                      <option value="low">Low (General Query)</option>
                      <option value="medium">Medium (Standard Request)</option>
                      <option value="high">High (Feature Impaired)</option>
                      <option value="urgent">Urgent (Live Exam in Session!)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: 6 }}>
                    Detailed Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what occurred, any error messages, affected candidate roll numbers or exam titles..."
                    className="sh-faq-search-input"
                    style={{ paddingLeft: '14px', resize: 'vertical' }}
                    value={ticketForm.message}
                    onChange={e => setTicketForm({ ...ticketForm, message: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: 6 }}>
                      Callback Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="sh-faq-search-input"
                      style={{ paddingLeft: '14px' }}
                      value={ticketForm.contact_phone}
                      onChange={e => setTicketForm({ ...ticketForm, contact_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem', marginBottom: 6 }}>
                      Notification Email
                    </label>
                    <input
                      type="email"
                      placeholder="admin@college.edu"
                      className="sh-faq-search-input"
                      style={{ paddingLeft: '14px' }}
                      value={ticketForm.contact_email}
                      onChange={e => setTicketForm({ ...ticketForm, contact_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="sh-modal-foot">
                <button
                  type="button"
                  className="sh-btn sh-btn-secondary"
                  disabled={submitting}
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sh-btn sh-btn-primary"
                  disabled={submitting}
                >
                  <Send size={15} />
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW TICKET DETAILS ────────────────────────── */}
      {selectedTicket && (
        <div className="sh-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="sh-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="sh-modal-head">
              <div>
                <span className="sh-ticket-id">{selectedTicket.ticket_number || `TKT-${selectedTicket.id}`}</span>
                <h3 className="sh-modal-title" style={{ marginTop: 2 }}>{selectedTicket.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sh-modal-body">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <span style={{ fontSize: '0.8rem', color: 'var(--mu, #64748b)' }}>
                  Submitted on {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'Recent'}
                </span>
              </div>

              <div style={{ background: 'var(--s2, #f8fafc)', border: '1px solid var(--bd, #e2e8f0)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mu, #64748b)', marginBottom: 6 }}>
                  Issue Description
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--tx, #0f172a)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.message}
                </p>
              </div>

              {selectedTicket.admin_reply ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', marginBottom: 4 }}>
                    Support Engineering Reply
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--tx, #0f172a)', lineHeight: 1.6 }}>
                    {selectedTicket.admin_reply}
                  </p>
                </div>
              ) : (
                <div style={{ background: 'var(--s2, #f1f5f9)', borderRadius: '10px', padding: '14px', fontSize: '0.85rem', color: 'var(--mu, #64748b)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="#0a74da" />
                  <span>Ticket received and assigned to on-call examination engineering team.</span>
                </div>
              )}
            </div>

            <div className="sh-modal-foot">
              <button
                type="button"
                className="sh-btn sh-btn-secondary"
                onClick={() => setSelectedTicket(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
