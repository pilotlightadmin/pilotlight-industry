import React from 'react';
import { FlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';

function PrivacyPage({ currentUser, onBack, onNavigate }) {
  const h2Style = { fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', margin: '1.5rem 0 0.6rem', color: '#4ecdc4' };
  const pStyle = { color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '0.75rem', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' };
  const ulStyle = { color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', margin: '0.5rem 0 0.75rem 1.25rem', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' };
  const highlightBox = { background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '10px', padding: '1rem', margin: '1rem 0' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

      {/* Page Header */}
      <div style={{ padding: '1.5rem 1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '0.35rem' }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Last updated: February 1, 2026</p>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={highlightBox}>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}><strong>Summary:</strong> We collect only what we need to run Pilot Light. We don't sell your data. We use it to improve your experience and help creators understand their audience (in aggregate, not individually).</p>
        </div>

        <h2 style={{ ...h2Style, marginTop: '1.5rem' }}>1. Information We Collect</h2>
        <p style={pStyle}>We collect information you provide directly and information generated through your use of Pilot Light.</p>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Information you provide:</strong></p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>Account information (name, email, password)</li>
          <li style={{ marginBottom: '0.5rem' }}>Profile information (display name, optional profile photo)</li>
          <li style={{ marginBottom: '0.5rem' }}>Creator application information (project details, background)</li>
          <li style={{ marginBottom: '0.5rem' }}>Content you upload (teaser trailers, thumbnails, descriptions)</li>
          <li style={{ marginBottom: '0.5rem' }}>Votes and ratings you submit</li>
        </ul>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Information collected automatically:</strong></p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>Device and browser information</li>
          <li style={{ marginBottom: '0.5rem' }}>IP address and approximate location</li>
          <li style={{ marginBottom: '0.5rem' }}>Pages visited and features used</li>
          <li style={{ marginBottom: '0.5rem' }}>Viewing activity (what you watch, how long)</li>
        </ul>

        <h2 style={h2Style}>2. How We Use Your Information</h2>
        <p style={pStyle}>We use your information to:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>Provide and improve Pilot Light</li>
          <li style={{ marginBottom: '0.5rem' }}>Process your votes and display aggregate ratings</li>
          <li style={{ marginBottom: '0.5rem' }}>Communicate with you about your account and our services</li>
          <li style={{ marginBottom: '0.5rem' }}>Provide creators with aggregate audience insights (not individual data)</li>
          <li style={{ marginBottom: '0.5rem' }}>Detect and prevent fraud and abuse</li>
          <li style={{ marginBottom: '0.5rem' }}>Comply with legal obligations</li>
        </ul>

        <h2 style={h2Style}>3. Information Sharing</h2>
        <p style={pStyle}><strong style={{ color: '#fff' }}>We do not sell your personal information.</strong></p>
        <p style={pStyle}>We may share information in the following circumstances:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Aggregate data:</strong> Creators see aggregate voting data (e.g., "47 votes, 4.2 average"), not individual voter identities.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Service providers:</strong> We work with third parties who help us operate (hosting, analytics, email). They're bound by confidentiality agreements.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Legal requirements:</strong> We may disclose information if required by law or to protect rights and safety.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Business transfers:</strong> If Pilot Light is acquired or merged, your information may be transferred.</li>
        </ul>

        <h2 style={h2Style}>4. Intellectual Property Protection</h2>
        <p style={pStyle}>Protecting creator intellectual property is fundamental to Pilot Light's mission.</p>
        <p style={pStyle}><strong style={{ color: '#fff' }}>For Creators:</strong></p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>You retain full ownership of all content you submit, including your teaser trailer, series concept, scripts, and creative elements.</li>
          <li style={{ marginBottom: '0.5rem' }}>Pilot Light does not claim ownership of your series concept or materials.</li>
          <li style={{ marginBottom: '0.5rem' }}>Pilot Light will not develop, produce, sell, or license your pilot concept without your explicit written permission.</li>
          <li style={{ marginBottom: '0.5rem' }}>You grant Pilot Light only a non-exclusive, worldwide license to display your submission for the purposes of voting, promotion, and platform operation.</li>
        </ul>
        <p style={pStyle}><strong style={{ color: '#fff' }}>For Voters:</strong></p>
        <p style={pStyle}>By creating an account and becoming a member of Pilot Light, you implicitly agree to the following:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>You agree to keep all viewed content confidential and will not share, reproduce, or distribute any pilot videos, concepts, or creative materials.</li>
          <li style={{ marginBottom: '0.5rem' }}>You will not use any ideas, concepts, or creative elements from the pilots you view for your own projects.</li>
          <li style={{ marginBottom: '0.5rem' }}>All content belongs to the respective creators and is protected by intellectual property rights.</li>
          <li style={{ marginBottom: '0.5rem' }}>Violation of these terms may result in immediate removal from the platform and potential legal action.</li>
        </ul>
        <div style={highlightBox}>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}><strong>Important:</strong> While Pilot Light operates as an invite-only platform and takes reasonable measures to protect creator content, we cannot guarantee that third parties will not independently develop similar ideas. By submitting to Pilot Light, creators acknowledge this inherent risk of sharing creative work. For complete details, see our <span onClick={() => onNavigate('terms')} style={{ color: '#4ecdc4', cursor: 'pointer' }}>Creator Submission Terms & IP Agreement</span>.</p>
        </div>

        <h2 style={h2Style}>5. Your Choices</h2>
        <p style={pStyle}>You have control over your information:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Account settings:</strong> Update your profile and notification preferences anytime.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Email opt-out:</strong> Unsubscribe from marketing emails using the link in any email.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Delete account:</strong> You can delete your account in settings. This removes your profile and voting history.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Data export:</strong> Contact us to request a copy of your data.</li>
        </ul>

        <h2 style={h2Style}>6. Data Retention</h2>
        <p style={pStyle}>We retain your information for as long as your account is active. If you delete your account, we remove your personal information within 30 days, except where we're required to retain it for legal purposes.</p>
        <p style={pStyle}>Aggregate, anonymized data (like total vote counts) may be retained indefinitely.</p>

        <h2 style={h2Style}>7. Security</h2>
        <p style={pStyle}>We implement industry-standard security measures to protect your information, including encryption in transit and at rest. However, no system is 100% secure, and we cannot guarantee absolute security.</p>

        <h2 style={h2Style}>8. Children's Privacy</h2>
        <p style={pStyle}>Pilot Light is not intended for users under 13 years of age. We do not knowingly collect information from children under 13. If we learn we have collected such information, we will delete it promptly.</p>

        <h2 style={h2Style}>9. International Users</h2>
        <p style={pStyle}>Pilot Light is operated from the United States. If you're accessing from outside the US, your information will be transferred to and processed in the US, where privacy laws may differ from your jurisdiction.</p>

        <h2 style={h2Style}>10. Changes to This Policy</h2>
        <p style={pStyle}>We may update this Privacy Policy from time to time. We'll notify you of significant changes by email or through the platform. Your continued use after changes constitutes acceptance.</p>

        <h2 style={h2Style}>11. Contact Us</h2>
        <p style={pStyle}>Questions about this Privacy Policy? Contact us at:</p>
        <p style={pStyle}>
          <strong style={{ color: '#fff' }}>Email:</strong> <a href="mailto:admin@pilotlighthq.com" style={{ color: '#4ecdc4' }}>admin@pilotlighthq.com</a>
        </p>
      </div>
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default PrivacyPage;
