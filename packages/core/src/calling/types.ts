import { z } from 'zod';

/**
 * Caretaker Contact Schema
 * Stored in `contacts` collection linked to `patientId`
 */
export const CaretakerContactSchema = z.object({
  id: z.string().min(1, 'Contact ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  name: z.string().min(1, 'Caretaker name is required'),
  phoneOrUserId: z.string().min(1, 'Phone or User ID is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  photoUrl: z.string().optional(),
  avatarColor: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isEmergencyContact: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CaretakerContact = z.infer<typeof CaretakerContactSchema>;

/**
 * Call Log Schema
 * Stored in `call_logs` collection
 */
export const CallStatusSchema = z.enum(['answered', 'missed', 'declined']);
export type CallStatus = z.infer<typeof CallStatusSchema>;

export const CallTypeSchema = z.enum(['video', 'audio']);
export type CallType = z.infer<typeof CallTypeSchema>;

export const CallLogSchema = z.object({
  id: z.string().min(1, 'Call log ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  callerId: z.string().min(1, 'Caller ID is required'),
  callerName: z.string().min(1, 'Caller name is required'),
  receiverId: z.string().min(1, 'Receiver ID is required'),
  receiverName: z.string().min(1, 'Receiver name is required'),
  callType: CallTypeSchema.default('video'),
  startTime: z.string(),
  endTime: z.string(),
  durationInSeconds: z.number().int().nonnegative(),
  status: CallStatusSchema,
  createdAt: z.string(),
});

export type CallLog = z.infer<typeof CallLogSchema>;

/**
 * Real-Time Call Signaling Schema
 * Used for WebRTC signaling state (ringing, connected, ended)
 */
export const CallSignalStateSchema = z.enum([
  'idle',
  'ringing',
  'connected',
  'declined',
  'missed',
  'ended',
]);
export type CallSignalState = z.infer<typeof CallSignalStateSchema>;

export const CallSignalSchema = z.object({
  callId: z.string(),
  patientId: z.string(),
  callerId: z.string(),
  callerName: z.string(),
  receiverId: z.string(),
  receiverName: z.string(),
  callType: CallTypeSchema.default('video'),
  status: CallSignalStateSchema,
  sdpOffer: z.any().optional(),
  sdpAnswer: z.any().optional(),
  iceCandidates: z.array(z.any()).default([]),
  timestamp: z.number(),
});

export type CallSignal = z.infer<typeof CallSignalSchema>;

/**
 * Active In-Call Session State
 */
export interface ActiveCallState {
  callId: string;
  patientId: string;
  remotePartyId: string;
  remotePartyName: string;
  remotePartyPhoto?: string;
  remotePartyRelationship?: string;
  callType: CallType;
  isCaller: boolean;
  status: CallSignalState;
  startTime: number | null;
  durationSeconds: number;
  isMuted: boolean;
  isVideoOff: boolean;
}
