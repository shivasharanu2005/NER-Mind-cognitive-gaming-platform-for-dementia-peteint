import {
  CallLog,
  CallSignal,
  ActiveCallState,
  CallType,
  CaretakerContact,
} from '@ner-mind/core';
import { CallingStorageService } from './callingStorage.js';
import { OfflineStorageService } from '../storage/localStorage.js';
import { SpeechService } from '../audio/speechService.js';

export type CallStateSubscriber = (state: ActiveCallState | null) => void;
export type IncomingCallSubscriber = (signal: CallSignal | null) => void;

const SIGNALING_STORAGE_KEY = 'ner_mind_active_call_signal';
const BROADCAST_CHANNEL_NAME = 'ner_mind_webrtc_signaling_bus';

export class CallingService {
  private static activeCall: ActiveCallState | null = null;
  private static incomingSignal: CallSignal | null = null;
  private static peerConnection: RTCPeerConnection | null = null;
  private static localStream: MediaStream | null = null;
  private static remoteStream: MediaStream | null = null;

  private static callSubscribers: Set<CallStateSubscriber> = new Set();
  private static incomingSubscribers: Set<IncomingCallSubscriber> = new Set();

  private static durationTimer: any = null;
  private static ringtoneAudioContext: AudioContext | null = null;
  private static ringtoneInterval: any = null;

  private static broadcastChannel: BroadcastChannel | null = null;
  private static isInitialized = false;

  /**
   * Initializes real-time signaling listeners (BroadcastChannel + LocalStorage for multi-window sync)
   */
  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.broadcastChannel.onmessage = (event) => {
            if (event.data) {
              this.handleIncomingSignal(event.data);
            }
          };
        }
      } catch (err) {
        console.warn('[CallingService] BroadcastChannel not supported, falling back to storage events:', err);
      }

      window.addEventListener('storage', (event) => {
        if (event.key === SIGNALING_STORAGE_KEY && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            this.handleIncomingSignal(parsed);
          } catch {}
        }
      });
    }
  }

  public static subscribeToCall(cb: CallStateSubscriber): () => void {
    this.callSubscribers.add(cb);
    cb(this.activeCall);
    return () => this.callSubscribers.delete(cb);
  }

  public static subscribeToIncoming(cb: IncomingCallSubscriber): () => void {
    this.incomingSubscribers.add(cb);
    cb(this.incomingSignal);
    return () => this.incomingSubscribers.delete(cb);
  }

  private static notifyCallChanged(): void {
    const clone = this.activeCall ? { ...this.activeCall } : null;
    this.callSubscribers.forEach((cb) => {
      try { cb(clone); } catch {}
    });
  }

  private static notifyIncomingChanged(): void {
    const clone = this.incomingSignal ? { ...this.incomingSignal } : null;
    this.incomingSubscribers.forEach((cb) => {
      try { cb(clone); } catch {}
    });
  }

  public static getActiveCall(): ActiveCallState | null {
    return this.activeCall;
  }

  public static getIncomingSignal(): CallSignal | null {
    return this.incomingSignal;
  }

  public static getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public static getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Dispatches a signaling payload to all peers via BroadcastChannel and Storage
   */
  public static sendSignal(signal: CallSignal): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(signal);
      } catch {}
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SIGNALING_STORAGE_KEY, JSON.stringify(signal));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }

    // Direct dispatch for headless/unit test environments
    if (typeof window === 'undefined' || !this.broadcastChannel) {
      this.handleIncomingSignal(signal);
    }
  }

  /**
   * Handles incoming signaling messages from peer
   */
  private static async handleIncomingSignal(signal: CallSignal): Promise<void> {
    const activePatientId = OfflineStorageService.getActivePatientId();

    // Verify signal is relevant for current patient session
    if (signal.patientId !== activePatientId) return;

    if (signal.status === 'ringing') {
      // If we are the receiver of the call
      if (this.activeCall && this.activeCall.callId === signal.callId) {
        // Already handling this call
        return;
      }

      this.incomingSignal = signal;
      this.playRingtone('incoming');
      this.triggerVibration();
      this.notifyIncomingChanged();
    } else if (signal.status === 'connected') {
      // Peer accepted our outgoing call
      this.stopRingtone();
      if (this.activeCall && this.activeCall.callId === signal.callId) {
        this.activeCall.status = 'connected';
        this.activeCall.startTime = Date.now();
        this.startDurationTimer();
        this.notifyCallChanged();

        if (signal.sdpAnswer && this.peerConnection) {
          try {
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription(signal.sdpAnswer)
            );
          } catch (e) {
            console.warn('[CallingService] Error setting remote description for answer:', e);
          }
        }
      }
    } else if (signal.status === 'declined' || signal.status === 'missed') {
      this.stopRingtone();
      if (this.activeCall && this.activeCall.callId === signal.callId) {
        this.cleanupMedia();
        // Record missed/declined log
        CallingStorageService.recordCallLog({
          patientId: this.activeCall.patientId,
          callerId: this.activeCall.isCaller ? 'patient' : this.activeCall.remotePartyId,
          callerName: this.activeCall.isCaller ? 'Patient' : this.activeCall.remotePartyName,
          receiverId: this.activeCall.isCaller ? this.activeCall.remotePartyId : 'patient',
          receiverName: this.activeCall.isCaller ? this.activeCall.remotePartyName : 'Patient',
          callType: this.activeCall.callType,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationInSeconds: 0,
          status: signal.status,
        });

        this.activeCall.status = signal.status;
        this.notifyCallChanged();
        setTimeout(() => {
          this.activeCall = null;
          this.notifyCallChanged();
        }, 1500);
      }
      this.incomingSignal = null;
      this.notifyIncomingChanged();
    } else if (signal.status === 'ended') {
      this.stopRingtone();
      if (this.activeCall && this.activeCall.callId === signal.callId) {
        this.endCall(false);
      }
      this.incomingSignal = null;
      this.notifyIncomingChanged();
    }
  }

  /**
   * Dementia-Friendly 1-Tap Outgoing Call
   * Initiates real-time audio/video call to a caretaker
   */
  public static async startCall(contact: CaretakerContact, callType: CallType = 'video'): Promise<void> {
    this.init();
    const patientProfile = OfflineStorageService.getPatientProfile();
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Set active call state
    this.activeCall = {
      callId,
      patientId: patientProfile.patientId,
      remotePartyId: contact.id,
      remotePartyName: contact.name,
      remotePartyPhoto: contact.photoUrl,
      remotePartyRelationship: contact.relationship,
      callType,
      isCaller: true,
      status: 'ringing',
      startTime: null,
      durationSeconds: 0,
      isMuted: false,
      isVideoOff: false,
    };
    this.notifyCallChanged();

    // Start acoustic ringback tone
    this.playRingtone('outgoing');

    // Announce voice reassurance for dementia patient
    SpeechService.speak(`Calling ${contact.name}. Please wait.`);

    // Initialize WebRTC
    await this.setupLocalMedia(callType);
    await this.createPeerConnection(callId, patientProfile.patientId, true);

    // Send initial ringing signal with SDP offer
    let offerDesc: any = null;
    if (this.peerConnection) {
      try {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        offerDesc = { type: offer.type, sdp: offer.sdp };
      } catch (e) {
        console.warn('[CallingService] PeerConnection offer error (running simulated WebRTC):', e);
      }
    }

    const signal: CallSignal = {
      callId,
      patientId: patientProfile.patientId,
      callerId: 'patient',
      callerName: patientProfile.displayName,
      receiverId: contact.id,
      receiverName: contact.name,
      callType,
      status: 'ringing',
      sdpOffer: offerDesc,
      iceCandidates: [],
      timestamp: Date.now(),
    };

    this.sendSignal(signal);
  }

  /**
   * Caretaker or Patient accepts an incoming call
   */
  public static async acceptCall(): Promise<void> {
    if (!this.incomingSignal) return;

    this.stopRingtone();
    const signal = this.incomingSignal;
    this.incomingSignal = null;
    this.notifyIncomingChanged();

    this.activeCall = {
      callId: signal.callId,
      patientId: signal.patientId,
      remotePartyId: signal.callerId,
      remotePartyName: signal.callerName,
      callType: signal.callType,
      isCaller: false,
      status: 'connected',
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isVideoOff: false,
    };
    this.notifyCallChanged();
    this.startDurationTimer();

    await this.setupLocalMedia(signal.callType);
    await this.createPeerConnection(signal.callId, signal.patientId, false);

    let answerDesc: any = null;
    if (this.peerConnection && signal.sdpOffer) {
      try {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.sdpOffer)
        );
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        answerDesc = { type: answer.type, sdp: answer.sdp };
      } catch (e) {
        console.warn('[CallingService] PeerConnection answer error:', e);
      }
    }

    const answerSignal: CallSignal = {
      ...signal,
      status: 'connected',
      sdpAnswer: answerDesc,
      timestamp: Date.now(),
    };

    this.sendSignal(answerSignal);
  }

  /**
   * Declines an incoming call
   */
  public static declineCall(): void {
    if (!this.incomingSignal) return;
    this.stopRingtone();
    const signal = this.incomingSignal;
    this.incomingSignal = null;
    this.notifyIncomingChanged();

    // Record call log
    CallingStorageService.recordCallLog({
      patientId: signal.patientId,
      callerId: signal.callerId,
      callerName: signal.callerName,
      receiverId: signal.receiverId,
      receiverName: signal.receiverName,
      callType: signal.callType,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationInSeconds: 0,
      status: 'declined',
    });

    const declineSignal: CallSignal = {
      ...signal,
      status: 'declined',
      timestamp: Date.now(),
    };
    this.sendSignal(declineSignal);
  }

  /**
   * Concludes an active call and records the call log
   */
  public static endCall(notifyPeer = true): void {
    this.stopRingtone();
    if (!this.activeCall) return;

    const call = this.activeCall;
    this.activeCall = null;
    this.cleanupMedia();
    this.stopDurationTimer();

    // Record call log in call_logs collection
    const startTimeISO = call.startTime ? new Date(call.startTime).toISOString() : new Date().toISOString();
    const endTimeISO = new Date().toISOString();
    const durationSec = call.durationSeconds || 0;
    const finalStatus: CallLog['status'] = durationSec > 0 ? 'answered' : (call.status === 'ringing' ? 'missed' : 'answered');

    CallingStorageService.recordCallLog({
      patientId: call.patientId,
      callerId: call.isCaller ? 'patient' : call.remotePartyId,
      callerName: call.isCaller ? 'Patient' : call.remotePartyName,
      receiverId: call.isCaller ? call.remotePartyId : 'patient',
      receiverName: call.isCaller ? call.remotePartyName : 'Patient',
      callType: call.callType,
      startTime: startTimeISO,
      endTime: endTimeISO,
      durationInSeconds: durationSec,
      status: finalStatus,
    });

    if (notifyPeer) {
      const endSignal: CallSignal = {
        callId: call.callId,
        patientId: call.patientId,
        callerId: call.isCaller ? 'patient' : call.remotePartyId,
        callerName: call.isCaller ? 'Patient' : call.remotePartyName,
        receiverId: call.isCaller ? call.remotePartyId : 'patient',
        receiverName: call.isCaller ? call.remotePartyName : 'Patient',
        callType: call.callType,
        status: 'ended',
        iceCandidates: [],
        timestamp: Date.now(),
      };
      this.sendSignal(endSignal);
    }

    this.notifyCallChanged();
    SpeechService.speak('Call ended safely.');
  }

  /**
   * Mute / unmute microphone audio
   */
  public static toggleMute(): boolean {
    if (!this.activeCall || !this.localStream) return false;
    const nextMute = !this.activeCall.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMute;
    });
    this.activeCall.isMuted = nextMute;
    this.notifyCallChanged();
    return nextMute;
  }

  /**
   * Enable / disable video camera
   */
  public static toggleVideo(): boolean {
    if (!this.activeCall || !this.localStream) return false;
    const nextVideoOff = !this.activeCall.isVideoOff;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = !nextVideoOff;
    });
    this.activeCall.isVideoOff = nextVideoOff;
    this.notifyCallChanged();
    return nextVideoOff;
  }

  /**
   * Starts local camera & microphone streams
   */
  private static async setupLocalMedia(callType: CallType): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video' ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });
    } catch (err) {
      console.warn('[CallingService] Media access denied or device unavailable, attempting audio-only:', err);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (audioErr) {
        console.warn('[CallingService] Audio device unavailable (using simulated streams):', audioErr);
      }
    }
  }

  /**
   * Creates standard RTCPeerConnection with public STUN servers
   */
  private static async createPeerConnection(
    _callId: string,
    _patientId: string,
    _isCaller: boolean
  ): Promise<void> {
    if (typeof RTCPeerConnection === 'undefined') return;

    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          this.notifyCallChanged();
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection?.connectionState === 'disconnected' ||
            this.peerConnection?.connectionState === 'failed') {
          console.log('[CallingService] Peer connection disconnected');
        }
      };
    } catch (e) {
      console.warn('[CallingService] RTCPeerConnection initialization warning:', e);
    }
  }

  private static cleanupMedia(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }
    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch {}
      this.peerConnection = null;
    }
  }

  private static startDurationTimer(): void {
    this.stopDurationTimer();
    this.durationTimer = setInterval(() => {
      if (this.activeCall && this.activeCall.status === 'connected') {
        this.activeCall.durationSeconds += 1;
        this.notifyCallChanged();
      }
    }, 1000);
  }

  private static stopDurationTimer(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  /**
   * Dementia-safe acoustic ringtone generation using Web Audio API
   */
  private static playRingtone(type: 'outgoing' | 'incoming'): void {
    if (typeof window === 'undefined') return;
    this.stopRingtone();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ringtoneAudioContext = new AudioCtx();
      const ctx = this.ringtoneAudioContext;

      if (type === 'outgoing') {
        // Outgoing gentle chime pattern: 440Hz & 480Hz soft dual-tone
        const playBurst = () => {
          if (!this.ringtoneAudioContext || this.ringtoneAudioContext.state === 'closed') return;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.value = 440;
          osc2.frequency.value = 480;

          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);
        };

        playBurst();
        this.ringtoneInterval = setInterval(playBurst, 2800);
      } else {
        // Incoming joyful melodic triad: 523Hz (C5) -> 659Hz (E5) -> 784Hz (G5)
        const playTriad = () => {
          if (!this.ringtoneAudioContext || this.ringtoneAudioContext.state === 'closed') return;
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            const startTime = ctx.currentTime + idx * 0.18;

            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.35);
          });
        };

        playTriad();
        this.ringtoneInterval = setInterval(playTriad, 2200);
      }
    } catch (e) {
      console.warn('[CallingService] Web Audio ringtone playback bypassed:', e);
    }
  }

  private static stopRingtone(): void {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.ringtoneAudioContext) {
      try {
        this.ringtoneAudioContext.close();
      } catch {}
      this.ringtoneAudioContext = null;
    }
  }

  private static triggerVibration(): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {}
    }
  }
}
