import React from 'react';
import { FlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';

function AboutPage({ currentUser, onBack, onNavigate }) {
  const h2Style = { fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '2rem 0 0.75rem' };
  const pStyle = { color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 300 };

  const values = [
    { icon: '🎯', title: 'Honest Feedback', desc: "Creators deserve unfiltered audience reactions, not polite nods from friends and family." },
    { icon: '🔄', title: 'Iteration Wins', desc: "The best shows aren't born perfect—they're refined. We encourage creators to improve and resubmit." },
    { icon: '📊', title: 'Data Over Gut', desc: 'Decisions backed by real audience signals beat hunches every time.' },
    { icon: '🌱', title: 'Early Believers', desc: "Every hit show started somewhere. We help audiences discover tomorrow's favorites today." }
  ];

  const navLinkStyle = { color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 400, transition: 'color 0.2s', letterSpacing: '0.02em' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');` }} />

      {/* Header */}
      <header style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span onClick={onBack} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} onClick={onBack}>
            <FlameIcon size={24} />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #4ecdc4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pilot Light</span>
          </div>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span onClick={() => onNavigate('landing')} style={navLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>Home</span>
          <span onClick={() => onNavigate('browse')} style={navLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>Browse</span>
          <span onClick={() => onNavigate(currentUser ? 'account' : 'landing')} style={navLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
            {currentUser ? currentUser.name : 'Login'}
          </span>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '2.5rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 400, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>About</div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', marginBottom: '0.75rem', lineHeight: '1.3', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>The Stage Before the Stage</h1>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', maxWidth: '560px', margin: '0 auto' }}>
          Pilot Light is where TV pilots find their first audience—real people who help creators understand what works before they pitch to networks.
        </p>
      </section>

      {/* Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1.5rem 2.5rem' }}>
        <div style={h2Style}>The Problem</div>
        <p style={pStyle}>
          Creating a TV pilot takes months of work and thousands of dollars. But most creators fly blind—they don't know if their concept resonates until they're in a pitch meeting, and by then it's too late to iterate.
        </p>
        <p style={pStyle}>
          Networks see hundreds of pilots. They're looking for signals: would people actually watch this? Does it have season potential? Without data, creators are guessing. And guesses don't get greenlit.
        </p>

        <div style={h2Style}>Our Solution</div>
        <p style={pStyle}>
          Pilot Light gives creators something they've never had before: real audience validation before the pitch.
        </p>
        <p style={pStyle}>
          Upload a 60-90 second teaser of your pilot concept. Get it in front of engaged viewers who rate its potential. See what's working and what needs refinement. Iterate. Resubmit. Walk into your next pitch with data that proves your concept has legs.
        </p>

        {/* Quote */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid rgba(78,205,196,0.3)', padding: '1.25rem 1.5rem', margin: '1.5rem 0', borderRadius: '0 12px 12px 0' }}>
          <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 300 }}>
            "I used to pitch based on instinct. Now I pitch with proof."
          </p>
        </div>

        <div style={h2Style}>What We Believe</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
          {values.map((v, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.88rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                {v.icon} {v.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: 0, lineHeight: '1.5', fontWeight: 300 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        <div style={h2Style}>For Voters</div>
        <p style={pStyle}>
          You get to be the first audience for content that might become your next favorite show. Watch teaser trailers across Comedy, Drama, Reality TV, and Stand Up, vote on what you'd want to see more of, and shape what gets made. Your opinion matters—literally.
        </p>

        <div style={h2Style}>For Creators</div>
        <p style={pStyle}>
          You get actionable data. Not just "people liked it," but specific signals about watch intent and season potential. You can track how changes to your teaser impact reception. And when you're ready to pitch, you'll have real numbers to back up your vision.
        </p>

        {/* CTA Section */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 400, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Get Started</div>
          <p style={{ marginBottom: '1.25rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>Whether you're here to discover or to create, there's a place for you.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('landing')}
              style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 500, fontSize: '0.85rem',
                background: 'none', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.02em' }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
              Browse Pilots
            </button>
            <button onClick={() => onNavigate('creators-landing')}
              style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 500, fontSize: '0.85rem',
                background: 'none', color: 'rgba(78,205,196,0.6)', border: '1px solid rgba(78,205,196,0.2)',
                cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.02em' }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.9)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.6)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.2)'; }}>
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
