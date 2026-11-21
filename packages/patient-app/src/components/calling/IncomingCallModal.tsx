import React from 'react';
import { CallSignal } from '@ner-mind/core';
import { CallingService } from '../../calling/callingService.js';

interface Props {
  incomingSignal: CallSignal;
}

export const IncomingCallModal: React.FC<Props> = ({ incomingSignal }) => {
  const handleAccept = () => {
    CallingService.acceptCall();
  };

  const handleDecline = () => {
    CallingService.declineCall();
  };

  return (
    <div
      className="incoming-call-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="incoming-call-title"
        style={{
          backgroundColor: '#1E293B',
          color: '#FFFFFF',
          borderRadius: 32,
          maxWidth: 420,
          width: '100%',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          border: '2px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <span
          style={{
            backgroundColor: '#0F172A',
            color: '#38BDF8',
            border: '1.5px solid #0284C7',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Incoming {incomingSignal.callType === 'video' ? 'Video' : 'Audio'} Call
        </span>

        {/* Pulsing Avatar */}
        <div style={{ position: 'relative', margin: '10px 0' }}>
          <div
            className="pulse-ring"
            style={{
              position: 'absolute',
              top: -12,
              left: -12,
              right: -12,
              bottom: -12,
              borderRadius: '50%',
              border: '3px solid #10B981',
              animation: 'pulsing 1.8s infinite',
            }}
          />
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 52,
              fontWeight: 900,
              color: '#FFFFFF',
              border: '4px solid #10B981',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {incomingSignal.callerName.charAt(0)}
          </div>
        </div>

        <div>
          <h2
            id="incoming-call-title"
            style={{
              fontSize: 26,
              fontWeight: 900,
              margin: '0 0 6px 0',
              color: '#F8FAFC',
            }}
          >
            {incomingSignal.callerName}
          </h2>
          <p
            style={{
              fontSize: 16,
              color: '#94A3B8',
              margin: 0,
              fontWeight: 600,
            }}
          >
            Calling you now...
          </p>
        </div>

        {/* Action Buttons: Accept & Decline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            width: '100%',
            marginTop: 12,
          }}
        >
          {/* Decline Button */}
          <button
            type="button"
            onClick={handleDecline}
            aria-label="Decline call"
            style={{
              flex: 1,
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 24,
              padding: '16px 20px',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
              minHeight: 64,
            }}
          >
            <span style={{ fontSize: 22 }}>✕</span>
            <span>Decline</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={handleAccept}
            aria-label="Accept call"
            style={{
              flex: 1,
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 24,
              padding: '16px 20px',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              minHeight: 64,
            }}
          >
            <span style={{ fontSize: 22 }}>📞</span>
            <span>Accept</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulsing {
          0% { transform: scale(0.95); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};
