import React, { useState, useEffect } from 'react';

const Timer = ({ seconds, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 300) return '#ef4444'; // Red for last 5 minutes
    if (timeLeft <= 600) return '#f59e0b'; // Yellow for last 10 minutes
    return '#22c55e'; // Green for normal time
  };

  return (
    <div style={{ 
      fontSize: 24, 
      fontWeight: '700', 
      color: getTimeColor(),
      fontFamily: 'Sora, sans-serif',
      textShadow: timeLeft <= 300 ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
      animation: timeLeft <= 300 ? 'pulse 1s infinite' : 'none'
    }}>
      {formatTime(timeLeft)}
    </div>
  );
};

export default Timer;
