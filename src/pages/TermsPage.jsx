import React from 'react';
import { FlameIcon } from '../components/Icons';
import PageFooter from '../components/PageFooter';

function TermsPage({ currentUser, onBack, onNavigate }) {
  const sectionLabel = { fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '2rem 0 0.6rem' };
  const pStyle = { color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '0.75rem', fontSize: '0.88rem', fontWeight: 300 };
  const ulStyle = { color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', margin: '0.5rem 0 0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 300 };
  const highlightBox = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', margin: '1rem 0' };
  const warningBox = { background: 'rgba(254,202,87,0.04)', border: '1px solid rgba(254,202,87,0.12)', borderRadius: '16px', padding: '1.25rem', margin: '1rem 0' };
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
        <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', marginBottom: '0.35rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Terms of Service</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>Last updated: February 1, 2026</p>
      </div>

      <div style={{ flex: 1, padding: '0 1.5rem 2.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={highlightBox}>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.88rem', fontWeight: 300, lineHeight: '1.6' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Summary:</span> Be respectful. Only upload content you have rights to. We provide the platform as-is. By using Pilot Light, you agree to these terms.</p>
        </div>

        <div style={{ ...sectionLabel, marginTop: '1.75rem' }}>1. Acceptance of Terms</div>
        <p style={pStyle}>By accessing or using Pilot Light ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you don't agree, don't use the Service.</p>
        <p style={pStyle}>We may modify these Terms at any time. Continued use after changes constitutes acceptance. We'll notify you of significant changes.</p>

        <div style={sectionLabel}>2. Eligibility</div>
        <p style={pStyle}>You must be at least 13 years old to use Pilot Light. By using the Service, you represent that you meet this requirement.</p>
        <p style={pStyle}>If you're using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</p>

        <div style={sectionLabel}>3. Account Registration</div>
        <p style={pStyle}>To access certain features, you must create an account. You agree to:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>Provide accurate and complete information</li>
          <li style={{ marginBottom: '0.4rem' }}>Keep your login credentials secure</li>
          <li style={{ marginBottom: '0.4rem' }}>Notify us immediately of unauthorized access</li>
          <li style={{ marginBottom: '0.4rem' }}>Be responsible for all activity under your account</li>
        </ul>
        <p style={pStyle}>We reserve the right to suspend or terminate accounts that violate these Terms.</p>

        <div style={sectionLabel}>4. User Content</div>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Your Content, Your Rights:</span> You retain ownership of content you upload ("User Content"). By uploading, you grant Pilot Light a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the platform for the purpose of operating the Service.</p>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Creator Responsibilities:</span> If you upload teaser trailers or other content, you represent that:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>You own or have the necessary rights to the content</li>
          <li style={{ marginBottom: '0.4rem' }}>Your content doesn't infringe any third-party rights (copyright, trademark, privacy, etc.)</li>
          <li style={{ marginBottom: '0.4rem' }}>You have obtained all necessary permissions from individuals appearing in your content</li>
          <li style={{ marginBottom: '0.4rem' }}>Your content complies with all applicable laws</li>
        </ul>
        <div style={warningBox}>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.88rem', fontWeight: 300, lineHeight: '1.6' }}><span style={{ color: 'rgba(254,202,87,0.7)', fontWeight: 500 }}>Important:</span> Uploading content you don't have rights to may result in account termination and potential legal liability.</p>
        </div>

        <div style={sectionLabel}>5. Acceptable Use</div>
        <p style={pStyle}>You agree NOT to:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>Upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
          <li style={{ marginBottom: '0.4rem' }}>Upload content containing explicit sexual material or gratuitous violence</li>
          <li style={{ marginBottom: '0.4rem' }}>Impersonate others or misrepresent your affiliation</li>
          <li style={{ marginBottom: '0.4rem' }}>Manipulate ratings or engage in fraudulent voting</li>
          <li style={{ marginBottom: '0.4rem' }}>Use bots, scripts, or automated tools to access the Service</li>
          <li style={{ marginBottom: '0.4rem' }}>Attempt to gain unauthorized access to any part of the Service</li>
          <li style={{ marginBottom: '0.4rem' }}>Interfere with or disrupt the Service's operation</li>
          <li style={{ marginBottom: '0.4rem' }}>Use the Service for any illegal purpose</li>
        </ul>

        <div style={sectionLabel}>6. Content Moderation</div>
        <p style={pStyle}>We reserve the right to review, remove, or disable access to any content that violates these Terms or that we find objectionable, at our sole discretion and without notice.</p>
        <p style={pStyle}>We are not obligated to monitor all content but may do so. We are not responsible for User Content posted by users.</p>

        <div style={sectionLabel}>7. Intellectual Property</div>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Platform IP:</span> The Pilot Light platform, including its design, features, and branding, is owned by Pilot Light and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our written permission.</p>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Creator Content Protection:</span></p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>Creators retain full ownership of all submitted content, including teaser trailers, series concepts, scripts, and creative elements.</li>
          <li style={{ marginBottom: '0.4rem' }}>Pilot Light does not claim ownership of creator series concepts or materials.</li>
          <li style={{ marginBottom: '0.4rem' }}>Pilot Light will not develop, produce, sell, or license creator pilot concepts without explicit written permission from the creator.</li>
          <li style={{ marginBottom: '0.4rem' }}>By submitting content, creators grant Pilot Light only a non-exclusive, worldwide license to display submissions for voting, promotion, and platform operation purposes.</li>
        </ul>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Voter Confidentiality Agreement:</span></p>
        <p style={pStyle}>By creating an account and becoming a member of Pilot Light, you implicitly agree to the following confidentiality terms:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>To keep all viewed content confidential and not share, reproduce, or distribute any pilot videos, concepts, or creative materials.</li>
          <li style={{ marginBottom: '0.4rem' }}>Not to use any ideas, concepts, or creative elements from viewed pilots for your own projects.</li>
          <li style={{ marginBottom: '0.4rem' }}>That all content belongs to the respective creators and is protected by intellectual property rights.</li>
          <li style={{ marginBottom: '0.4rem' }}>To provide honest, constructive feedback solely for the purpose of helping creators improve their work.</li>
          <li style={{ marginBottom: '0.4rem' }}>Not to attempt to identify or contact creators outside of the platform.</li>
        </ul>
        <div style={warningBox}>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.88rem', fontWeight: 300, lineHeight: '1.6' }}><span style={{ color: 'rgba(254,202,87,0.7)', fontWeight: 500 }}>Enforcement:</span> Violation of these terms may result in immediate removal from the platform and potential legal action.</p>
        </div>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Disclaimer:</span> While Pilot Light operates as an invite-only platform and takes reasonable measures to protect creator content, Pilot Light cannot guarantee that third parties will not independently develop similar ideas. Creators acknowledge this inherent risk when sharing creative work on the platform.</p>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Copyright Claims:</span> Pilot Light respects intellectual property rights. If you believe content infringes your copyright, contact us at <a href="mailto:admin@pilotlighthq.com" style={{ color: 'rgba(78,205,196,0.6)', textDecoration: 'none' }}>admin@pilotlighthq.com</a> with:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>Identification of the copyrighted work</li>
          <li style={{ marginBottom: '0.4rem' }}>Identification of the infringing content</li>
          <li style={{ marginBottom: '0.4rem' }}>Your contact information</li>
          <li style={{ marginBottom: '0.4rem' }}>A statement of good faith belief</li>
          <li style={{ marginBottom: '0.4rem' }}>A statement of accuracy under penalty of perjury</li>
          <li style={{ marginBottom: '0.4rem' }}>Your physical or electronic signature</li>
        </ul>

        <div style={sectionLabel}>8. Privacy</div>
        <p style={pStyle}>Your use of the Service is also governed by our <span onClick={() => onNavigate('privacy')} style={{ color: 'rgba(78,205,196,0.6)', cursor: 'pointer' }}>Privacy Policy</span>, which is incorporated into these Terms by reference.</p>

        <div style={sectionLabel}>9. Third-Party Services</div>
        <p style={pStyle}>The Service may contain links to third-party websites or integrate with third-party services. We are not responsible for their content, policies, or practices.</p>

        <div style={sectionLabel}>10. Disclaimers</div>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</span></p>
        <p style={pStyle}>We do not warrant that:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>The Service will be uninterrupted or error-free</li>
          <li style={{ marginBottom: '0.4rem' }}>Defects will be corrected</li>
          <li style={{ marginBottom: '0.4rem' }}>The Service is free of viruses or harmful components</li>
          <li style={{ marginBottom: '0.4rem' }}>Any content or information obtained through the Service will be accurate</li>
        </ul>

        <div style={sectionLabel}>11. Limitation of Liability</div>
        <p style={pStyle}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, PILOT LIGHT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</span>, including loss of profits, data, or goodwill, arising from your use of the Service.</p>
        <p style={pStyle}>Our total liability for any claims arising from these Terms or your use of the Service shall not exceed the amount you paid us (if any) in the 12 months preceding the claim.</p>

        <div style={sectionLabel}>12. Indemnification</div>
        <p style={pStyle}>You agree to indemnify and hold Pilot Light harmless from any claims, damages, or expenses (including legal fees) arising from:</p>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}>Your use of the Service</li>
          <li style={{ marginBottom: '0.4rem' }}>Your User Content</li>
          <li style={{ marginBottom: '0.4rem' }}>Your violation of these Terms</li>
          <li style={{ marginBottom: '0.4rem' }}>Your violation of any third-party rights</li>
        </ul>

        <div style={sectionLabel}>13. Termination</div>
        <p style={pStyle}>You may stop using the Service at any time. You may delete your account through your account settings.</p>
        <p style={pStyle}>We may suspend or terminate your access at any time, with or without cause or notice. Upon termination, your right to use the Service ceases immediately.</p>

        <div style={sectionLabel}>14. Governing Law</div>
        <p style={pStyle}>These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.</p>
        <p style={pStyle}>Any disputes shall be resolved in the courts located in Los Angeles County, California, and you consent to personal jurisdiction in those courts.</p>

        <div style={sectionLabel}>15. General</div>
        <ul style={ulStyle}>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Entire Agreement:</span> These Terms constitute the entire agreement between you and Pilot Light.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Severability:</span> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Waiver:</span> Our failure to enforce any right doesn't waive that right.</li>
          <li style={{ marginBottom: '0.4rem' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Assignment:</span> You may not assign these Terms. We may assign them freely.</li>
        </ul>

        <div style={sectionLabel}>16. Contact</div>
        <p style={pStyle}>
          Questions about these Terms? Reach us at <a href="mailto:admin@pilotlighthq.com" style={{ color: 'rgba(78,205,196,0.6)', textDecoration: 'none' }}>admin@pilotlighthq.com</a>
        </p>
      </div>
      <PageFooter onNavigate={onNavigate} currentUser={currentUser} />
    </div>
  );
}

export default TermsPage;
