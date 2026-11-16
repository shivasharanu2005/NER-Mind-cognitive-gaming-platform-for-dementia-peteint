import React, { useState } from 'react';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { XIcon, Volume2Icon, VolumeXIcon } from '../common/Icons.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCaregiver: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenCaregiver,
}) => {
  const { language } = useLocalization();
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(SpeechService.isEnabled);
  const [speechRate, setSpeechRate] = useState<number>(0.85);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    SpeechService.setEnabled(next);
    if (next) {
      SpeechService.speak('Voice assistant is active', 0.9, (language as SupportedAppLanguage) || 'en');
    }
  };

  const handleChangeRate = (rate: number) => {
    setSpeechRate(rate);
    SpeechService.speak('This is how I speak at this speed.', rate, (language as SupportedAppLanguage) || 'en');
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
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>⚙️</span>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Patient App Settings
              </h3>
              <span style={{ fontSize: 13, color: '#64748B' }}>
                Comfort and accessibility adjustments
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Settings Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Voice ON/OFF */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              borderRadius: 18,
              backgroundColor: voiceEnabled ? '#EFF6FF' : '#F8FAFC',
              border: `1.5px solid ${voiceEnabled ? '#BFDBFE' : '#E2E8F0'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {voiceEnabled ? <Volume2Icon size={24} color="#2563EB" /> : <VolumeXIcon size={24} color="#94A3B8" />}
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Spoken Voice Guidance
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Read aloud instructions and questions automatically
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleVoice}
              style={{
                backgroundColor: voiceEnabled ? '#2563EB' : '#E2E8F0',
                color: voiceEnabled ? '#FFFFFF' : '#475569',
                border: 'none',
                borderRadius: 12,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {voiceEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Speech Rate */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Voice Reading Speed
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Slow & Gentle', rate: 0.75 },
                { label: 'Comfortable', rate: 0.85 },
                { label: 'Normal', rate: 1.0 },
              ].map((item) => (
                <button
                  key={item.rate}
                  type="button"
                  onClick={() => handleChangeRate(item.rate)}
                  style={{
                    padding: '12px',
                    borderRadius: 14,
                    border: `2px solid ${speechRate === item.rate ? '#2563EB' : '#E2E8F0'}`,
                    backgroundColor: speechRate === item.rate ? '#EFF6FF' : '#FFFFFF',
                    color: speechRate === item.rate ? '#1D4ED8' : '#334155',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Size */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Reading Text Size
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { id: 'normal', label: 'Standard (18px)' },
                { id: 'large', label: 'Large (22px)' },
                { id: 'xlarge', label: 'Extra Large (26px)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTextSize(item.id as any)}
                  style={{
                    padding: '12px',
                    borderRadius: 14,
                    border: `2px solid ${textSize === item.id ? '#2563EB' : '#E2E8F0'}`,
                    backgroundColor: textSize === item.id ? '#EFF6FF' : '#FFFFFF',
                    color: textSize === item.id ? '#1D4ED8' : '#334155',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              borderRadius: 18,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                High Contrast Colors
              </div>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Increase color clarity and button borders for easier vision
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              style={{
                backgroundColor: highContrast ? '#0F172A' : '#E2E8F0',
                color: highContrast ? '#FFFFFF' : '#475569',
                border: 'none',
                borderRadius: 12,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {highContrast ? 'Active' : 'Off'}
            </button>
          </div>

          {/* Caregiver Portal Link */}
          <div
            style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 16,
              padding: '14px 18px',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E' }}>
                Advanced Clinical Settings
              </div>
              <div style={{ fontSize: 12, color: '#B45309' }}>
                Language, game schedules, and photo management are managed in Caregiver Portal.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCaregiver();
              }}
              style={{
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Open Caregiver 🛡️
            </button>
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
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              padding: '10px 24px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

