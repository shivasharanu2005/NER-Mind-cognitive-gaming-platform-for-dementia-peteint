import React from 'react';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { XIcon, HelpCircleIcon } from '../common/Icons.js';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerEmergency: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  onTriggerEmergency,
}) => {
  const { language } = useLocalization();

  if (!isOpen) return null;

  const handleSpeakHelpGuide = () => {
    const text = 'Welcome to NER-MIND Help. You can tap on any game card to start playing. If you need any assistance, you can press the red Emergency button to alert your caregiver immediately. This platform is 100% offline and always safe.';
    SpeechService.speak(text, 0.85, (language as SupportedAppLanguage) || 'en');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          maxWidth: 580,
          width: '100%',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.25)',
          border: '1.5px solid #CBD5E1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#EFF6FF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <HelpCircleIcon size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1E3A8A', margin: 0 }}>
                Help & Patient Support
              </h3>
              <span style={{ fontSize: 13, color: '#1D4ED8' }}>
                We are always here to assist you
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #BFDBFE',
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1E3A8A',
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Quick Voice Audio Guide */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 18,
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                Audio Spoken Guide
              </div>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Hear a friendly voice explain how to use NER-MIND
              </div>
            </div>

            <button
              type="button"
              onClick={handleSpeakHelpGuide}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🔊 Listen</span>
            </button>
          </div>

          {/* Emergency Alert Direct Button */}
          <div
            style={{
              backgroundColor: '#FFF1F2',
              borderRadius: 18,
              padding: '18px 20px',
              border: '2px solid #FECDD3',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <h4 style={{ fontSize: 16, fontWeight: 900, color: '#9F1239', margin: 0 }}>
                Need Help Right Now?
              </h4>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 14px 0' }}>
              Pressing this sends an immediate audible notification to your caregiver's device.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTriggerEmergency();
              }}
              style={{
                width: '100%',
                backgroundColor: '#E11D48',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                padding: '12px',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Alert Caregiver Immediately
            </button>
          </div>

          {/* FAQ Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                ❓ Does NER-MIND work without internet?
              </div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>
                Yes! NER-MIND is 100% offline. All games, family photos, and speech work locally on your device without internet.
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                ❓ What if I make a mistake in a game?
              </div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>
                There are no penalties or timers! You can take as much time as you like. The AI will gently adapt the game so you enjoy playing.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 800,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

