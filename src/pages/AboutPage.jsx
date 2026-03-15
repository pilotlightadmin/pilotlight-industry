import React from 'react';
import { FlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';

function AboutPage({ currentUser, onBack, onNavigate }) {
  const h2Style = { fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', margin: '1.75rem 0 0.75rem', color: '#4ecdc4' };
  const pStyle = { color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '1rem', fontSize: 'clamp(0.9rem, 3vw, 1rem)' };

  const values = [
    { icon: '🎯', title: 'Honest Feedback', desc: "Creators deserve unfiltered audience reactions, not polite nods from friends and family." },
    { icon: '🔄', title: 'Iteration Wins', desc: "The best shows aren't born perfect—they're refined. We encourage creators to improve and resubmit." },
    { icon: '📊', title: 'Data Over Gut', desc: 'Decisions backed by real audience signals beat hunches every time.' },
    { icon: '🌱', title: 'Early Believers', desc: "Every hit show started somewhere. We help audiences discover tomorrow's favorites today." }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} onClick={onBack}>
          <FlameIcon size={24} />
          <span style={{ fontSize: '1.15rem', fontWeight: '700', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pilot Light</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </span>
          <span onClick={() => onNavigate('browse')} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Browse</span>
          <span onClick={() => onNavigate(currentUser ? 'account' : 'landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            {currentUser ? currentUser.name : 'Login'}
          </span>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '0.75rem', lineHeight: '1.3' }}>The Stage Before the Stage</h1>
        <p style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
          Pilot Light is where TV pilots find their first audience—real people who help creators understand what works before they pitch to networks.
        </p>
      </section>

      {/* Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1.5rem 2.5rem' }}>
        <h2 style={h2Style}>The Problem</h2>
        <p style={pStyle}>
          Creating a TV pilot takes months of work and thousands of dollars. But most creators fly blind—they don't know if their concept resonates until they're in a pitch meeting, and by then it's too late to iterate.
        </p>
        <p style={pStyle}>
          Networks see hundreds of pilots. They're looking for signals: <strong style={{ color: '#fff' }}>Would people actually watch this? Does it have season potential?</strong> Without data, creators are guessing. And guesses don't get greenlit.
        </p>

        <h2 style={h2Style}>Our Solution</h2>
        <p style={pStyle}>
          Pilot Light gives creators something they've never had before: <strong style={{ color: '#fff' }}>real audience validation before the pitch</strong>.
        </p>
        <p style={pStyle}>
          Upload a 60-90 second teaser of your pilot concept. Get it in front of engaged viewers who rate its watch potential and season viability. See what's working and what needs refinement. Iterate. Resubmit. Walk into your next pitch with data that proves your concept has legs.
        </p>

        {/* Quote */}
        <div style={{ background: 'rgba(78, 205, 196, 0.1)', borderLeft: '4px solid #4ecdc4', padding: '1rem 1.25rem', margin: '1.25rem 0', borderRadius: '0 10px 10px 0' }}>
          <p style={{ fontStyle: 'italic', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            "I used to pitch based on instinct. Now I pitch with proof."
          </p>
        </div>

        <h2 style={h2Style}>What We Believe</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
          {values.map((v, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {v.icon} {v.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>{v.desc}</p>
            </div>
          ))}
        </div>

        <h2 style={h2Style}>For Voters</h2>
        <p style={pStyle}>
          You get to be the first audience for content that might become your next favorite show. Watch teaser trailers across Comedy, Drama, Reality TV, and Stand Up, vote on what you'd want to see more of, and shape what gets made. Your opinion matters—literally.
        </p>

        <h2 style={h2Style}>For Creators</h2>
        <p style={pStyle}>
          You get actionable data. Not just "people liked it," but specific signals about watch intent and season potential. You can track how changes to your teaser impact reception. And when you're ready to pitch, you'll have real numbers to back up your vision.
        </p>

        {/* CTA Section */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', marginTop: '1.75rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>Ready to Dive In?</h2>
          <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>Whether you're here to discover or to create, there's a place for you.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('landing')}
              style={{ padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
            >
              Browse Pilots
            </button>
            <button
              onClick={() => onNavigate('creators-landing')}
              style={{ padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', background: 'linear-gradient(135deg, #e17055, #d63031)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              For Creators
            </button>
          </div>
        </div>
      </div>

      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default AboutPage;
