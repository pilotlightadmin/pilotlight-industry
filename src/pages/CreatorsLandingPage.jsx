import React, { useState } from 'react';
import { FlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';
import LoginModal from './LoginModal';

function CreatorsLandingPage({ currentUser, onBack, onNavigate, onApply, onLogin }) {
  const [loginModalMode, setLoginModalMode] = useState(null);
  const [pilotTeaserExpanded, setPilotTeaserExpanded] = useState(null);
  const creatorStatus = currentUser?.creatorStatus || 'none';
  const navLinkStyle = { color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 400, transition: 'color 0.2s', letterSpacing: '0.02em' };

  const PilotTeaserTerm = ({ id }) => (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span
        onClick={(e) => { e.stopPropagation(); setPilotTeaserExpanded(pilotTeaserExpanded === id ? null : id); }}
        style={{ color: 'rgba(78,205,196,0.6)', cursor: 'pointer', borderBottom: '1px dashed rgba(78,205,196,0.4)' }}
      >Pilot Teaser</span>
      {pilotTeaserExpanded === id && (
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '100%', marginTop: '0.5rem',
          background: 'rgba(18,18,18,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
          padding: '1.25rem', width: 'min(320px, 80vw)', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(24px)'
        }}>
          <h4 style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 0.5rem', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}>What is a Pilot Teaser?</h4>
          <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: '0.82rem', lineHeight: '1.6', fontWeight: 300, fontFamily: "'Outfit', sans-serif" }}>
            It's completely up to you! It could be a video of you pitching the idea, a teaser, a trailer, or an important scene. Whatever you think will best sell your vision to an audience.
          </p>
          <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: '12px', height: '12px', background: 'rgba(18,18,18,0.98)', borderLeft: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
      )}
    </span>
  );

  const handleApplyClick = () => {
    if (!currentUser) {
      setLoginModalMode('signup');
    } else if (creatorStatus === 'approved') {
      onNavigate('creator-portal');
    } else if (creatorStatus === 'pending') {
      // Already applied
    } else {
      onApply();
    }
  };

  const renderCTAButton = () => {
    if (creatorStatus === 'approved') {
      return (
        <button onClick={() => onNavigate('creator-portal')}
          style={{ padding: '0.7rem 1.75rem', borderRadius: '10px', fontWeight: 500, fontSize: '0.85rem',
            background: 'none', color: 'rgba(78,205,196,0.6)', border: '1px solid rgba(78,205,196,0.2)',
            cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.02em', fontFamily: "'Outfit', sans-serif" }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.9)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(78,205,196,0.6)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.2)'; }}>
          Go to Creator Portal
        </button>
      );
    } else if (creatorStatus === 'pending') {
      return (
        <div style={{ background: 'rgba(254,202,87,0.04)', border: '1px solid rgba(254,202,87,0.12)', borderRadius: '16px', padding: '1.25rem', maxWidth: '400px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(254,202,87,0.7)', fontWeight: 500, margin: 0, fontSize: '0.88rem', fontFamily: "'Outfit', sans-serif" }}>Your application is under review</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: '0.4rem 0 0', fontWeight: 300, fontFamily: "'Outfit', sans-serif" }}>We'll email you within 48 hours.</p>
        </div>
      );
    } else {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={handleApplyClick}
            style={{ padding: '0.7rem 1.75rem', borderRadius: '10px', fontWeight: 500, fontSize: '0.85rem',
              background: 'none', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', transition: 'all 0.25s ease', letterSpacing: '0.02em', fontFamily: "'Outfit', sans-serif" }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
            Apply for Creator Access
          </button>
          <span onClick={() => setLoginModalMode('login')}
            style={{ color: 'rgba(78,205,196,0.5)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 400, transition: 'color 0.2s', fontFamily: "'Outfit', sans-serif" }}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(78,205,196,0.8)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(78,205,196,0.5)'}>
            Already a creator? Log in
          </span>
        </div>
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');` }} />

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
          {currentUser ? (
            <span onClick={() => onNavigate('account')} style={navLinkStyle}
              onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
              {currentUser.name}
            </span>
          ) : (
            <>
              <span onClick={() => setLoginModalMode('login')} style={navLinkStyle}
                onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>Login</span>
              <span onClick={() => setLoginModalMode('signup')}
                style={{ ...navLinkStyle, color: 'rgba(78,205,196,0.5)' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'rgba(78,205,196,0.8)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(78,205,196,0.5)'}>Sign Up</span>
            </>
          )}
        </nav>
      </header>

      {loginModalMode && <LoginModal onClose={() => setLoginModalMode(null)} onLogin={(user) => { onLogin(user, { creatorMode: true }); setLoginModalMode(null); }} onForgotPassword={() => { setLoginModalMode(null); onNavigate('forgot-password'); }} initialMode={loginModalMode} />}

      <div style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '3rem 1.5rem 2.5rem', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 400, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>For Creators</div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', fontWeight: 600, marginBottom: '0.75rem', lineHeight: '1.3', color: 'rgba(255,255,255,0.9)' }}>Validate Your Vision</h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto 1.75rem', lineHeight: '1.7', fontWeight: 300 }}>
            Pilot Light connects serious creators with real audiences. Get honest feedback on your pilot concept before investing months in production.
          </p>
          {renderCTAButton()}
        </section>

        {/* Value Props */}
        <div style={{ padding: '2.5rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '1.25rem' }}>Why Creators Choose Pilot Light</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { icon: '🎯', title: 'Real Audience Data', desc: "See exactly how viewers rate your concept's watch potential and season viability. No more guessing—know what resonates." },
              { icon: '📊', title: 'Actionable Insights', desc: "Understand what's working and what needs refinement. Make data-driven decisions before you pitch to networks." },
              { icon: '🔄', title: 'Iterate & Improve', desc: "Resubmit improved teasers and track how your changes impact audience reception. Refine until it's undeniable." },
              { icon: '🔒', title: 'Your Ideas Protected', desc: 'Pilot Light is invite-only — only vetted, hand-picked community members can access your content.' }
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '0.88rem', marginBottom: '0.4rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', fontSize: '0.82rem', margin: 0, fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div style={{ padding: '2.5rem 1.5rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '1.25rem' }}>How It Works</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { num: '1', title: 'Apply', desc: 'Tell us about yourself and your project. We review applications within 48 hours.' },
                { num: '2', title: 'Upload', desc: null },
                { num: '3', title: 'Learn', desc: 'Watch the votes come in. See detailed breakdowns of watch potential and season viability.' },
                { num: '4', title: 'Improve', desc: 'Use the feedback to refine your teaser. Resubmit and track your improvement.' }
              ].map((step, i) => (
                <div key={i} style={{ flex: '1 1 140px', textAlign: 'center', minWidth: '140px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: '0.88rem', margin: '0 auto 0.6rem', color: 'rgba(255,255,255,0.5)' }}>{step.num}</div>
                  <h4 style={{ fontSize: '0.88rem', marginBottom: '0.35rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{step.title}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', lineHeight: '1.6', fontWeight: 300 }}>
                    {step.desc ? step.desc : <>Once approved, upload your 60-90 second <PilotTeaserTerm id="howItWorks" /> with a compelling description and thumbnail.</>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div style={{ padding: '2.5rem 1.5rem', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.6rem' }}>What We're Looking For</div>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 300 }}>Pilot Light is for serious creators ready to put their work in front of real audiences.</p>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { text: null, hasTerm: true },
                { text: 'A project in the Comedy or Drama genre (more genres coming soon)', hasTerm: false },
                { text: 'Serious intent to develop the project further', hasTerm: false },
                { text: 'Openness to honest, unfiltered audience feedback', hasTerm: false },
                { text: 'Original content that you have the rights to share', hasTerm: false }
              ].map((item, i) => (
                <li key={i} style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
                  <span style={{ position: 'absolute', left: 0, color: 'rgba(78,205,196,0.5)', fontWeight: 500 }}>✓</span>
                  {item.hasTerm ? <>A 60-90 second <PilotTeaserTerm id="requirements" /> that captures your pilot concept</> : item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ padding: '2.5rem 1.5rem' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '1.25rem' }}>Frequently Asked Questions</div>
            {[
              { q: 'Is there a cost to submit?', a: 'No. Pilot Light is free for creators during our early access period. We want to build the best platform for validating creative work.' },
              { q: 'What is a Pilot Teaser?', a: "It's completely up to you! It could be a video of you pitching the idea, a teaser, a trailer, or an important scene. Whatever you think will best sell your vision to an audience." },
              { q: 'What kind of content can I submit?', a: "We're currently accepting 60-90 second pilot teasers for Comedy and Drama. Thriller, sci-fi, documentary, and more genres are coming soon." },
              { q: 'How long until I get feedback?', a: 'Most pilots start receiving votes within the first 24-48 hours. The more engagement your pilot gets, the richer your feedback data becomes.' },
              { q: 'Can I resubmit an improved version?', a: 'Absolutely. We encourage iteration. Resubmit your improved teaser and track how the changes impact audience reception.' },
              { q: 'Can I link my crowdfunding page?', a: "Yes! During upload, you can optionally add a link to your GoFundMe, Kickstarter, Indiegogo, or any crowdfunding page. If you add one, voters will see a \"Fund This Pilot\" button on your pilot's page." },
              { q: 'Who sees my pilot?', a: "Your pilot is shown to our invite-only community of registered voters—real people who've been hand-picked to discover and evaluate new content." }
            ].map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', marginBottom: '0.75rem' }}>
                <h4 style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.35rem', fontSize: '0.88rem', fontWeight: 500 }}>{faq.q}</h4>
                <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', margin: 0, fontSize: '0.82rem', fontWeight: 300 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 400, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Get Started</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 300 }}>Join creators who are using real audience data to refine their work.</p>
            {renderCTAButton()}
          </div>
        </div>
      </div>
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default CreatorsLandingPage;
