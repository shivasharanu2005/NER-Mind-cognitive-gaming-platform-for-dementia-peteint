import React, { useState } from 'react';
import { SpeechService } from '../../audio/speechService.js';
import { LocalAuthService } from '../../auth/localAuthService.js';

interface Props {
  patientName: string;
  patientId: string;
  onOpenCaregiver: () => void;
  onOpenSettings: () => void;
  onTriggerEmergency: () => void;
  onPatientSwitched?: (newPatientId: string) => void;
  onOpenCreateProfile?: () => void;
  onTestAlarm?: () => void;
  isOnline: boolean;
}

export const AndroidMobileHeader: React.FC<Props> = ({
  patientName,
  patientId: _patientId,
  onOpenCaregiver,
  onOpenSettings,
  onTriggerEmergency,
  onPatientSwitched: _onPatientSwitched,
  onOpenCreateProfile,
  onTestAlarm,
  isOnline,
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => SpeechService.isEnabled);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    SpeechService.setEnabled(next);
    setVoiceEnabled(next);
    if (next) {
      SpeechService.speak('Voice assistance enabled. I will guide you through all games and reminders.');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  return (
    <header
      className="android-app-header"
      style={{
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        padding: 'max(14px, env(safe-area-inset-top)) 16px 12px 16px',
        borderBottom: '2px solid #1E293B',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Top Utility Row: Mode Pill, SOS, Settings, Voice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 8,
        }}
      >
        {/* App Title Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#38BDF8',
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          <span>🧠</span>
          <span>NER-MIND</span>
        </div>

        {/* Right Action Icons: SOS, Voice, Caretaker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Test Activity Alert Button */}
          {onTestAlarm && (
            <button
              type="button"
              onClick={onTestAlarm}
              title="Preview real-time activity reminder notice"
              style={{
                backgroundColor: '#334155',
                color: '#F59E0B',
                border: '1px solid #475569',
                borderRadius: 18,
                padding: '6px 9px',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <span>🔔</span>
              <span style={{ fontSize: 11, color: '#F8FAFC' }}>Notice</span>
            </button>
          )}

          {/* Voice Prompt Toggle */}
          <button
            type="button"
            onClick={toggleVoice}
            aria-label="Toggle voice guidance"
            style={{
              backgroundColor: voiceEnabled ? '#2563EB' : '#334155',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 18,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <span>{voiceEnabled ? '🔊' : '🔇'}</span>
            <span>{voiceEnabled ? 'Voice ON' : 'Muted'}</span>
          </button>

          {/* SOS Emergency Call Button */}
          <button
            type="button"
            onClick={onTriggerEmergency}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 18,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
            }}
          >
            <span>🚨</span>
            <span>SOS</span>
          </button>

          {/* Caregiver Portal Button */}
          <button
            type="button"
            onClick={onOpenCaregiver}
            title="Caretaker Portal"
            style={{
              backgroundColor: '#334155',
              color: '#F1F5F9',
              border: '1px solid #475569',
              borderRadius: 18,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            👨‍⚕️
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings & Accessibility"
            style={{
              backgroundColor: '#334155',
              color: '#F1F5F9',
              border: '1px solid #475569',
              borderRadius: 18,
              padding: '6px 8px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Patient Greeting & Active User Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Patient Avatar with Online Dot */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                backgroundColor: '#38BDF8',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
                border: '2px solid #FFFFFF',
              }}
            >
              {patientName.charAt(0)}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isOnline ? '#10B981' : '#F59E0B',
                border: '2px solid #0F172A',
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>
              {getGreeting()}
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 19,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.3px',
              }}
            >
              {patientName}
            </h2>
          </div>
        </div>

        {/* Single Device Profile Pill & Signout */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            style={{
              backgroundColor: '#1E293B',
              color: '#E2E8F0',
              border: '1px solid #334155',
              borderRadius: 14,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <span>👤 Profile</span>
            <span style={{ color: '#94A3B8', fontSize: 10 }}>▼</span>
          </button>

          {showUserDropdown && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 6,
                backgroundColor: '#1E293B',
                borderRadius: 16,
                border: '1.5px solid #334155',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                minWidth: 230,
                padding: '12px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Single Device Profile
              </div>
              <div style={{ marginTop: 6, fontSize: 15, fontWeight: 900, color: '#FFFFFF' }}>
                {patientName}
              </div>
              <div style={{ fontSize: 11, color: '#38BDF8', marginTop: 2 }}>
                ● 1 Profile active on this device
              </div>

              <div style={{ height: 1, backgroundColor: '#334155', margin: '10px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    LocalAuthService.logout();
                    if (typeof localStorage !== 'undefined') {
                      localStorage.removeItem('ner_mind_active_session');
                      localStorage.removeItem('ner_mind_splash_seen');
                    }
                    if (typeof window !== 'undefined') {
                      window.location.reload();
                    }
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#7F1D1D',
                    color: '#FCA5A5',
                    border: '1px solid #991B1B',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>🚪 Sign Out Profile</span>
                </button>

                {onOpenCreateProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenCreateProfile();
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    title="Register a new profile and sign out current profile"
                  >
                    <span>➕ Register New Profile</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
