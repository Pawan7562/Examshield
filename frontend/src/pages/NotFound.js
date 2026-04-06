import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
      padding: 16,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        padding: 48,
        borderRadius: 16,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        {/* 404 Icon */}
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #ef444 0%, #dc2626 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          404
        </div>

        {/* Error Message */}
        <h1 style={{
          margin: '0 0 16px 0',
          fontSize: 28,
          fontWeight: '700',
          color: '#1e293b',
          lineHeight: 1.2
        }}>
          Page Not Found
        </h1>

        <p style={{
          margin: '0 0 24px 0',
          fontSize: 16,
          color: '#64748b',
          lineHeight: 1.5
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleGoHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.2)';
            }}
          >
            <Home size={16} />
            Go to Homepage
          </button>

          <button
            onClick={() => window.history.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#cbd5e1';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <div style={{
          marginTop: 32,
          padding: 20,
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: 14,
            color: '#374151',
            fontWeight: '500'
          }}>
            <strong>Need help?</strong>
          </p>
          <p style={{
            margin: '0',
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.5
          }}>
            If you believe this is an error, please contact your administrator or try accessing the page from the main navigation menu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
