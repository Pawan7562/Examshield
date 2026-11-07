import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.ambientGlow} />

      <div style={styles.card}>
        <div style={styles.brandRow}>
          <div style={styles.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span style={styles.brandTitle}>Nexify Examina</span>
        </div>

        <div style={styles.errorCode}>404</div>
        <div style={styles.statusPill}>Page Not Found</div>

        <h1 style={styles.heading}>Destination Unreachable</h1>
        <p style={styles.subtext}>
          The examination resource, assessment room, or dashboard page you requested does not exist or has been relocated.
        </p>

        <div style={styles.quickLinksGrid}>
          <Link to="/login" style={styles.quickLink}>
            <span>Candidate Login</span>
            <span style={{ color: '#10b981' }}>&rarr;</span>
          </Link>
          <Link to="/student/dashboard" style={styles.quickLink}>
            <span>Student Dashboard</span>
            <span style={{ color: '#10b981' }}>&rarr;</span>
          </Link>
          <Link to="/admin/login" style={styles.quickLink}>
            <span>College Admin</span>
            <span style={{ color: '#10b981' }}>&rarr;</span>
          </Link>
          <Link to="/" style={styles.quickLink}>
            <span>Platform Home</span>
            <span style={{ color: '#10b981' }}>&rarr;</span>
          </Link>
        </div>

        <Link to="/" style={styles.primaryBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Return to Main Portal
        </Link>
      </div>
    </div>
  );
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
    top: '-120px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '500px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(7, 12, 22, 0) 70%)',
    pointerEvents: 'none',
  },
  card: {
    maxWidth: '540px',
    width: '100%',
    backgroundColor: '#0e1726',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '44px 36px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    position: 'relative',
    zIndex: 10,
  },
  brandRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
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
  errorCode: {
    fontSize: '76px',
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    marginBottom: '8px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '4px 12px',
    borderRadius: '9999px',
    marginBottom: '14px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '10px',
  },
  subtext: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  quickLinksGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '22px',
  },
  quickLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '12px 14px',
    textDecoration: 'none',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.2s',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
    border: 'none',
    cursor: 'pointer',
  },
};

