import React from 'react';
import { PULL_FACTORS } from '../utils/constants';

function TugOfWarChart({ pullFactorsIn, pullFactorsBack, totalVotes }) {
  const maxVotes = Math.max(
    ...Object.values(pullFactorsIn),
    ...Object.values(pullFactorsBack),
    1
  );

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: 'clamp(1rem, 4vw, 2rem)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'center' }}>
        Pull Factor Analysis
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 'clamp(1rem, 3vw, 2rem)', fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', textAlign: 'center' }}>
        What's drawing viewers in vs. holding them back
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1rem, 4vw, 2rem)', marginBottom: 'clamp(1rem, 3vw, 2rem)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'linear-gradient(135deg, #8b4545 0%, #c75050 100%)' }} />
          <span style={{ color: '#c75050', fontWeight: '600', fontSize: 'clamp(0.75rem, 2vw, 0.9rem)' }}>Pulling BACK</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'linear-gradient(135deg, #4ecdc4 0%, #55e6c1 100%)' }} />
          <span style={{ color: '#4ecdc4', fontWeight: '600', fontSize: 'clamp(0.75rem, 2vw, 0.9rem)' }}>Pulling IN</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
        {PULL_FACTORS.map((factor) => {
          const inCount = pullFactorsIn[factor] || 0;
          const backCount = pullFactorsBack[factor] || 0;
          const inPercent = totalVotes > 0 ? (inCount / totalVotes * 100) : 0;
          const backPercent = totalVotes > 0 ? (backCount / totalVotes * 100) : 0;
          const netScore = inCount - backCount;

          return (
            <div key={factor}>
              {/* Factor Label */}
              <div style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: '700', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', color: '#fff' }}>{factor}</span>
              </div>

              {/* Tug of War Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.25rem, 1vw, 0.5rem)' }}>
                {/* Left Side - Pull Back (negative) */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'clamp(0.2rem, 1vw, 0.5rem)' }}>
                  <span style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', color: '#c75050', fontWeight: '600', minWidth: 'clamp(24px, 6vw, 40px)', textAlign: 'right' }}>
                    {backCount > 0 ? `-${backCount}` : ''}
                  </span>
                  <div style={{ flex: 1, maxWidth: '150px', height: 'clamp(18px, 4vw, 24px)', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden',
                    display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: `${Math.min((backCount / maxVotes) * 100, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(270deg, #8b4545 0%, #c75050 100%)',
                      borderRadius: '12px',
                      boxShadow: backCount > 0 ? '0 0 15px rgba(199,80,80,0.5)' : 'none',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>

                {/* Center Divider with Net Score */}
                <div style={{
                  width: 'clamp(36px, 10vw, 50px)',
                  height: 'clamp(28px, 7vw, 36px)',
                  background: netScore > 0 ? 'rgba(78,205,196,0.2)' : netScore < 0 ? 'rgba(199,80,80,0.2)' : 'rgba(255,255,255,0.1)',
                  border: `2px solid ${netScore > 0 ? '#4ecdc4' : netScore < 0 ? '#c75050' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                  color: netScore > 0 ? '#4ecdc4' : netScore < 0 ? '#c75050' : 'rgba(255,255,255,0.5)',
                  flexShrink: 0
                }}>
                  {netScore > 0 ? `+${netScore}` : netScore}
                </div>

                {/* Right Side - Pull In (positive) */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 'clamp(0.2rem, 1vw, 0.5rem)' }}>
                  <div style={{ flex: 1, maxWidth: '150px', height: 'clamp(18px, 4vw, 24px)', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min((inCount / maxVotes) * 100, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #4ecdc4 0%, #55e6c1 100%)',
                      borderRadius: '12px',
                      boxShadow: inCount > 0 ? '0 0 15px rgba(78,205,196,0.5)' : 'none',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', color: '#4ecdc4', fontWeight: '600', minWidth: 'clamp(24px, 6vw, 40px)' }}>
                    {inCount > 0 ? `+${inCount}` : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalVotes === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1.5rem', marginTop: '1rem', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
          No votes yet - share your pilot to get feedback!
        </p>
      )}
    </div>
  );
}

export default TugOfWarChart;
