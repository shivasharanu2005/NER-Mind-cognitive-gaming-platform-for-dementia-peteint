import React, { useState } from 'react';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { XIcon, HelpCircleIcon } from '../common/Icons.js';
import { EmergencyAlertService, EmergencyEvent } from '../../services/EmergencyAlertService.js';
import { CallingStorageService } from '../../calling/callingStorage.js';
import { CallingService } from '../../calling/callingService.js';
import { OfflineStorageService } from '../../storage/localStorage.js';

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
  const [activeAlert, setActiveAlert] = useState<EmergencyEvent | null>(null);
  const [isAlerting, setIsAlerting] = useState<boolean>(false);

  if (!isOpen) return null;

  const patientProfile = OfflineStorageService.getPatientProfile();
  const contacts = CallingStorageService.getContacts(patientProfile.patientId);
  const primaryCaretaker = contacts.find((c) => c.isPrimary) || contacts[0];

  const handleSpeakHelpGuide = () => {
    const text = 'Welcome to NER-MIND Help. You can tap on any game card to start playing. If you need any assistance, press the red Alert Caregiver button. An urgent alert will immediately be sent to your caregiver’s phone and portal. Everything works 100% offline and is completely safe.';
    SpeechService.speak(text, 0.85, (language as SupportedAppLanguage) || 'en');
  };

  const handleAlertCaregiverNow = () => {
    setIsAlerting(true);
    const event = EmergencyAlertService.triggerEmergencyAlert({
      patientId: patientProfile.patientId,
      patientName: patientProfile.displayName,
      reason: 'Patient clicked "Alert Caregiver Immediately" in Help & Support.',
    });
    setActiveAlert(event);
    setIsAlerting(false);
  };

  const handleCallCaretakerDirectly = () => {
    if (primaryCaretaker) {
      onClose();
      CallingService.startCall(primaryCaretaker, 'video');
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
        padding: 20,
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-support-title"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          maxWidth: 580,
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
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: activeAlert ? '#FEF2F2' : '#EFF6FF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: activeAlert ? '#FEE2E2' : '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeAlert ? '#DC2626' : '#2563EB',
                fontSize: 22,
              }}
            >
              {activeAlert ? '🚨' : <HelpCircleIcon size={24} />}
            </div>
            <div>
              <h3
                id="help-support-title"
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: activeAlert ? '#991B1B' : '#1E3A8A',
                  margin: 0,
                }}
              >
                {activeAlert ? 'Caretaker Alerted' : 'Help & Patient Support'}
              </h3>
              <span style={{ fontSize: 13, color: activeAlert ? '#B91C1C' : '#1D4ED8', fontWeight: 600 }}>
                {activeAlert ? 'Urgent notice dispatched to caregiver portal' : 'We are always here to assist you'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 10,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1E293B',
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Real-Time Caretaker Alert Dispatch Box */}
          {activeAlert ? (
            <div
              style={{
                backgroundColor: '#F0FDF4',
                borderRadius: 22,
                padding: '22px',
                border: '2.5px solid #22C55E',
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: '#DCFCE7',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 900,
                  }}
                >
                  ✓
                </div>
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 900, color: '#14532D', margin: '0 0 2px 0' }}>
                    Alert Delivered to Caretaker!
                  </h4>
                  <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>
                    Received by {activeAlert.caretakerName} • {new Date(activeAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 14, color: '#166534', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                A critical notification was dispatched to your caregiver’s device and portal. Please remain seated comfortably; help is on the way.
              </p>

              {/* Direct 1-Tap Call to Caretaker */}
              {primaryCaretaker && (
                <button
                  type="button"
                  onClick={handleCallCaretakerDirectly}
                  style={{
                    width: '100%',
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 16,
                    padding: '14px 18px',
                    fontSize: 16,
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                  }}
                >
                  <span style={{ fontSize: 22 }}>📞</span>
                  <span>Speak with {primaryCaretaker.name} Now</span>
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#FFF1F2',
                borderRadius: 22,
                padding: '22px',
                border: '2.5px solid #FECDD3',
                boxShadow: '0 4px 16px rgba(225, 29, 72, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>🚨</span>
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 900, color: '#9F1239', margin: 0 }}>
                    Need Immediate Caretaker Assistance?
                  </h4>
                  <span style={{ fontSize: 13, color: '#BE123C', fontWeight: 600 }}>
                    Sends an urgent audible notice to {primaryCaretaker ? primaryCaretaker.name : 'your caregiver'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                Tapping the button below will instantly alert your caregiver’s portal and phone with your name, time, and location.
              </p>

              <button
                type="button"
                onClick={handleAlertCaregiverNow}
                disabled={isAlerting}
                style={{
                  width: '100%',
                  backgroundColor: '#E11D48',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 18,
                  padding: '16px 20px',
                  fontSize: 17,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)',
                  minHeight: 56,
                }}
              >
                <span style={{ fontSize: 22 }}>🚨</span>
                <span>{isAlerting ? 'Sending Alert...' : 'Alert Caregiver Immediately'}</span>
              </button>
            </div>
          )}

          {/* Quick Audio Guide */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 18,
              padding: '16px 20px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                🔊 Spoken Voice Guide
              </div>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Listen to audio instructions explaining how to play and navigate
              </div>
            </div>

            <button
              type="button"
              onClick={handleSpeakHelpGuide}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Listen 🔊
            </button>
          </div>

          {/* Practice Safety Scenarios Button */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 18,
              padding: '16px 20px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                🛡️ Home Safety Scenarios
              </div>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Step-by-step guidance for kitchen stove, unexpected doorbells, and sudden dizziness
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onTriggerEmergency();
              }}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#2563EB',
                border: '1.5px solid #93C5FD',
                borderRadius: 14,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Practice Steps →
            </button>
          </div>

          {/* FAQ Accordions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: '14px 18px',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                ❓ Does NER-MIND work completely offline?
              </div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>
                Yes! NER-MIND is 100% offline-native. All 10 cognitive games, voice guides, daily routines, and family memories run directly on your phone with zero internet required.
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: '14px 18px',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                ❓ How do I talk to my family or doctor?
              </div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>
                Tap the green <strong>"Call"</strong> icon in the bottom menu to see large photos of your family members and doctor. Tapping any card starts a call immediately!
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
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
              borderRadius: 14,
              padding: '10px 24px',
              fontSize: 15,
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
