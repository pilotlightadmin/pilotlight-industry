import React from 'react';
import { FlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';

function PrivacyPage({ currentUser, onBack, onNavigate }) {
  const sectionLabel = { fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '2rem 0 0.6rem' };
  const pStyle = { color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '0.75rem', fontSize: '0.88rem', fontWeight: 300 };
  const ulStyle = { color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', margin: '0.5rem 0 0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 300 };
  const highlightBox = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', margin: '1rem 0' };
  const navLinkStyle = { color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 400, transition: 'color 0.2s', letterSpacing: '0.02em' };

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
          <span onClick={() => onNavigate(currentUser ? 'account' : 'landing')} style={navLinkStyle}
            onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
            {currentUser ? currentUser.name : 'Login'}
          </span>
        </nav>
      </header>

      {/* Page Header */}
      <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 400, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', marginBottom: '0.35rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>Last updated: February 1, 2026</p>
      </div>

      <div style={{ flex: 1, padding: '0 1.5rem 2.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={highlightBox}>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.88rem', fontWeight: 300, lineHeight: '1.6' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Summary:</span> We collect only what we need to run Pilot Light. We don't sell your data. We use it to improve your experience and help creators understand their audience (in aggregate, not individually).</p>
        </div>

        <div style={{ ...sectionLabel, marginTop: '1.75rem' }}>1. Information We Collect</div>
        <p style={pStyle}>We collect information you provide directly and information generated through your use of Pilot Light.</p>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Information you provide:</span></p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>Account information (name, email, password)</li>
          <li style={{ marginBottom: '0.4rem' }}>Profile information (display name, optional profile photo)</li>
          <li style={{ marginBottom: '0.4rem' }}>Creator application information (project details, background)</li>
          <li style={{ marginBottom: '0.4rem' }}>Content you upload (teaser trailers, thumbnails, descriptions)</li>
          <li style={{ marginBottom: '0.4rem' }}>Votes and ratings you submit</li>
        </ul>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Information collected automatically:</span></p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>Device and browser information</li>
          <li style={{ marginBottom: '0.4rem' }}>IP address and approximate location</li>
          <li style={{ marginBottom: '0.4rem' }}>Pages visited and features used</li>
          <li style={{ marginBottom: '0.4rem' }}>Viewing activity (what you watch, how long)</li>
        </ul>

        <div style={sectionLabel}>2. How We Use Your Information</div>
        <p style={pStyle}>We use your information to:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>Provide and improve Pilot Light</li>
          <li style={{ marginBottom: '0.4rem' }}>Process your votes and display aggregate ratings</li>
          <li style={{ marginBottom: '0.4rem' }}>Communicate with you about your account and our services</li>
          <li style={{ marginBottom: '0.4rem' }}>Provide creators with aggregate audience insights (not individual data)</li>
          <li style={{ marginBottom: '0.4rem' }}>Detect and prevent fraud and abuse</li>
          <li style={{ marginBottom: '0.4rem' }}>Comply with legal obligations</li>
        </ul>

        <div style={sectionLabel}>3. Information Sharing</div>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>We do not sell your personal information.</span></p>
        <p style={pStyle}>We may share information in the following circumstances:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Aggregate data:</span> Creators see aggregate voting data, not individual voter identities.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Service providers:</span> We work with third parties who help us operate. They're bound by confidentiality agreements.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Legal requirements:</span> We may disclose information if required by law.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Business transfers:</span> If Pilot Light is acquired or merged, your information may be transferred.</li>
        </ul>

        <div style={sectionLabel}>4. Intellectual Property Protection</div>
        <p style={pStyle}>Protecting creator intellectual property is fundamental to Pilot Light's mission.</p>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>For Creators:</span></p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>You retain full ownership of all content you submit.</li>
          <li style={{ marginBottom: '0.4rem' }}>Pilot Light does not claim ownership of your series concept or materials.</li>
          <li style={{ marginBottom: '0.4rem' }}>Pilot Light will not develop, produce, sell, or license your pilot concept without explicit written permission.</li>
          <li style={{ marginBottom: '0.4rem' }}>You grant Pilot Light only a non-exclusive, worldwide license to display your submission for voting, promotion, and platform operation.</li>
        </ul>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>For Voters:</span></p>
        <p style={pStyle}>By creating an account, you implicitly agree to keep all viewed content confidential, not reproduce or distribute any creative materials, and not use ideas from viewed pilots for your own projects. Violation may result in removal and potential legal action.</p>
        <div style={highlightBox}>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.88rem', fontWeight: 300, lineHeight: '1.6' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Important:</span> While Pilot Light takes reasonable measures to protect creator content, we cannot guarantee that third parties will not independently develop similar ideas. For complete details, see our <span onClick={() => onNavigate('terms')} style={{ color: 'rgba(78,205,196,0.6)', cursor: 'pointer' }}>Creator Submission Terms & IP Agreement</span>.</p>
        </div>

        <div style={sectionLabel}>5. Your Choices</div>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Account settings:</span> Update your profile and notification preferences anytime.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Email opt-out:</span> Unsubscribe from marketing emails using the link in any email.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Delete account:</span> Remove your profile and voting history in settings.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Data export:</span> Contact us to request a copy of your data.</li>
        </ul>

        <div style={sectionLabel}>6. Data Retention</div>
        <p style={pStyle}>We retain your information for as long as your account is active. If you delete your account, we remove your personal information within 30 days, except where required for legal purposes. Aggregate, anonymized data may be retained indefinitely.</p>

        <div style={sectionLabel}>7. Security</div>
        <p style={pStyle}>We implement industry-standard security measures including encryption in transit and at rest. However, no system is 100% secure.</p>

        <div style={sectionLabel}>8. Children's Privacy</div>
        <p style={pStyle}>Pilot Light is not intended for users under 13. We do not knowingly collect information from children under 13.</p>

        <div style={sectionLabel}>9. International Users</div>
        <p style={pStyle}>Pilot Light is operated from the United States. If you're accessing from outside the US, your information will be transferred to and processed in the US.</p>

        <div style={sectionLabel}>10. Changes to This Policy</div>
        <p style={pStyle}>We may update this Privacy Policy from time to time. We'll notify you of significant changes by email or through the platform.</p>

        <div style={sectionLabel}>11. Contact Us</div>
        <p style={pStyle}>
          Questions? Reach us at <a href="mailto:admin@pilotlighthq.com" style={{ color: 'rgba(78,205,196,0.6)', textDecoration: 'none' }}>admin@pilotlighthq.com</a>
        </p>
      </div>
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default PrivacyPage;
