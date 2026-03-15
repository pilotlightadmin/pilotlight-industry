import React, { useState } from 'react';
import { FlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';
import LoginModal from './LoginModal';

function CreatorsLandingPage({ currentUser, onBack, onNavigate, onApply, onLogin }) {
  const [loginModalMode, setLoginModalMode] = useState(null); // null = closed, 'login' or 'signup'
  const [pilotTeaserExpanded, setPilotTeaserExpanded] = useState(null); // null or 'howItWorks' or 'requirements'
  const creatorStatus = currentUser?.creatorStatus || 'none';

  // Clickable Pilot Teaser term with expandable definition
  const PilotTeaserTerm = ({ id }) => (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span
        onClick={(e) => { e.stopPropagation(); setPilotTeaserExpanded(pilotTeaserExpanded === id ? null : id); }}
        style={{ color: '#4ecdc4', cursor: 'pointer', borderBottom: '1px dashed #4ecdc4' }}
      >Pilot Teaser</span>
      {pilotTeaserExpanded === id && (
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '100%', marginTop: '0.5rem',
          background: 'rgba(30,30,50,0.98)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '10px',
          padding: '1rem', width: 'min(320px, 80vw)', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          <h4 style={{ color: '#4ecdc4', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>What is a Pilot Teaser?</h4>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
            It's completely up to you! It could be a video of you pitching the idea, a teaser, a trailer, or an important scene. Whatever you think will best sell your vision to an audience.
          </p>
          <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: '12px', height: '12px', background: 'rgba(30,30,50,0.98)', borderLeft: '1px solid rgba(78,205,196,0.3)',
            borderTop: '1px solid rgba(78,205,196,0.3)' }} />
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
      // Already applied, show status
    } else {
      onApply();
    }
  };

  const renderCTAButton = () => {
    if (creatorStatus === 'approved') {
      return (
        <button onClick={() => onNavigate('creator-portal')} style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: '600', fontSize: '1.1rem', background: 'linear-gradient(135deg, #4ecdc4, #44a08d)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
          Go to Creator Portal →
        </button>
      );
    } else if (creatorStatus === 'pending') {
      return (
        <div style={{ background: 'rgba(254,202,87,0.15)', border: '1px solid rgba(254,202,87,0.3)', borderRadius: '12px', padding: '1.5rem', maxWidth: '400px', margin: '0 auto' }}>
          <p style={{ color: '#feca57', fontWeight: '600', margin: 0 }}>⏳ Your application is under review</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>We'll email you within 48 hours.</p>
        </div>
      );
    } else {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleApplyClick} style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: '600', fontSize: '1.1rem', background: 'linear-gradient(135deg, #e17055, #d63031)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
            Apply for Creator Access
          </button>
          <button onClick={() => setLoginModalMode('login')} style={{ background: 'none', border: 'none', color: '#4ecdc4', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}>
            Already a creator? Log in →
          </button>
        </div>
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} onClick={() => onNavigate('browse')}>
          <FlameIcon size={24} />
          <span style={{ fontSize: '1.15rem', fontWeight: '700', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pilot Light</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span onClick={() => onNavigate('browse')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </span>
          {currentUser ? (
            <span onClick={() => onNavigate('account')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              {currentUser.name}
            </span>
          ) : (
            <>
              <span onClick={() => setLoginModalMode('login')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                Login
              </span>
              <span onClick={() => setLoginModalMode('signup')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4ecdc4', cursor: 'pointer', fontWeight: '600' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#4ecdc4'}>
                Sign Up
              </span>
            </>
          )}
        </nav>
      </header>

      {loginModalMode && <LoginModal onClose={() => setLoginModalMode(null)} onLogin={(user) => { onLogin(user, { creatorMode: true }); setLoginModalMode(null); }} onForgotPassword={() => { setLoginModalMode(null); onNavigate('forgot-password'); }} initialMode={loginModalMode} />}

      <div style={{ flex: 1 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'linear-gradient(135deg, rgba(225,112,85,0.15), rgba(78,205,196,0.15))' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '700', marginBottom: '0.75rem', lineHeight: '1.3' }}>Validate Your Vision</h1>
          <p style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
            Pilot Light connects serious creators with real audiences. Get honest feedback on your pilot concept before investing months in production.
          </p>
          {renderCTAButton()}
        </div>

        {/* Value Props */}
        <div style={{ padding: '2.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', marginBottom: '1.5rem' }}>Why Creators Choose Pilot Light</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: '🎯', title: 'Real Audience Data', desc: "See exactly how viewers rate your concept's watch potential and season viability. No more guessing—know what resonates." },
              { icon: '📊', title: 'Actionable Insights', desc: "Understand what's working and what needs refinement. Make data-driven decisions before you pitch to networks." },
              { icon: '🔄', title: 'Iterate & Improve', desc: 'Resubmit improved teasers and track how your changes impact audience reception. Refine until it\'s undeniable.' },
              { icon: '🔒', title: 'Your Ideas Protected', desc: 'Pilot Light is invite-only — only vetted, hand-picked community members can access your content. Your creative work stays protected.' }
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', fontSize: '0.95rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div style={{ padding: '2.5rem 1.5rem', background: 'rgba(0,0,0,0.2)' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', marginBottom: '1.5rem' }}>How It Works</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto', flexWrap: 'wrap' }}>
            {[
              { num: '1', title: 'Apply', desc: 'Tell us about yourself and your project. We review applications within 48 hours.' },
              { num: '2', title: 'Upload', desc: null },
              { num: '3', title: 'Learn', desc: 'Watch the votes come in. See detailed breakdowns of watch potential and season viability.' },
              { num: '4', title: 'Improve', desc: 'Use the feedback to refine your teaser. Resubmit and track your improvement.' }
            ].map((step, i) => (
              <div key={i} style={{ flex: '1 1 140px', textAlign: 'center', minWidth: '140px' }}>
                <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #4ecdc4, #44a08d)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', margin: '0 auto 0.75rem' }}>{step.num}</div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>{step.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {step.desc ? step.desc : <>Once approved, upload your 60-90 second <PilotTeaserTerm id="howItWorks" /> with a compelling description and thumbnail.</>}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div style={{ padding: '2.5rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', marginBottom: '0.75rem' }}>What We're Looking For</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>Pilot Light is for serious creators ready to put their work in front of real audiences.</p>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { text: null, hasTerm: true },
                { text: 'A project in the Comedy or Drama genre (more genres coming soon)', hasTerm: false },
                { text: 'Serious intent to develop the project further', hasTerm: false },
                { text: 'Openness to honest, unfiltered audience feedback', hasTerm: false },
                { text: 'Original content that you have the rights to share', hasTerm: false }
              ].map((item, i) => (
                <li key={i} style={{ padding: '0.6rem 0', paddingLeft: '1.75rem', position: 'relative', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize: '0.95rem' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#4ecdc4', fontWeight: 'bold' }}>✓</span>
                  {item.hasTerm ? <>A 60-90 second <PilotTeaserTerm id="requirements" /> that captures your pilot concept</> : item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ padding: '2.5rem 1.5rem', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', marginBottom: '1.25rem' }}>Frequently Asked Questions</h2>
            {[
              { q: 'Is there a cost to submit?', a: 'No. Pilot Light is free for creators during our early access period. We want to build the best platform for validating creative work.' },
              { q: 'What is a Pilot Teaser?', a: "It's completely up to you! It could be a video of you pitching the idea, a teaser, a trailer, or an important scene. Whatever you think will best sell your vision to an audience." },
              { q: 'What kind of content can I submit?', a: "We're currently accepting 60-90 second pilot teasers for Comedy and Drama. Thriller, sci-fi, documentary, and more genres are coming soon." },
              { q: 'How long until I get feedback?', a: 'Most pilots start receiving votes within the first 24-48 hours. The more engagement your pilot gets, the richer your feedback data becomes.' },
              { q: 'Can I resubmit an improved version?', a: 'Absolutely. We encourage iteration. Resubmit your improved teaser and track how the changes impact audience reception.' },
              { q: 'Can I link my crowdfunding page?', a: "Yes! During upload, you can optionally add a link to your GoFundMe, Kickstarter, Indiegogo, or any crowdfunding page. If you add one, voters will see a \"Fund This Pilot\" button on your pilot's page. If you don't add one, nothing extra shows up." },
              { q: 'Who sees my pilot?', a: "Your pilot is shown to our invite-only community of registered voters—real people who've been hand-picked to discover and evaluate new content. Only invited members can access the platform." }
            ].map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1.25rem', marginBottom: '0.75rem' }}>
                <h4 style={{ color: '#4ecdc4', marginBottom: '0.35rem', fontSize: '1rem' }}>{faq.q}</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', margin: 0, fontSize: '0.9rem' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', marginBottom: '0.75rem' }}>Ready to Validate Your Vision?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>Join creators who are using real audience data to refine their work.</p>
          {renderCTAButton()}
        </div>
      </div>
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default CreatorsLandingPage;
