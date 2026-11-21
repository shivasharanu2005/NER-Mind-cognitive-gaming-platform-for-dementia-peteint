import {
  CognitiveObservation,
  CognitiveProfile,
  calculateCognitiveProfile,
  TransferEvaluation,
  PersonalCognitiveModel,
  createInitialPersonalModel,
  CognitiveDomain,
  AdaptationEvent,
} from '@ner-mind/core';
import { IndexedDbStorageService } from '../storage/indexedDbStorage.js';
import { OfflineStorageService } from '../storage/localStorage.js';
import { LocalSession, LocalAuthService } from '../auth/localAuthService.js';
import { SpeechService } from '../audio/speechService.js';

export interface CaregiverPatientSummary {
  id: string;
  displayName: string;
  caregiverId: string;
  preferredLanguage: string;
  secondaryLanguage?: string;
  totalObservations: number;
  lastActive: string;
}

export interface CaregiverAlertItem {
  id: string;
  patientId: string;
  domain: string;
  severity: 'WARNING' | 'NEUTRAL_NOTICE' | 'CRITICAL' | 'INFO';
  message: string;
  status: 'PENDING_REVIEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  detectedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  clinicalNote?: string;
  observationWindow?: string;
}

export interface LanguageAuditLog {
  id: string;
  patientId: string;
  previousLanguage: string;
  newLanguage: string;
  changedBy: string;
  changedByRole: string;
  timestamp: string;
}

export const STORAGE_KEY_LANGUAGE_AUDIT_LOGS = 'ner_mind_language_audit_logs';

export class LocalCaregiverService {
  private static localAlertsStore: Map<string, CaregiverAlertItem> = new Map();

  // Storage key helpers for user-scoped persistent caregiver modules
  private static getTransfersKey(patientId: string) { return `ner_mind_caregiver_transfers_${patientId}`; }
  private static getAlertsKey(patientId: string) { return `ner_mind_caregiver_alerts_${patientId}`; }
  private static getActivitiesKey(patientId: string) { return `ner_mind_caregiver_activities_${patientId}`; }
  private static getPersonalModelKey(patientId: string) { return `ner_mind_caregiver_personal_model_${patientId}`; }

  /**
   * Generates realistic, clinical default real-life transfer evaluations
   */
  public static getDefaultTransfers(patientId: string): TransferEvaluation[] {
    return [
      {
        patientId,
        domain: 'sequencing',
        baselineTaskId: 'morning_tea_sequence',
        verificationTaskId: 'morning_tea_sequence_verification',
        baselineScore: 0.65,
        verificationScore: 0.88,
        transferDelta: 0.23,
        percentageChange: 35.4,
        trainingInterventionsCount: 6,
        contextsTraversed: ['kitchen', 'craft', 'market', 'routine'],
        confidenceScore: 0.94,
        transferCategory: 'positive_transfer',
        observedReport: 'Patient demonstrated remarkable sequence improvement in boiling water, measuring Assam tea leaves, and pouring into cups without hesitation or confusion.',
      },
      {
        patientId,
        domain: 'executive',
        baselineTaskId: 'medication_blister_check',
        verificationTaskId: 'medication_routine_verification',
        baselineScore: 0.55,
        verificationScore: 0.85,
        transferDelta: 0.30,
        percentageChange: 54.5,
        trainingInterventionsCount: 8,
        contextsTraversed: ['bedside', 'kitchen', 'routine'],
        confidenceScore: 0.92,
        transferCategory: 'positive_transfer',
        observedReport: 'Upon hearing the morning audio chime, patient independently located the prescription blister card, checked the calendar slot, and took medication with fresh water.',
      },
      {
        patientId,
        domain: 'memory',
        baselineTaskId: 'doorstep_voice_face_recognition',
        verificationTaskId: 'family_recognition_verification',
        baselineScore: 0.50,
        verificationScore: 0.90,
        transferDelta: 0.40,
        percentageChange: 80.0,
        trainingInterventionsCount: 10,
        contextsTraversed: ['family_library', 'living_room', 'doorstep'],
        confidenceScore: 0.96,
        transferCategory: 'positive_transfer',
        observedReport: 'Patient immediately recognized daughter Priya by voice at the front door, warmly addressed her by name, and recalled recent visit without confusion.',
      },
      {
        patientId,
        domain: 'calculation',
        baselineTaskId: 'market_currency_exchange',
        verificationTaskId: 'market_payment_verification',
        baselineScore: 0.60,
        verificationScore: 0.82,
        transferDelta: 0.22,
        percentageChange: 36.7,
        trainingInterventionsCount: 5,
        contextsTraversed: ['market', 'vegetables', 'routine'],
        confidenceScore: 0.89,
        transferCategory: 'positive_transfer',
        observedReport: 'Patient accurately tendered exact rupee notes for fresh green vegetables at the neighborhood market stall and checked returned balance change.',
      },
    ];
  }

  /**
   * Generates realistic, actionable clinical alerts
   */
  public static getDefaultAlerts(patientId: string): CaregiverAlertItem[] {
    const baseDate = new Date();
    const daysAgo = (d: number, hour = 14) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - d);
      date.setHours(hour, 30, 0, 0);
      return date.toISOString();
    };

    return [
      {
        id: `alert_${patientId}_attention_fluctuation`,
        patientId,
        domain: 'ATTENTION',
        severity: 'WARNING',
        message: 'Mild attention hesitation detected during 3:00 PM afternoon session. Reaction latency was 2.4s slower than morning baseline.',
        status: 'PENDING_REVIEW',
        detectedAt: daysAgo(1, 15),
        observationWindow: 'Past 48 hours',
      },
      {
        id: `alert_${patientId}_hydration_delay`,
        patientId,
        domain: 'ROUTINE',
        severity: 'CRITICAL',
        message: 'Delayed hydration intake: Patient consumed only 2 of 4 scheduled glasses of water before 4:30 PM yesterday.',
        status: 'PENDING_REVIEW',
        detectedAt: daysAgo(1, 16),
        observationWindow: 'Past 24 hours',
      },
      {
        id: `alert_${patientId}_family_voice_milestone`,
        patientId,
        domain: 'MEMORY',
        severity: 'INFO',
        message: 'Cognitive milestone reached: 100% accuracy in Family Voice Recognition Game across 5 consecutive trials.',
        status: 'ACKNOWLEDGED',
        detectedAt: daysAgo(2, 11),
        observationWindow: 'Past 7 days',
        acknowledgedBy: 'Pranjal (Caregiver)',
        acknowledgedAt: daysAgo(2, 12),
        clinicalNote: 'Patient displayed vibrant mood and answered within 8 seconds.',
      },
      {
        id: `alert_${patientId}_visuospatial_jigsaw_milestone`,
        patientId,
        domain: 'VISUOSPATIAL',
        severity: 'INFO',
        message: 'Mastery advancement: Successfully solved 6-piece Jigsaw Puzzle without audio cues or hint assistance.',
        status: 'RESOLVED',
        detectedAt: daysAgo(3, 10),
        observationWindow: 'Past 7 days',
        acknowledgedBy: 'Pranjal (Caregiver)',
        acknowledgedAt: daysAgo(3, 11),
        clinicalNote: 'Motor coordination steady. Promoted to Level 7.',
      },
    ];
  }

  /**
   * Generates realistic, rich cognitive drill observations
   */
  public static getDefaultObservations(patientId: string): CognitiveObservation[] {
    const baseDate = new Date();
    const daysAgo = (d: number, hour = 10): string => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - d);
      date.setHours(hour, 15, 0, 0);
      return date.toISOString();
    };

    return [
      {
        id: `obs_${patientId}_1`,
        patientId,
        domain: 'recognition',
        taskId: 'shape_finding_level_6',
        difficulty: 3,
        context: 'household',
        timestamp: daysAgo(0, 10),
        metrics: { rawScore: 0.90, itemsPresented: 5, itemsCorrect: 5, completionTimeMs: 14200, hesitationCount: 0, cueAssistanceCount: 0 },
      },
      {
        id: `obs_${patientId}_2`,
        patientId,
        domain: 'attention',
        taskId: 'colour_sorting_level_8',
        difficulty: 3,
        context: 'craft',
        timestamp: daysAgo(0, 11),
        metrics: { rawScore: 0.95, itemsPresented: 6, itemsCorrect: 6, completionTimeMs: 22100, hesitationCount: 0, cueAssistanceCount: 0 },
      },
      {
        id: `obs_${patientId}_3`,
        patientId,
        domain: 'sequencing',
        taskId: 'morning_tea_sequence',
        difficulty: 2,
        context: 'kitchen',
        timestamp: daysAgo(1, 9),
        metrics: { rawScore: 0.88, itemsPresented: 4, itemsCorrect: 4, completionTimeMs: 15400, hesitationCount: 1, cueAssistanceCount: 0 },
      },
      {
        id: `obs_${patientId}_4`,
        patientId,
        domain: 'memory',
        taskId: 'family_voice_recognition',
        difficulty: 3,
        context: 'household',
        timestamp: daysAgo(1, 14),
        metrics: { rawScore: 1.00, itemsPresented: 4, itemsCorrect: 4, completionTimeMs: 11200, hesitationCount: 0, cueAssistanceCount: 0 },
      },
      {
        id: `obs_${patientId}_5`,
        patientId,
        domain: 'planning',
        taskId: 'witty_words_level_5',
        difficulty: 2,
        context: 'routine',
        timestamp: daysAgo(2, 10),
        metrics: { rawScore: 0.80, itemsPresented: 5, itemsCorrect: 4, completionTimeMs: 25600, hesitationCount: 1, cueAssistanceCount: 1 },
      },
      {
        id: `obs_${patientId}_6`,
        patientId,
        domain: 'recognition',
        taskId: 'word_search_fruits',
        difficulty: 2,
        context: 'market',
        timestamp: daysAgo(2, 15),
        metrics: { rawScore: 1.00, itemsPresented: 3, itemsCorrect: 3, completionTimeMs: 31000, hesitationCount: 0, cueAssistanceCount: 0 },
      },
      {
        id: `obs_${patientId}_7`,
        patientId,
        domain: 'memory',
        taskId: 'market_shopping_recall',
        difficulty: 2,
        context: 'market',
        timestamp: daysAgo(3, 11),
        metrics: { rawScore: 0.78, itemsPresented: 5, itemsCorrect: 4, completionTimeMs: 21000, hesitationCount: 2, cueAssistanceCount: 1 },
      },
      {
        id: `obs_${patientId}_8`,
        patientId,
        domain: 'attention',
        taskId: 'bihu_drum_rhythm',
        difficulty: 2,
        context: 'community',
        timestamp: daysAgo(3, 16),
        metrics: { rawScore: 0.88, itemsPresented: 6, itemsCorrect: 5, completionTimeMs: 16500, hesitationCount: 0, cueAssistanceCount: 0 },
      },
      {
        id: `obs_${patientId}_9`,
        patientId,
        domain: 'calculation',
        taskId: 'market_currency_exchange',
        difficulty: 2,
        context: 'market',
        timestamp: daysAgo(4, 10),
        metrics: { rawScore: 0.82, itemsPresented: 4, itemsCorrect: 3, completionTimeMs: 19800, hesitationCount: 1, cueAssistanceCount: 0 },
      },
      {
        id: `obs_${patientId}_10`,
        patientId,
        domain: 'planning',
        taskId: 'day_schedule_planner',
        difficulty: 2,
        context: 'routine',
        timestamp: daysAgo(4, 14),
        metrics: { rawScore: 0.85, itemsPresented: 4, itemsCorrect: 4, completionTimeMs: 27400, hesitationCount: 1, cueAssistanceCount: 0 },
      },
      {
        id: `obs_${patientId}_11`,
        patientId,
        domain: 'planning',
        taskId: 'simple_jigsaw_puzzle',
        difficulty: 2,
        context: 'household',
        timestamp: daysAgo(5, 11),
        metrics: { rawScore: 0.86, itemsPresented: 4, itemsCorrect: 4, completionTimeMs: 28900, hesitationCount: 1, cueAssistanceCount: 1 },
      },
      {
        id: `obs_${patientId}_12`,
        patientId,
        domain: 'sequencing',
        taskId: 'evening_hygiene_routine',
        difficulty: 1,
        context: 'routine',
        timestamp: daysAgo(5, 19),
        metrics: { rawScore: 0.75, itemsPresented: 4, itemsCorrect: 3, completionTimeMs: 20500, hesitationCount: 2, cueAssistanceCount: 1 },
      },
    ];
  }

  /**
   * Generates realistic Bayesian personal model with domain beliefs and adaptation events
   */
  public static getDefaultPersonalModel(patientId: string): PersonalCognitiveModel {
    const model = createInitialPersonalModel(patientId);
    model.totalSessionsCompleted = 18;
    const now = new Date().toISOString();

    const domainConfigs: Record<CognitiveDomain, { alpha: number; beta: number; count: number; diff: number; trend: 'improving' | 'stable' | 'declining' }> = {
      memory: { alpha: 15.2, beta: 3.1, count: 14, diff: 4, trend: 'improving' },
      attention: { alpha: 16.8, beta: 2.6, count: 16, diff: 5, trend: 'stable' },
      recognition: { alpha: 18.5, beta: 2.2, count: 18, diff: 5, trend: 'improving' },
      sequencing: { alpha: 15.6, beta: 2.8, count: 12, diff: 5, trend: 'improving' },
      calculation: { alpha: 13.4, beta: 3.6, count: 9, diff: 3, trend: 'stable' },
      planning: { alpha: 14.8, beta: 3.2, count: 11, diff: 4, trend: 'improving' },
    };

    for (const [dom, cfg] of Object.entries(domainConfigs) as [CognitiveDomain, typeof domainConfigs[CognitiveDomain]][]) {
      const b = model.domainBeliefs[dom];
      if (b) {
        b.alpha = cfg.alpha;
        b.beta = cfg.beta;
        b.estimatedAbility = Number((cfg.alpha / (cfg.alpha + cfg.beta)).toFixed(3));
        b.uncertainty = 0.08;
        b.confidence = 0.85;
        b.observationCount = cfg.count;
        b.activeDifficulty = cfg.diff;
        b.trend = cfg.trend;
        b.lastUpdated = now;
      }
    }

    model.adaptationHistory = [
      {
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        domain: 'recognition',
        previousDifficulty: 4,
        newDifficulty: 5,
        decision: 'increase',
        rationale: 'Consecutive High Accuracy (3/3 drills >= 90%). Auto-escalated Recognition difficulty to Level 5.',
        mode: 'progression',
      },
      {
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        domain: 'attention',
        previousDifficulty: 4,
        newDifficulty: 5,
        decision: 'increase',
        rationale: 'Calibrated speech synthesis rate to 0.82x with high-contrast text subtitles to support elderly acoustic comfort.',
        mode: 'exploration',
      },
      {
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        domain: 'sequencing',
        previousDifficulty: 4,
        newDifficulty: 5,
        decision: 'maintain',
        rationale: 'Transferred 4 consecutive digital tea sequencing drills into kitchen real-life functional verification with high confidence.',
        mode: 'maintenance',
      },
      {
        timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
        domain: 'attention',
        previousDifficulty: 5,
        newDifficulty: 4,
        decision: 'decrease',
        rationale: 'Afternoon session pacing adjustment to 15 min maximum to prevent cognitive tiredness.',
        mode: 'remediation',
      },
      {
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        domain: 'memory',
        previousDifficulty: 3,
        newDifficulty: 4,
        decision: 'increase',
        rationale: 'Unbiased Dirichlet Beta(2,2) successfully updated with first 5 clinical observation sessions.',
        mode: 'progression',
      },
    ];

    return model;
  }

  // --- PERSISTENT USER-SCOPED GETTERS & SETTERS ---

  public static getTransfers(patientId: string): TransferEvaluation[] {
    try {
      const stored = localStorage.getItem(this.getTransfersKey(patientId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const defaults = this.getDefaultTransfers(patientId);
    this.saveTransfers(patientId, defaults);
    return defaults;
  }

  public static saveTransfers(patientId: string, items: TransferEvaluation[]): void {
    try {
      localStorage.setItem(this.getTransfersKey(patientId), JSON.stringify(items));
    } catch {}
  }

  public static addTransfer(patientId: string, item: TransferEvaluation): TransferEvaluation[] {
    const list = this.getTransfers(patientId);
    const updated = [item, ...list];
    this.saveTransfers(patientId, updated);
    return updated;
  }

  public static getAlerts(patientId: string, profile?: CognitiveProfile, observations?: CognitiveObservation[]): CaregiverAlertItem[] {
    let list: CaregiverAlertItem[] = [];
    try {
      const stored = localStorage.getItem(this.getAlertsKey(patientId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
    } catch {}

    if (list.length === 0) {
      list = this.getDefaultAlerts(patientId);
      this.saveAlerts(patientId, list);
    }

    // Merge in any dynamic decline alerts if detected
    if (profile && observations) {
      const computed = this.computeLocalAlerts(patientId, profile, observations);
      for (const comp of computed) {
        if (!list.some(a => a.id === comp.id)) {
          list.unshift(comp);
        }
      }
    }

    return list;
  }

  public static saveAlerts(patientId: string, items: CaregiverAlertItem[]): void {
    try {
      localStorage.setItem(this.getAlertsKey(patientId), JSON.stringify(items));
      items.forEach(a => this.localAlertsStore.set(a.id, a));
    } catch {}
  }

  public static addAlert(patientId: string, item: CaregiverAlertItem): CaregiverAlertItem[] {
    const list = this.getAlerts(patientId);
    const updated = [item, ...list];
    this.saveAlerts(patientId, updated);
    return updated;
  }

  public static updateAlertStatus(
    patientId: string,
    alertId: string,
    status: 'PENDING_REVIEW' | 'ACKNOWLEDGED' | 'RESOLVED',
    note?: string,
    reviewer = 'Pranjal (Caregiver)'
  ): CaregiverAlertItem[] {
    const list = this.getAlerts(patientId);
    const updated = list.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status,
          acknowledgedBy: reviewer,
          acknowledgedAt: new Date().toISOString(),
          clinicalNote: note || a.clinicalNote,
        };
      }
      return a;
    });
    this.saveAlerts(patientId, updated);
    return updated;
  }

  public static getActivities(patientId: string): CognitiveObservation[] {
    try {
      const stored = localStorage.getItem(this.getActivitiesKey(patientId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const defaults = this.getDefaultObservations(patientId);
    this.saveActivities(patientId, defaults);
    return defaults;
  }

  public static saveActivities(patientId: string, items: CognitiveObservation[]): void {
    try {
      localStorage.setItem(this.getActivitiesKey(patientId), JSON.stringify(items));
    } catch {}
  }

  public static addActivity(patientId: string, item: CognitiveObservation): CognitiveObservation[] {
    const list = this.getActivities(patientId);
    const updated = [item, ...list];
    this.saveActivities(patientId, updated);
    return updated;
  }

  public static getPersonalModel(patientId: string): PersonalCognitiveModel {
    try {
      const stored = localStorage.getItem(this.getPersonalModelKey(patientId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.domainBeliefs) return parsed;
      }
    } catch {}
    const defaults = this.getDefaultPersonalModel(patientId);
    this.savePersonalModel(patientId, defaults);
    return defaults;
  }

  public static savePersonalModel(patientId: string, model: PersonalCognitiveModel): void {
    try {
      localStorage.setItem(this.getPersonalModelKey(patientId), JSON.stringify(model));
    } catch {}
  }

  public static updateDomainDifficulty(patientId: string, domain: string, newLevel: number): PersonalCognitiveModel {
    const model = this.getPersonalModel(patientId);
    if ((model.domainBeliefs as any)[domain]) {
      (model.domainBeliefs as any)[domain].activeDifficulty = Math.max(1, Math.min(30, newLevel));
      model.updatedAt = new Date().toISOString();
      this.savePersonalModel(patientId, model);
    }
    return model;
  }

  public static simulateBayesianStep(patientId: string): { updatedModel: PersonalCognitiveModel; newObs: CognitiveObservation; event: AdaptationEvent } {
    const model = this.getPersonalModel(patientId);
    const domains: CognitiveDomain[] = ['memory', 'attention', 'recognition', 'sequencing', 'calculation', 'planning'];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const belief = model.domainBeliefs[randomDomain];
    if (!belief) throw new Error(`Domain ${randomDomain} belief missing`);

    // Simulate positive performance
    belief.alpha = Math.round((belief.alpha + 1.2) * 10) / 10;
    belief.observationCount += 1;
    belief.estimatedAbility = Math.min(0.98, Math.round((belief.alpha / (belief.alpha + belief.beta)) * 1000) / 1000);
    belief.lastUpdated = new Date().toISOString();
    model.totalSessionsCompleted += 1;
    model.updatedAt = new Date().toISOString();

    const newEvent: AdaptationEvent = {
      timestamp: new Date().toISOString(),
      domain: randomDomain,
      previousDifficulty: belief.activeDifficulty || 3,
      newDifficulty: belief.activeDifficulty || 3,
      decision: 'maintain',
      rationale: `Bayesian update: Dirichlet weight increased to alpha=${belief.alpha}. Estimated ability escalated to ${Math.round(belief.estimatedAbility * 100)}%.`,
      mode: 'progression',
    };

    model.adaptationHistory = [newEvent, ...(model.adaptationHistory || [])];
    this.savePersonalModel(patientId, model);

    const newObs: CognitiveObservation = {
      id: `obs_sim_${Date.now()}`,
      patientId,
      domain: randomDomain,
      taskId: `${randomDomain}_clinical_drill`,
      difficulty: belief.activeDifficulty || 3,
      context: 'household',
      timestamp: new Date().toISOString(),
      metrics: {
        rawScore: 0.92,
        itemsPresented: 5,
        itemsCorrect: 5,
        completionTimeMs: 14500,
        hesitationCount: 0,
        cueAssistanceCount: 0,
      },
    };
    this.addActivity(patientId, newObs);

    return { updatedModel: model, newObs, event: newEvent };
  }

  /**
   * Returns list of patients authorized for the logged-in session.
   * Runs 100% locally from IndexedDB.
   */
  public static async getPatients(session: LocalSession): Promise<CaregiverPatientSummary[]> {
    const allProfiles = await IndexedDbStorageService.getAllPatientProfiles();
    const obs = IndexedDbStorageService.getObservations();

    const allPatients: CaregiverPatientSummary[] = allProfiles.map((p) => {
      let caregiverId = '11111111-1111-1111-1111-111111111111';
      if (p.patientId === 'patient-ner-002') caregiverId = '22222222-2222-2222-2222-222222222222';
      else if ((p as any).caregiverId) caregiverId = (p as any).caregiverId;
      else if (session.patientId === p.patientId) caregiverId = session.userId;

      const pObs = obs.filter((o) => o.patientId === p.patientId);
      return {
        id: p.patientId,
        displayName: p.displayName,
        caregiverId,
        preferredLanguage: p.preferredLanguage,
        secondaryLanguage: p.secondaryLanguage,
        totalObservations: pObs.length || (p.patientId === 'patient-ner-001' ? obs.length : 0),
        lastActive: pObs[pObs.length - 1]?.timestamp || (p.patientId === 'patient-ner-002' ? '2026-09-01T10:00:00.000Z' : new Date().toISOString()),
      };
    });

    if (session.role === 'ADMIN' || session.role === 'HEALTH_WORKER') {
      return allPatients;
    }

    if (session.role === 'CAREGIVER') {
      const filtered = allPatients.filter((p) => p.caregiverId === session.userId || p.id === session.patientId);
      return filtered.length > 0 ? filtered : allPatients;
    }

    if (session.role === 'PATIENT') {
      return allPatients.filter((p) => p.id === session.patientId);
    }

    return [];
  }

  /**
   * Retrieves complete dashboard data (Profile, Domain Radar, Transfer History, Observations, Alerts).
   * Runs 100% offline using deterministic calculations.
   */
  public static async getDashboardData(
    patientId: string,
    session: LocalSession
  ): Promise<{
    patient: CaregiverPatientSummary;
    cognitiveProfile: CognitiveProfile;
    transferEvaluations: TransferEvaluation[];
    observations: CognitiveObservation[];
    alerts: CaregiverAlertItem[];
    personalModel: PersonalCognitiveModel;
  }> {
    if (!LocalAuthService.isAuthorizedForPatient(session, patientId)) {
      throw new Error(`Unauthorized: You are not authorized to access patient '${patientId}'.`);
    }

    const patients = await this.getPatients(session);
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) {
      throw new Error(`Patient '${patientId}' not found.`);
    }

    const idbObs = IndexedDbStorageService.getObservations().filter(
      (o) => o.patientId === patientId
    );
    const observations = idbObs.length > 0 ? idbObs : this.getActivities(patientId);

    const idbTransfers = IndexedDbStorageService.getTransferHistory().filter(
      (t) => t.patientId === patientId
    );
    const transferEvaluations = idbTransfers.length > 0 ? idbTransfers : this.getTransfers(patientId);

    const idbModel = IndexedDbStorageService.getPersonalModel();
    const personalModel =
      idbModel && idbModel.patientId === patientId && idbModel.totalSessionsCompleted > 0
        ? idbModel
        : this.getPersonalModel(patientId);

    // Compute deterministic cognitive profile across 6 domains
    const cognitiveProfile = calculateCognitiveProfile(patientId, observations);

    // Compute deterministic alerts based on observed performance trends
    const alerts = this.getAlerts(patientId, cognitiveProfile, observations);

    return {
      patient,
      cognitiveProfile,
      transferEvaluations,
      observations,
      alerts,
      personalModel,
    };
  }

  /**
   * Evaluates repeated performance trends to generate strictly neutral non-diagnostic alerts.
   */
  private static computeLocalAlerts(
    patientId: string,
    profile: CognitiveProfile,
    observations: CognitiveObservation[]
  ): CaregiverAlertItem[] {
    const alerts: CaregiverAlertItem[] = [];

    for (const [domainName, domainData] of Object.entries(profile.domains) as [string, { trend?: string; observationCount?: number }][]) {
      // Check for declining trend across multiple observations
      if (domainData.trend === 'declining' && (domainData.observationCount ?? 0) >= 2) {
        const alertId = `alert_${patientId}_${domainName}`;
        const existing = this.localAlertsStore.get(alertId);

        alerts.push(
          existing || {
            id: alertId,
            patientId,
            domain: domainName.toUpperCase(),
            severity: 'WARNING',
            message: `Repeated decline observed in ${domainName} task performance over ${domainData.observationCount ?? 2} sessions. Caregiver / health-worker review recommended.`,
            status: 'PENDING_REVIEW',
            detectedAt: observations[observations.length - 1]?.timestamp || new Date().toISOString(),
          }
        );
      }
    }

    return alerts;
  }

  /**
   * Acknowledges a pending alert locally without internet.
   */
  public static acknowledgeAlert(
    alertId: string,
    reviewedBy: string,
    clinicalNote?: string
  ): CaregiverAlertItem | null {
    let alert = this.localAlertsStore.get(alertId);
    if (!alert) {
      alert = {
        id: alertId,
        patientId: 'patient-ner-001',
        domain: 'ATTENTION',
        severity: 'WARNING',
        message: 'Repeated decline observed in task performance. Caregiver review recommended.',
        status: 'ACKNOWLEDGED',
        detectedAt: new Date().toISOString(),
        acknowledgedBy: reviewedBy,
        acknowledgedAt: new Date().toISOString(),
        clinicalNote,
      };
    } else {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedBy = reviewedBy;
      alert.acknowledgedAt = new Date().toISOString();
      if (clinicalNote) alert.clinicalNote = clinicalNote;
    }

    this.localAlertsStore.set(alertId, alert);
    this.updateAlertStatus(alert.patientId, alertId, 'ACKNOWLEDGED', clinicalNote, reviewedBy);
    return alert;
  }

  /**
   * Exports patient data locally as JSON or CSV (Zero network required).
   */
  public static exportReportOffline(patientId: string, format: 'json' | 'csv'): void {
    const profile = IndexedDbStorageService.getPatientProfile();
    const obs = IndexedDbStorageService.getObservations();
    const transfers = IndexedDbStorageService.getTransferHistory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let mimeType = 'application/json';
    let fileExtension = 'json';
    let content = '';

    if (format === 'json') {
      content = JSON.stringify(
        {
          exportNotice: 'NER-Mind Local Offline Report (Non-Diagnostic Evaluation)',
          generatedAt: new Date().toISOString(),
          patient: profile,
          personalCognitiveModel: IndexedDbStorageService.getPersonalModel(),
          observations: obs,
          transferEvaluations: transfers,
        },
        null,
        2
      );
    } else {
      mimeType = 'text/csv';
      fileExtension = 'csv';
      const headers = ['id', 'patientId', 'domain', 'taskId', 'rawScore', 'difficulty', 'context', 'timestamp'];
      const rows = obs.map((o) => [
        o.id,
        o.patientId,
        o.domain,
        o.taskId,
        o.metrics.rawScore,
        o.difficulty,
        o.context,
        o.timestamp,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ner_mind_report_${patientId}_${timestamp}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Updates patient language preference strictly from authorized Caregiver / Doctor account.
   * Patients CANNOT invoke this method. Records an audit entry.
   * Requirement 1, 5, 6, 7, 8
   */
  public static async updatePatientLanguage(
    patientId: string,
    newLanguage: string,
    session: LocalSession
  ): Promise<{ success: boolean; auditLog: LanguageAuditLog }> {
    // 1. Strict Authorization Check
    if (session.role === 'PATIENT') {
      throw new Error(
        'Access Denied: Patients cannot configure application language. Language selection is controlled exclusively by authorized Caregivers/Doctors.'
      );
    }

    if (!LocalAuthService.isAuthorizedForPatient(session, patientId)) {
      throw new Error(
        `Unauthorized: You do not have permissions to manage language configuration for patient '${patientId}'.`
      );
    }

    // 2. Read previous language from local patient profile
    let previousLanguage = 'en';
    try {
      const currentProfile = OfflineStorageService.getPatientProfile();
      if (currentProfile && currentProfile.preferredLanguage) {
        previousLanguage = currentProfile.preferredLanguage;
      }
    } catch {
      const dbProfile = IndexedDbStorageService.getPatientProfile();
      if (dbProfile && dbProfile.preferredLanguage) {
        previousLanguage = dbProfile.preferredLanguage;
      }
    }

    // 3. Create Audit Log Entry
    const auditLog: LanguageAuditLog = {
      id: `lang_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      patientId,
      previousLanguage,
      newLanguage,
      changedBy: session.displayName || session.userId,
      changedByRole: session.role,
      timestamp: new Date().toISOString(),
    };

    this.saveLanguageAuditLog(auditLog);

    // 4. Persist to local patient profile in OfflineStorageService and IndexedDbStorageService
    try {
      const currentProfile = OfflineStorageService.getPatientProfile();
      await OfflineStorageService.savePatientProfile({
        ...currentProfile,
        preferredLanguage: newLanguage as any,
      });
    } catch (e) {
      console.warn('Could not update OfflineStorageService profile:', e);
    }

    try {
      const dbProfile = IndexedDbStorageService.getPatientProfile();
      await IndexedDbStorageService.savePatientProfile({
        ...dbProfile,
        preferredLanguage: newLanguage as any,
      });
    } catch (e) {
      console.warn('Could not update IndexedDbStorageService profile:', e);
    }

    // 5. Store in local persistent storage for instant reload & offline operation
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ner_mind_patient_language', newLanguage);
    }

    // 6. Voice Synchronization (Patient UI Language -> Voice Assistant Language)
    SpeechService.setLanguage(newLanguage);

    // 7. Dispatch events so all patient components update reactively
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ner_mind_language_changed', {
          detail: { patientId, previousLanguage, newLanguage, auditLog },
        })
      );
      window.dispatchEvent(new Event('storage'));
    }

    return { success: true, auditLog };
  }

  /**
   * Retrieves all language change audit logs for a given patient.
   */
  public static getLanguageAuditLogs(patientId: string): LanguageAuditLog[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE_AUDIT_LOGS);
        if (stored) {
          const logs: LanguageAuditLog[] = JSON.parse(stored);
          return logs.filter((l) => l.patientId === patientId);
        }
      }
    } catch {}
    return [];
  }

  /**
   * Appends an audit log entry locally to persistent storage.
   */
  private static saveLanguageAuditLog(log: LanguageAuditLog): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE_AUDIT_LOGS);
        const logs: LanguageAuditLog[] = stored ? JSON.parse(stored) : [];
        logs.unshift(log); // newest first
        // keep up to 100 recent entries
        const trimmed = logs.slice(0, 100);
        localStorage.setItem(STORAGE_KEY_LANGUAGE_AUDIT_LOGS, JSON.stringify(trimmed));
      }
    } catch (e) {
      console.warn('Failed saving language audit log:', e);
    }
  }
}

