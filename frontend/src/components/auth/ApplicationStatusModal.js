import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Search,
  RefreshCw,
  Mail,
  X,
  ExternalLink
} from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatIST } from '../../utils/timezone';

export default function ApplicationStatusModal({
  isOpen,
  onClose,
  initialEmail = '',
  initialStatusData = null,
  onProceedLogin
}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState(initialStatusData || null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (initialStatusData) {
      setStatusData(initialStatusData);
    }
  }, [initialEmail, initialStatusData]);

  if (!isOpen) return null;

  const handleCheckStatus = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid institutional email address');
      toast.error('Please enter a valid institutional email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authAPI.checkApplicationStatus({ email: cleanEmail });
      const data = res?.data || res;
      setStatusData(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'No application found for this email';
      setErrorMsg(msg);
      setStatusData(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const status = statusData?.status || 'pending';
  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.iconCircle}>
              <Building2 size={20} color="#10b981" />
            </div>
            <div>
              <h3 style={styles.title}>Track Application Status</h3>
              <p style={styles.subtitle}>Check your college registration and approval progress</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleCheckStatus} style={styles.searchForm}>
          <div style={styles.inputWrap}>
            <Mail size={16} style={styles.inputIcon} />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Enter your registered institutional email"
              style={styles.input}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={styles.checkBtn}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="sa-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search size={14} />
                <span>Track Status</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div style={styles.errorBox}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Status Display */}
        {statusData && (
          <div style={styles.resultsContainer}>
            {/* Institution Badge & Status */}
            <div style={styles.collegeHeaderCard}>
              <div>
                <span style={styles.instLabel}>APPLICANT INSTITUTION</span>
                <h4 style={styles.collegeName}>{statusData.name || 'Your Institution'}</h4>
                <div style={styles.collegeEmail}>{statusData.email}</div>
              </div>

              <div>
                {isPending && (
                  <span style={styles.badgePending}>
                    <Clock size={13} />
                    PENDING APPROVAL
                  </span>
                )}
                {isApproved && (
                  <span style={styles.badgeApproved}>
                    <CheckCircle2 size={13} />
                    APPROVED &amp; ACTIVE
                  </span>
                )}
                {isRejected && (
                  <span style={styles.badgeRejected}>
                    <XCircle size={13} />
                    REGISTRATION DECLINED
                  </span>
                )}
              </div>
            </div>

            {/* Visual 3-Stage Progress Tracker */}
            <div style={styles.stepperBox}>
              <div style={styles.stepperRow}>
                {/* Stage 1: Submitted */}
                <div style={styles.stepItem}>
                  <div style={{ ...styles.stepCircle, ...styles.stepCircleComplete }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div style={styles.stepTitle}>Submitted</div>
                  <div style={styles.stepTime}>
                    {statusData.submittedAt ? formatIST(statusData.submittedAt, 'dateOnly') : 'Completed'}
                  </div>
                </div>

                <div style={{ ...styles.stepLine, ...(isApproved || isRejected ? styles.stepLineActive : {}) }} />

                {/* Stage 2: Super Admin Verification */}
                <div style={styles.stepItem}>
                  <div
                    style={{
                      ...styles.stepCircle,
                      ...(isApproved
                        ? styles.stepCircleComplete
                        : isRejected
                        ? styles.stepCircleRejected
                        : styles.stepCirclePending)
                    }}
                  >
                    {isApproved ? (
                      <CheckCircle2 size={16} />
                    ) : isRejected ? (
                      <XCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </div>
                  <div style={styles.stepTitle}>Admin Review</div>
                  <div style={styles.stepTime}>
                    {isApproved ? 'Verified' : isRejected ? 'Declined' : 'In Progress'}
                  </div>
                </div>

                <div style={{ ...styles.stepLine, ...(isApproved ? styles.stepLineActive : {}) }} />

                {/* Stage 3: Dashboard Access */}
                <div style={styles.stepItem}>
                  <div
                    style={{
                      ...styles.stepCircle,
                      ...(isApproved ? styles.stepCircleComplete : styles.stepCircleLocked)
                    }}
                  >
                    <ShieldCheck size={16} />
                  </div>
                  <div style={styles.stepTitle}>Platform Access</div>
                  <div style={styles.stepTime}>{isApproved ? 'Granted' : 'Locked'}</div>
                </div>
              </div>
            </div>

            {/* Dynamic Status Detail Card */}
            {isPending && (
              <div style={styles.pendingNoticeCard}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Clock size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: '14px', color: '#b45309', fontWeight: 700 }}>
                      Under Review by Super Admin
                    </h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: 1.55 }}>
                      Your registration request was received and is currently being verified. As soon as the Super Admin approves your account, an automated confirmation email will be dispatched to <strong>{statusData.email}</strong>, allowing you to log in immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isApproved && (
              <div style={styles.approvedNoticeCard}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: '14px', color: '#065f46', fontWeight: 700 }}>
                      Registration Officially Approved!
                    </h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#047857', lineHeight: 1.55 }}>
                      Your institution account is fully verified and active. You now have unrestricted access to the College Admin Cockpit, candidate roster management, and AI proctoring suites.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  style={styles.loginNowBtn}
                  onClick={() => {
                    if (onProceedLogin) {
                      onProceedLogin(statusData.email);
                    } else {
                      window.location.href = `/admin/login?email=${encodeURIComponent(statusData.email)}`;
                    }
                  }}
                >
                  <span>Proceed to College Sign In</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {isRejected && (
              <div style={styles.rejectedNoticeCard}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <XCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: '14px', color: '#991b1b', fontWeight: 700 }}>
                      Registration Declined
                    </h5>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#b91c1c', lineHeight: 1.55 }}>
                      {statusData.rejectionReason || 'The administrator was unable to approve this registration application at this time.'}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#7f1d1d' }}>
                      If you believe this is in error, please contact Nexify Forge Platform Governance at{' '}
                      <a href="mailto:support@nexifyforge.in" style={{ color: '#991b1b', fontWeight: 700, textDecoration: 'underline' }}>
                        support@nexifyforge.in
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerNote}>
            Powered by <strong>Nexify Examina &bull; Nexify Forge</strong>
          </div>
          <button style={styles.doneBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 12, 22, 0.78)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modal: {
    maxWidth: '560px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 0.2s ease-out',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fafbfc',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 800,
    color: '#0f172a',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '12.5px',
    color: '#64748b',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchForm: {
    padding: '18px 24px 12px',
    display: 'flex',
    gap: '10px',
  },
  inputWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
  },
  checkBtn: {
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  errorBox: {
    margin: '0 24px 14px',
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: '12.5px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  resultsContainer: {
    padding: '0 24px 18px',
  },
  collegeHeaderCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  instLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#94a3b8',
  },
  collegeName: {
    margin: '2px 0',
    fontSize: '15px',
    fontWeight: 800,
    color: '#0f172a',
  },
  collegeEmail: {
    fontSize: '12px',
    color: '#64748b',
  },
  badgePending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    color: '#d97706',
    padding: '5px 12px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 800,
  },
  badgeApproved: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    color: '#15803d',
    padding: '5px 12px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 800,
  },
  badgeRejected: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    padding: '5px 12px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 800,
  },
  stepperBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px 16px',
    marginBottom: '16px',
  },
  stepperRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '90px',
    textAlign: 'center',
  },
  stepCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px',
  },
  stepCircleComplete: {
    background: '#10b981',
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
  },
  stepCirclePending: {
    background: '#fef3c7',
    color: '#d97706',
    border: '2px solid #f59e0b',
  },
  stepCircleRejected: {
    background: '#fee2e2',
    color: '#ef4444',
    border: '2px solid #ef4444',
  },
  stepCircleLocked: {
    background: '#f1f5f9',
    color: '#94a3b8',
    border: '1px solid #cbd5e1',
  },
  stepTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#0f172a',
  },
  stepTime: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  stepLine: {
    flex: 1,
    height: '2px',
    background: '#e2e8f0',
    margin: '-20px 8px 0',
  },
  stepLineActive: {
    background: '#10b981',
  },
  pendingNoticeCard: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  approvedNoticeCard: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '16px',
  },
  rejectedNoticeCard: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  loginNowBtn: {
    width: '100%',
    background: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '11px 16px',
    fontSize: '13.5px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
  },
  footer: {
    padding: '14px 24px',
    borderTop: '1px solid #f1f5f9',
    background: '#fafbfc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerNote: {
    fontSize: '11.5px',
    color: '#94a3b8',
  },
  doneBtn: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 16px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

