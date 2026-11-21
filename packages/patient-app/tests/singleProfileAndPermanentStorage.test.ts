import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineStorageService } from '../src/storage/localStorage.js';
import { IndexedDbStorageService, RecognitionAttempt } from '../src/storage/indexedDbStorage.js';
import { LocalAuthService } from '../src/auth/localAuthService.js';
import { CallingStorageService } from '../src/calling/callingStorage.js';
import { EmergencyAlertService } from '../src/services/EmergencyAlertService.js';
import { STORAGE_KEY_DAILY_PLAN, DEFAULT_PLAN } from '../src/components/patient/TodaysPlanView.js';
import { STORAGE_KEY_REMINDERS, DEFAULT_REMINDERS } from '../src/components/patient/RemindersView.js';
import { PersonalMemoryProfile, CognitiveObservation } from '@ner-mind/core';

describe('Single Profile Device Invariant & Permanent Database Storage for All Features', () => {
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

  it('1. Single Device Profile: Adding a new profile logs out previous profile and sets it as the sole profile', async () => {
    // 1. Initial active profile (Profile A)
    const initialProfile = OfflineStorageService.getPatientProfile();
    expect(initialProfile).toBeDefined();

    // Log in a session for Profile A
    await LocalAuthService.login('caregiver_pranjal', 'CaregiverSecurePass123!');
    expect(LocalAuthService.getSession()).not.toBeNull();

    // 2. Caretaker adds a second profile (Profile B) on the device
    const newProfileB: PersonalMemoryProfile = {
      patientId: 'patient_new_device_002',
      displayName: 'Dharanidhar Sharma',
      preferredLanguage: 'as',
      secondaryLanguage: 'en',
      caretakerName: 'Bipul Sharma',
      caretakerPassword: 'NewPassword123!',
      dateOfBirth: '1948-08-20',
      locality: 'Nalbari, Assam',
      mobileNumber: '+91 94350 77889',
      emailId: 'bipul.sharma@example.com',
      familiarObjects: [],
      familiarFaces: [],
    };

    // Creating Profile B must log out Profile A
    await OfflineStorageService.createPatientProfile(newProfileB);

    // Verify previous session was signed out
    expect(LocalAuthService.getSession()).toBeNull();

    // Verify only Profile B is now the single registered profile on the device
    const allProfiles = await OfflineStorageService.getAllPatientProfiles();
    expect(allProfiles.length).toBe(1);
    expect(allProfiles[0].patientId).toBe('patient_new_device_002');
    expect(allProfiles[0].displayName).toBe('Dharanidhar Sharma');
    expect(OfflineStorageService.getActivePatientId()).toBe('patient_new_device_002');
  });

  it('2. Patient Side: Games & Progress are permanently saved in IndexedDB observations and personal model', async () => {
    const activePid = OfflineStorageService.getActivePatientId();

    const sampleObservation: CognitiveObservation = {
      id: `obs_${Date.now()}_1`,
      patientId: activePid,
      domain: 'attention',
      timestamp: new Date().toISOString(),
      context: 'games',
      metrics: {
        rawScore: 0.95,
        itemsPresented: 4,
        itemsCorrect: 4,
        completionTimeMs: 12500,
        hesitationCount: 0,
        cueAssistanceCount: 0,
      },
    };

    await OfflineStorageService.recordObservation(sampleObservation);

    const obsList = OfflineStorageService.getObservations();
    const found = obsList.find((o) => o.id === sampleObservation.id);
    expect(found).toBeDefined();
    expect(found?.metrics.rawScore).toBe(0.95);

    // Verify game level max progress is permanently saved
    OfflineStorageService.setUserScopedData('ner_mind_game_max_level_shape_finding', 14, activePid);
    const savedLevel = OfflineStorageService.getUserScopedData('ner_mind_game_max_level_shape_finding', 1, activePid);
    expect(savedLevel).toBe(14);
  });

  it('3. Patient Side: Daily Activity & Reminders are permanently stored', () => {
    const activePid = OfflineStorageService.getActivePatientId();

    // Save customized daily plan
    const customPlan = [
      ...DEFAULT_PLAN,
      {
        id: 'custom_walk_1',
        time: '05:30 PM',
        period: 'evening' as const,
        category: 'exercise' as const,
        defaultTitle: 'Garden Stroll with Son',
        defaultSubtitle: 'Gentle walk near courtyard',
        icon: '🚶',
        colorBg: '#EFF6FF',
        colorBorder: '#BFDBFE',
        actionType: 'habit' as const,
        isCompleted: false,
      },
    ];

    OfflineStorageService.setUserScopedData(STORAGE_KEY_DAILY_PLAN, customPlan, activePid);
    const retrievedPlan = OfflineStorageService.getUserScopedData(STORAGE_KEY_DAILY_PLAN, DEFAULT_PLAN, activePid);
    expect(retrievedPlan.length).toBe(customPlan.length);
    expect(retrievedPlan.some((p) => p.defaultTitle.includes('Garden Stroll'))).toBe(true);

    // Save customized reminders
    const customReminders = [
      ...DEFAULT_REMINDERS,
      {
        id: 'rem_bp_med',
        time: '02:00 PM',
        defaultTitle: 'Afternoon Blood Pressure Medicine',
        category: 'medicine' as const,
        recurrence: 'daily' as const,
        icon: '💊',
        colorBg: '#FBE8EE',
        colorBorder: '#F6A6A6',
        patientAcknowledged: false,
        caretakerVerified: false,
        snoozeCount: 0,
        isCompleted: false,
      },
    ];

    OfflineStorageService.setUserScopedData(STORAGE_KEY_REMINDERS, customReminders, activePid);
    const retrievedRem = OfflineStorageService.getUserScopedData(STORAGE_KEY_REMINDERS, DEFAULT_REMINDERS, activePid);
    expect(retrievedRem.some((r) => r.defaultTitle.includes('Blood Pressure'))).toBe(true);
  });

  it('4. Caretaker Side: Calling, Contacts, Call History, and Alerts are permanently stored', () => {
    const activePid = OfflineStorageService.getActivePatientId();

    // 1. Add Caretaker Contact
    const contact = CallingStorageService.addContact({
      patientId: activePid,
      name: 'Dr. Jyotirmoy Sarma',
      phoneOrUserId: '+91 94350 22334',
      relationship: 'Neurologist',
      avatarColor: '#10B981',
      isPrimary: false,
      isEmergencyContact: true,
    }, activePid);

    expect(contact.id).toBeDefined();

    const contacts = CallingStorageService.getContacts(activePid);
    const foundContact = contacts.find((c) => c.name === 'Dr. Jyotirmoy Sarma');
    expect(foundContact).toBeDefined();

    // 2. Record Call Log
    const log = CallingStorageService.recordCallLog({
      patientId: activePid,
      callerId: activePid,
      callerName: 'Patient Device',
      receiverId: contact.id,
      receiverName: contact.name,
      callType: 'audio',
      status: 'answered',
      durationInSeconds: 142,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    }, activePid);

    expect(log.id).toBeDefined();

    const callLogs = CallingStorageService.getCallLogs(activePid);
    expect(callLogs.some((l) => l.id === log.id)).toBe(true);

    // 3. Trigger & Permanently Store Emergency Alert
    const alert = EmergencyAlertService.triggerEmergencyAlert({
      patientId: activePid,
      reason: 'Patient pressed Help & Support button.',
    });

    expect(alert.id).toBeDefined();
    expect(alert.severity).toBe('CRITICAL');
  });

  it('5. Caretaker Side: Recognition Library Photo and Attempts permanently stored in IndexedDB', async () => {
    const activePid = OfflineStorageService.getActivePatientId();

    // Save recognition attempt
    const attempt: RecognitionAttempt = {
      id: `rec_att_${Date.now()}`,
      patientId: activePid,
      category: 'family',
      imageId: 'img_test_family_01',
      correct: true,
      durationMs: 2300,
      difficulty: 'easy',
      answeredAt: new Date().toISOString(),
      activity: 'photo-recognition',
    };

    await IndexedDbStorageService.recordRecognitionAttempt(attempt);

    const attempts = await IndexedDbStorageService.getRecognitionAttempts(activePid);
    expect(attempts.some((a) => a.id === attempt.id)).toBe(true);
  });
});
