import React, { useState } from 'react';
import { CognitiveDomain, TrainingRecommendation, PersonalizedTaskSelection, SupportedLanguage } from '@ner-mind/core';
import { PatientTab } from './BottomNav.js';
import { StandaloneGameId } from './CognitiveGamesMenu.js';
import { SupportedAppLanguage } from '../../audio/speechService.js';
import { SUPPORTED_LANGUAGES_META } from '../../services/LocalizationService.js';
import { useLocalization } from '../../localization/index.js';
import { HeroBanner } from '../dashboard/HeroBanner.js';
import { GamesSection } from '../dashboard/GamesSection.js';
import { RightDashboard } from '../dashboard/RightDashboard.js';
import { RecommendedSection } from '../dashboard/RecommendedSection.js';
import { EmergencySimulatorModal } from '../modals/EmergencySimulatorModal.js';

interface Props {
  patientName: string;
  onNavigateTab: (tab: PatientTab) => void;
  onStartGame: (domain: CognitiveDomain) => void;
  recommendation: TrainingRecommendation | null;
  personalizedTask: PersonalizedTaskSelection | null;
  onOpenVoiceSetup: () => void;
  currentLanguage?: SupportedLanguage;
  onSelectActivity?: (activity: StandaloneGameId) => void;
  onStartMission?: () => void;
  onOpenSafetySimulator?: () => void;
}

export const PatientHomeDashboard: React.FC<Props> = ({
  patientName,
  onNavigateTab,
  onStartGame,
  recommendation,
  personalizedTask,
  onOpenVoiceSetup,
  onSelectActivity = () => {},
  onStartMission = () => onNavigateTab('transfer'),
  onOpenSafetySimulator,
}) => {
  const { language, formatBilingual } = useLocalization();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const handleOpenSimulator = () => {
    if (onOpenSafetySimulator) {
      onOpenSafetySimulator();
    } else {
      setIsSimulatorOpen(true);
    }
  };

  const recDomain: CognitiveDomain =
    (recommendation?.priorityDomain as CognitiveDomain) ||
    (personalizedTask?.candidate?.domain as CognitiveDomain) ||
    'memory';

  const appLang = (language as SupportedAppLanguage) || 'en';
  const langMeta = SUPPORTED_LANGUAGES_META[appLang] || SUPPORTED_LANGUAGES_META.en;

  return (
    <div className="patient-dashboard-container" style={{ width: '100%', margin: '0 auto', paddingBottom: 60 }}>
      {/* 2-Column Responsive Dashboard Layout */}
      <div
        className="dashboard-columns-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* Main Center Column */}
        <div className="dashboard-main-column" style={{ minWidth: 0 }}>
          {/* 1. Main Hero Banner */}
          <HeroBanner
            patientName={patientName}
            onStartJourney={() => onStartGame(recDomain)}
          />

          {/* 2. Games and Activities Section (10 colorful cards) */}
          <GamesSection
            onStartDomain={onStartGame}
            onSelectActivity={onSelectActivity}
            onStartMission={onStartMission}
            onOpenSafetySimulator={handleOpenSimulator}
          />

          {/* 3. Recommended For You Section */}
          <RecommendedSection
            recommendation={recommendation}
            personalizedTask={personalizedTask}
            onStartGame={onStartGame}
            onOpenSafetySimulator={handleOpenSimulator}
            onOpenVoiceSetup={onOpenVoiceSetup}
            onStartMission={onStartMission}
            onOpenProgress={() => onNavigateTab('progress')}
          />

          {/* Language & Voice Synchronized Status Bar (Contract preservation for test-suite) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: '14px 20px',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12,
            }}
            data-testid="patient-home-language-status"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{langMeta.flag || '🇮🇳'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  {formatBilingual(langMeta.nativeName, langMeta.englishName)} ({langMeta.englishName})
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Managed by Caregiver • Voice assistant active & synchronized
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                padding: '4px 10px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>🔒</span> Synchronized
            </span>
          </div>
        </div>

        {/* Right Dashboard Column */}
        <div className="dashboard-right-column">
          <RightDashboard
            onNavigateTab={onNavigateTab}
            onStartGame={onStartGame}
            onOpenSafetySimulator={handleOpenSimulator}
          />
        </div>
      </div>

      {/* Emergency Simulator Modal */}
      <EmergencySimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        patientName={patientName}
      />

      <style>{`
        @media (max-width: 1200px) {
          .dashboard-columns-layout {
            grid-template-columns: 1fr !important;
          }
          .dashboard-right-column {
            margin-top: 12px;
          }
        }
      `}</style>
    </div>
  );
};
