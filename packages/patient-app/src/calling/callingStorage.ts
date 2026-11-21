import { CaretakerContact, CallLog, CaretakerContactSchema, CallLogSchema } from '@ner-mind/core';
import { OfflineStorageService } from '../storage/localStorage.js';

export const STORAGE_KEY_CONTACTS = 'ner_mind_contacts_v2';
export const STORAGE_KEY_CALL_LOGS = 'ner_mind_call_logs_v2';

/**
 * Default seed contacts for North Eastern Region (NER) dementia patient companion
 */
const DEFAULT_CONTACTS: Omit<CaretakerContact, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    patientId: 'patient-ner-001',
    name: 'Pranjal Sharma',
    phoneOrUserId: '+91 98640 12345',
    relationship: 'Son (Primary Caregiver)',
    avatarColor: '#2563EB',
    isPrimary: true,
    isEmergencyContact: true,
  },
  {
    patientId: 'patient-ner-001',
    name: 'Ananya Sharma',
    phoneOrUserId: '+91 98640 67890',
    relationship: 'Daughter',
    avatarColor: '#D97706',
    isPrimary: false,
    isEmergencyContact: true,
  },
  {
    patientId: 'patient-ner-001',
    name: 'Dr. B. K. Hazarika',
    phoneOrUserId: '+91 94350 11223',
    relationship: 'Family Physician (Guwahati)',
    avatarColor: '#059669',
    isPrimary: false,
    isEmergencyContact: true,
  },
  {
    patientId: 'patient-ner-001',
    name: 'Jyoti Gogoi',
    phoneOrUserId: '+91 94350 44556',
    relationship: 'Home Care Nurse',
    avatarColor: '#7C3AED',
    isPrimary: false,
    isEmergencyContact: false,
  },
];

type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export const notifyCallingStorageChanged = () => {
  listeners.forEach((cb) => {
    try { cb(); } catch {}
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ner_mind_calling_storage_update'));
  }
};

export class CallingStorageService {
  /**
   * Subscribe to real-time changes in contacts or call logs
   */
  public static subscribe(cb: StorageListener): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  /**
   * Retrieves all contacts linked to the active patient
   */
  public static getContacts(patientId?: string): CaretakerContact[] {
    const activePid = patientId || OfflineStorageService.getActivePatientId();
    const stored = OfflineStorageService.getUserScopedData<CaretakerContact[]>(
      STORAGE_KEY_CONTACTS,
      [],
      activePid
    );

    if (!stored || stored.length === 0) {
      // Seed initial friendly contacts for the patient
      const now = new Date().toISOString();
      const seeded: CaretakerContact[] = DEFAULT_CONTACTS.map((c, idx) => ({
        ...c,
        id: `contact_${activePid}_${idx + 1}`,
        patientId: activePid,
        createdAt: now,
        updatedAt: now,
      }));
      OfflineStorageService.setUserScopedData(STORAGE_KEY_CONTACTS, seeded, activePid);
      return seeded;
    }

    return stored;
  }

  /**
   * Adds a new caretaker contact to the contacts collection
   */
  public static addContact(
    contact: Omit<CaretakerContact, 'id' | 'createdAt' | 'updatedAt'>,
    patientId?: string
  ): CaretakerContact {
    const activePid = patientId || contact.patientId || OfflineStorageService.getActivePatientId();
    const now = new Date().toISOString();
    const newContact: CaretakerContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      patientId: activePid,
      createdAt: now,
      updatedAt: now,
    };

    // Validate using Zod schema
    CaretakerContactSchema.parse(newContact);

    const current = this.getContacts(activePid);
    const updated = [newContact, ...current];
    OfflineStorageService.setUserScopedData(STORAGE_KEY_CONTACTS, updated, activePid);
    notifyCallingStorageChanged();
    return newContact;
  }

  /**
   * Updates an existing contact
   */
  public static updateContact(
    contact: CaretakerContact,
    patientId?: string
  ): CaretakerContact {
    const activePid = patientId || contact.patientId || OfflineStorageService.getActivePatientId();
    const now = new Date().toISOString();
    const validated: CaretakerContact = {
      ...contact,
      updatedAt: now,
    };

    CaretakerContactSchema.parse(validated);

    const current = this.getContacts(activePid);
    const updated = current.map((c) => (c.id === validated.id ? validated : c));
    OfflineStorageService.setUserScopedData(STORAGE_KEY_CONTACTS, updated, activePid);
    notifyCallingStorageChanged();
    return validated;
  }

  /**
   * Designates a contact as the primary caregiver and emergency responder
   */
  public static setPrimaryContact(contactId: string, patientId?: string): CaretakerContact[] {
    const activePid = patientId || OfflineStorageService.getActivePatientId();
    const current = this.getContacts(activePid);
    const updated = current.map((c) => ({
      ...c,
      isPrimary: c.id === contactId,
      isEmergencyContact: c.id === contactId ? true : c.isEmergencyContact,
      updatedAt: new Date().toISOString(),
    }));
    OfflineStorageService.setUserScopedData(STORAGE_KEY_CONTACTS, updated, activePid);
    notifyCallingStorageChanged();
    return updated;
  }

  /**
   * Deletes a contact from the contacts collection
   */
  public static deleteContact(contactId: string, patientId?: string): void {
    const activePid = patientId || OfflineStorageService.getActivePatientId();
    const current = this.getContacts(activePid);
    const updated = current.filter((c) => c.id !== contactId);
    OfflineStorageService.setUserScopedData(STORAGE_KEY_CONTACTS, updated, activePid);
    notifyCallingStorageChanged();
  }

  /**
   * Retrieves past call logs linked to the active patient
   */
  public static getCallLogs(patientId?: string): CallLog[] {
    const activePid = patientId || OfflineStorageService.getActivePatientId();
    return OfflineStorageService.getUserScopedData<CallLog[]>(
      STORAGE_KEY_CALL_LOGS,
      [],
      activePid
    );
  }

  /**
   * Automatically records a call log when a call concludes, is missed, or is declined
   */
  public static recordCallLog(
    logData: Omit<CallLog, 'id' | 'createdAt'>,
    patientId?: string
  ): CallLog {
    const activePid = patientId || logData.patientId || OfflineStorageService.getActivePatientId();
    const newLog: CallLog = {
      ...logData,
      id: `call_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      patientId: activePid,
      createdAt: new Date().toISOString(),
    };

    // Validate using Zod schema
    CallLogSchema.parse(newLog);

    const current = this.getCallLogs(activePid);
    const updated = [newLog, ...current];
    OfflineStorageService.setUserScopedData(STORAGE_KEY_CALL_LOGS, updated, activePid);
    notifyCallingStorageChanged();
    return newLog;
  }

  /**
   * Clears past call history
   */
  public static clearCallLogs(patientId?: string): void {
    const activePid = patientId || OfflineStorageService.getActivePatientId();
    OfflineStorageService.setUserScopedData(STORAGE_KEY_CALL_LOGS, [], activePid);
    notifyCallingStorageChanged();
  }

  /**
   * Generates a Firebase Firestore / Supabase schema export
   */
  public static exportCloudDatabaseSchema(): {
    collections: string[];
    schemaDefinition: Record<string, any>;
  } {
    return {
      collections: ['contacts', 'call_logs', 'call_signals'],
      schemaDefinition: {
        contacts: {
          id: 'string (UUID primary key)',
          patientId: 'string (foreign key references patients)',
          name: 'string',
          phoneOrUserId: 'string',
          relationship: 'string',
          photoUrl: 'string (optional photo URL)',
          avatarColor: 'string',
          isPrimary: 'boolean',
          isEmergencyContact: 'boolean',
          createdAt: 'timestamp (ISO 8601)',
          updatedAt: 'timestamp (ISO 8601)',
        },
        call_logs: {
          id: 'string (UUID primary key)',
          patientId: 'string (foreign key references patients)',
          callerId: 'string',
          callerName: 'string',
          receiverId: 'string',
          receiverName: 'string',
          callType: 'enum("video", "audio")',
          startTime: 'timestamp (ISO 8601)',
          endTime: 'timestamp (ISO 8601)',
          durationInSeconds: 'integer',
          status: 'enum("answered", "missed", "declined")',
          createdAt: 'timestamp (ISO 8601)',
        },
        call_signals: {
          callId: 'string',
          patientId: 'string',
          callerId: 'string',
          callerName: 'string',
          receiverId: 'string',
          receiverName: 'string',
          callType: 'enum("video", "audio")',
          status: 'enum("idle", "ringing", "connected", "declined", "missed", "ended")',
          sdpOffer: 'json / string',
          sdpAnswer: 'json / string',
          iceCandidates: 'array',
          timestamp: 'timestamp / integer',
        },
      },
    };
  }
}
