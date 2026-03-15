import React, { useState } from 'react';
import { KeyRound, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import StorageManager from '../services/StorageManager';
import { FlameIcon, Icon } from '../components/Icons';

function ResetPasswordPage({ onSuccess, onBack, token: propToken }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputStyle = {
    width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff',
    fontSize: '1rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setSubmitting(false);
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      setSubmitting(false);
      return;
    }

    try {
      const token = propToken;
      if (!token) {
        setError('Invalid or expired reset link. Please request a new one.');
        setSubmitting(false);
        return;
      }

      const result = await StorageManager.resetPassword(token, newPassword);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        {/* Logo - centered, icon same size as letter P */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <FlameIcon size={40} style={{ marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Pilot Light</h1>
        </div>

        {/* Page title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Icon component={KeyRound} style={{ width: '28px', height: '28px', color: '#4ecdc4' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#fff', margin: 0 }}>Create New Password</h2>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', fontSize: '1rem' }}>
          Enter your new password below.
        </p>

        {success ? (
          <div style={{ background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)',
            borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem' }}>
            <Icon component={CheckCircle2} style={{ width: '48px', height: '48px', color: '#4ecdc4', marginBottom: '1rem' }} />
            <h3 style={{ color: '#4ecdc4', fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.75rem' }}>Password Reset Successfully!</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Your password has been updated. You can now log in with your new password.
            </p>
            <button onClick={onSuccess}
              style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
            {error && <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)',
              borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', color: '#ff6b6b', fontSize: '0.9rem' }}>{error}</div>}

            {/* New Password */}
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} required placeholder="New Password (min 8 characters)"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(78,205,196,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, marginTop: '-0.5rem' }}>
                <Icon component={showPassword ? EyeOff : Eye} style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Confirm Password */}
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <input type={showConfirmPassword ? 'text' : 'password'} required placeholder="Confirm New Password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, paddingRight: '3rem' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(78,205,196,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>
                <Icon component={showConfirmPassword ? EyeOff : Eye} style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'left', margin: '0.75rem 0 1.25rem' }}>
              Your new password cannot be one of your last 3 passwords.
            </p>

            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: '1rem',
                background: submitting ? 'rgba(78,205,196,0.5)' : 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseOver={(e) => { if (!submitting) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 25px rgba(78,205,196,0.3)'; }}}
              onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Back to login */}
        {!success && (
          <button onClick={onBack}
            style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem auto 0',
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.95rem' }}>
            <Icon component={ArrowLeft} style={{ width: '18px', height: '18px' }} />
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
