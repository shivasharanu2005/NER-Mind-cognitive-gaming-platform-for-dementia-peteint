import React, { lazy, Suspense, useState, useEffect } from 'react';
import {
  CognitiveDomain,
  CognitiveProfile,
  calculateCognitiveProfile,
  recommendNextTrainingSession,
  TrainingRecommendation,
  PersonalizationEngine,
  PersonalizedTaskSelection,
} from '@ner-mind/core';
import { OfflineStorageService } from './storage/localStorage.js';
import { SyncWorker, SyncStatusInfo } from './sync/syncWorker.js';
import { SpeechService } from './audio/speechService.js';
import {
  CognitiveSessionSubFrame,
  ActiveSessionState,
  STORAGE_KEY_ACTIVE_SESSION,
} from './components/CognitiveSessionSubFrame.js';
import { TransferWorkflow } from './transfer/TransferWorkflow.js';
import { CaregiverPortal } from './caregiver/CaregiverPortal.js';
import { HealthcareWorkerPortal } from './healthcare/HealthcareWorkerPortal.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

// Redesigned Dashboard & Navigation Components
import { Sidebar } from './components/navigation/Sidebar.js';
import { DashboardHeader } from './components/dashboard/DashboardHeader.js';
import { BottomNav, PatientTab } from './components/patient/BottomNav.js';
import { PatientHomeDashboard } from './components/patient/PatientHomeDashboard.js';
import { TodaysPlanView } from './components/patient/TodaysPlanView.js';
import { CognitiveGamesMenu, StandaloneGameId } from './components/patient/CognitiveGamesMenu.js';
import { RealLifeMissionsView } from './components/patient/RealLifeMissionsView.js';
import { RemindersView } from './components/patient/RemindersView.js';
import { FamilyMemoriesView } from './components/patient/FamilyMemoriesView.js';
import { PatientProgressView } from './components/patient/PatientProgressView.js';
import { SplashScreen } from './components/patient/SplashScreen.js';
import { VoiceSetupModal } from './components/patient/VoiceSetupModal.js';
import { SettingsModal } from './components/modals/SettingsModal.js';
import { HelpSupportModal } from './components/modals/HelpSupportModal.js';
import { LogoutModal } from './components/modals/LogoutModal.js';
import { EmergencySimulatorModal } from './components/modals/EmergencySimulatorModal.js';
import {
  SUPPORTED_LANGUAGES_META,
  SupportedAppLanguage,
} from './services/LocalizationService.js';
import { LocalizationProvider, useLocalization } from './localization/index.js';
import { AppModeProvider, useAppMode } from './context/AppModeContext.js';
import { AndroidMobileHeader } from './components/android/AndroidMobileHeader.js';
import { AndroidHomeFeed } from './components/android/AndroidHomeFeed.js';
import { ActivityAlarmService, ActivityAlarmEvent } from './services/ActivityAlarmService.js';
import { ActivityNoticeModal } from './components/modals/ActivityNoticeModal.js';
import { CaretakerSetupModal } from './components/modals/CaretakerSetupModal.js';
import { EmergencyAlertService } from './services/EmergencyAlertService.js';
import { CallingService } from './calling/callingService.js';
import { ActiveCallState, CallSignal } from '@ner-mind/core';
import { PatientCallingView } from './components/calling/PatientCallingView.js';
import { ActiveCallModal } from './components/calling/ActiveCallModal.js';
import { IncomingCallModal } from './components/calling/IncomingCallModal.js';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

const ColorSorting = lazy(() => import('./games/colorsorting.js'));
const PictureRecognitionGame = lazy(() => import('./games/PictureRecognitionGame.js'));
const ShapeFindingGame = lazy(() => import('./games/ShapeFindingGame.js'));
const SimpleJigsawPuzzle = lazy(() => import('./games/SimpleJigsawPuzzle.js'));
const WittyWords = lazy(() => import('./games/wittywords.js'));
const WordSearchGame = lazy(() => import('./games/wordsearch.js'));
const PersonalRecognitionGame = lazy(() => import('./games/PersonalRecognitionGame.js').then((module) => ({ default: module.PersonalRecognitionGame })));
const IdentifyPersonGame = lazy(() => import('./games/IdentifyPersonGame.js').then((module) => ({ default: module.IdentifyPersonGame })));

type ViewMode = 'patient' | 'caregiver' | 'healthcare';

const PatientAppInner: React.FC = () => {
  const { language } = useLocalization();
  const { isAndroid, isWebsite } = useAppMode();
  const [activePatientId, setActivePatientId] = useState<string>(() => OfflineStorageService.getActivePatientId());
  const [activeAlarm, setActiveAlarm] = useState<ActivityAlarmEvent | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [incomingSignal, setIncomingSignal] = useState<CallSignal | null>(null);
  const [showCaretakerSetupModal, setShowCaretakerSetupModal] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return !localStorage.getItem('ner_mind_caretaker_onboarding_completed');
    }
    return false;
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/caregiver')) return 'caregiver';
      if (window.location.pathname.startsWith('/healthcare')) return 'healthcare';
    }
    return 'patient';
  });

  const handlePatientSwitched = async (newId: string) => {
    await OfflineStorageService.setActivePatientId(newId);
    setActivePatientId(newId);
    refreshProfile();
  };

  const handleProfileCreated = async (newPatientId: string) => {
    localStorage.setItem('ner_mind_caretaker_onboarding_completed', 'true');
    setShowCaretakerSetupModal(false);
    await handlePatientSwitched(newPatientId);
  };

  const handleExploreDemo = () => {
    localStorage.setItem('ner_mind_caretaker_onboarding_completed', 'true');
    setShowCaretakerSetupModal(false);
  };

  const handleTestAlarm = () => {
    const currentPatient = OfflineStorageService.getPatientProfile();
    ActivityAlarmService.triggerDemoAlarm(currentPatient.displayName);
  };

  const handleTriggerEmergency = () => {
    const currentPatient = OfflineStorageService.getPatientProfile();
    EmergencyAlertService.triggerEmergencyAlert({
      patientId: currentPatient.patientId,
      patientName: currentPatient.displayName,
      reason: 'Patient pressed the red SOS button from the main header.',
    });
    setShowSafetyModal(true);
  };

  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' ? !localStorage.getItem('ner_mind_splash_seen') : false;
  });

  // Modal Dialog States
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState<boolean>(false);

  // Primary Patient App Tabs
  const [patientTab, setPatientTab] = useState<PatientTab>('home');
  const [showFullTransferProtocol, setShowFullTransferProtocol] = useState<boolean>(false);

  // Active Cognitive Session State
  const [activeSessionDomain, setActiveSessionDomain] = useState<CognitiveDomain | null>(null);
  const [activeStandaloneGame, setActiveStandaloneGame] = useState<StandaloneGameId | null>(null);
  const [activeSessionRestored, setActiveSessionRestored] = useState<ActiveSessionState | null>(null);
  const [savedSession, setSavedSession] = useState<ActiveSessionState | null>(null);

  // Local Storage & Core State
  const [, setProfile] = useState<CognitiveProfile | null>(null);
  const [recommendation, setRecommendation] = useState<TrainingRecommendation | null>(null);
  const [personalizedTask, setPersonalizedTask] = useState<PersonalizedTaskSelection | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo | null>(null);

  // Bootstrap Local IndexedDB and App State
  useEffect(() => {
    let unsubscribeSync: (() => void) | null = null;

    const bootstrap = async () => {
      try {
        await OfflineStorageService.init();

        const obs = OfflineStorageService.getObservations();
        const patientProfile = OfflineStorageService.getPatientProfile();
        const cogProfile = calculateCognitiveProfile(patientProfile.patientId, obs);
        setProfile(cogProfile);

        // Enforce Caregiver/Doctor Configured Language & Voice Assistant Pipeline
        SpeechService.setLanguage(patientProfile.preferredLanguage || 'en');
        if (patientProfile.accessibility) {
          SpeechService.setEnabled(patientProfile.accessibility.audioPromptsEnabled !== false);
        }

        const rec = recommendNextTrainingSession(cogProfile, obs);
        setRecommendation(rec);

        const pModel = OfflineStorageService.getPersonalModel();
        const pTask = PersonalizationEngine.selectNextPersonalizedTask(pModel);
        setPersonalizedTask(pTask);

        setPendingSyncCount(OfflineStorageService.getPendingSyncCount());

        const worker = SyncWorker.getInstance();
        unsubscribeSync = worker.subscribe((status) => {
          setSyncStatus(status);
          setPendingSyncCount(status.pendingCount);
        });

        // Check for active saved session for resume support
        const rawSession = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION) : null;
        if (rawSession) {
          try {
            const parsed = JSON.parse(rawSession);
            if (parsed && parsed.domain && parsed.currentQuestionIndex < parsed.totalQuestions) {
              setSavedSession(parsed);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
          }
        }

        if (navigator.onLine) {
          worker.triggerSyncWithBackoff(1000);
        }
      } catch (err) {
        console.error('[Bootstrap Error]', err);
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrap();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleStorageChange = () => {
      refreshProfile();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
      if (unsubscribeSync) unsubscribeSync();
    };
  }, []);

  const refreshProfile = () => {
    const obs = OfflineStorageService.getObservations();
    const patientProfile = OfflineStorageService.getPatientProfile();
    const cogProfile = calculateCognitiveProfile(patientProfile.patientId, obs);
    setProfile(cogProfile);

    // Sync speech pipeline immediately upon caregiver updates
    SpeechService.setLanguage(patientProfile.preferredLanguage || 'en');
    if (patientProfile.accessibility) {
      SpeechService.setEnabled(patientProfile.accessibility.audioPromptsEnabled !== false);
    }

    const rec = recommendNextTrainingSession(cogProfile, obs);
    setRecommendation(rec);

    const pModel = OfflineStorageService.getPersonalModel();
    const pTask = PersonalizationEngine.selectNextPersonalizedTask(pModel);
    setPersonalizedTask(pTask);

    setPendingSyncCount(OfflineStorageService.getPendingSyncCount());

    const rawSession = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION) : null;
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        if (parsed && parsed.domain && parsed.currentQuestionIndex < parsed.totalQuestions) {
          setSavedSession(parsed);
        } else {
          setSavedSession(null);
        }
      } catch {
        setSavedSession(null);
      }
    } else {
      setSavedSession(null);
    }

    SyncWorker.getInstance().triggerSyncWithBackoff(500);
  };

  // Android Native Back-Button Handler (Dementia-safe hierarchical navigation)
  useEffect(() => {
    let backListener: { remove: () => void } | null = null;

    const setupBackButton = async () => {
      try {
        backListener = await CapApp.addListener('backButton', () => {
          // Priority 0: Active Call or Incoming Call
          if (activeCall) { CallingService.endCall(); return; }
          if (incomingSignal) { CallingService.declineCall(); return; }

          // Priority 1: Modals & Drawers
          if (activeAlarm) { setActiveAlarm(null); return; }
          if (showCaretakerSetupModal) { setShowCaretakerSetupModal(false); return; }
          if (showVoiceModal) { setShowVoiceModal(false); return; }
          if (showSettingsModal) { setShowSettingsModal(false); return; }
          if (showHelpModal) { setShowHelpModal(false); return; }
          if (showLogoutModal) { setShowLogoutModal(false); return; }
          if (showSafetyModal) { setShowSafetyModal(false); return; }
          if (isSidebarMobileOpen) { setIsSidebarMobileOpen(false); return; }

          // Priority 2: Active Cognitive Game or Transfer Protocol
          if (activeStandaloneGame !== null) { setActiveStandaloneGame(null); return; }
          if (activeSessionDomain !== null) { setActiveSessionDomain(null); return; }
          if (showFullTransferProtocol) { setShowFullTransferProtocol(false); return; }

          // Priority 3: Caregiver / Healthcare Portals
          if (viewMode !== 'patient') { setViewMode('patient'); return; }

          // Priority 4: Patient Subtabs -> Return to Home
          if (patientTab !== 'home') { setPatientTab('home'); return; }

          // Priority 5: Exit App
          CapApp.exitApp();
        });
      } catch {
        // Web environment fallback
      }
    };

    setupBackButton();

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [
    activeCall,
    incomingSignal,
    activeAlarm,
    showCaretakerSetupModal,
    showVoiceModal,
    showSettingsModal,
    showHelpModal,
    showLogoutModal,
    showSafetyModal,
    isSidebarMobileOpen,
    activeStandaloneGame,
    activeSessionDomain,
    showFullTransferProtocol,
    viewMode,
    patientTab,
  ]);

  // Real-Time Calling Engine & Signaling Bus Subscription
  useEffect(() => {
    CallingService.init();
    const unsubCall = CallingService.subscribeToCall((state) => {
      setActiveCall(state);
    });
    const unsubIncoming = CallingService.subscribeToIncoming((sig) => {
      setIncomingSignal(sig);
    });

    return () => {
      unsubCall();
      unsubIncoming();
    };
  }, []);

  // Real-Time Daily Activity & Health Reminder Alarm Watcher
  useEffect(() => {
    const currentPatient = OfflineStorageService.getPatientProfile();
    ActivityAlarmService.startAlarmWatcher(currentPatient.patientId, currentPatient.displayName);
    const unsubscribeAlarm = ActivityAlarmService.subscribe((alarm) => {
      setActiveAlarm(alarm);
    });

    return () => {
      ActivityAlarmService.stopAlarmWatcher();
      unsubscribeAlarm();
    };
  }, [activePatientId]);

  // Native Android Device Styling (Status Bar & Portrait Lock)
  useEffect(() => {
    const initDevice = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f172a' });
      } catch {
        // Fallback for desktop/web
      }
      try {
        await ScreenOrientation.lock({ orientation: 'portrait' });
      } catch {
        // Fallback for desktop/web
      }
    };

    initDevice();
  }, []);

  const handleStartSession = (domain: CognitiveDomain, restored?: ActiveSessionState) => {
    setActiveSessionRestored(restored || null);
    setActiveSessionDomain(domain);
  };

  const handleManualSync = async () => {
    const worker = SyncWorker.getInstance();
    await worker.syncNow();
  };

  const handleDismissSplash = () => {
    localStorage.setItem('ner_mind_splash_seen', 'true');
    setShowSplash(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setShowSplash(true);
    SpeechService.speak('You have logged out safely. Welcome back anytime.', 0.85, (language as SupportedAppLanguage) || 'en');
  };

  // Loading Screen
  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          color: '#0F172A',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
        <h2 style={{ fontSize: 32, margin: '0 0 8px 0', color: '#2563EB', fontWeight: 900 }}>
          NER-MIND
        </h2>
        <p style={{ fontSize: 18, color: '#64748B', maxWidth: 460, margin: '0 0 24px 0' }}>
          Loading offline cognitive companion and personal memory profile...
        </p>
        <div
          style={{
            width: 44,
            height: 44,
            border: '4px solid #EFF6FF',
            borderTopColor: '#2563EB',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // SCREEN 1: SPLASH SCREEN (when enabled or first-time launch)
  if (showSplash) {
    const currentPatient = OfflineStorageService.getPatientProfile();
    const currentMeta =
      SUPPORTED_LANGUAGES_META[currentPatient.preferredLanguage as SupportedAppLanguage] ||
      SUPPORTED_LANGUAGES_META.en;
    return (
      <SplashScreen
        onGetStarted={handleDismissSplash}
        currentLanguageLabel={`${currentMeta.flag} ${currentMeta.englishName} (${currentMeta.nativeName})`}
        patientName={currentPatient.displayName}
      />
    );
  }

  // CAREGIVER PORTAL (SCREENS 16–20)
  if (viewMode === 'caregiver') {
    return <CaregiverPortal onBackToPatientApp={() => setViewMode('patient')} />;
  }

  // HEALTHCARE WORKER PORTAL (SCREENS 21–22)
  if (viewMode === 'healthcare') {
    return <HealthcareWorkerPortal onExit={() => setViewMode('patient')} />;
  }

  const patient = OfflineStorageService.getPatientProfile();
  const isPlayingGame = Boolean(activeStandaloneGame || activeSessionDomain || showFullTransferProtocol);

  // PATIENT COMPANION EXPERIENCE (TAILORED FOR ANDROID APP & WEBSITE)
  return (
    <div
      className={isAndroid ? 'android-app-viewport' : 'website-desktop-viewport'}
      style={{
        minHeight: '100vh',
        backgroundColor: isAndroid ? '#0F172A' : '#F8FAFC',
        display: 'flex',
        flexDirection: isWebsite ? 'row' : 'column',
        position: 'relative',
      }}
    >
      {/* 1. Desktop Website Sidebar (Concealed in Android Mode & during focused gameplay) */}
      {isWebsite && !isPlayingGame && (
        <Sidebar
          activeTab={patientTab}
          onSelectTab={(tab) => {
            setPatientTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenHelp={() => setShowHelpModal(true)}
          patientName={patient.displayName}
          isOnline={isOnline}
          isOpenMobile={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
          pendingSyncCount={pendingSyncCount}
        />
      )}

      {/* Main Content Viewport */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          backgroundColor: isAndroid ? '#F8FAFC' : 'transparent',
        }}
      >
        {/* 2. Top Header Section: Tailored Android Mobile App Bar vs Desktop Header */}
        {!isPlayingGame && (
          isAndroid ? (
            <AndroidMobileHeader
              patientName={patient.displayName}
              patientId={patient.patientId}
              onOpenCaregiver={() => setViewMode('caregiver')}
              onOpenSettings={() => setShowSettingsModal(true)}
              onTriggerEmergency={handleTriggerEmergency}
              onPatientSwitched={handlePatientSwitched}
              onOpenCreateProfile={() => setShowCaretakerSetupModal(true)}
              onTestAlarm={handleTestAlarm}
              isOnline={isOnline}
            />
          ) : (
            <DashboardHeader
              patientName={patient.displayName}
              patientId={patient.patientId}
              onToggleSidebarMobile={() => setIsSidebarMobileOpen(true)}
              onOpenCaregiver={() => setViewMode('caregiver')}
              onLogout={() => setShowLogoutModal(true)}
              onOpenCreateProfile={() => setShowCaretakerSetupModal(true)}
              onTestAlarm={handleTestAlarm}
              onPatientSwitched={handlePatientSwitched}
              isOnline={isOnline}
              pendingSyncCount={pendingSyncCount}
              onManualSync={handleManualSync}
              isSyncing={syncStatus?.state === 'SYNCING'}
            />
          )
        )}

        {/* 3. Main Patient Application Content */}
        <main
          style={{
            flex: 1,
            padding: isPlayingGame
              ? (isAndroid ? '16px 14px 90px 14px' : '24px 20px')
              : (isAndroid ? '0 0 85px 0' : '28px 32px'),
            maxWidth: isPlayingGame ? 900 : (isAndroid ? '100%' : 1440),
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* ACTIVE COGNITIVE SESSION (FOCUSED GAMEPLAY) */}
          {activeStandaloneGame ? (
            <section aria-label="Selected cognitive game">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto 20px', maxWidth: 900 }}>
                <button
                  type="button"
                  onClick={() => setActiveStandaloneGame(null)}
                  style={{
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    borderRadius: 14,
                    padding: '10px 20px',
                    color: '#2563EB',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <span>← Back to Dashboard</span>
                </button>
              </div>
              <Suspense fallback={<p role="status" style={{ textAlign: 'center', color: '#64748B', fontSize: 18, marginTop: 40 }}>Loading game…</p>}>
                {activeStandaloneGame === 'colorSorting' && <ColorSorting />}
                {activeStandaloneGame === 'pictureRecognition' && <PictureRecognitionGame onExit={() => setActiveStandaloneGame(null)} />}
                {activeStandaloneGame === 'shapeFinding' && <ShapeFindingGame />}
                {activeStandaloneGame === 'jigsawPuzzle' && <SimpleJigsawPuzzle />}
                {activeStandaloneGame === 'wittyWords' && <WittyWords />}
                {activeStandaloneGame === 'wordSearch' && <WordSearchGame />}
                {activeStandaloneGame === 'personalRecognition' && <PersonalRecognitionGame onExit={() => setActiveStandaloneGame(null)} />}
                {activeStandaloneGame === 'identifyPerson' && <IdentifyPersonGame onExit={() => setActiveStandaloneGame(null)} />}
              </Suspense>
            </section>
          ) : activeSessionDomain ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto 20px', maxWidth: 900 }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSessionDomain(null);
                    setActiveSessionRestored(null);
                    refreshProfile();
                  }}
                  style={{
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    borderRadius: 14,
                    padding: '10px 20px',
                    color: '#2563EB',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <span>← Back to Dashboard</span>
                </button>
              </div>
              <CognitiveSessionSubFrame
                domain={activeSessionDomain}
                initialDifficulty={activeSessionRestored?.currentDifficulty || 1}
                totalQuestions={10}
                restoredSession={activeSessionRestored}
                onExit={() => {
                  setActiveSessionDomain(null);
                  setActiveSessionRestored(null);
                  refreshProfile();
                }}
                onSessionComplete={() => {
                  refreshProfile();
                }}
              />
            </div>
          ) : showFullTransferProtocol ? (
            /* Full 3-Step Real-Life Transfer Protocol */
            <div>
              <button
                type="button"
                onClick={() => setShowFullTransferProtocol(false)}
                style={{
                  marginBottom: 16,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: 14,
                  padding: '10px 20px',
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#2563EB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                ← Back to Dashboard
              </button>
              <TransferWorkflow
                onFinish={() => {
                  setShowFullTransferProtocol(false);
                  refreshProfile();
                }}
              />
            </div>
          ) : (
            <>
              {/* Resume Incomplete Session Card */}
              {savedSession && (
                <div
                  style={{
                    backgroundColor: '#FEF3C7',
                    borderRadius: 22,
                    padding: '20px 24px',
                    border: '2px solid #F59E0B',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)',
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 900, color: '#92400E' }}>
                      Resume Previous Cognitive Session?
                    </h4>
                    <span style={{ fontSize: 14, color: '#B45309', fontWeight: 600 }}>
                      {savedSession.domain.toUpperCase()} • Question {savedSession.currentQuestionIndex + 1} of {savedSession.totalQuestions}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        handleStartSession(savedSession.domain, savedSession);
                        setSavedSession(null);
                      }}
                      style={{
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 12,
                        padding: '10px 20px',
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Resume ▶
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
                        setSavedSession(null);
                      }}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 12,
                        padding: '10px 16px',
                        fontSize: 14,
                        color: '#64748B',
                        cursor: 'pointer',
                      }}
                    >
                      Discard ✕
                    </button>
                  </div>
                </div>
              )}

              {/* TAB ROUTING: DEDICATED ANDROID MOBILE FEED VS WEBSITE DESKTOP DASHBOARD */}
              {patientTab === 'home' && (
                isAndroid ? (
                  <AndroidHomeFeed
                    patientName={patient.displayName}
                    patientId={patient.patientId}
                    onNavigateTab={(t) => setPatientTab(t)}
                    onStartGame={(d) => handleStartSession(d)}
                    onSelectActivity={(activity) => setActiveStandaloneGame(activity)}
                    onStartMission={() => setPatientTab('transfer')}
                    onOpenSafetySimulator={() => setShowSafetyModal(true)}
                  />
                ) : (
                  <PatientHomeDashboard
                    patientName={patient.displayName}
                    onNavigateTab={(t) => setPatientTab(t)}
                    onStartGame={(d) => handleStartSession(d)}
                    recommendation={recommendation}
                    personalizedTask={personalizedTask}
                    onOpenVoiceSetup={() => setShowVoiceModal(true)}
                    currentLanguage={(patient.preferredLanguage as any) || 'en'}
                    onSelectActivity={(activity) => setActiveStandaloneGame(activity)}
                    onStartMission={() => setPatientTab('transfer')}
                    onOpenSafetySimulator={() => setShowSafetyModal(true)}
                  />
                )
              )}

              {patientTab === 'games' && (
                <CognitiveGamesMenu
                  onBack={() => setPatientTab('home')}
                  onSelectDomain={(d) => handleStartSession(d)}
                  onSelectActivity={setActiveStandaloneGame}
                />
              )}

              {patientTab === 'plan' && (
                <TodaysPlanView
                  onBack={() => setPatientTab('home')}
                  onStartGame={(d) => handleStartSession(d)}
                  onStartMission={() => setPatientTab('transfer')}
                  onStartFamily={() => setPatientTab('family')}
                />
              )}

              {patientTab === 'reminders' && (
                <RemindersView onBack={() => setPatientTab('home')} />
              )}

              {patientTab === 'call' && (
                <PatientCallingView onBack={() => setPatientTab('home')} />
              )}

              {patientTab === 'progress' && (
                <PatientProgressView onBack={() => setPatientTab('home')} />
              )}

              {patientTab === 'family' && (
                <FamilyMemoriesView onBack={() => setPatientTab('home')} />
              )}

              {patientTab === 'transfer' && (
                <RealLifeMissionsView
                  onBack={() => setPatientTab('home')}
                  onOpenTransferProtocol={() => setShowFullTransferProtocol(true)}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation Bar: Fixed on Android Mobile App, responsive on mobile screens */}
        {!isPlayingGame && (isAndroid || isSidebarMobileOpen === false) && (
          <div className="mobile-bottom-nav-wrapper" style={{ display: isAndroid ? 'block' : undefined }}>
            <BottomNav activeTab={patientTab} onTabChange={(t) => setPatientTab(t)} />
          </div>
        )}
      </div>

      {/* Voice Assistance Setup Modal */}
      {showVoiceModal && (
        <VoiceSetupModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          onContinue={() => {
            setShowVoiceModal(false);
          }}
          currentLanguage={(patient.preferredLanguage as any) || 'en'}
          patientName={patient.displayName}
        />
      )}

      {/* Accessible Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onOpenCaregiver={() => setViewMode('caregiver')}
      />

      {/* Help & Support Modal */}
      <HelpSupportModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onTriggerEmergency={handleTriggerEmergency}
      />

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirmLogout={handleConfirmLogout}
        patientName={patient.displayName}
      />

      {/* Safety & Emergency Situation Simulator Modal */}
      <EmergencySimulatorModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        patientName={patient.displayName}
      />

      {/* Real-Time Activity & Health Reminder Alert Notice Modal */}
      {activeAlarm && (
        <ActivityNoticeModal
          alarm={activeAlarm}
          onClose={() => setActiveAlarm(null)}
        />
      )}

      {/* Real-Time Active Audio/Video Call View */}
      {activeCall && <ActiveCallModal activeCall={activeCall} />}

      {/* Real-Time Incoming Call Alert Modal */}
      {incomingSignal && !activeCall && <IncomingCallModal incomingSignal={incomingSignal} />}

      {/* Caretaker Onboarding & Patient Profile Creation Modal */}
      {showCaretakerSetupModal && (
        <CaretakerSetupModal
          isOpen={showCaretakerSetupModal}
          isInitialOnboarding={typeof localStorage !== 'undefined' ? !localStorage.getItem('ner_mind_caretaker_onboarding_completed') : false}
          onProfileCreated={handleProfileCreated}
          onExploreDemo={handleExploreDemo}
          onClose={() => setShowCaretakerSetupModal(false)}
        />
      )}

      <style>{`
        .mobile-bottom-nav-wrapper {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-bottom-nav-wrapper {
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppModeProvider>
        <LocalizationProvider>
          <PatientAppInner />
        </LocalizationProvider>
      </AppModeProvider>
    </ErrorBoundary>
  );
};
