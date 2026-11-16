import React from 'react';
import { CognitiveDomain, TrainingRecommendation, PersonalizedTaskSelection } from '@ner-mind/core';
import { SparklesIcon } from '../common/Icons.js';

interface RecommendedSectionProps {
  recommendation: TrainingRecommendation | null;
  personalizedTask: PersonalizedTaskSelection | null;
  onStartGame: (domain: CognitiveDomain) => void;
  onOpenSafetySimulator: () => void;
  onOpenVoiceSetup: () => void;
  onStartMission: () => void;
  onOpenProgress: () => void;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  recommendation,
  personalizedTask,
  onStartGame,
  onOpenSafetySimulator,
  onOpenVoiceSetup,
  onStartMission,
  onOpenProgress,
}) => {
  const recDomain: CognitiveDomain =
    (recommendation?.priorityDomain as CognitiveDomain) ||
    (personalizedTask?.candidate?.domain as CognitiveDomain) ||
    'memory';

  const recReason =
    personalizedTask?.rationale ||
    recommendation?.rationale ||
    'Personalized daily training selected by the offline adaptive engine.';

  return (
    <section aria-label="Personalized Recommendations" style={{ marginBottom: 36 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SparklesIcon size={24} color="#2563EB" />
          <h3
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#0F172A',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Recommended For You
          </h3>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid #BFDBFE',
            }}
          >
            AI Personalized
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#64748B', fontWeight: 500 }}>
          Custom tailored based on your memory profile and daily cognitive habits
        </p>
      </div>

      {/* Grid of 5 Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {/* 1. Emergency Situation Simulator */}
        <div
          onClick={onOpenSafetySimulator}
          className="rec-card"
          style={{
            backgroundColor: '#FFF1F2',
            border: '2px solid #FECDD3',
            borderRadius: 22,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #FECDD3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                🚨
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: '#FFE4E6',
                  color: '#BE123C',
                  padding: '3px 8px',
                  borderRadius: 8,
                  border: '1px solid #FECDD3',
                }}
              >
                Safety & Peace of Mind
              </span>
            </div>

            <h4
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#9F1239',
                margin: '0 0 6px 0',
              }}
            >
              Emergency Situation Simulator
            </h4>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.45, margin: 0 }}>
              Practice staying calm during unexpected doorbells, gas stove checks, or feeling disoriented.
            </p>
          </div>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#E11D48',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <span>Simulate Emergency</span>
            <span>▶</span>
          </div>
        </div>

        {/* 2. AI Adaptive Difficulty */}
        <div
          onClick={() => onStartGame(recDomain)}
          className="rec-card"
          style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #BFDBFE',
            borderRadius: 22,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                🎯
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: '#DBEAFE',
                  color: '#1E40AF',
                  padding: '3px 8px',
                  borderRadius: 8,
                  border: '1px solid #BFDBFE',
                }}
              >
                {recDomain.toUpperCase()} Focus
              </span>
            </div>

            <h4
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1E3A8A',
                margin: '0 0 6px 0',
              }}
            >
              AI Adaptive Difficulty
            </h4>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.45, margin: 0 }}>
              {recReason}
            </p>
          </div>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#2563EB',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <span>Start Adapted Session</span>
            <span>▶</span>
          </div>
        </div>

        {/* 3. Voice Assistance */}
        <div
          onClick={onOpenVoiceSetup}
          className="rec-card"
          style={{
            backgroundColor: '#F5F3FF',
            border: '2px solid #DDD6FE',
            borderRadius: 22,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #DDD6FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                🎙️
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: '#EDE9FE',
                  color: '#5B21B6',
                  padding: '3px 8px',
                  borderRadius: 8,
                  border: '1px solid #DDD6FE',
                }}
              >
                Offline Voice
              </span>
            </div>

            <h4
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#4C1D95',
                margin: '0 0 6px 0',
              }}
            >
              Voice Assistance
            </h4>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.45, margin: 0 }}>
              Speak commands and hear warm audio directions in your mother tongue without typing.
            </p>
          </div>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#7C3AED',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <span>Check Microphone & Voice</span>
            <span>🎙️</span>
          </div>
        </div>

        {/* 4. Real-Life Learning */}
        <div
          onClick={onStartMission}
          className="rec-card"
          style={{
            backgroundColor: '#ECFDF5',
            border: '2px solid #A7F3D0',
            borderRadius: 22,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                🛒
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  padding: '3px 8px',
                  borderRadius: 8,
                  border: '1px solid #A7F3D0',
                }}
              >
                Transfer Protocol
              </span>
            </div>

            <h4
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#064E3B',
                margin: '0 0 6px 0',
              }}
            >
              Real-Life Learning
            </h4>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.45, margin: 0 }}>
              Connect game practice to real routines: Assam morning tea preparation and market grocery trips.
            </p>
          </div>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#059669',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <span>Start Life Mission</span>
            <span>→</span>
          </div>
        </div>

        {/* 5. Progress Tracking */}
        <div
          onClick={onOpenProgress}
          className="rec-card"
          style={{
            backgroundColor: '#FFFBEB',
            border: '2px solid #FDE68A',
            borderRadius: 22,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #FDE68A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                📊
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  padding: '3px 8px',
                  borderRadius: 8,
                  border: '1px solid #FDE68A',
                }}
              >
                Long-Term Insights
              </span>
            </div>

            <h4
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#78350F',
                margin: '0 0 6px 0',
              }}
            >
              Progress Tracking
            </h4>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.45, margin: 0 }}>
              Visualise your cognitive resilience, retention rates, and celebrate daily streaks.
            </p>
          </div>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#D97706',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <span>View Progress</span>
            <span>📈</span>
          </div>
        </div>
      </div>

      <style>{`
        .rec-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
        }
      `}</style>
    </section>
  );
};
