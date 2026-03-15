import React, { useState } from 'react';
import StorageManager from '../services/StorageManager';

function CreatorApplyPage({ currentUser, onBack, onSubmit, onNavigate }) {
  const [step, setStep] = useState('application'); // 'application' or 'terms'
  const [formData, setFormData] = useState({ creatorType: '', describes: '', aboutPilot: '', whyPilotLight: '', portfolioLink: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleFormContinue = (e) => {
    e.preventDefault();
    if (!formData.creatorType || !formData.describes || !formData.aboutPilot || !formData.whyPilotLight) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setStep('terms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError('');
    const result = await StorageManager.submitCreatorApplication(currentUser.id, formData);
    if (result.success) {
      onSubmit();
    } else {
      setError(result.message || 'Failed to submit application');
      setStep('application');
    }
    setSubmitting(false);
  };

  const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', fontFamily: 'inherit', boxSizing: 'border-box' };

  // Step Indicator Component
  const StepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(0.5rem, 2vw, 1rem)', marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
      {[{ num: 1, label: 'Application' }, { num: 2, label: 'Terms' }].map(({ num, label }) => (
        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', borderRadius: '50%',
            background: (step === 'application' && num === 1) || (step === 'terms' && num <= 2)
              ? 'linear-gradient(135deg, #e17055 0%, #d63031 100%)' : 'rgba(255,255,255,0.1)',
            border: (step === 'application' && num === 1) || (step === 'terms' && num <= 2)
              ? 'none' : '2px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
            color: (step === 'application' && num === 1) || (step === 'terms' && num <= 2) ? '#fff' : 'rgba(255,255,255,0.4)'
          }}>{num}</div>
          <span style={{ color: (step === 'application' && num === 1) || (step === 'terms' && num <= 2) ? '#fff' : 'rgba(255,255,255,0.4)',
            fontWeight: '600', fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)' }}>{label}</span>
          {num < 2 && <div style={{ width: 'clamp(20px, 5vw, 40px)', height: '2px',
            background: step === 'terms' ? '#e17055' : 'rgba(255,255,255,0.1)', marginLeft: '0.25rem' }} />}
        </div>
      ))}
    </div>
  );

  // Terms Step
  if (step === 'terms') {
    return (
      <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 'clamp(1.5rem, 4vw, 2rem)', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1.5rem)', color: '#fff', cursor: 'pointer', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </button>
        </div>

        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <StepIndicator />

          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '800', marginBottom: '0.5rem', textAlign: 'center',
            background: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Creator Submission Terms
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 'clamp(1.5rem, 4vw, 2rem)', textAlign: 'center', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
            Please review and accept the terms to complete your application
          </p>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: 'clamp(1.25rem, 4vw, 2rem)',
            border: '1px solid rgba(255,255,255,0.1)', marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
            <p style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.8', marginBottom: '1.25rem', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
              By submitting your trailer and series concept to Pilot Light, you agree to the following:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0, fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)' }}>
              <li style={{ marginBottom: '0.875rem' }}>You own all rights to the content you are submitting, including video, script, and creative elements.</li>
              <li style={{ marginBottom: '0.875rem' }}>You grant Pilot Light a non-exclusive, worldwide license to display your submission for the purposes of voting, promotion, and platform operation.</li>
              <li style={{ marginBottom: '0.875rem' }}>Pilot Light does not claim ownership of your series concept or materials.</li>
              <li style={{ marginBottom: '0.875rem' }}>You understand that your submission will be visible to registered voters, who may include other creators, audience members, or industry professionals. Pilot Light operates as an invite-only platform, but is not responsible for independent use of your idea by others.</li>
              <li style={{ marginBottom: '0.875rem' }}>You confirm your submission complies with anonymity rules: no personal identifiers, handles, or watermarks.</li>
              <li>You confirm that your content does not infringe on third-party copyrights or IP.</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(225,112,85,0.08)', borderRadius: '12px', padding: 'clamp(1rem, 3vw, 1.25rem)', marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
            border: termsAccepted ? '1px solid rgba(225,112,85,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: '0.2rem', width: '20px', height: '20px', cursor: 'pointer', accentColor: '#e17055' }} />
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', lineHeight: '1.5' }}>
                I have read and agree to the <strong style={{ color: '#e17055' }}>Creator Submission Terms & IP Agreement</strong>
              </span>
            </label>
          </div>

          {error && <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', color: '#ff6b6b', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
            <button onClick={() => { setStep('application'); setTermsAccepted(false); }}
              style={{ flex: 1, padding: 'clamp(0.875rem, 3vw, 1.25rem)', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', cursor: 'pointer', fontWeight: '500' }}>
              ← Back
            </button>
            <button onClick={handleFinalSubmit} disabled={!termsAccepted || submitting}
              style={{ flex: 2, padding: 'clamp(0.875rem, 3vw, 1.25rem)',
                background: (termsAccepted && !submitting) ? 'linear-gradient(135deg, #e17055 0%, #d63031 100%)' : 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: '12px', color: '#fff', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                fontWeight: '700', cursor: (termsAccepted && !submitting) ? 'pointer' : 'not-allowed',
                opacity: (termsAccepted && !submitting) ? 1 : 0.5 }}>
              {submitting ? 'Submitting...' : 'Accept & Submit Application'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Application Form Step
  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(1rem, 4vw, 2rem)' }}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 'clamp(1.5rem, 4vw, 2rem)', flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1.5rem)', color: '#fff', cursor: 'pointer', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </button>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1.5rem)', color: '#fff', cursor: 'pointer', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>← Back</button>
      </div>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <StepIndicator />

        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '800', marginBottom: '0.5rem' }}>Apply for Creator Access</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 'clamp(1.5rem, 4vw, 2rem)', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Tell us about yourself and your project. We review applications within 48 hours.</p>

        <form onSubmit={handleFormContinue}>
          {error && <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', color: '#ff6b6b', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)' }}>{error}</div>}

          <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>What Kind of Creator Are You? *</label>
            <select value={formData.creatorType} onChange={(e) => setFormData({...formData, creatorType: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }} required>
              <option value="">Select one...</option>
              <option value="Independent Filmmaker">Independent Filmmaker</option>
              <option value="Film/TV Student">Film/TV Student</option>
              <option value="Industry Professional">Working Professional (TV/Film Industry)</option>
              <option value="Content Creator">Content Creator Transitioning to Long-Form</option>
              <option value="Writer">Writer with Produced Work</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>Tell Us About Yourself *</label>
            <p style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Your background, experience, and what drives you as a creator</p>
            <textarea value={formData.describes} onChange={(e) => setFormData({...formData, describes: e.target.value})} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Tell us about yourself..." required />
          </div>

          <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>Why Pilot Light? *</label>
            <p style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>What do you hope to learn from audience feedback?</p>
            <textarea value={formData.whyPilotLight} onChange={(e) => setFormData({...formData, whyPilotLight: e.target.value})} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="What are you hoping to get out of this?" required />
          </div>

          <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>What Will Your First Pilot Be? *</label>
            <p style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Logline and premise</p>
            <textarea value={formData.aboutPilot} onChange={(e) => setFormData({...formData, aboutPilot: e.target.value})} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Describe your pilot concept..." required />
          </div>

          <div style={{ marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>Link to your work (optional)</label>
            <p style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Portfolio, previous projects, social media, IMDb, etc.</p>
            <input type="url" value={formData.portfolioLink} onChange={(e) => setFormData({...formData, portfolioLink: e.target.value})} style={inputStyle} placeholder="https://" />
          </div>

          <button type="submit" style={{ width: '100%', padding: 'clamp(1rem, 3vw, 1.25rem)', background: 'linear-gradient(135deg, #e17055, #d63031)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', fontWeight: '700', cursor: 'pointer' }}>
            Continue to Terms →
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatorApplyPage;
