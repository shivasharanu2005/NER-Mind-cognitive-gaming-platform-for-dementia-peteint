import React, { useState, useEffect } from 'react';
import { CognitiveDomain } from '@ner-mind/core';
import { StandaloneGameId } from '../patient/CognitiveGamesMenu.js';
import { PatientTab } from '../patient/BottomNav.js';
import { SpeechService } from '../../audio/speechService.js';
import { OfflineStorageService } from '../../storage/localStorage.js';
import { ReminderItem, DEFAULT_REMINDERS, STORAGE_KEY_REMINDERS } from '../patient/RemindersView.js';
import { PlanItem, DEFAULT_PLAN, STORAGE_KEY_DAILY_PLAN } from '../patient/TodaysPlanView.js';

interface Props {
  patientName: string;
  patientId: string;
  onNavigateTab: (tab: PatientTab) => void;
  onStartGame: (domain: CognitiveDomain) => void;
  onSelectActivity: (activity: StandaloneGameId) => void;
  onStartMission: () => void;
  onOpenSafetySimulator: () => void;
}

export const AndroidHomeFeed: React.FC<Props> = ({
  patientName,
  patientId,
  onNavigateTab,
  onStartGame,
  onSelectActivity,
  onStartMission,
  onOpenSafetySimulator,
}) => {
  // Load user-scoped reminders & daily plan
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    return OfflineStorageService.getUserScopedData(STORAGE_KEY_REMINDERS, DEFAULT_REMINDERS, patientId);
  });
  const [planItems, setPlanItems] = useState<PlanItem[]>(() => {
    return OfflineStorageService.getUserScopedData(STORAGE_KEY_DAILY_PLAN, DEFAULT_PLAN, patientId);
  });
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    return OfflineStorageService.getUserScopedData('ner_mind_water_count', 2, patientId);
  });

  useEffect(() => {
    setReminders(OfflineStorageService.getUserScopedData(STORAGE_KEY_REMINDERS, DEFAULT_REMINDERS, patientId));
    setPlanItems(OfflineStorageService.getUserScopedData(STORAGE_KEY_DAILY_PLAN, DEFAULT_PLAN, patientId));
    setWaterGlasses(OfflineStorageService.getUserScopedData('ner_mind_water_count', 2, patientId));
  }, [patientId]);

  // Find next pending medicine
  const nextMedicine = reminders.find((r) => r.category === 'medicine' && !r.patientAcknowledged);

  // Completed activities stats
  const completedActivitiesCount = planItems.filter((i) => i.isCompleted).length;

  const handleAcknowledgeMedicine = (reminderId: string) => {
    const updated = reminders.map((r) =>
      r.id === reminderId
        ? {
            ...r,
            patientAcknowledged: true,
            patientAcknowledgedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isCompleted: true,
          }
        : r
    );
    setReminders(updated);
    OfflineStorageService.setUserScopedData(STORAGE_KEY_REMINDERS, updated, patientId);
    SpeechService.speak('Medication acknowledged. Excellent work staying on schedule!');
  };

  const handleAddWater = () => {
    const next = Math.min(8, waterGlasses + 1);
    setWaterGlasses(next);
    OfflineStorageService.setUserScopedData('ner_mind_water_count', next, patientId);
    SpeechService.speak(`Hydration logged. You have had ${next} glasses of fresh water today.`);
  };

  const playVoicePrompt = (text: string) => {
    SpeechService.speak(text);
  };

  // 10 Android Game Cards
  const gamesList: Array<{
    id: StandaloneGameId | 'domain_memory';
    title: string;
    regionalTitle: string;
    desc: string;
    icon: string;
    colorBg: string;
    colorBorder: string;
    textColor: string;
    domain: CognitiveDomain;
    isDomain?: boolean;
  }> = [
    {
      id: 'shapeFinding',
      title: 'Shape Finding',
      regionalTitle: 'আকৃতি বিচৰা খেল',
      desc: 'Find familiar circles, stars & patterns',
      icon: '🔍',
      colorBg: '#EFF6FF',
      colorBorder: '#BFDBFE',
      textColor: '#1D4ED8',
      domain: 'attention',
    },
    {
      id: 'jigsawPuzzle',
      title: 'Jigsaw Puzzle',
      regionalTitle: 'চিত্ৰ জোৰা খেল',
      desc: 'Reassemble serene landscape art',
      icon: '🧩',
      colorBg: '#F5F3FF',
      colorBorder: '#DDD6FE',
      textColor: '#6D28D9',
      domain: 'attention',
    },
    {
      id: 'pictureRecognition',
      title: 'Picture Recognition',
      regionalTitle: 'ছবি চিনাক্তকৰণ',
      desc: 'Identify familiar heritage items',
      icon: '🖼️',
      colorBg: '#ECFDF5',
      colorBorder: '#A7F3D0',
      textColor: '#047857',
      domain: 'recognition',
    },
    {
      id: 'colorSorting',
      title: 'Color Sorting',
      regionalTitle: 'ৰং পৃথকীকৰণ',
      desc: 'Sort vibrant tea leaves & flowers',
      icon: '🎨',
      colorBg: '#FFFBEB',
      colorBorder: '#FDE68A',
      textColor: '#B45309',
      domain: 'planning',
    },
    {
      id: 'wittyWords',
      title: 'Word Arrange',
      regionalTitle: 'শব্দ সজোৱা খেল',
      desc: 'Arrange letters into familiar words',
      icon: '🔤',
      colorBg: '#FFF1F2',
      colorBorder: '#FECDD3',
      textColor: '#BE123C',
      domain: 'memory',
    },
    {
      id: 'identifyPerson',
      title: 'Family Identification',
      regionalTitle: 'পৰিয়ালৰ মানুহ চিনা',
      desc: 'Recognize your family members & photos',
      icon: '👨‍👩‍👧',
      colorBg: '#FDF2F8',
      colorBorder: '#FBCFE8',
      textColor: '#BE185D',
      domain: 'recognition',
    },
    {
      id: 'personalRecognition',
      title: 'Familiar Objects',
      regionalTitle: 'পৰিচিত বস্তু খেল',
      desc: 'Recall personal household memories',
      icon: '🏺',
      colorBg: '#F0FDFA',
      colorBorder: '#99F6E4',
      textColor: '#0F766E',
      domain: 'recognition',
    },
    {
      id: 'domain_memory',
      title: 'Shopping Recall',
      regionalTitle: 'বজাৰৰ তালিকা মনত ৰখা',
      desc: 'Remember items from the fresh market',
      icon: '🛒',
      colorBg: '#F1F5F9',
      colorBorder: '#CBD5E1',
      textColor: '#334155',
      domain: 'memory',
      isDomain: true,
    },
    {
      id: 'wordSearch',
      title: 'Word Search',
      regionalTitle: 'শব্দ বিচাৰক',
      desc: 'Discover gentle words in calming grid',
      icon: '📖',
      colorBg: '#FEF3C7',
      colorBorder: '#FDE68A',
      textColor: '#92400E',
      domain: 'attention',
    },
    {
      id: 'shapeFinding',
      title: 'Tea Routine Sequencing',
      regionalTitle: 'চাহ বনোৱাৰ নিয়ম',
      desc: 'Sequence everyday familiar habits',
      icon: '☕',
      colorBg: '#FFF7ED',
      colorBorder: '#FED7AA',
      textColor: '#C2410C',
      domain: 'sequencing',
    },
  ];

  return (
    <div
      className="android-home-feed"
      style={{
        padding: '16px 14px 100px 14px',
        maxWidth: 640,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {/* 1. HERO BRAIN WORKOUT CARD */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #38BDF8 100%)',
          borderRadius: 24,
          padding: '22px 20px',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.28)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 700, marginBottom: 4 }}>
              Welcome, {patientName}!
            </div>
            <span
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Recommended Today
            </span>
            <h3 style={{ margin: '10px 0 6px 0', fontSize: 22, fontWeight: 900, lineHeight: 1.25 }}>
              Shape Finding Exercise
            </h3>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.9, lineHeight: 1.4 }}>
              Strengthen visual attention & pattern memory with comforting shapes.
            </p>
          </div>
          <span style={{ fontSize: 44 }}>🧠</span>
        </div>

        {/* 1-Tap Big Android Action Button */}
        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => onSelectActivity('shapeFinding')}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              color: '#1E3A8A',
              border: 'none',
              borderRadius: 16,
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <span>▶</span>
            <span>Start Today's Workout</span>
          </button>

          <button
            type="button"
            onClick={() => playVoicePrompt('Today we will practice shape finding. Tap the start button whenever you feel ready.')}
            title="Listen to voice guidance"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: 16,
              padding: '14px 16px',
              fontSize: 18,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            🔊
          </button>
        </div>
      </section>

      {/* 2. QUICK DAILY ESSENTIALS (CARDS ROW) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h4 style={{ margin: '0 0 2px 4px', fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
          Daily Care Essentials
        </h4>

        {/* Medication Card (if pending) */}
        {nextMedicine && (
          <div
            style={{
              backgroundColor: '#FFF1F2',
              border: '2px solid #FECDD3',
              borderRadius: 20,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>💊</span>
              <div>
                <div style={{ fontSize: 12, color: '#BE123C', fontWeight: 800 }}>
                  DUE AT {nextMedicine.time}
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#881337' }}>
                  {nextMedicine.medicineName || nextMedicine.defaultTitle}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAcknowledgeMedicine(nextMedicine.id)}
              style={{
                backgroundColor: '#E11D48',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ✓ Took It
            </button>
          </div>
        )}

        {/* Family & Care Video Call Banner */}
        <div
          onClick={() => onNavigateTab('call')}
          role="button"
          tabIndex={0}
          style={{
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            borderRadius: 22,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 32 }}>📞</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>Call Family & Caretaker</div>
              <div style={{ fontSize: 13, color: '#D1FAE5', fontWeight: 600 }}>1-tap video or voice call</div>
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, backgroundColor: 'rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 14 }}>
            Call →
          </span>
        </div>

        {/* 2-Column Quick Widgets: Water & Routine */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Water Tracker */}
          <div
            style={{
              backgroundColor: '#E0F2FE',
              border: '2px solid #BAE6FD',
              borderRadius: 20,
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 26 }}>💧</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0369A1' }}>
                {waterGlasses} / 8 Glasses
              </span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0C4A6E' }}>Hydration</div>
              <button
                type="button"
                onClick={handleAddWater}
                style={{
                  marginTop: 6,
                  width: '100%',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '8px 10px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                + Log 1 Glass
              </button>
            </div>
          </div>

          {/* Routine Tracker */}
          <div
            style={{
              backgroundColor: '#F0FDF4',
              border: '2px solid #BBF7D0',
              borderRadius: 20,
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 26 }}>📅</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#15803D' }}>
                {completedActivitiesCount} / {planItems.length}
              </span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#14532D' }}>Today's Plan</div>
              <button
                type="button"
                onClick={() => onNavigateTab('plan')}
                style={{
                  marginTop: 6,
                  width: '100%',
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '8px 10px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                View Routine →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ALL 10 COGNITIVE GAMES (TOUCH-OPTIMIZED ANDROID GRID) */}
      <section style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>
              Cognitive Games & Memory
            </h4>
            <span style={{ fontSize: 12, color: '#64748B' }}>10 interactive dementia-friendly games</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('games')}
            style={{
              backgroundColor: 'transparent',
              color: '#2563EB',
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            All Games →
          </button>
        </div>

        {/* 2-Column Big Touch Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {gamesList.map((game, idx) => (
            <div
              key={`${game.id}-${idx}`}
              onClick={() => {
                if (game.isDomain) {
                  onStartGame(game.domain);
                } else {
                  onSelectActivity(game.id as StandaloneGameId);
                }
              }}
              role="button"
              tabIndex={0}
              style={{
                backgroundColor: game.colorBg,
                border: `2px solid ${game.colorBorder}`,
                borderRadius: 20,
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 140,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                transition: 'transform 0.1s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 32 }}>{game.icon}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playVoicePrompt(`${game.title}. ${game.desc}`);
                  }}
                  title="Listen"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid #CBD5E1',
                    borderRadius: 10,
                    padding: '3px 7px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  🔊
                </button>
              </div>

              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: game.textColor,
                    lineHeight: 1.25,
                  }}
                >
                  {game.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748B',
                    fontWeight: 600,
                    marginTop: 3,
                    lineHeight: 1.3,
                  }}
                >
                  {game.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. EMERGENCY & SAFETY SIMULATOR CARD */}
      <section
        style={{
          backgroundColor: '#FFFBEB',
          border: '2px solid #FDE68A',
          borderRadius: 20,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#92400E' }}>
              Safety & Real-Life Practice
            </div>
            <div style={{ fontSize: 12, color: '#B45309' }}>
              Practice home safety and emergency response calmly.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onStartMission}
            style={{
              backgroundColor: '#B45309',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Missions 🎯
          </button>
          <button
            type="button"
            onClick={onOpenSafetySimulator}
            style={{
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Practice ▶
          </button>
        </div>
      </section>
    </div>
  );
};
