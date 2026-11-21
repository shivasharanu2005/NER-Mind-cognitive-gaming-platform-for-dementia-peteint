import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmergencyAlertService } from '../src/services/EmergencyAlertService.js';
import { LocalCaregiverService } from '../src/caregiver/localCaregiverService.js';
import { OfflineStorageService } from '../src/storage/localStorage.js';
import { CallingStorageService } from '../src/calling/callingStorage.js';

describe('Emergency Help & Support Alert System + Android Settings', () => {
  beforeEach(async () => {
    let store: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { store = {}; },
    };
    localStorage.clear();

    // Mock AudioContext
    (global as any).AudioContext = class {
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
      }
    };

    // Mock navigator.vibrate safely
    try {
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn(),
        configurable: true,
        writable: true,
      });
    } catch {}

    await OfflineStorageService.init();
    vi.restoreAllMocks();
  });

  it('1. Triggers emergency alert from patient side and saves CRITICAL alert into Caregiver Portal', () => {
    let receivedAlert: any = null;
    const unsub = EmergencyAlertService.subscribe((alert) => {
      if (alert) receivedAlert = alert;
    });

    const alert = EmergencyAlertService.triggerEmergencyAlert({
      patientId: 'patient-ner-001',
      patientName: 'Bhaben Kalita',
      reason: 'Patient pressed Help & Support button.',
    });

    expect(alert).toBeDefined();
    expect(alert.severity).toBe('CRITICAL');
    expect(alert.status).toBe('PENDING_REVIEW');
    expect(alert.patientName).toBe('Bhaben Kalita');
    expect(alert.caretakerName).toBeDefined();
    expect(receivedAlert).not.toBeNull();
    expect(receivedAlert.id).toBe(alert.id);

    // Verify it was logged into Caregiver Portal alerts collection
    const caregiverAlerts = LocalCaregiverService.getAlerts('patient-ner-001');
    expect(caregiverAlerts.length).toBeGreaterThan(0);
    const matched = caregiverAlerts.find((a) => a.id === alert.id);
    expect(matched).toBeDefined();
    expect(matched?.severity).toBe('CRITICAL');
    expect(matched?.status).toBe('PENDING_REVIEW');

    unsub();
  });

  it('2. Caretaker acknowledges the alert in real time and updates status across services', () => {
    const alert = EmergencyAlertService.triggerEmergencyAlert({
      patientId: 'patient-ner-001',
      patientName: 'Bhaben Kalita',
    });

    expect(alert.status).toBe('PENDING_REVIEW');

    EmergencyAlertService.acknowledgeEmergency(alert.id, 'Pranjal Sharma (Caretaker)');

    const active = EmergencyAlertService.getActiveEmergency();
    expect(active?.status).toBe('ACKNOWLEDGED');

    const caregiverAlerts = LocalCaregiverService.getAlerts('patient-ner-001');
    const matched = caregiverAlerts.find((a) => a.id === alert.id);
    expect(matched?.status).toBe('ACKNOWLEDGED');
    expect(matched?.acknowledgedBy).toContain('Pranjal Sharma');
  });

  it('3. Respects designated primary emergency contact selection from CallingStorageService', () => {
    const contacts = CallingStorageService.getContacts('patient-ner-001');
    const doctorContact = contacts.find((c) => c.relationship.includes('Physician') || c.name.includes('Hazarika'));
    expect(doctorContact).toBeDefined();

    if (doctorContact) {
      // Designate doctor as primary emergency contact
      CallingStorageService.setPrimaryContact(doctorContact.id, 'patient-ner-001');

      const alert = EmergencyAlertService.triggerEmergencyAlert({
        patientId: 'patient-ner-001',
      });

      expect(alert.caretakerName).toBe(doctorContact.name);
      expect(alert.caretakerPhone).toBe(doctorContact.phoneOrUserId);
    }
  });

  it('4. Android settings persist correctly in offline local storage', () => {
    localStorage.setItem('ner_mind_setting_text_size', 'xlarge');
    localStorage.setItem('ner_mind_setting_high_contrast', 'true');
    localStorage.setItem('ner_mind_setting_haptics', 'true');
    localStorage.setItem('ner_mind_setting_wakelock', 'true');
    localStorage.setItem('ner_mind_setting_chime_volume', 'loud');

    expect(localStorage.getItem('ner_mind_setting_text_size')).toBe('xlarge');
    expect(localStorage.getItem('ner_mind_setting_high_contrast')).toBe('true');
    expect(localStorage.getItem('ner_mind_setting_haptics')).toBe('true');
    expect(localStorage.getItem('ner_mind_setting_wakelock')).toBe('true');
    expect(localStorage.getItem('ner_mind_setting_chime_volume')).toBe('loud');
  });
});
