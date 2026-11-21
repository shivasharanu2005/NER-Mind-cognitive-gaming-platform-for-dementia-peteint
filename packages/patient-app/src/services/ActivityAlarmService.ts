import { SpeechService } from '../audio/speechService.js';
import { OfflineStorageService } from '../storage/localStorage.js';
import { DEFAULT_PLAN, PlanItem, STORAGE_KEY_DAILY_PLAN } from '../components/patient/TodaysPlanView.js';
import { DEFAULT_REMINDERS, ReminderItem, STORAGE_KEY_REMINDERS } from '../components/patient/RemindersView.js';

export interface ActivityAlarmEvent {
  id: string;
  title: string;
  category: string;
  time: string;
  description: string;
  icon: string;
  source: 'plan' | 'reminder';
  patientName: string;
  domain?: string;
  medicineName?: string;
  prescribedInstructions?: string;
}

type AlarmListener = (event: ActivityAlarmEvent | null) => void;

/**
 * Real-time Daily Activity & Health Reminder Alarm Service
 * Monitors scheduled activity and reminder times on mobile devices and browsers.
 * Triggers multi-sensory alerts: Dementia-friendly audio chimes, device vibration,
 * spoken voice instructions (TTS), system notifications, and visual in-app notices.
 */
export class ActivityAlarmService {
  private static listeners: Set<AlarmListener> = new Set();
  private static activeAlarm: ActivityAlarmEvent | null = null;
  private static timerId: any = null;
  private static snoozedAlarms: Map<string, number> = new Map(); // id -> timestamp until which it is snoozed

  public static subscribe(listener: AlarmListener): () => void {
    this.listeners.add(listener);
    if (this.activeAlarm) {
      listener(this.activeAlarm);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(event: ActivityAlarmEvent | null): void {
    this.activeAlarm = event;
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.warn('[ActivityAlarm] Listener error:', err);
      }
    }
  }

  public static getActiveAlarm(): ActivityAlarmEvent | null {
    return this.activeAlarm;
  }

  public static dismissAlarm(): void {
    this.notifyListeners(null);
  }

  public static snoozeAlarm(minutes = 10): void {
    if (this.activeAlarm) {
      const until = Date.now() + minutes * 60 * 1000;
      this.snoozedAlarms.set(this.activeAlarm.id, until);
      SpeechService.speak(`Reminder snoozed for ${minutes} minutes.`);
      this.dismissAlarm();
    }
  }

  public static markActiveAlarmCompleted(): void {
    if (!this.activeAlarm) return;
    const { id, source } = this.activeAlarm;
    const activePatientId = OfflineStorageService.getActivePatientId();

    try {
      if (source === 'plan') {
        const currentPlans = OfflineStorageService.getUserScopedData<PlanItem[]>(
          STORAGE_KEY_DAILY_PLAN,
          DEFAULT_PLAN,
          activePatientId
        );
        const updated = currentPlans.map((p) =>
          p.id === id
            ? { ...p, isCompleted: true, completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            : p
        );
        OfflineStorageService.setUserScopedData(STORAGE_KEY_DAILY_PLAN, updated, activePatientId);
      } else {
        const currentReminders = OfflineStorageService.getUserScopedData<ReminderItem[]>(
          STORAGE_KEY_REMINDERS,
          DEFAULT_REMINDERS,
          activePatientId
        );
        const updated = currentReminders.map((r) =>
          r.id === id
            ? {
                ...r,
                patientAcknowledged: true,
                patientAcknowledgedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isCompleted: true,
              }
            : r
        );
        OfflineStorageService.setUserScopedData(STORAGE_KEY_REMINDERS, updated, activePatientId);
      }

      this.playDementiaFriendlyChime(true);
      SpeechService.speak('Well done! Activity marked as completed.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.warn('[ActivityAlarm] Failed to mark completed:', e);
    }

    this.dismissAlarm();
  }

  /**
   * Dementia-Friendly Soft Harmonic Chime using Web Audio API
   * Peaceful ascending sine triad (C5 -> E5 -> G5 -> C6).
   */
  public static playDementiaFriendlyChime(isSuccess = false, volumeMultiplier: number = 1.0): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const notes = isSuccess
        ? [523.25, 659.25, 783.99, 1046.5] // C5 -> E5 -> G5 -> C6 (celebratory)
        : [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 (gentle reminder chime)

      const peakGain = 0.18 * Math.max(0.2, Math.min(2.0, volumeMultiplier));

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.2);

        gain.gain.setValueAtTime(0, now + idx * 0.2);
        gain.gain.linearRampToValueAtTime(peakGain, now + idx * 0.2 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.2);
        osc.stop(now + idx * 0.2 + 0.6);
      });
    } catch (err) {
      console.warn('[ActivityAlarm] WebAudio chime error:', err);
    }
  }

  /**
   * Device vibration for tactile notification on mobile devices
   */
  public static triggerDeviceVibration(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 450]);
      } catch {}
    }
  }

  /**
   * Requests system notification permission
   */
  public static requestNotificationPermission(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }

  /**
   * Posts to system notification tray (Android drawer / lock screen)
   */
  public static showSystemNotification(event: ActivityAlarmEvent): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ Activity Time: ${event.title}`, {
          body: event.description || `It is ${event.time}. Time for your ${event.category} routine!`,
          icon: '/favicon.ico',
          tag: `activity_${event.id}`,
        });
      } catch {}
    }
  }

  /**
   * Parses time string e.g. "08:00 AM" into minutes from midnight
   */
  public static parseTimeToMinutes(timeStr: string): number {
    const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return -1;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  /**
   * Checks for activities and reminders due in the current minute
   */
  public static checkDueActivities(patientId?: string, patientName?: string): void {
    const currentPatientId = patientId || OfflineStorageService.getActivePatientId();
    const currentPatientName = patientName || OfflineStorageService.getPatientProfile()?.displayName || 'Friend';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayDateKey = now.toISOString().split('T')[0];
    const storageNotifiedKey = `ner_mind_notified_${currentPatientId}_${todayDateKey}`;

    let notifiedIds: string[] = [];
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageNotifiedKey);
        if (stored) notifiedIds = JSON.parse(stored);
      } catch {}
    }

    // 1. Check Daily Plan items
    const planItems = OfflineStorageService.getUserScopedData<PlanItem[]>(
      STORAGE_KEY_DAILY_PLAN,
      DEFAULT_PLAN,
      currentPatientId
    );

    for (const item of planItems) {
      if (item.isCompleted) continue;
      const actMinutes = this.parseTimeToMinutes(item.time);
      if (actMinutes < 0) continue;

      // Check if snoozed
      const snoozedUntil = this.snoozedAlarms.get(item.id);
      if (snoozedUntil && Date.now() < snoozedUntil) continue;

      // Within 2 minutes of scheduled time
      const diff = Math.abs(currentMinutes - actMinutes);
      if (diff <= 2 && !notifiedIds.includes(item.id)) {
        notifiedIds.push(item.id);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(storageNotifiedKey, JSON.stringify(notifiedIds));
          } catch {}
        }

        const event: ActivityAlarmEvent = {
          id: item.id,
          title: item.defaultTitle,
          category: item.category,
          time: item.time,
          description: item.description || item.defaultSubtitle,
          icon: item.icon,
          source: 'plan',
          patientName: currentPatientName,
          domain: item.domain,
        };

        this.triggerAlarm(event);
        return;
      }
    }

    // 2. Check Reminders items
    const reminderItems = OfflineStorageService.getUserScopedData<ReminderItem[]>(
      STORAGE_KEY_REMINDERS,
      DEFAULT_REMINDERS,
      currentPatientId
    );

    for (const rem of reminderItems) {
      if (rem.patientAcknowledged || rem.isCompleted) continue;
      const remMinutes = this.parseTimeToMinutes(rem.time);
      if (remMinutes < 0) continue;

      const snoozedUntil = this.snoozedAlarms.get(rem.id);
      if (snoozedUntil && Date.now() < snoozedUntil) continue;

      const diff = Math.abs(currentMinutes - remMinutes);
      if (diff <= 2 && !notifiedIds.includes(rem.id)) {
        notifiedIds.push(rem.id);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(storageNotifiedKey, JSON.stringify(notifiedIds));
          } catch {}
        }

        const event: ActivityAlarmEvent = {
          id: rem.id,
          title: rem.defaultTitle,
          category: rem.category,
          time: rem.time,
          description: rem.prescribedInstructions || rem.scheduleInfo || 'Scheduled health routine',
          icon: rem.icon,
          source: 'reminder',
          patientName: currentPatientName,
          medicineName: rem.medicineName,
          prescribedInstructions: rem.prescribedInstructions,
        };

        this.triggerAlarm(event);
        return;
      }
    }
  }

  /**
   * Triggers the complete multi-sensory alert on the mobile device
   */
  public static triggerAlarm(event: ActivityAlarmEvent): void {
    // 1. Play soft harmonic chime
    this.playDementiaFriendlyChime(false);

    // 2. Device tactile vibration
    this.triggerDeviceVibration();

    // 3. System Notification drawer
    this.showSystemNotification(event);

    // 4. Voice Instructions
    const spokenMessage = `Attention please. ${event.patientName ? `${event.patientName}, ` : ''}it is ${event.time}. Time for your activity: ${event.title}. ${event.description}`;
    setTimeout(() => {
      SpeechService.speak(spokenMessage);
    }, 600);

    // 5. Visual In-App Modal
    this.notifyListeners(event);
  }

  /**
   * Demo test alarm that caretakers and patients can trigger on-demand
   */
  public static triggerDemoAlarm(patientName?: string): void {
    const name = patientName || OfflineStorageService.getPatientProfile()?.displayName || 'Friend';
    const demoEvent: ActivityAlarmEvent = {
      id: `demo_alarm_${Date.now()}`,
      title: 'Nutritious Assam Tea & Morning Hydration',
      category: 'routine',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: 'Time for your daily warm refreshment and glass of lukewarm water. Hydration supports your memory and daily energy.',
      icon: '☕',
      source: 'plan',
      patientName: name,
    };
    this.triggerAlarm(demoEvent);
  }

  /**
   * Starts periodic interval checking for activity time
   */
  public static startAlarmWatcher(patientId?: string, patientName?: string): void {
    this.requestNotificationPermission();
    if (this.timerId) clearInterval(this.timerId);

    // Immediate check
    this.checkDueActivities(patientId, patientName);

    // Check every 25 seconds
    this.timerId = setInterval(() => {
      this.checkDueActivities(patientId, patientName);
    }, 25000);
  }

  public static stopAlarmWatcher(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
