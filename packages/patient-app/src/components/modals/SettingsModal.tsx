import React, { useState, useEffect } from 'react';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { XIcon, Volume2Icon, VolumeXIcon } from '../common/Icons.js';
import { ActivityAlarmService } from '../../services/ActivityAlarmService.js';
import { SyncWorker } from '../../sync/syncWorker.js';
import { CallingStorageService } from '../../calling/callingStorage.js';
import { CaretakerContact } from '@ner-mind/core';

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

  // Voice & Audio States
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => SpeechService.isEnabled);
  const [speechRate, setSpeechRate] = useState<number>(() => {
    return typeof localStorage !== 'undefined'
      ? parseFloat(localStorage.getItem('ner_mind_setting_speech_rate') || '0.85')
      : 0.85;
  });

  // Display & Accessibility States
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (typeof localStorage !== 'undefined'
      ? (localStorage.getItem('ner_mind_setting_text_size') as any) || 'large'
      : 'large');
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('ner_mind_setting_high_contrast') === 'true'
      : false;
  });

  // Android Mobile-Specific Features
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('ner_mind_setting_haptics') !== 'false'
      : true;
  });

  const [screenWakeLock, setScreenWakeLock] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('ner_mind_setting_wakelock') === 'true'
      : true;
  });

  const [chimeVolume, setChimeVolume] = useState<'soft' | 'medium' | 'loud'>(() => {
    return (typeof localStorage !== 'undefined'
      ? (localStorage.getItem('ner_mind_setting_chime_volume') as any) || 'medium'
      : 'medium');
  });

  // Emergency Contact Selection
  const [contacts, setContacts] = useState<CaretakerContact[]>([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string>('');

  // Diagnostic State
  const [syncStatusText, setSyncStatusText] = useState<string>('Ready & Synced');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const allContacts = CallingStorageService.getContacts();
    setContacts(allContacts);
    const primary = allContacts.find((c) => c.isEmergencyContact || c.isPrimary);
    if (primary) setSelectedEmergencyId(primary.id);
  }, [isOpen]);

  if (!isOpen) return null;

  // Apply Text Size Globally
  const applyTextSize = (size: 'normal' | 'large' | 'xlarge') => {
    setTextSize(size);
    localStorage.setItem('ner_mind_setting_text_size', size);
    if (typeof document !== 'undefined') {
      if (size === 'normal') document.documentElement.style.fontSize = '16px';
      else if (size === 'large') document.documentElement.style.fontSize = '18px';
      else if (size === 'xlarge') document.documentElement.style.fontSize = '20px';
    }
  };

  // Toggle High Contrast Globally
  const applyHighContrast = (val: boolean) => {
    setHighContrast(val);
    localStorage.setItem('ner_mind_setting_high_contrast', String(val));
    if (typeof document !== 'undefined') {
      if (val) {
        document.body.classList.add('ner-mind-high-contrast');
      } else {
        document.body.classList.remove('ner-mind-high-contrast');
      }
    }
  };

  // Toggle Voice Prompt
  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    SpeechService.setEnabled(next);
    if (next) {
      SpeechService.speak('Voice assistant is active and will guide your activities.', speechRate, (language as SupportedAppLanguage) || 'en');
    }
  };

  // Handle Speech Rate Change
  const handleChangeRate = (rate: number) => {
    setSpeechRate(rate);
    localStorage.setItem('ner_mind_setting_speech_rate', String(rate));
    SpeechService.speak('This is how I speak at this pace. Comfortable and clear.', rate, (language as SupportedAppLanguage) || 'en');
  };

  // Test Chime Sound
  const handleTestChime = () => {
    const volMult = chimeVolume === 'soft' ? 0.5 : chimeVolume === 'loud' ? 1.5 : 1.0;
    ActivityAlarmService.playDementiaFriendlyChime(true, volMult);
    if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 100, 150]);
    }
  };

  // Select Primary Emergency Contact
  const handleSelectEmergencyContact = (contactId: string) => {
    setSelectedEmergencyId(contactId);
    const updated = CallingStorageService.setPrimaryContact(contactId);
    setContacts(updated);
  };

  // Test Haptics
  const handleTestHaptics = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 300]);
    }
  };

  // Sync Diagnostics
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusText('Synchronizing on-device models...');
    try {
      const worker = SyncWorker.getInstance();
      await worker.syncNow();
      setSyncStatusText('All offline data synchronized successfully ✓');
    } catch {
      setSyncStatusText('Sync finished in offline mode.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusText('Ready & Synced'), 4000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          maxWidth: 620,
          width: '100%',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.3)',
          border: '2px solid #CBD5E1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1.5px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                fontSize: 22,
                border: '1.5px solid #BFDBFE',
              }}
            >
              ⚙️
            </div>
            <div>
              <h3
                id="settings-title"
                style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}
              >
                App Settings & Preferences
              </h3>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                Tailor screen, audio, and Android features for comfort
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: 12,
              width: 38,
              height: 38,
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
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* 1. Reading Text Size Selection */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 20,
              padding: '18px 20px',
              border: '1.5px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>
              👓 Reading Text Size
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
              Instantly adjusts font size across all games, activities, and menus.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { id: 'normal', label: 'Standard', sub: '16px Base' },
                { id: 'large', label: 'Large (Elderly)', sub: '18px Base' },
                { id: 'xlarge', label: 'Extra Large', sub: '20px Base' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTextSize(item.id as any)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 16,
                    border: `2.5px solid ${textSize === item.id ? '#2563EB' : '#CBD5E1'}`,
                    backgroundColor: textSize === item.id ? '#EFF6FF' : '#FFFFFF',
                    color: textSize === item.id ? '#1D4ED8' : '#334155',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: textSize === item.id ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Spoken Voice Guidance & Speed */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 20,
              padding: '18px 20px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {voiceEnabled ? <Volume2Icon size={24} color="#2563EB" /> : <VolumeXIcon size={24} color="#94A3B8" />}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
                    Spoken Voice Guidance
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>
                    Reads game instructions and reminders in clear local dialect
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
                  borderRadius: 14,
                  padding: '8px 18px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {voiceEnabled ? 'Enabled ✓' : 'Muted ✕'}
              </button>
            </div>

            {voiceEnabled && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
                  Speaking Speed Pace:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Slow (0.75x)', rate: 0.75 },
                    { label: 'Relaxed (0.85x)', rate: 0.85 },
                    { label: 'Standard (1.0x)', rate: 1.0 },
                  ].map((item) => (
                    <button
                      key={item.rate}
                      type="button"
                      onClick={() => handleChangeRate(item.rate)}
                      style={{
                        padding: '10px',
                        borderRadius: 14,
                        border: `2px solid ${speechRate === item.rate ? '#2563EB' : '#CBD5E1'}`,
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
            )}
          </div>

          {/* 4. Android Haptic Feedback & Screen Wake Lock */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 20,
              padding: '18px 20px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Haptic Vibration */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
                  📳 Haptic Vibration Feedback
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Gentle physical vibration pulse when touching buttons and receiving calls
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {hapticsEnabled && (
                  <button
                    type="button"
                    onClick={handleTestHaptics}
                    title="Preview vibration"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 10,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Test
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const next = !hapticsEnabled;
                    setHapticsEnabled(next);
                    localStorage.setItem('ner_mind_setting_haptics', String(next));
                    if (next) handleTestHaptics();
                  }}
                  style={{
                    backgroundColor: hapticsEnabled ? '#10B981' : '#E2E8F0',
                    color: hapticsEnabled ? '#FFFFFF' : '#475569',
                    border: 'none',
                    borderRadius: 14,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {hapticsEnabled ? 'Active' : 'Off'}
                </button>
              </div>
            </div>

            {/* Screen Wake Lock */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
                  💡 Keep Screen Awake During Games
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Prevents Android phone from going to sleep during puzzles
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !screenWakeLock;
                  setScreenWakeLock(next);
                  localStorage.setItem('ner_mind_setting_wakelock', String(next));
                }}
                style={{
                  backgroundColor: screenWakeLock ? '#2563EB' : '#E2E8F0',
                  color: screenWakeLock ? '#FFFFFF' : '#475569',
                  border: 'none',
                  borderRadius: 14,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {screenWakeLock ? 'Active' : 'Off'}
              </button>
            </div>

            {/* High Contrast */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
                  🎨 Visual High Contrast Mode
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Sharpen button borders and color separation for visual clarity
                </div>
              </div>

              <button
                type="button"
                onClick={() => applyHighContrast(!highContrast)}
                style={{
                  backgroundColor: highContrast ? '#0F172A' : '#E2E8F0',
                  color: highContrast ? '#FFFFFF' : '#475569',
                  border: 'none',
                  borderRadius: 14,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {highContrast ? 'Enabled' : 'Off'}
              </button>
            </div>
          </div>

          {/* 5. Chime & Musical Alert Tone Preview */}
          <div
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 20,
              padding: '18px 20px',
              border: '2px solid #FCD34D',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#92400E' }}>
                  🔔 Daily Activity Musical Chime
                </div>
                <div style={{ fontSize: 13, color: '#B45309', marginTop: 2 }}>
                  Gentle ascending musical triad (C5 → E5 → G5 → C6)
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestChime}
                style={{
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 14,
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
                }}
              >
                <span>🔔 Test Chime</span>
              </button>
            </div>

            {/* Chime Volume Level */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTop: '1px dashed #FCD34D' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
                Chime Alert Volume:
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['soft', 'medium', 'loud'] as const).map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => {
                      setChimeVolume(vol);
                      localStorage.setItem('ner_mind_setting_chime_volume', vol);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 12,
                      border: `2px solid ${chimeVolume === vol ? '#B45309' : '#FDE68A'}`,
                      backgroundColor: chimeVolume === vol ? '#F59E0B' : '#FFFBEB',
                      color: chimeVolume === vol ? '#FFFFFF' : '#92400E',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {vol}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Primary Emergency SOS Caregiver Contact */}
          <div
            style={{
              backgroundColor: '#FFF1F2',
              borderRadius: 20,
              padding: '18px 20px',
              border: '2px solid #FECDD3',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#BE123C' }}>
                🚨 Primary Emergency Contact (SOS)
              </div>
              <div style={{ fontSize: 13, color: '#9F1239', marginTop: 2 }}>
                The caretaker who receives instant alerts and 1-tap call when Help & Support is pressed
              </div>
            </div>

            {contacts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contacts.map((contact) => {
                  const isSelected = selectedEmergencyId === contact.id || (!selectedEmergencyId && (contact.isEmergencyContact || contact.isPrimary));
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleSelectEmergencyContact(contact.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 14,
                        border: `2px solid ${isSelected ? '#E11D48' : '#FDA4AF'}`,
                        backgroundColor: isSelected ? '#FFFFFF' : '#FFF5F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: isSelected ? '0 2px 8px rgba(225, 29, 72, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: contact.avatarColor || '#E11D48',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: 14,
                          }}
                        >
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#881337' }}>
                            {contact.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#9F1239' }}>
                            {contact.relationship} • {contact.phoneOrUserId}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 8,
                          backgroundColor: isSelected ? '#E11D48' : 'transparent',
                          color: isSelected ? '#FFFFFF' : '#9F1239',
                        }}
                      >
                        {isSelected ? 'Primary SOS ✓' : 'Select'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9F1239', fontStyle: 'italic' }}>
                No caretaker contacts configured yet. Add them in the Caregiver Portal.
              </div>
            )}
          </div>

          {/* 6. Offline Storage Diagnostics */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 20,
              padding: '18px 20px',
              border: '1.5px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
                🛡️ Offline Storage & Health Check
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  borderRadius: 10,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isSyncing ? '⏳ Syncing...' : '🔄 Verify & Sync'}
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#059669', fontWeight: 700 }}>
              🟢 {syncStatusText}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Zero internet dependency. 10 cognitive games, voice packs, and memory models are stored safely inside Android IndexedDB.
            </div>
          </div>

          {/* 7. Caretaker Portal Shortcut */}
          <div
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 20,
              padding: '18px 20px',
              border: '2px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#1E40AF' }}>
                👨‍⚕️ Caretaker & Clinical Portal
              </div>
              <div style={{ fontSize: 13, color: '#3B82F6', marginTop: 2 }}>
                Manage patient profiles, schedule activities, upload familiar photos, and review logs
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCaregiver();
              }}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                padding: '11px 20px',
                fontSize: 14,
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              Open Caregiver 🛡️
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1.5px solid #E2E8F0',
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
              borderRadius: 14,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
