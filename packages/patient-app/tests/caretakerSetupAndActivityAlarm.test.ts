import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineStorageService } from '../src/storage/localStorage.js';
import { LocalAuthService } from '../src/auth/localAuthService.js';
import { ActivityAlarmService, ActivityAlarmEvent } from '../src/services/ActivityAlarmService.js';
import { SpeechService } from '../src/audio/speechService.js';
import { PersonalMemoryProfile } from '@ner-mind/core';

describe('Caretaker Multi-User Profile Creation & Real-Time Activity Alarm System', () => {
  beforeEach(async () => {
    let store: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { store = {}; },
    };
    localStorage.clear();
    await OfflineStorageService.init();
    vi.restoreAllMocks();
  });

  it('1. Registers new patient profile with all 8 required profile details and scopes it properly', async () => {
    const newProfile: PersonalMemoryProfile = {
      patientId: 'patient_test_999',
      displayName: 'Amiya Baruah',
      caretakerName: 'Ratul Baruah',
      caretakerPassword: 'SecurePassword123!',
      dateOfBirth: '1952-04-10',
      locality: 'Jorhat, Assam',
      preferredLanguage: 'en',
      mobileNumber: '+919876543210',
      emailId: 'ratul.baruah@example.com',
      familiarObjects: [],
      familiarFaces: [],
    };

    // Save profile to storage
    await OfflineStorageService.createPatientProfile(newProfile);

    // Verify it appears in getAllPatientProfiles
    const allProfiles = await OfflineStorageService.getAllPatientProfiles();
    const retrieved = allProfiles.find((p) => p.patientId === 'patient_test_999');
    expect(retrieved).toBeDefined();
    expect(retrieved?.displayName).toBe('Amiya Baruah');
    expect(retrieved?.caretakerName).toBe('Ratul Baruah');
    expect(retrieved?.dateOfBirth).toBe('1952-04-10');
    expect(retrieved?.locality).toBe('Jorhat, Assam');
    expect(retrieved?.mobileNumber).toBe('+919876543210');
    expect(retrieved?.emailId).toBe('ratul.baruah@example.com');
  });

  it('2. Registers caretaker account and enables offline credentials authentication', async () => {
    await LocalAuthService.registerCaretakerAccount(
      'Ratul Baruah',
      'SecurePassword123!',
      'patient_test_999',
      'ratul.baruah@example.com'
    );

    // Try authenticating with valid credentials
    const session = await LocalAuthService.login(
      'ratul.baruah@example.com',
      'SecurePassword123!'
    );
    expect(session).toBeDefined();
    expect(session.patientId).toBe('patient_test_999');
    expect(session.displayName).toContain('Ratul Baruah');

    // Try authenticating with wrong password -> should fail
    await expect(
      LocalAuthService.login('ratul.baruah@example.com', 'WrongPassword!')
    ).rejects.toThrow();
  });

  it('3. Isolates daily plan and reminders when switching patient profiles', async () => {
    // Patient A data
    OfflineStorageService.setUserScopedData('ner_mind_todays_plan_v2', [{ id: 'act-A', title: 'Plan A' }], 'patient-A');

    // Patient B data
    OfflineStorageService.setUserScopedData('ner_mind_todays_plan_v2', [{ id: 'act-B', title: 'Plan B' }], 'patient-B');

    // Read back Patient A
    const planA = OfflineStorageService.getUserScopedData('ner_mind_todays_plan_v2', [], 'patient-A');
    expect(planA).toEqual([{ id: 'act-A', title: 'Plan A' }]);

    // Read back Patient B
    const planB = OfflineStorageService.getUserScopedData('ner_mind_todays_plan_v2', [], 'patient-B');
    expect(planB).toEqual([{ id: 'act-B', title: 'Plan B' }]);
    expect(planA).not.toEqual(planB);
  });

  it('4. Real-time ActivityAlarmService triggers alert notice, speech, and chime on demo alarm', async () => {
    const speakSpy = vi.spyOn(SpeechService, 'speak').mockImplementation(() => {});

    let receivedAlarm: ActivityAlarmEvent | null = null;
    const unsubscribe = ActivityAlarmService.subscribe((alarm) => {
      receivedAlarm = alarm;
    });

    // Trigger demo alarm
    ActivityAlarmService.triggerDemoAlarm('Amiya Baruah');

    expect(receivedAlarm).not.toBeNull();
    expect(receivedAlarm?.patientName).toBe('Amiya Baruah');
    expect(receivedAlarm?.title).toContain('Assam Tea');
    expect(receivedAlarm?.category).toBe('routine');

    // Wait for the 600ms chime delay before speech starts
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(speakSpy).toHaveBeenCalled();

    // Mark completed
    ActivityAlarmService.markActiveAlarmCompleted();
    const active = ActivityAlarmService.getActiveAlarm();
    expect(active).toBeNull();

    unsubscribe();
  });

  it('5. Snooze functionality reschedules alarm reminder safely', () => {
    ActivityAlarmService.triggerDemoAlarm('Amiya Baruah');
    expect(ActivityAlarmService.getActiveAlarm()).not.toBeNull();

    // Snooze 10 minutes
    ActivityAlarmService.snoozeAlarm(10);
    expect(ActivityAlarmService.getActiveAlarm()).toBeNull();
  });
});
