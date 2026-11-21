import { openDB, IDBPDatabase } from 'idb';
import {
  CognitiveObservation,
  PersonalMemoryProfile,
  SyncEvent,
  SyncEventType,
  computeIdempotencyHash,
  SyncBatchPayload,
  TransferEvaluation,
  PersonalCognitiveModel,
  PersonalizationEngine,
  createInitialPersonalModel,
  CognitiveDomain,
} from '@ner-mind/core';
import { LocalAuthService } from '../auth/localAuthService.js';

export const DEFAULT_NER_PROFILE: PersonalMemoryProfile = {
  patientId: 'patient-ner-001',
  displayName: 'Bhaben Sharma',
  preferredLanguage: 'en',
  secondaryLanguage: 'as',
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
      id: 'obj-1',
      name: 'Assam Tea Leaves',
      category: 'kitchen',
      culturalRegionTag: 'NER',
      significanceHint: 'Fresh Orthodox garden tea',
      consentToUseInGames: true,
    },
    {
      id: 'obj-2',
      name: 'Bamboo Jaapi',
      category: 'craft',
      culturalRegionTag: 'NER',
      significanceHint: 'Traditional conical woven sun hat',
      consentToUseInGames: true,
    },
    {
      id: 'obj-3',
      name: 'Fresh Bamboo Shoot',
      category: 'kitchen',
      culturalRegionTag: 'NER',
      significanceHint: 'Seasonal cooking ingredient',
      consentToUseInGames: true,
    },
    {
      id: 'obj-4',
      name: 'Gamusa',
      category: 'personal',
      culturalRegionTag: 'NER',
      significanceHint: 'Handwoven red and white traditional cloth',
      consentToUseInGames: true,
    },
  ],
  familiarRoutines: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Morning Assam Tea Routine',
      steps: ['Boil water', 'Add tea leaves', 'Add splash of milk', 'Strain into cup'],
      timeOfDay: 'morning',
      consentToUseInSequencing: true,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Evening Garden Walk',
      steps: ['Put on slippers', 'Walk to backyard tea garden', 'Water basil plant'],
      timeOfDay: 'evening',
      consentToUseInSequencing: true,
    },
  ],
  familyContacts: [
    {
      id: 'cnt-1',
      fullName: 'Pranjal Sharma',
      relationship: 'Son (Caregiver)',
      phoneNumber: '+91 98640 12345',
      isEmergencyContact: true,
      photoConsentGranted: true,
      voiceConsentGranted: true,
    },
  ],
  consent: {
    status: 'granted',
    consentedBy: 'caregiver',
    grantedAt: '2026-09-01T10:00:00.000Z',
    dataRetentionDays: 365,
  },
};

export const SECONDARY_NER_PROFILE: PersonalMemoryProfile = {
  patientId: 'patient-ner-002',
  displayName: 'Anupama Barua',
  preferredLanguage: 'as',
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
      id: 'obj-2-1',
      name: 'Assam Silk Mekhela',
      category: 'personal',
      culturalRegionTag: 'NER',
      significanceHint: 'Muga silk traditional attire',
      consentToUseInGames: true,
    },
    {
      id: 'obj-2-2',
      name: 'Bell Metal Xorai',
      category: 'craft',
      culturalRegionTag: 'NER',
      significanceHint: 'Traditional Sarthebari bell metal offering tray',
      consentToUseInGames: true,
    },
  ],
  familiarRoutines: [
    {
      id: 'routine-2-1',
      title: 'Morning Prayer & Flowers',
      steps: ['Wash hands', 'Collect hibiscus flowers', 'Light oil lamp', 'Chant peace prayer'],
      timeOfDay: 'morning',
      consentToUseInSequencing: true,
    },
  ],
  familyContacts: [
    {
      id: 'cnt-2-1',
      fullName: 'Anita Barua',
      relationship: 'Daughter (Caregiver)',
      phoneNumber: '+91 98640 54321',
      isEmergencyContact: true,
      photoConsentGranted: true,
      voiceConsentGranted: true,
    },
  ],
  consent: {
    status: 'granted',
    consentedBy: 'caregiver',
    grantedAt: '2026-09-01T10:00:00.000Z',
    dataRetentionDays: 365,
  },
};

const DB_NAME = 'ner_mind_db';
const DB_VERSION = 6;

export type RecognitionCategory = 'family' | 'friends' | 'animals' | 'plants' | 'objects';
export interface RecognitionImage {
  id: string; patientId: string; name: string; category: RecognitionCategory;
  description: string; relationship?: string; mimeType: string; image: Blob; voice?: Blob; voiceMimeType?: string;
  includeInPersonGame?: boolean; createdAt: string; updatedAt: string;
}
interface StoredRecognitionImage extends Omit<RecognitionImage, 'image' | 'voice' | 'name' | 'description' | 'relationship' | 'includeInPersonGame'> {
  encryptedImage: ArrayBuffer;
  encryptedMetadata: ArrayBuffer;
  iv: ArrayBuffer;
  metadataIv: ArrayBuffer;
  encryptedVoice?: ArrayBuffer;
  voiceIv?: ArrayBuffer;
}
export interface RecognitionAttempt {
  id: string; patientId: string; category: RecognitionCategory; imageId: string;
  correct: boolean; durationMs: number; difficulty: 'easy' | 'medium' | 'hard'; answeredAt: string;
  activity?: 'photo-recognition' | 'identify-person';
}

/**
 * Robust IndexedDB storage service fulfilling Phase 2.3A requirements:
 * - 100% durable IndexedDB backing for profiles, observations, outbox events, and transfer history.
 * - Idempotent one-time migration from legacy localStorage.
 * - Memory caching for synchronous-speed React state updates without rendering empty/flashing UI states.
 * - In-memory fallback if IndexedDB is not supported in the execution environment (e.g., Node.js unit tests).
 */
export class IndexedDbStorageService {
  private static dbPromise: Promise<IDBPDatabase> | null = null;
  private static sequenceCounter = 0;
  private static initialized = false;

  // In-memory cache synced with IndexedDB
  private static cachedProfile: PersonalMemoryProfile = DEFAULT_NER_PROFILE;
  private static cachedObservations: CognitiveObservation[] = [];
  private static cachedOutbox: SyncEvent[] = [];
  private static cachedTransfers: TransferEvaluation[] = [];
  private static cachedPersonalModel: PersonalCognitiveModel = createInitialPersonalModel(DEFAULT_NER_PROFILE.patientId);
  private static cachedRecentFingerprints: Map<string, string[]> = new Map();

  // Memory fallback storage for non-browser/test environments
  private static memoryStore = {
    profile: new Map<string, PersonalMemoryProfile>(),
    observations: new Map<string, CognitiveObservation>(),
    outbox: new Map<string, SyncEvent>(),
    transfers: [] as TransferEvaluation[],
    personalModel: new Map<string, PersonalCognitiveModel>(),
    recentTasks: new Map<string, any>(),
    recognitionImages: new Map<string, RecognitionImage>(),
    recognitionAttempts: [] as RecognitionAttempt[],
  };

  public static isReady(): boolean {
    return this.initialized;
  }

  public static async getDB(): Promise<IDBPDatabase | null> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return null;
    }

    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('patient_profile')) {
            db.createObjectStore('patient_profile', { keyPath: 'patientId' });
          }
          if (!db.objectStoreNames.contains('observations')) {
            const obsStore = db.createObjectStore('observations', { keyPath: 'id' });
            obsStore.createIndex('idx_patientId', 'patientId');
            obsStore.createIndex('idx_domain', 'domain');
            obsStore.createIndex('idx_timestamp', 'timestamp');
          }
          if (!db.objectStoreNames.contains('sync_outbox')) {
            const outboxStore = db.createObjectStore('sync_outbox', { keyPath: 'eventId' });
            outboxStore.createIndex('idx_status', 'status');
            outboxStore.createIndex('idx_sequence', 'clientSequenceNumber');
          }
          if (!db.objectStoreNames.contains('transfer_history')) {
            const transferStore = db.createObjectStore('transfer_history', { keyPath: 'id', autoIncrement: true });
            transferStore.createIndex('idx_patientId', 'patientId');
          }
          if (!db.objectStoreNames.contains('personal_model')) {
            db.createObjectStore('personal_model', { keyPath: 'patientId' });
          }
          if (!db.objectStoreNames.contains('recent_tasks')) {
            db.createObjectStore('recent_tasks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('recognition_images')) {
            db.createObjectStore('recognition_images', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('recognition_attempts')) {
            db.createObjectStore('recognition_attempts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('recognition_crypto_keys')) {
            db.createObjectStore('recognition_crypto_keys');
          }
          if (!db.objectStoreNames.contains('app_data')) {
            db.createObjectStore('app_data');
          }
        },
      });
    }
    return this.dbPromise;
  }

  /**
   * Initializes the IndexedDB storage service during app bootstrap:
   * 1. Opens IndexedDB connection
   * 2. Migrates legacy localStorage data if required
   * 3. Preloads patient profile, observations, transfer history, personal model, and sync outbox into memory cache
   */
  public static async init(): Promise<void> {
    await this.migrateFromLocalStorageIfNeeded();
    const db = await this.getDB();
    const activePid = this.getActivePatientId();

    if (db) {
      // 0. Hydrate app_data from IndexedDB to localStorage if needed
      if (db.objectStoreNames.contains('app_data')) {
        try {
          const keys = await db.getAllKeys('app_data');
          for (const k of keys) {
            const keyStr = String(k);
            if (typeof localStorage !== 'undefined' && !localStorage.getItem(keyStr)) {
              const val = await db.get('app_data', k);
              if (val !== undefined && val !== null) {
                localStorage.setItem(keyStr, JSON.stringify(val));
              }
            }
          }
        } catch { }
      }

      // 1. Profile: Load active profile for activePid
      let p = await db.get('patient_profile', activePid);
      if (!p && typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`ner_mind_patient_profile_${activePid}`);
        if (raw) {
          try {
            p = JSON.parse(raw);
            await db.put('patient_profile', p);
          } catch { }
        }
      }
      if (!p) {
        p = await db.get('patient_profile', DEFAULT_NER_PROFILE.patientId);
      }
      if (p) {
        this.cachedProfile = p;
        this.activePatientId = p.patientId;
      } else {
        await db.put('patient_profile', DEFAULT_NER_PROFILE);
        this.cachedProfile = DEFAULT_NER_PROFILE;
        this.activePatientId = DEFAULT_NER_PROFILE.patientId;
      }

      // 2. Observations
      this.cachedObservations = (await db.getAll('observations')) || [];

      // 3. Outbox
      this.cachedOutbox = (await db.getAll('sync_outbox')) || [];
      for (const e of this.cachedOutbox) {
        if (e.clientSequenceNumber > this.sequenceCounter) {
          this.sequenceCounter = e.clientSequenceNumber;
        }
      }

      // 4. Transfers
      this.cachedTransfers = (await db.getAll('transfer_history')) || [];

      // 5. Personal Cognitive Model (Continual Online Learning)
      const model = await db.get('personal_model', this.activePatientId);
      if (model) {
        this.cachedPersonalModel = model;
      } else if (this.cachedObservations.length > 0) {
        this.cachedPersonalModel = PersonalizationEngine.rebuildPersonalModelFromObservations(
          this.activePatientId,
          this.cachedObservations.filter((o) => o.patientId === this.activePatientId),
          this.cachedTransfers.filter((t) => t.patientId === this.activePatientId)
        );
        await db.put('personal_model', this.cachedPersonalModel);
      } else {
        this.cachedPersonalModel = createInitialPersonalModel(this.activePatientId);
        await db.put('personal_model', this.cachedPersonalModel);
      }

      // 6. Recent Tasks
      const recentRecords = (await db.getAll('recent_tasks')) || [];
      this.cachedRecentFingerprints.clear();
      recentRecords.forEach((r: any) => {
        const key = `${r.patientId}:${r.domain}`;
        const list = this.cachedRecentFingerprints.get(key) || [];
        this.cachedRecentFingerprints.set(key, [...list, r.fingerprint].slice(-30));
      });
    } else {
      // In-memory fallback
      if (!this.memoryStore.profile.has(this.activePatientId)) {
        this.memoryStore.profile.set(DEFAULT_NER_PROFILE.patientId, DEFAULT_NER_PROFILE);
      }
      this.cachedProfile = this.memoryStore.profile.get(this.activePatientId) || DEFAULT_NER_PROFILE;
      this.cachedObservations = Array.from(this.memoryStore.observations.values());
      this.cachedOutbox = Array.from(this.memoryStore.outbox.values());
      this.cachedTransfers = [...this.memoryStore.transfers];

      if (this.memoryStore.personalModel.has(this.activePatientId)) {
        this.cachedPersonalModel = this.memoryStore.personalModel.get(this.activePatientId)!;
      } else if (this.cachedObservations.length > 0) {
        this.cachedPersonalModel = PersonalizationEngine.rebuildPersonalModelFromObservations(
          this.activePatientId,
          this.cachedObservations.filter((o) => o.patientId === this.activePatientId),
          this.cachedTransfers.filter((t) => t.patientId === this.activePatientId)
        );
        this.memoryStore.personalModel.set(this.activePatientId, this.cachedPersonalModel);
      } else {
        this.cachedPersonalModel = createInitialPersonalModel(this.activePatientId);
        this.memoryStore.personalModel.set(this.activePatientId, this.cachedPersonalModel);
      }

      this.cachedRecentFingerprints.clear();
      for (const r of this.memoryStore.recentTasks.values()) {
        const key = `${r.patientId}:${r.domain}`;
        const list = this.cachedRecentFingerprints.get(key) || [];
        this.cachedRecentFingerprints.set(key, [...list, r.fingerprint].slice(-30));
      }
    }

    this.initialized = true;
  }

  /**
   * Performs an idempotent one-time migration from legacy localStorage to IndexedDB.
   */
  public static async migrateFromLocalStorageIfNeeded(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;

    try {
      const rawProfile = localStorage.getItem('ner_mind_patient_profile');
      const rawObs = localStorage.getItem('ner_mind_observations');
      const rawOutbox = localStorage.getItem('ner_mind_sync_outbox');

      if (!rawProfile && !rawObs && !rawOutbox) {
        return false;
      }

      const db = await this.getDB();

      if (db) {
        const tx = db.transaction(['patient_profile', 'observations', 'sync_outbox'], 'readwrite');
        if (rawProfile) {
          const profile = JSON.parse(rawProfile);
          await tx.objectStore('patient_profile').put(profile);
          this.cachedProfile = profile;
        }
        if (rawObs) {
          const obsList: CognitiveObservation[] = JSON.parse(rawObs);
          for (const obs of obsList) {
            await tx.objectStore('observations').put(obs);
          }
          this.cachedObservations = obsList;
        }
        if (rawOutbox) {
          const outboxList: SyncEvent[] = JSON.parse(rawOutbox);
          for (const evt of outboxList) {
            await tx.objectStore('sync_outbox').put(evt);
            this.sequenceCounter = Math.max(this.sequenceCounter, evt.clientSequenceNumber);
          }
          this.cachedOutbox = outboxList;
        }
        await tx.done;
      } else {
        if (rawProfile) {
          const p = JSON.parse(rawProfile);
          this.memoryStore.profile.set(p.patientId, p);
          this.cachedProfile = p;
        }
        if (rawObs) {
          const obsList: CognitiveObservation[] = JSON.parse(rawObs);
          obsList.forEach(o => this.memoryStore.observations.set(o.id, o));
          this.cachedObservations = obsList;
        }
        if (rawOutbox) {
          const outboxList: SyncEvent[] = JSON.parse(rawOutbox);
          outboxList.forEach(e => this.memoryStore.outbox.set(e.eventId, e));
          this.cachedOutbox = outboxList;
        }
      }

      // Clear legacy localStorage keys and record migration marker
      localStorage.setItem('ner_mind_migrated_v1', 'true');
      localStorage.removeItem('ner_mind_patient_profile');
      localStorage.removeItem('ner_mind_observations');
      localStorage.removeItem('ner_mind_sync_outbox');
      return true;
    } catch (e) {
      console.warn('[IndexedDB] Migration warning:', e);
      return false;
    }
  }

  // --- PATIENT PROFILE & USER-SCOPED STORAGE ---
  private static activePatientId: string = 'patient-ner-001';

  public static getActivePatientId(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('ner_mind_active_patient_id');
      if (stored) return stored;
    }
    return this.activePatientId;
  }

  public static async setActivePatientId(patientId: string): Promise<PersonalMemoryProfile> {
    this.activePatientId = patientId;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ner_mind_active_patient_id', patientId);
    }
    const db = await this.getDB();
    if (db) {
      let p = await db.get('patient_profile', patientId);
      if (!p) {
        p = patientId === SECONDARY_NER_PROFILE.patientId
          ? SECONDARY_NER_PROFILE
          : { ...DEFAULT_NER_PROFILE, patientId, displayName: `Patient ${patientId}` };
        await db.put('patient_profile', p);
      }
      this.cachedProfile = p;
      return p;
    } else {
      let p = this.memoryStore.profile.get(patientId);
      if (!p) {
        p = patientId === SECONDARY_NER_PROFILE.patientId
          ? SECONDARY_NER_PROFILE
          : { ...DEFAULT_NER_PROFILE, patientId, displayName: `Patient ${patientId}` };
        this.memoryStore.profile.set(patientId, p);
      }
      this.cachedProfile = p;
      return p;
    }
  }

  /**
   * Returns all registered profiles on this device.
   * In Single-Device Profile Mode, exactly one active profile content is maintained at any time.
   */
  public static async getAllPatientProfiles(): Promise<PersonalMemoryProfile[]> {
    const current = this.getPatientProfile();
    return [current];
  }

  /**
   * Creates a new patient profile on this device.
   * Single Device Invariant: When a new profile is added, any previous profile
   * is automatically signed out and replaced as the sole active profile on this device.
   */
  public static async createPatientProfile(profile: PersonalMemoryProfile): Promise<PersonalMemoryProfile> {
    // 1. Terminate previous session to guarantee single profile per device
    LocalAuthService.logout();

    const previousId = this.activePatientId;

    const db = await this.getDB();
    if (db) {
      try {
        await db.clear('patient_profile');
      } catch { }
      await db.put('patient_profile', profile);
    } else {
      this.memoryStore.profile.clear();
      this.memoryStore.profile.set(profile.patientId, profile);
    }

    this.cachedProfile = profile;
    this.activePatientId = profile.patientId;

    if (typeof localStorage !== 'undefined') {
      // Clear previous active session and custom patient data
      localStorage.removeItem('ner_mind_active_session');
      localStorage.removeItem('ner_mind_local_session');
      if (previousId && previousId !== profile.patientId) {
        localStorage.removeItem(`ner_mind_patient_profile_${previousId}`);
      }
      localStorage.setItem('ner_mind_active_patient_id', profile.patientId);
      localStorage.setItem(`ner_mind_patient_profile_${profile.patientId}`, JSON.stringify(profile));
      localStorage.setItem('ner_mind_custom_patient_ids', JSON.stringify([profile.patientId]));
    }

    // Initialize fresh personal model for this single active patient
    const newModel = createInitialPersonalModel(profile.patientId);
    await this.savePersonalModel(newModel);

    await this.enqueueSyncEvent('memory_profile_updated', profile as any);
    return profile;
  }

  public static getPatientStorageKey(baseKey: string, patientId?: string): string {
    const id = patientId || this.getActivePatientId();
    return `${baseKey}_${id}`;
  }

  public static getUserScopedData<T>(baseKey: string, defaultFallback: T, patientId?: string): T {
    if (typeof localStorage === 'undefined') return defaultFallback;
    try {
      const scopedKey = this.getPatientStorageKey(baseKey, patientId);
      const stored = localStorage.getItem(scopedKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
        if (!Array.isArray(parsed) && parsed !== null) return parsed as unknown as T;
      }
      // Check legacy global key if patientId is primary default patient
      const legacy = localStorage.getItem(baseKey);
      if (legacy && (!patientId || patientId === DEFAULT_NER_PROFILE.patientId)) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
        if (!Array.isArray(parsed) && parsed !== null) return parsed as unknown as T;
      }
    } catch { }
    return defaultFallback;
  }

  public static setUserScopedData<T>(baseKey: string, data: T, patientId?: string): void {
    const scopedKey = this.getPatientStorageKey(baseKey, patientId);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(scopedKey, JSON.stringify(data));
        const id = patientId || this.getActivePatientId();
        if (id === DEFAULT_NER_PROFILE.patientId) {
          localStorage.setItem(baseKey, JSON.stringify(data));
        }
      } catch (e) {
        console.warn('[UserScopedStorage] Failed to save in localStorage:', e);
      }
    }

    // Persist permanently into IndexedDB app_data store
    this.getDB().then((db) => {
      if (db && db.objectStoreNames.contains('app_data')) {
        db.put('app_data', data, scopedKey).catch(() => { });
      }
    }).catch(() => { });
  }

  public static getPatientProfile(): PersonalMemoryProfile {
    return this.cachedProfile;
  }

  public static async savePatientProfile(profile: PersonalMemoryProfile): Promise<void> {
    this.cachedProfile = profile;
    const db = await this.getDB();
    if (db) {
      await db.put('patient_profile', profile);
    } else {
      this.memoryStore.profile.set(profile.patientId, profile);
    }
    await this.enqueueSyncEvent('memory_profile_updated', profile as any);
  }

  // --- OBSERVATIONS ---

  public static getObservations(): CognitiveObservation[] {
    return [...this.cachedObservations];
  }

  public static async recordObservation(observation: CognitiveObservation): Promise<void> {
    this.cachedObservations.push(observation);
    const db = await this.getDB();
    if (db) {
      await db.put('observations', observation);
    } else {
      this.memoryStore.observations.set(observation.id, observation);
    }

    // On-Device Continual Online Learning: Update Personal Cognitive Model
    this.cachedPersonalModel = PersonalizationEngine.updatePersonalModel(
      this.cachedPersonalModel,
      observation
    );
    if (db) {
      await db.put('personal_model', this.cachedPersonalModel);
    } else {
      this.memoryStore.personalModel.set(this.cachedPersonalModel.patientId, this.cachedPersonalModel);
    }

    await this.enqueueSyncEvent('observation_recorded', observation as any);
  }

  // --- TRANSFER EVALUATIONS ---

  public static getTransferHistory(): TransferEvaluation[] {
    return [...this.cachedTransfers];
  }

  public static async recordTransferEvaluation(evaluation: TransferEvaluation): Promise<void> {
    this.cachedTransfers.push(evaluation);
    const db = await this.getDB();
    if (db) {
      await db.put('transfer_history', evaluation);
    } else {
      this.memoryStore.transfers.push(evaluation);
    }

    // Continual Learning: Update Transfer Associations
    this.cachedPersonalModel = PersonalizationEngine.recordTransferResult(
      this.cachedPersonalModel,
      evaluation
    );
    if (db) {
      await db.put('personal_model', this.cachedPersonalModel);
    } else {
      this.memoryStore.personalModel.set(this.cachedPersonalModel.patientId, this.cachedPersonalModel);
    }

    await this.enqueueSyncEvent('transfer_evaluated', evaluation as any);
  }

  // --- PERSONAL COGNITIVE MODEL (ON-DEVICE CONTINUAL LEARNING) ---

  public static getPersonalModel(): PersonalCognitiveModel {
    return this.cachedPersonalModel;
  }

  public static async savePersonalModel(model: PersonalCognitiveModel): Promise<void> {
    this.cachedPersonalModel = model;
    const db = await this.getDB();
    if (db) {
      await db.put('personal_model', model);
    } else {
      this.memoryStore.personalModel.set(model.patientId, model);
    }
  }

  public static async rebuildPersonalModel(): Promise<PersonalCognitiveModel> {
    const profile = this.getPatientProfile();
    const obs = this.getObservations();
    const transfers = this.getTransferHistory();
    const rebuilt = PersonalizationEngine.rebuildPersonalModelFromObservations(
      profile.patientId,
      obs,
      transfers
    );
    await this.savePersonalModel(rebuilt);
    return rebuilt;
  }

  // --- RECENT TASKS & ANTI-REPETITION FINGERPRINTS ---

  public static getRecentTaskFingerprints(patientId?: string, domain?: CognitiveDomain): string[] {
    const pid = patientId || this.cachedProfile.patientId;
    if (!domain) return [];
    const key = `${pid}:${domain}`;
    return this.cachedRecentFingerprints.get(key) || [];
  }

  public static async recordTaskFingerprint(patientId: string, domain: CognitiveDomain, fingerprint: string): Promise<void> {
    const key = `${patientId}:${domain}`;
    const list = this.cachedRecentFingerprints.get(key) || [];
    const updated = [...list, fingerprint].slice(-30);
    this.cachedRecentFingerprints.set(key, updated);

    const record = {
      id: `${patientId}_${domain}_${fingerprint}`,
      patientId,
      domain,
      fingerprint,
      timestamp: new Date().toISOString(),
    };

    const db = await this.getDB();
    if (db) {
      await db.put('recent_tasks', record);
    } else {
      this.memoryStore.recentTasks.set(record.id, record);
    }
  }

  public static async getRecognitionImages(patientId: string): Promise<RecognitionImage[]> {
    const db = await this.getDB();
    if (!db) return Array.from(this.memoryStore.recognitionImages.values()).filter((item) => item.patientId === patientId);
    const records = (await db.getAll('recognition_images') as Array<RecognitionImage | StoredRecognitionImage>).filter((item) => item.patientId === patientId);
    const encrypted = records.filter((item): item is StoredRecognitionImage => 'encryptedImage' in item);
    if (encrypted.length === 0) return records as RecognitionImage[];
    const key = await this.getRecognitionKey(db, false);
    if (!key) throw new Error('Recognition image key is missing.');
    return Promise.all(records.map(async (item) => {
      if (!('encryptedImage' in item)) return item;
      const [plain, metadataPlain] = await Promise.all([
        crypto.subtle.decrypt({ name: 'AES-GCM', iv: item.iv }, key, item.encryptedImage),
        crypto.subtle.decrypt({ name: 'AES-GCM', iv: item.metadataIv }, key, item.encryptedMetadata),
      ]);
      const metadata = JSON.parse(new TextDecoder().decode(metadataPlain)) as Pick<RecognitionImage, 'name' | 'description' | 'relationship' | 'includeInPersonGame'>;
      const voice = item.encryptedVoice && item.voiceIv
        ? await crypto.subtle.decrypt({ name: 'AES-GCM', iv: item.voiceIv }, key, item.encryptedVoice)
        : undefined;
      return {
        ...item, ...metadata, image: new Blob([plain], { type: item.mimeType }),
        voice: voice ? new Blob([voice], { type: item.voiceMimeType || 'audio/webm' }) : undefined,
      } as RecognitionImage;
    }));
  }

  public static async saveRecognitionImage(image: RecognitionImage): Promise<void> {
    const db = await this.getDB();
    if (db) {
      if (!globalThis.crypto?.subtle) throw new Error('Secure photo storage is unavailable in this browser context.');
      const key = await this.getRecognitionKey(db, true);
      const randomIv = crypto.getRandomValues(new Uint8Array(12));
      const iv = randomIv.buffer.slice(randomIv.byteOffset, randomIv.byteOffset + randomIv.byteLength) as ArrayBuffer;
      const randomMetadataIv = crypto.getRandomValues(new Uint8Array(12));
      const metadataIv = randomMetadataIv.buffer.slice(randomMetadataIv.byteOffset, randomMetadataIv.byteOffset + randomMetadataIv.byteLength) as ArrayBuffer;
      const encryptedImage = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key!, await image.image.arrayBuffer());
      const encryptedMetadata = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: metadataIv }, key!, new TextEncoder().encode(JSON.stringify({
          name: image.name, description: image.description, relationship: image.relationship,
          includeInPersonGame: image.includeInPersonGame !== false,
        })),
      );
      let encryptedVoice: ArrayBuffer | undefined;
      let voiceIv: ArrayBuffer | undefined;
      if (image.voice) {
        const randomVoiceIv = crypto.getRandomValues(new Uint8Array(12));
        voiceIv = randomVoiceIv.buffer.slice(randomVoiceIv.byteOffset, randomVoiceIv.byteOffset + randomVoiceIv.byteLength) as ArrayBuffer;
        encryptedVoice = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: voiceIv }, key!, await image.voice.arrayBuffer());
      }
      const { image: _plainImage, voice: _plainVoice, name: _name, description: _description, relationship: _relationship, includeInPersonGame: _selected, ...metadata } = image;
      await db.put('recognition_images', { ...metadata, encryptedImage, encryptedMetadata, iv, metadataIv, encryptedVoice, voiceIv } satisfies StoredRecognitionImage);
    } else this.memoryStore.recognitionImages.set(image.id, image);
  }

  private static async getRecognitionKey(db: IDBPDatabase, create: boolean): Promise<CryptoKey | undefined> {
    const key = await db.get('recognition_crypto_keys', 'image-key') as CryptoKey | undefined;
    if (key || !create) return key;
    if (!globalThis.crypto?.subtle) throw new Error('Secure photo storage is unavailable in this browser context.');
    const newKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await db.put('recognition_crypto_keys', newKey, 'image-key');
    return newKey;
  }

  public static async deleteRecognitionImage(id: string): Promise<void> {
    const db = await this.getDB();
    if (db) await db.delete('recognition_images', id);
    else this.memoryStore.recognitionImages.delete(id);
  }

  public static async getRecognitionAttempts(patientId: string): Promise<RecognitionAttempt[]> {
    const db = await this.getDB();
    const records = db ? await db.getAll('recognition_attempts') as RecognitionAttempt[] : this.memoryStore.recognitionAttempts;
    return records.filter((item) => item.patientId === patientId);
  }

  public static async recordRecognitionAttempt(attempt: RecognitionAttempt): Promise<void> {
    const db = await this.getDB();
    if (db) await db.put('recognition_attempts', attempt);
    else {
      const existing = this.memoryStore.recognitionAttempts.findIndex((item) => item.id === attempt.id);
      if (existing >= 0) this.memoryStore.recognitionAttempts.splice(existing, 1);
      this.memoryStore.recognitionAttempts.push(attempt);
    }
  }

  // --- SYNC OUTBOX ---

  public static async enqueueSyncEvent(eventType: SyncEventType, payload: Record<string, unknown>): Promise<SyncEvent> {
    const profile = this.getPatientProfile();
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    this.sequenceCounter++;

    const hash = computeIdempotencyHash(eventId, profile.patientId, payload, timestamp);

    const event: SyncEvent = {
      eventId,
      patientId: profile.patientId,
      eventType,
      payload,
      clientCreatedAt: timestamp,
      clientSequenceNumber: this.sequenceCounter,
      idempotencyHash: hash,
      status: 'pending',
      retryCount: 0,
    };

    this.cachedOutbox.push(event);

    const db = await this.getDB();
    if (db) {
      await db.put('sync_outbox', event);
    } else {
      this.memoryStore.outbox.set(eventId, event);
    }

    return event;
  }

  public static getPendingSyncCount(): number {
    return this.cachedOutbox.filter(e => e.status === 'pending' || e.status === 'failed').length;
  }

  public static getPendingSyncEvents(): SyncEvent[] {
    return this.cachedOutbox.filter(e => e.status === 'pending' || e.status === 'failed');
  }

  public static async createSyncBatch(
    patientId: string,
    limit: number = 50,
    batchId: string = crypto.randomUUID()
  ): Promise<SyncBatchPayload | null> {
    const pending = this.cachedOutbox
      .filter(e => e.status === 'pending' || e.status === 'failed')
      .slice(0, limit);

    if (pending.length === 0) return null;

    const db = await this.getDB();
    if (db) {
      const tx = db.transaction('sync_outbox', 'readwrite');
      for (const e of pending) {
        e.status = 'syncing';
        await tx.store.put(e);
      }
      await tx.done;
    } else {
      for (const e of pending) {
        e.status = 'syncing';
        this.memoryStore.outbox.set(e.eventId, e);
      }
    }

    return {
      batchId,
      patientId,
      deviceTimestamp: new Date().toISOString(),
      events: [...pending],
    };
  }

  public static async acknowledgeSynced(eventIds: string[]): Promise<void> {
    const idSet = new Set(eventIds);
    for (const e of this.cachedOutbox) {
      if (idSet.has(e.eventId)) {
        e.status = 'synced';
      }
    }

    const db = await this.getDB();
    if (db) {
      const tx = db.transaction('sync_outbox', 'readwrite');
      for (const id of eventIds) {
        const item: SyncEvent | undefined = await tx.store.get(id);
        if (item) {
          item.status = 'synced';
          await tx.store.put(item);
        }
      }
      await tx.done;
    } else {
      for (const id of eventIds) {
        const item = this.memoryStore.outbox.get(id);
        if (item) {
          item.status = 'synced';
        }
      }
    }
  }

  public static async markSyncFailed(eventIds: string[], _reason?: string): Promise<void> {
    const idSet = new Set(eventIds);
    for (const e of this.cachedOutbox) {
      if (idSet.has(e.eventId)) {
        e.status = 'failed';
        e.retryCount = (e.retryCount || 0) + 1;
      }
    }

    const db = await this.getDB();
    if (db) {
      const tx = db.transaction('sync_outbox', 'readwrite');
      for (const id of eventIds) {
        const item: SyncEvent | undefined = await tx.store.get(id);
        if (item) {
          item.status = 'failed';
          item.retryCount = (item.retryCount || 0) + 1;
          await tx.store.put(item);
        }
      }
      await tx.done;
    } else {
      for (const id of eventIds) {
        const item = this.memoryStore.outbox.get(id);
        if (item) {
          item.status = 'failed';
          item.retryCount = (item.retryCount || 0) + 1;
        }
      }
    }
  }

  public static async resetForTesting(): Promise<void> {
    this.sequenceCounter = 0;
    this.cachedProfile = { ...DEFAULT_NER_PROFILE };
    this.cachedObservations = [];
    this.cachedOutbox = [];
    this.cachedTransfers = [];
    this.cachedPersonalModel = createInitialPersonalModel(DEFAULT_NER_PROFILE.patientId);
    this.cachedRecentFingerprints.clear();
    this.memoryStore.profile.clear();
    this.memoryStore.observations.clear();
    this.memoryStore.outbox.clear();
    this.memoryStore.transfers = [];
    this.memoryStore.personalModel.clear();
    this.memoryStore.recentTasks.clear();
    this.memoryStore.recognitionImages.clear();
    this.memoryStore.recognitionAttempts = [];

    const db = await this.getDB();
    if (db) {
      const tx = db.transaction(['patient_profile', 'observations', 'sync_outbox', 'transfer_history', 'personal_model', 'recent_tasks', 'recognition_images', 'recognition_attempts'], 'readwrite');
      await tx.objectStore('patient_profile').clear();
      await tx.objectStore('observations').clear();
      await tx.objectStore('sync_outbox').clear();
      await tx.objectStore('transfer_history').clear();
      await tx.objectStore('personal_model').clear();
      await tx.objectStore('recent_tasks').clear();
      await tx.objectStore('recognition_images').clear();
      await tx.objectStore('recognition_attempts').clear();
      await tx.done;
    }
    this.initialized = true;
  }
}
