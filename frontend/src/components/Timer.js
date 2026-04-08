import React, { useState, useEffect, useRef } from 'react';

const Timer = ({ seconds, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);

  // Keep callback ref fresh
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Reset when seconds prop changes
  useEffect(() => {
    setTimeLeft(seconds);
    firedRef.current = false;
  }, [seconds]);

  // Single stable interval
  useEffect(() => {
    if (seconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!firedRef.current) {
            firedRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]); // Only re-run if initial seconds changes

  const formatTime = (total) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isUrgent = timeLeft <= 300;
  const isWarning = timeLeft <= 600 && timeLeft > 300;
  const color = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      background: isUrgent ? 'rgba(239,68,68,0.1)' : isWarning ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.08)',
      border: `1px solid ${color}30`,
      borderRadius: 20,
      transition: 'all 0.5s ease',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span style={{
        fontSize: 16,
        fontWeight: 800,
        color,
        fontFamily: "'Inter', monospace",
        letterSpacing: '0.5px',
        textShadow: isUrgent ? `0 0 12px ${color}60` : 'none',
        animation: isUrgent ? 'pulse-dot 1s infinite' : 'none',
      }}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default Timer;
