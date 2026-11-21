import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CallingStorageService } from '../src/calling/callingStorage.js';
import { CallingService } from '../src/calling/callingService.js';
import { OfflineStorageService } from '../src/storage/localStorage.js';
import { CaretakerContact } from '@ner-mind/core';

describe('Real-Time Calling Feature & Caretaker Contact Management System', () => {
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

  it('1. Seeds and returns initial Caretaker Contacts linked to the active patient', () => {
    const contacts = CallingStorageService.getContacts('patient-ner-001');
    expect(contacts.length).toBeGreaterThanOrEqual(4);
    expect(contacts[0].name).toBe('Pranjal Sharma');
    expect(contacts[0].relationship).toContain('Son');
    expect(contacts[0].isPrimary).toBe(true);
    expect(contacts[0].patientId).toBe('patient-ner-001');
  });

  it('2. Caretaker can add, update, and delete contacts in real time', () => {
    let notified = false;
    const unsub = CallingStorageService.subscribe(() => {
      notified = true;
    });

    // Add contact
    const newContact = CallingStorageService.addContact({
      patientId: 'patient-ner-001',
      name: 'Dr. Barua',
      phoneOrUserId: '+91 94350 99887',
      relationship: 'Neurologist',
      avatarColor: '#059669',
      isPrimary: false,
      isEmergencyContact: true,
    });

    expect(newContact.id).toBeDefined();
    expect(notified).toBe(true);

    let contacts = CallingStorageService.getContacts('patient-ner-001');
    const found = contacts.find((c) => c.name === 'Dr. Barua');
    expect(found).toBeDefined();
    expect(found?.relationship).toBe('Neurologist');

    // Update contact
    CallingStorageService.updateContact({
      ...found!,
      relationship: 'Consulting Neurologist',
    });
    contacts = CallingStorageService.getContacts('patient-ner-001');
    const updated = contacts.find((c) => c.id === found!.id);
    expect(updated?.relationship).toBe('Consulting Neurologist');

    // Delete contact
    CallingStorageService.deleteContact(found!.id);
    contacts = CallingStorageService.getContacts('patient-ner-001');
    expect(contacts.find((c) => c.id === found!.id)).toBeUndefined();

    unsub();
  });

  it('3. Initiates 1-tap call from patient to caretaker and transitions through ringing state', async () => {
    const contact: CaretakerContact = {
      id: 'contact_test_1',
      patientId: 'patient-ner-001',
      name: 'Pranjal Sharma',
      phoneOrUserId: '+91 98640 12345',
      relationship: 'Son',
      isPrimary: true,
      isEmergencyContact: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let activeState: any = null;
    const unsub = CallingService.subscribeToCall((state) => {
      activeState = state;
    });

    await CallingService.startCall(contact, 'video');

    expect(activeState).not.toBeNull();
    expect(activeState?.remotePartyName).toBe('Pranjal Sharma');
    expect(activeState?.isCaller).toBe(true);
    expect(activeState?.status).toBe('ringing');
    expect(activeState?.callType).toBe('video');

    unsub();
    CallingService.endCall(false);
  });

  it('4. Real-time signaling handles incoming call, acceptance, duration timer, and ending', async () => {
    // Send simulated incoming call signal from Caretaker to Patient
    const incomingSignal = {
      callId: 'call_test_123',
      patientId: 'patient-ner-001',
      callerId: 'caregiver_pranjal',
      callerName: 'Pranjal Sharma (Caregiver)',
      receiverId: 'patient',
      receiverName: 'Bhaben Sharma',
      callType: 'video' as const,
      status: 'ringing' as const,
      iceCandidates: [],
      timestamp: Date.now(),
    };

    CallingService.sendSignal(incomingSignal);

    // Verify incoming call is captured
    const captured = CallingService.getIncomingSignal();
    expect(captured).not.toBeNull();
    expect(captured?.callerName).toBe('Pranjal Sharma (Caregiver)');

    // Accept call
    await CallingService.acceptCall();
    const active = CallingService.getActiveCall();
    expect(active).not.toBeNull();
    expect(active?.status).toBe('connected');
    expect(active?.remotePartyName).toBe('Pranjal Sharma (Caregiver)');

    // End call
    CallingService.endCall(false);
    expect(CallingService.getActiveCall()).toBeNull();

    // Verify call log was automatically recorded in call_logs collection
    const logs = CallingStorageService.getCallLogs('patient-ner-001');
    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[0];
    expect(lastLog.callerName).toBe('Pranjal Sharma (Caregiver)');
    expect(lastLog.status).toBe('answered');
  });

  it('5. Declining an incoming call logs a declined status', () => {
    const incomingSignal = {
      callId: 'call_test_declined',
      patientId: 'patient-ner-001',
      callerId: 'unknown_caller',
      callerName: 'Unknown',
      receiverId: 'patient',
      receiverName: 'Bhaben Sharma',
      callType: 'video' as const,
      status: 'ringing' as const,
      iceCandidates: [],
      timestamp: Date.now(),
    };

    CallingService.sendSignal(incomingSignal);
    CallingService.declineCall();

    const logs = CallingStorageService.getCallLogs('patient-ner-001');
    const declinedLog = logs.find((l) => l.callerId === 'unknown_caller');
    expect(declinedLog).toBeDefined();
    expect(declinedLog?.status).toBe('declined');
  });

  it('6. Exports Cloud Database Schema matching Firebase Firestore and Supabase collections', () => {
    const schema = CallingStorageService.exportCloudDatabaseSchema();
    expect(schema.collections).toContain('contacts');
    expect(schema.collections).toContain('call_logs');
    expect(schema.collections).toContain('call_signals');
    expect(schema.schemaDefinition.contacts).toBeDefined();
    expect(schema.schemaDefinition.call_logs).toBeDefined();
  });
});
