import React, { useRef, useEffect } from 'react';
import { ActiveCallState } from '@ner-mind/core';
import { CallingService } from '../../calling/callingService.js';

interface Props {
  activeCall: ActiveCallState;
}

export const ActiveCallModal: React.FC<Props> = ({ activeCall }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const localStream = CallingService.getLocalStream();
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    const remoteStream = CallingService.getRemoteStream();
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [activeCall.status]);

  const handleEndCall = () => {
    CallingService.endCall();
  };

  const handleToggleMute = () => {
    CallingService.toggleMute();
  };

  const handleToggleVideo = () => {
    CallingService.toggleVideo();
  };

  const formatDuration = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div
      className="active-call-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        zIndex: 999998,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      {/* Top Bar: Call Status & Remote Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'max(16px, env(safe-area-inset-top)) 24px 16px 24px',
          background: 'linear-gradient(to bottom, rgba(15,23,42,0.95), transparent)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              border: '2px solid #FFFFFF',
            }}
          >
            {activeCall.remotePartyName.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              {activeCall.remotePartyName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: activeCall.status === 'connected' ? '#10B981' : '#F59E0B',
                }}
              />
              <span style={{ fontSize: 14, color: '#CBD5E1', fontWeight: 600 }}>
                {activeCall.status === 'connected'
                  ? `Connected • ${formatDuration(activeCall.durationSeconds)}`
                  : activeCall.status === 'ringing'
                  ? 'Calling... Ringing'
                  : activeCall.status}
              </span>
            </div>
          </div>
        </div>

        {/* Call Type Pill */}
        <span
          style={{
            backgroundColor: '#1E293B',
            color: '#38BDF8',
            border: '1.5px solid #0284C7',
            borderRadius: 18,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {activeCall.callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
        </span>
      </div>

      {/* Center Video / Active Display */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#1E293B',
          margin: '0 16px',
          borderRadius: 24,
        }}
      >
        {/* Remote Video Stream or Avatar Screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: CallingService.getRemoteStream() ? 'block' : 'none',
          }}
        />

        {/* Fallback Display if remote video track is not currently streamed */}
        {!CallingService.getRemoteStream() && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 24,
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: 20,
                border: '6px solid #38BDF8',
                boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
              }}
            >
              {activeCall.remotePartyPhoto ? (
                <img
                  src={activeCall.remotePartyPhoto}
                  alt={activeCall.remotePartyName}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                activeCall.remotePartyName.charAt(0)
              )}
            </div>

            <h3 style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px 0' }}>
              {activeCall.remotePartyName}
            </h3>
            {activeCall.remotePartyRelationship && (
              <p style={{ fontSize: 16, color: '#94A3B8', margin: '0 0 16px 0', fontWeight: 700 }}>
                {activeCall.remotePartyRelationship}
              </p>
            )}

            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1.5px solid #334155',
                borderRadius: 20,
                padding: '8px 20px',
                fontSize: 16,
                fontWeight: 700,
                color: '#38BDF8',
              }}
            >
              {activeCall.status === 'connected' ? 'Call in Progress 🎙️' : 'Ringing... 🔔'}
            </div>
          </div>
        )}

        {/* Local Picture-in-Picture Video Preview */}
        {activeCall.callType === 'video' && !activeCall.isVideoOff && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 120,
              height: 160,
              borderRadius: 16,
              backgroundColor: '#0F172A',
              border: '2.5px solid #FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              zIndex: 20,
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '24px 24px max(24px, env(safe-area-inset-bottom)) 24px',
          background: 'linear-gradient(to top, rgba(15,23,42,0.95), transparent)',
          zIndex: 10,
        }}
      >
        {/* Toggle Microphone */}
        <button
          type="button"
          onClick={handleToggleMute}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: activeCall.isMuted ? '#EF4444' : '#334155',
            color: '#FFFFFF',
            border: '2px solid #475569',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
          title={activeCall.isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {activeCall.isMuted ? '🔇' : '🎙️'}
        </button>

        {/* Giant Red End Call Button (Accessible Dementia Focus) */}
        <button
          type="button"
          onClick={handleEndCall}
          aria-label="End Call"
          style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 36,
            padding: '16px 36px',
            fontSize: 20,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.5)',
            minHeight: 70,
          }}
        >
          <span style={{ fontSize: 28, transform: 'rotate(135deg)', display: 'inline-block' }}>📞</span>
          <span>End Call</span>
        </button>

        {/* Toggle Camera (for video calls) */}
        {activeCall.callType === 'video' && (
          <button
            type="button"
            onClick={handleToggleVideo}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: activeCall.isVideoOff ? '#EF4444' : '#334155',
              color: '#FFFFFF',
              border: '2px solid #475569',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            title={activeCall.isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {activeCall.isVideoOff ? '🚫' : '📹'}
          </button>
        )}
      </div>
    </div>
  );
};
