import React, { useState } from 'react';
import { FlameIcon } from './Icons';

export default function VoterNdaModal({ userName, onAccept, onDecline, mandatory = false }) {
  const [isChecked, setIsChecked] = useState(false);

  const ndaTerms = `CONFIDENTIAL PILOT PREVIEW AGREEMENT

By accessing and viewing this pilot, you agree to the following terms:

1. CONFIDENTIALITY: All content shared in this screening room is strictly confidential. You may not discuss, describe, or share details of any pilot with anyone outside this platform without explicit written consent.

2. NO SHARING: You may not record, screenshot, download, or reproduce any pilot content. All content remains the exclusive property of its creators.

3. INTELLECTUAL PROPERTY: All pilots, characters, storylines, and creative elements are protected intellectual property. You may not use, adapt, or build upon this content in any way.

4. HONEST FEEDBACK: You commit to providing honest, thoughtful feedback. Feedback should be constructive and based on artistic merit, not personal preferences.

5. NO CONTACT: You may not contact pilots creators, writers, or producers directly regarding feedback, collaboration, or business opportunities outside of this platform.

6. VIOLATION CONSEQUENCES: Breach of this agreement may result in immediate removal from the platform, legal action, and/or financial penalties as outlined in our full Terms of Service.`;

  const handleAccept = () => {
    if (isChecked) {
      onAccept();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#0f0f0f',
          border: '1px solid rgba(212, 165, 116, 0.2)',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '32px 32px 24px',
            borderBottom: '1px solid rgba(212, 165, 116, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FlameIcon color="#d4a574" size={28} />
          <h1
            style={{
              margin: 0,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '32px',
              fontWeight: 300,
              letterSpacing: '0.15em',
              color: '#d4a574',
              textTransform: 'uppercase',
            }}
          >
            Member Agreement
          </h1>
        </div>

        {/* NDA Text Area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px 32px',
          }}
        >
          <textarea
            value={ndaTerms}
            readOnly
            style={{
              width: '100%',
              height: '100%',
              minHeight: '250px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(212, 165, 116, 0.15)',
              borderRadius: '8px',
              color: '#f5f0eb',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 300,
              lineHeight: 1.6,
              padding: '16px',
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '24px 32px',
            borderTop: '1px solid rgba(212, 165, 116, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              color: '#f5f0eb',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 300,
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#d4a574',
                cursor: 'pointer',
              }}
            />
            <span>I agree to this Member Agreement</span>
          </label>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            {!mandatory && (
              <button
                onClick={onDecline}
                style={{
                  padding: '12px 28px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(212, 165, 116, 0.3)',
                  borderRadius: '8px',
                  color: '#d4a574',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 165, 116, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.3)';
                }}
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleAccept}
              disabled={!isChecked}
              style={{
                padding: '12px 32px',
                background: isChecked
                  ? 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)'
                  : 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(184, 134, 11, 0.3) 100%)',
                border: 'none',
                borderRadius: '8px',
                color: isChecked ? '#0a0a0a' : 'rgba(245, 240, 235, 0.4)',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                letterSpacing: '0.05em',
                cursor: isChecked ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => {
                if (isChecked) {
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 165, 116, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
