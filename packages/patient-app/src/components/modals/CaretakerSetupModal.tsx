import React, { useState } from 'react';
import { SupportedLanguage } from '@ner-mind/core';
import { OfflineStorageService } from '../../storage/localStorage.js';
import { LocalAuthService } from '../../auth/localAuthService.js';
import { SpeechService, SUPPORTED_LANGUAGES_META } from '../../audio/speechService.js';

interface Props {
  isOpen: boolean;
  onProfileCreated: (newPatientId: string) => void;
  onExploreDemo: () => void;
  onClose?: () => void;
  isInitialOnboarding?: boolean;
}

export const CaretakerSetupModal: React.FC<Props> = ({
  isOpen,
  onProfileCreated,
  onExploreDemo,
  onClose,
  isInitialOnboarding = false,
}) => {
  // Form State
  const [patientName, setPatientName] = useState('');
  const [caretakerName, setCaretakerName] = useState('');
  const [caretakerPassword, setCaretakerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('1956-05-15');
  const [locality, setLocality] = useState('Guwahati, Assam');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [relationship, setRelationship] = useState('Son / Daughter');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate patient age in years
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 68;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const patientAge = calculateAge(dateOfBirth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!patientName.trim()) {
      setErrorMsg('Please enter the patient’s full name.');
      return;
    }
    if (!caretakerName.trim()) {
      setErrorMsg('Please enter the caretaker’s full name.');
      return;
    }
    if (!caretakerPassword.trim() || caretakerPassword.length < 6) {
      setErrorMsg('Caretaker security password must be at least 6 characters.');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMsg('Please enter caretaker mobile number for emergency notifications.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPatientId = `patient_${Date.now()}`;

      // 1. Construct new patient memory profile
      const newProfile: any = {
        patientId: newPatientId,
        displayName: patientName.trim(),
        preferredLanguage: language,
        secondaryLanguage: 'en',
        accessibility: {
          highContrast: true,
          fontSize: 'large',
          voiceInputEnabled: true,
          audioPromptsEnabled: true,
          speechRate: 0.85,
          minimumTouchTargetPx: 64,
        },
        familiarObjects: [
          {
            id: `obj_${Date.now()}_1`,
            name: 'Assam Tea Leaves',
            category: 'kitchen',
            culturalRegionTag: locality || 'NER',
            significanceHint: 'Fresh garden orthodox tea',
            consentToUseInGames: true,
          },
          {
            id: `obj_${Date.now()}_2`,
            name: 'Traditional Gamusa / Shawl',
            category: 'personal',
            culturalRegionTag: locality || 'NER',
            significanceHint: 'Handwoven traditional attire',
            consentToUseInGames: true,
          },
        ],
        familiarRoutines: [
          {
            id: `rt_${Date.now()}_1`,
            title: 'Morning Tea Routine',
            steps: ['Boil water', 'Add tea leaves', 'Add splash of milk', 'Pour into cup'],
            timeOfDay: 'morning',
            consentToUseInSequencing: true,
          },
          {
            id: `rt_${Date.now()}_2`,
            title: 'Evening Courtyard Stroll',
            steps: ['Put on slippers', 'Walk to garden', 'Water plants'],
            timeOfDay: 'evening',
            consentToUseInSequencing: true,
          },
        ],
        familyContacts: [
          {
            id: `cnt_${Date.now()}`,
            fullName: caretakerName.trim(),
            relationship: relationship || 'Caregiver',
            phoneNumber: mobileNumber.trim(),
            isEmergencyContact: true,
            photoConsentGranted: true,
            voiceConsentGranted: true,
          },
        ],
        consent: {
          status: 'granted',
          consentedBy: 'caregiver',
          grantedAt: new Date().toISOString(),
          dataRetentionDays: 365,
        },
        // Caretaker Details & Demographics
        caretakerName: caretakerName.trim(),
        caretakerPassword: caretakerPassword.trim(),
        dateOfBirth,
        locality: locality.trim(),
        mobileNumber: mobileNumber.trim(),
        emailId: emailId.trim(),
      };

      // 2. Persist in IndexedDbStorageService & set active
      await OfflineStorageService.createPatientProfile(newProfile);

      // 3. Register caretaker account in local offline authentication
      await LocalAuthService.registerCaretakerAccount(
        caretakerName.trim(),
        caretakerPassword.trim(),
        newPatientId,
        emailId.trim() || mobileNumber.trim()
      );

      // 4. Mark onboarding completed
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ner_mind_caretaker_onboarding_completed', 'true');
        localStorage.setItem(`ner_mind_patient_profile_${newPatientId}`, JSON.stringify(newProfile));
      }

      // 5. Sync SpeechService language immediately
      SpeechService.setLanguage(language as any);
      setTimeout(() => {
        SpeechService.speak(`Welcome, ${patientName.trim()}. Your cognitive gaming and daily memory assistance companion is ready.`);
      }, 500);

      onProfileCreated(newPatientId);
    } catch (err: any) {
      console.error('[CaretakerSetupModal Error]', err);
      setErrorMsg(err.message || 'Failed to create patient profile.');
    } finally {
      setIsSubmitting(false);
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
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-modal-title"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          maxWidth: 580,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '32px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '2px solid #E2E8F0',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#EAF4FF',
              color: '#1677D2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              marginBottom: 12,
              boxShadow: '0 6px 16px rgba(22, 119, 210, 0.15)',
            }}
          >
            🧠
          </div>
          <h2
            id="setup-modal-title"
            style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0' }}
          >
            {isInitialOnboarding ? 'Caretaker & Patient Profile Setup' : 'Create New Patient Profile'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Configure your elderly patient’s details, caretaker security password, language, and regional locality.
            100% offline & private.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: '#FFF1F2',
              color: '#BE123C',
              padding: '12px 16px',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 18,
              border: '1.5px solid #FECDD3',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Single Device Profile Notice */}
          <div
            style={{
              backgroundColor: '#EFF6FF',
              color: '#1E40AF',
              padding: '12px 16px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 700,
              border: '1.5px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>📱</span>
            <div>
              <div style={{ fontWeight: 800 }}>Single Profile Device Mode</div>
              <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 2 }}>
                Adding a new profile will automatically sign out and replace the previous profile on this device. All data is saved permanently in local database.
              </div>
            </div>
          </div>

          {/* Section 1: Patient Details */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 18,
              padding: 18,
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1677D2', letterSpacing: '0.04em' }}>
              👤 PATIENT INFORMATION
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                Patient Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Chandra Sharma"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 15,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 4, display: 'block' }}>
                  Approx Age: {patientAge} years
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Locality / Region *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Guwahati, Assam"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                Primary Spoken & Assisted Language *
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 15,
                  boxSizing: 'border-box',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {Object.entries(SUPPORTED_LANGUAGES_META).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {meta.flag} {meta.englishName} ({meta.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Caretaker Credentials & Contact */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 18,
              padding: 18,
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.04em' }}>
              🛡️ CARETAKER DETAILS & SECURITY CREDENTIALS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Caretaker Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anita Barua"
                  value={caretakerName}
                  onChange={(e) => setCaretakerName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 15,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 15,
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Daughter">Daughter</option>
                  <option value="Son">Son</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Professional Caregiver">Professional Caregiver / Nurse</option>
                  <option value="Health Worker">Health Worker / ASHA</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                Caretaker Portal Security Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters (for Caregiver Portal access)"
                  value={caretakerPassword}
                  onChange={(e) => setCaretakerPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 15,
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    fontSize: 16,
                    cursor: 'pointer',
                    color: '#64748B',
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              <span style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'block' }}>
                You will use this password to access the Caregiver Portal and adjust patient game levels.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="+91 98640 12345"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Email ID *
                </label>
                <input
                  type="email"
                  placeholder="caretaker@example.com"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: '#1677D2',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 16,
              padding: '16px',
              fontSize: 17,
              fontWeight: 900,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(22, 119, 210, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: 6,
            }}
          >
            <span>{isSubmitting ? '⏳' : '🚀'}</span>
            <span>{isSubmitting ? 'Creating Profile & Initializing Models...' : 'Save Profile & Launch Application'}</span>
          </button>

          {/* Secondary Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            {isInitialOnboarding ? (
              <button
                type="button"
                onClick={onExploreDemo}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: 8,
                  textDecoration: 'underline',
                }}
              >
                Or explore with Demo Patient (Bhaben Sharma) →
              </button>
            ) : (
              onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: 8,
                  }}
                >
                  Cancel
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
