import React, { useState, useEffect, useRef } from 'react';

const Timer = ({ seconds, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);
  const endTimeRef = useRef(Date.now() + seconds * 1000);

  // Keep callback ref fresh
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Synchronize target end timestamp when seconds prop changes
  useEffect(() => {
    setTimeLeft(seconds);
    endTimeRef.current = Date.now() + seconds * 1000;
    firedRef.current = false;
  }, [seconds]);

  // True wall-clock interval with background tab throttle resistance
  useEffect(() => {
    if (seconds <= 0) return;

    const checkTime = () => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          onExpireRef.current?.();
        }
      }
    };

    const interval = setInterval(checkTime, 1000);

    // Sync immediately when tab regains focus or visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTime();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [seconds]);

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
