import React from 'react';
import { FlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';

function TermsPage({ currentUser, onBack, onNavigate }) {
  const h2Style = { fontSize: 'clamp(1.1rem, 3.5vw, 1.25rem)', margin: '1.5rem 0 0.6rem', color: '#4ecdc4' };
  const pStyle = { color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '0.75rem', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' };
  const ulStyle = { color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', margin: '0.75rem 0 0.75rem 1.25rem', fontSize: 'clamp(0.85rem, 3vw, 0.95rem)' };
  const highlightBox = { background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '10px', padding: '1rem', margin: '1rem 0' };
  const warningBox = { background: 'rgba(254,202,87,0.1)', border: '1px solid rgba(254,202,87,0.3)', borderRadius: '10px', padding: '1rem', margin: '1rem 0' };

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
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '0.35rem' }}>Terms of Service</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)' }}>Last updated: February 1, 2026</p>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={highlightBox}>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}><strong>Summary:</strong> Be respectful. Only upload content you have rights to. We provide the platform as-is. By using Pilot Light, you agree to these terms.</p>
        </div>

        <h2 style={{ ...h2Style, marginTop: '1.5rem' }}>1. Acceptance of Terms</h2>
        <p style={pStyle}>By accessing or using Pilot Light ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you don't agree, don't use the Service.</p>
        <p style={pStyle}>We may modify these Terms at any time. Continued use after changes constitutes acceptance. We'll notify you of significant changes.</p>

        <h2 style={h2Style}>2. Eligibility</h2>
        <p style={pStyle}>You must be at least 13 years old to use Pilot Light. By using the Service, you represent that you meet this requirement.</p>
        <p style={pStyle}>If you're using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</p>

        <h2 style={h2Style}>3. Account Registration</h2>
        <p style={pStyle}>To access certain features, you must create an account. You agree to:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>Provide accurate and complete information</li>
          <li style={{ marginBottom: '0.5rem' }}>Keep your login credentials secure</li>
          <li style={{ marginBottom: '0.5rem' }}>Notify us immediately of unauthorized access</li>
          <li style={{ marginBottom: '0.5rem' }}>Be responsible for all activity under your account</li>
        </ul>
        <p style={pStyle}>We reserve the right to suspend or terminate accounts that violate these Terms.</p>

        <h2 style={h2Style}>4. User Content</h2>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Your Content, Your Rights:</strong> You retain ownership of content you upload ("User Content"). By uploading, you grant Pilot Light a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the platform for the purpose of operating the Service.</p>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Creator Responsibilities:</strong> If you upload teaser trailers or other content, you represent that:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>You own or have the necessary rights to the content</li>
          <li style={{ marginBottom: '0.5rem' }}>Your content doesn't infringe any third-party rights (copyright, trademark, privacy, etc.)</li>
          <li style={{ marginBottom: '0.5rem' }}>You have obtained all necessary permissions from individuals appearing in your content</li>
          <li style={{ marginBottom: '0.5rem' }}>Your content complies with all applicable laws</li>
        </ul>
        <div style={warningBox}>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}><strong>Important:</strong> Uploading content you don't have rights to may result in account termination and potential legal liability.</p>
        </div>

        <h2 style={h2Style}>5. Acceptable Use</h2>
        <p style={pStyle}>You agree NOT to:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>Upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
          <li style={{ marginBottom: '0.5rem' }}>Upload content containing explicit sexual material or gratuitous violence</li>
          <li style={{ marginBottom: '0.5rem' }}>Impersonate others or misrepresent your affiliation</li>
          <li style={{ marginBottom: '0.5rem' }}>Manipulate ratings or engage in fraudulent voting</li>
          <li style={{ marginBottom: '0.5rem' }}>Use bots, scripts, or automated tools to access the Service</li>
          <li style={{ marginBottom: '0.5rem' }}>Attempt to gain unauthorized access to any part of the Service</li>
          <li style={{ marginBottom: '0.5rem' }}>Interfere with or disrupt the Service's operation</li>
          <li style={{ marginBottom: '0.5rem' }}>Use the Service for any illegal purpose</li>
        </ul>

        <h2 style={h2Style}>6. Content Moderation</h2>
        <p style={pStyle}>We reserve the right to review, remove, or disable access to any content that violates these Terms or that we find objectionable, at our sole discretion and without notice.</p>
        <p style={pStyle}>We are not obligated to monitor all content but may do so. We are not responsible for User Content posted by users.</p>

        <h2 style={h2Style}>7. Intellectual Property</h2>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Platform IP:</strong> The Pilot Light platform, including its design, features, and branding, is owned by Pilot Light and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our written permission.</p>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Creator Content Protection:</strong></p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>Creators retain full ownership of all submitted content, including teaser trailers, series concepts, scripts, and creative elements.</li>
          <li style={{ marginBottom: '0.5rem' }}>Pilot Light does not claim ownership of creator series concepts or materials.</li>
          <li style={{ marginBottom: '0.5rem' }}>Pilot Light will not develop, produce, sell, or license creator pilot concepts without explicit written permission from the creator.</li>
          <li style={{ marginBottom: '0.5rem' }}>By submitting content, creators grant Pilot Light only a non-exclusive, worldwide license to display submissions for voting, promotion, and platform operation purposes.</li>
        </ul>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Voter Confidentiality Agreement:</strong></p>
        <p style={pStyle}>By creating an account and becoming a member of Pilot Light, you implicitly agree to the following confidentiality terms:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>To keep all viewed content confidential and not share, reproduce, or distribute any pilot videos, concepts, or creative materials.</li>
          <li style={{ marginBottom: '0.5rem' }}>Not to use any ideas, concepts, or creative elements from viewed pilots for your own projects.</li>
          <li style={{ marginBottom: '0.5rem' }}>That all content belongs to the respective creators and is protected by intellectual property rights.</li>
          <li style={{ marginBottom: '0.5rem' }}>To provide honest, constructive feedback solely for the purpose of helping creators improve their work.</li>
          <li style={{ marginBottom: '0.5rem' }}>Not to attempt to identify or contact creators outside of the platform.</li>
        </ul>
        <div style={warningBox}>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}><strong>Enforcement:</strong> Violation of these terms may result in immediate removal from the platform and potential legal action.</p>
        </div>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Disclaimer:</strong> While Pilot Light operates as an invite-only platform and takes reasonable measures to protect creator content, Pilot Light cannot guarantee that third parties will not independently develop similar ideas. Creators acknowledge this inherent risk when sharing creative work on the platform.</p>
        <p style={pStyle}><strong style={{ color: '#fff' }}>Copyright Claims:</strong> Pilot Light respects intellectual property rights. If you believe content infringes your copyright, contact us at <a href="mailto:admin@pilotlighthq.com" style={{ color: '#4ecdc4' }}>admin@pilotlighthq.com</a> with:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>Identification of the copyrighted work</li>
          <li style={{ marginBottom: '0.5rem' }}>Identification of the infringing content</li>
          <li style={{ marginBottom: '0.5rem' }}>Your contact information</li>
          <li style={{ marginBottom: '0.5rem' }}>A statement of good faith belief</li>
          <li style={{ marginBottom: '0.5rem' }}>A statement of accuracy under penalty of perjury</li>
          <li style={{ marginBottom: '0.5rem' }}>Your physical or electronic signature</li>
        </ul>

        <h2 style={h2Style}>8. Privacy</h2>
        <p style={pStyle}>Your use of the Service is also governed by our <span onClick={() => onNavigate('privacy')} style={{ color: '#4ecdc4', cursor: 'pointer' }}>Privacy Policy</span>, which is incorporated into these Terms by reference.</p>

        <h2 style={h2Style}>9. Third-Party Services</h2>
        <p style={pStyle}>The Service may contain links to third-party websites or integrate with third-party services. We are not responsible for their content, policies, or practices.</p>

        <h2 style={h2Style}>10. Disclaimers</h2>
        <p style={pStyle}><strong style={{ color: '#fff' }}>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</strong></p>
        <p style={pStyle}>We do not warrant that:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>The Service will be uninterrupted or error-free</li>
          <li style={{ marginBottom: '0.5rem' }}>Defects will be corrected</li>
          <li style={{ marginBottom: '0.5rem' }}>The Service is free of viruses or harmful components</li>
          <li style={{ marginBottom: '0.5rem' }}>Any content or information obtained through the Service will be accurate</li>
        </ul>

        <h2 style={h2Style}>11. Limitation of Liability</h2>
        <p style={pStyle}><strong style={{ color: '#fff' }}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, PILOT LIGHT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</strong>, including loss of profits, data, or goodwill, arising from your use of the Service.</p>
        <p style={pStyle}>Our total liability for any claims arising from these Terms or your use of the Service shall not exceed the amount you paid us (if any) in the 12 months preceding the claim.</p>

        <h2 style={h2Style}>12. Indemnification</h2>
        <p style={pStyle}>You agree to indemnify and hold Pilot Light harmless from any claims, damages, or expenses (including legal fees) arising from:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}>Your use of the Service</li>
          <li style={{ marginBottom: '0.5rem' }}>Your User Content</li>
          <li style={{ marginBottom: '0.5rem' }}>Your violation of these Terms</li>
          <li style={{ marginBottom: '0.5rem' }}>Your violation of any third-party rights</li>
        </ul>

        <h2 style={h2Style}>13. Termination</h2>
        <p style={pStyle}>You may stop using the Service at any time. You may delete your account through your account settings.</p>
        <p style={pStyle}>We may suspend or terminate your access at any time, with or without cause or notice. Upon termination, your right to use the Service ceases immediately.</p>

        <h2 style={h2Style}>14. Governing Law</h2>
        <p style={pStyle}>These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.</p>
        <p style={pStyle}>Any disputes shall be resolved in the courts located in Los Angeles County, California, and you consent to personal jurisdiction in those courts.</p>

        <h2 style={h2Style}>15. General</h2>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Pilot Light.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Waiver:</strong> Our failure to enforce any right doesn't waive that right.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Assignment:</strong> You may not assign these Terms. We may assign them freely.</li>
        </ul>

        <h2 style={h2Style}>16. Contact</h2>
        <p style={pStyle}>Questions about these Terms? Contact us at:</p>
        <p style={pStyle}>
          <strong style={{ color: '#fff' }}>Email:</strong> <a href="mailto:admin@pilotlighthq.com" style={{ color: '#4ecdc4' }}>admin@pilotlighthq.com</a>
        </p>
      </div>
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default TermsPage;
