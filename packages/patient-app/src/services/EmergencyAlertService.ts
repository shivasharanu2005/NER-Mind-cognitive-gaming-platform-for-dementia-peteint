import { LocalCaregiverService, CaregiverAlertItem } from '../caregiver/localCaregiverService.js';
import { OfflineStorageService } from '../storage/localStorage.js';
import { SpeechService, SupportedAppLanguage } from '../audio/speechService.js';
import { CallingStorageService } from '../calling/callingStorage.js';

export interface EmergencyEvent {
  id: string;
  patientId: string;
  patientName: string;
  caretakerName?: string;
  caretakerPhone?: string;
  timestamp: string;
  reason: string;
  status: 'PENDING_REVIEW' | 'ACKNOWLEDGED';
  severity: 'CRITICAL';
}

type EmergencySubscriber = (event: EmergencyEvent | null) => void;

const EMERGENCY_STORAGE_KEY = 'ner_mind_emergency_broadcast_v2';
const EMERGENCY_CHANNEL_NAME = 'ner_mind_emergency_bus';

export class EmergencyAlertService {
  private static subscribers: Set<EmergencySubscriber> = new Set();
  private static activeEmergency: EmergencyEvent | null = null;
  private static broadcastChannel: BroadcastChannel | null = null;
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel(EMERGENCY_CHANNEL_NAME);
          this.broadcastChannel.onmessage = (event) => {
            if (event.data) {
              this.handleReceivedEmergency(event.data);
            }
          };
        }
      } catch (e) {
        console.warn('[EmergencyAlertService] BroadcastChannel not supported:', e);
      }

      window.addEventListener('storage', (event) => {
        if (event.key === EMERGENCY_STORAGE_KEY && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            this.handleReceivedEmergency(parsed);
          } catch {}
        }
      });
    }
  }

  public static subscribe(cb: EmergencySubscriber): () => void {
    this.init();
    this.subscribers.add(cb);
    cb(this.activeEmergency);
    return () => this.subscribers.delete(cb);
  }

  private static notifySubscribers(): void {
    const clone = this.activeEmergency ? { ...this.activeEmergency } : null;
    this.subscribers.forEach((cb) => {
      try { cb(clone); } catch {}
    });
  }

  public static getActiveEmergency(): EmergencyEvent | null {
    return this.activeEmergency;
  }

  /**
   * Main Dispatcher: Triggers an urgent Help & Support alert that reaches the Caretaker side
   */
  public static triggerEmergencyAlert(options?: {
    patientId?: string;
    patientName?: string;
    reason?: string;
  }): EmergencyEvent {
    this.init();
    const patientProfile = OfflineStorageService.getPatientProfile();
    const patientId = options?.patientId || patientProfile.patientId;
    const patientName = options?.patientName || patientProfile.displayName;
    const reason = options?.reason || 'Patient pressed the Help & Support emergency alert button.';

    // Look up primary caretaker contact
    const contacts = CallingStorageService.getContacts(patientId);
    const primaryCaretaker = contacts.find((c) => c.isPrimary) || contacts.find((c) => c.isEmergencyContact) || contacts[0];

    const emergencyEvent: EmergencyEvent = {
      id: `emergency_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      patientName,
      caretakerName: primaryCaretaker ? primaryCaretaker.name : patientProfile.caretakerName || 'Primary Caregiver',
      caretakerPhone: primaryCaretaker ? primaryCaretaker.phoneOrUserId : patientProfile.mobileNumber || '+91 98640 12345',
      timestamp: new Date().toISOString(),
      reason,
      status: 'PENDING_REVIEW',
      severity: 'CRITICAL',
    };

    this.activeEmergency = emergencyEvent;

    // 1. Save directly into Caretaker's persistent Alerts collection
    const currentAlerts = LocalCaregiverService.getAlerts(patientId);
    const newAlert: CaregiverAlertItem = {
      id: emergencyEvent.id,
      patientId,
      domain: 'EMERGENCY_SUPPORT',
      severity: 'CRITICAL',
      message: `🚨 URGENT PATIENT SOS: ${patientName} requested immediate assistance. Reason: ${reason}. Please check in on the patient immediately.`,
      status: 'PENDING_REVIEW',
      detectedAt: emergencyEvent.timestamp,
      observationWindow: 'Patient-Initiated Help & Support Alert',
    };

    // Place at the very top of alerts
    const updatedAlerts = [newAlert, ...currentAlerts.filter((a) => a.id !== newAlert.id)];
    LocalCaregiverService.saveAlerts(patientId, updatedAlerts);

    // 2. Broadcast to Caretaker Portal via BroadcastChannel & LocalStorage
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(emergencyEvent);
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(emergencyEvent));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('ner_mind_emergency_alert', { detail: emergencyEvent }));
      } catch {}
    }

    // 3. Audio & Haptic Feedback for Patient
    this.playEmergencyAlertSound();
    this.triggerDeviceVibration();

    // 4. Dementia Reassurance Voice Prompt
    const reassuranceText = `Help alert sent to ${emergencyEvent.caretakerName}. Please stay comfortable and seated. Help is on the way.`;
    SpeechService.speak(reassuranceText, 0.85, (patientProfile.preferredLanguage as SupportedAppLanguage) || 'en');

    // 5. System Notification to Mobile Drawer / Lockscreen
    this.dispatchSystemNotification(emergencyEvent);

    this.notifySubscribers();
    return emergencyEvent;
  }

  /**
   * Caretaker acknowledges the emergency alert
   */
  public static acknowledgeEmergency(alertId: string, reviewedBy = 'Caregiver'): void {
    if (this.activeEmergency && this.activeEmergency.id === alertId) {
      this.activeEmergency.status = 'ACKNOWLEDGED';
      this.notifySubscribers();
      setTimeout(() => {
        this.activeEmergency = null;
        this.notifySubscribers();
      }, 2000);
    }

    // Update Caretaker Alerts storage
    const patientProfile = OfflineStorageService.getPatientProfile();
    const alerts = LocalCaregiverService.getAlerts(patientProfile.patientId);
    const updated = alerts.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status: 'ACKNOWLEDGED' as const,
          acknowledgedBy: reviewedBy,
          acknowledgedAt: new Date().toISOString(),
        };
      }
      return a;
    });
    LocalCaregiverService.saveAlerts(patientProfile.patientId, updated);
  }

  private static handleReceivedEmergency(event: EmergencyEvent): void {
    const activePid = OfflineStorageService.getActivePatientId();
    if (event.patientId !== activePid) return;

    this.activeEmergency = event;
    this.playEmergencyAlertSound();
    this.triggerDeviceVibration();
    this.notifySubscribers();
  }

  private static playEmergencyAlertSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      // Urgent but soothing dual-tone chime (F5 -> A5 -> C6)
      const frequencies = [698.46, 880.00, 1046.50];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.14;

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch {}
  }

  private static triggerDeviceVibration(): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([500, 200, 500, 200, 1000]);
      } catch {}
    }
  }

  private static dispatchSystemNotification(event: EmergencyEvent): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification('🚨 NER-MIND Caregiver Emergency Alert', {
            body: `${event.patientName} requested immediate assistance. ${event.reason}`,
            icon: '/favicon.ico',
            tag: event.id,
          });
        }
      } catch {}
    }
  }
}
