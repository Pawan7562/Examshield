import React from 'react';

const ExamShieldLogo = ({ size = 32, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffd75c" />
          <stop offset="1" stopColor="#f6ae00" />
        </linearGradient>
        <linearGradient id="esGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffeaba" />
        </linearGradient>
        <filter id="shadow" x="-10" y="-10" width="120" height="120" filterUnits="userSpaceOnUse">
           <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.25" floodColor="#e69b00" />
        </filter>
        <filter id="glow" x="-20" y="-20" width="140" height="140" filterUnits="userSpaceOnUse">
           <feGaussianBlur stdDeviation="3" result="blur" />
           <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      
      {/* Outer Glow Shield Base */}
      <path 
        d="M50 6 L90 20 V50 C90 75 50 90 50 90 C50 90 10 75 10 50 V20 L50 6 Z" 
        fill="url(#shieldGrad)"
        filter="url(#shadow)"
      />
      
      {/* Inner geometric accent */}
      <path 
        d="M50 14 L80 25 V48 C80 68 50 82 50 82 C50 82 20 68 20 48 V25 L50 14 Z" 
        fill="none" 
        stroke="rgba(255,255,255,0.45)" 
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Styled text letters 'E' & 'S' */}
      <g fill="url(#esGrad)" filter="url(#glow)">
        {/* Precision geometric 'E' */}
        <path d="M 30 33 L 48 33 L 48 40 L 38 40 L 38 45 L 46 45 L 46 51 L 38 51 L 38 58 L 48 58 L 48 65 L 30 65 Z" />
        
        {/* Precision geometric 'S' */}
        <path d="M 69 33 L 51 33 L 51 49 L 61 49 C 64 49 64 53 61 53 L 51 53 L 51 65 L 69 65 L 69 49 L 59 49 C 56 49 56 45 59 45 L 69 45 Z" />
      </g>
    </svg>
  );
};

export default ExamShieldLogo;
