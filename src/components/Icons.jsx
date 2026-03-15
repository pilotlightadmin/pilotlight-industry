import React, { useRef, useEffect, useMemo } from 'react';

// Icon wrapper - renders a lucide-react component with inline-flex styling
const Icon = ({ component: Component, size = 24, ...props }) => {
  if (!Component) return null;
  return (
    <i style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...props.style }}>
      <Component size={size} {...props} />
    </i>
  );
};

// Custom Star Icon with proper fill/stroke support
const StarIcon = ({ size = 24, filled = false, color = '#d4a574', emptyColor = 'rgba(255,255,255,0.2)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={filled ? color : 'transparent'}
      stroke={filled ? color : emptyColor}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Custom Flame Icon with gradient outline (Blend B style)
const FlameIcon = ({ size = 24, style = {} }) => {
  const id = useMemo(() => `flameGrad_${Math.random().toString(36).substr(2, 9)}`, []);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="50%" stopColor="#feca57" />
          <stop offset="100%" stopColor="#fff5cc" />
        </linearGradient>
      </defs>
      <path
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      />
    </svg>
  );
};

// Comedy Icon - cheeky winking face on teal rounded square
const ComedyIcon = ({ size = 24, style = {} }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-6c.78 2.34 2.72 4 5 4s4.22-1.66 5-4H7zm1-4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm8 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
    </svg>
  );
};

// TV Upload Icon - upload arrow inside a TV screen
const TvUploadIcon = ({ size = 24, style = {} }) => {
  const id = useMemo(() => `tvGrad_${Math.random().toString(36).substr(2, 9)}`, []);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="50%" stopColor="#feca57" />
          <stop offset="100%" stopColor="#fff5cc" />
        </linearGradient>
      </defs>
      <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke={`url(#${id})`} strokeWidth="2" />
      <path fill="none" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15V9M9 11l3-3 3 3" />
      <line x1="8" y1="21" x2="16" y2="21" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// Drama Icon - frowning face circle
const DramaIcon = ({ size = 24, style = {} }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-5c.78-2.34 2.72-4 5-4s4.22 1.66 5 4H7zm1-5c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm8 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
    </svg>
  );
};

// Animated Flame Icon for loading states - dancing flame effect
const AnimatedFlameIcon = ({ size = 64, style = {} }) => {
  const id = useMemo(() => `flameGradAnim_${Math.random().toString(36).substr(2, 9)}`, []);
  const filterId = useMemo(() => `flameGlow_${Math.random().toString(36).substr(2, 9)}`, []);

  // Different flame path states for dancing/swaying effect
  const flamePaths = [
    "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
    "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.5-2.5.5-4.5 2.5-6 0 2.5 1.5 5 3.5 6.5 2.2 1.8 3.5 3.3 3.5 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
    "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-.8-2-.5-4 1.5-5.5 1 2 2.5 4.5 4.5 6 1.8 1.4 2.5 3.8 2.5 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
    "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.2-2.3 0-4.2 2.2-5.8 .3 2.3 1.8 4.7 3.8 6.3 2 1.6 3.2 3.6 3.2 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff6b6b">
            <animate attributeName="stop-color" values="#ff6b6b;#ff8a80;#ff6b6b" dur="1.5s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#feca57">
            <animate attributeName="stop-color" values="#feca57;#ffe082;#feca57" dur="1.2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#fff5cc">
            <animate attributeName="stop-color" values="#fff5cc;#ffffff;#fff5cc" dur="0.8s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <path
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate
            attributeName="d"
            values={flamePaths.join(';') + ';' + flamePaths[0]}
            dur="0.8s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
          />
        </path>
      </g>
    </svg>
  );
};

// Export both the Icon component and specific icons
export { Icon, StarIcon, FlameIcon, ComedyIcon, TvUploadIcon, DramaIcon, AnimatedFlameIcon };
