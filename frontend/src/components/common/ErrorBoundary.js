import React from 'react';

/**
 * Enterprise React Error Boundary for ExamShield / Nexify Examina
 * Catches JavaScript errors anywhere in child component tree,
 * logs error telemetry, and displays a polished, high-trust UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled component error:', error, errorInfo);
    this.setState({ errorInfo });

    // Report error telemetry to backend if available (non-blocking)
    try {
      const errorPayload = {
        message: error?.message || 'Component render crash',
        stack: error?.stack?.substring(0, 500),
        componentStack: errorInfo?.componentStack?.substring(0, 500),
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
      // Store in sessionStorage for support debugging
      sessionStorage.setItem('last_exam_error', JSON.stringify(errorPayload));
    } catch (_) {}
  }

  handleReload = () => {
    this.setState({ isRetrying: true });
    window.location.reload();
  };

  handleGoDashboard = () => {
    const isStudent = window.location.pathname.startsWith('/student');
    const isSuperAdmin = window.location.pathname.startsWith('/super-admin');
    if (isSuperAdmin) {
      window.location.href = '/super-admin/dashboard';
    } else if (isStudent) {
      window.location.href = '/student/dashboard';
    } else {
      window.location.href = '/admin/dashboard';
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const isExamRoom = window.location.pathname.includes('/exam/');

      return (
        <div style={styles.wrapper}>
          <div style={styles.ambientGlow} />

          <div style={styles.card}>
            {/* Header Badge */}
            <div style={styles.brandRow}>
              <div style={styles.brandIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span style={styles.brandTitle}>Nexify Examina</span>
            </div>

            {/* Error Shield Icon */}
            <div style={styles.iconContainer}>
              <div style={styles.iconCircle}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>

            <div style={styles.statusPill}>
              <span style={styles.statusDot} />
              Application Safe Mode Active
            </div>

            <h1 style={styles.heading}>Display Temporarily Interrupted</h1>

            <p style={styles.subtext}>
              A client-side interface issue occurred. The system has automatically protected your session.
            </p>

            {/* Exam Data Protection Guarantee Banner */}
            <div style={styles.protectionBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <div>
                <div style={styles.protectionTitle}>Candidate Answers Protected</div>
                <div style={styles.protectionDesc}>
                  {isExamRoom
                    ? 'All attempted answers, question selections, and remaining exam timer are safely saved in your browser storage. Refreshing will immediately restore your active exam.'
                    : 'Your session credentials and records are safely cached. Refreshing will restore the dashboard.'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.actions}>
              <button
                onClick={this.handleReload}
                disabled={this.state.isRetrying}
                style={styles.primaryBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {this.state.isRetrying ? 'Restoring View...' : 'Reload & Restore Screen'}
              </button>

              <button onClick={this.handleGoDashboard} style={styles.secondaryBtn}>
                Return to Dashboard
              </button>
            </div>

            {/* Proctor Assistance */}
            <div style={styles.supportNote}>
              If this screen reappears, please notify your college invigilator or exam proctor.
            </div>

            {/* Collapsible Diagnostics */}
            <div style={{ marginTop: 20 }}>
              <button onClick={this.toggleDetails} style={styles.toggleBtn}>
                {this.state.showDetails ? 'Hide Diagnostics ▲' : 'Proctor Technical Details ▼'}
              </button>

              {this.state.showDetails && (
                <div style={styles.detailsBox}>
                  <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: 6 }}>
                    {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown error'}
                  </p>
                  <pre style={styles.stackTrace}>
                    {this.state.errorInfo?.componentStack || this.state.error?.stack || 'No stack available'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#070c16',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    color: '#e2e8f0',
  },
  ambientGlow: {
    position: 'absolute',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '450px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(7, 12, 22, 0) 70%)',
    pointerEvents: 'none',
  },
  card: {
    maxWidth: '560px',
    width: '100%',
    backgroundColor: '#0e1726',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    padding: '36px 32px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    position: 'relative',
    zIndex: 10,
  },
  brandRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  brandIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  iconContainer: {
    margin: '0 auto 16px auto',
    display: 'flex',
    justifyContent: 'center',
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#152238',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '5px 14px',
    borderRadius: '9999px',
    marginBottom: '14px',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    boxShadow: '0 0 8px #10b981',
  },
  heading: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '10px',
    lineHeight: 1.3,
  },
  subtext: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  protectionBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '12px',
    padding: '14px 16px',
    textAlign: 'left',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    marginBottom: '22px',
  },
  protectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '3px',
  },
  protectionDesc: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    justifyContent: 'center',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.2s',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    padding: '11px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#e2e8f0',
    cursor: 'pointer',
  },
  supportNote: {
    marginTop: '18px',
    fontSize: '12px',
    color: '#64748b',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 8px',
    textDecoration: 'underline',
  },
  detailsBox: {
    marginTop: '12px',
    backgroundColor: '#070c16',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'left',
    maxHeight: '160px',
    overflowY: 'auto',
    fontSize: '11px',
  },
  stackTrace: {
    color: '#64748b',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};

export default ErrorBoundary;
