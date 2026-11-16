import React, { useState, useEffect } from 'react';
import { PatientTab } from '../patient/BottomNav.js';
import { PlanItem, DEFAULT_PLAN, STORAGE_KEY_DAILY_PLAN } from '../patient/TodaysPlanView.js';
import { ReminderItem, DEFAULT_REMINDERS, STORAGE_KEY_REMINDERS } from '../patient/RemindersView.js';
import { OfflineStorageService } from '../../storage/localStorage.js';
import { calculateCognitiveProfile } from '@ner-mind/core';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { CheckIcon, ChevronRightIcon, TrendingUpIcon } from '../common/Icons.js';

interface RightDashboardProps {
  onNavigateTab: (tab: PatientTab) => void;
  onStartGame?: (domain: any) => void;
  onOpenSafetySimulator?: () => void;
}

export const RightDashboard: React.FC<RightDashboardProps> = ({
  onNavigateTab,
}) => {
  const { language } = useLocalization();

  // Progress metrics
  const [stats, setStats] = useState({
    completedGames: 18,
    level: 2,
    accuracy: 86,
    bestScore: 95,
  });

  // Today's Plan state
  const [planItems, setPlanItems] = useState<PlanItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DAILY_PLAN);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PLAN;
  });

  // Reminders state
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_REMINDERS;
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const storedPlan = localStorage.getItem(STORAGE_KEY_DAILY_PLAN);
        if (storedPlan) setPlanItems(JSON.parse(storedPlan));
        const storedRem = localStorage.getItem(STORAGE_KEY_REMINDERS);
        if (storedRem) setReminders(JSON.parse(storedRem));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    try {
      const profile = OfflineStorageService.getPatientProfile();
      const obs = OfflineStorageService.getObservations();
      const count = obs.length > 0 ? obs.length : 18;
      const cog = calculateCognitiveProfile(profile.patientId, obs);
      const scores = Object.values(cog.domains).map(d => d.currentScore).filter(Boolean);
      const avg = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
        : 86;
      const best = scores.length > 0
        ? Math.round(Math.max(...scores) * 100)
        : 95;

      setStats({
        completedGames: count,
        level: Math.max(1, Math.min(5, Math.floor(count / 8) + 1)),
        accuracy: avg,
        bestScore: Math.max(best, 92),
      });
    } catch {}
  }, []);

  const handleTogglePlan = (id: string) => {
    setPlanItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      );
      try {
        localStorage.setItem('ner_mind_todays_plan_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const next = !item.patientAcknowledged;
          return {
            ...item,
            patientAcknowledged: next,
            isCompleted: next,
          };
        }
        return item;
      });
      try {
        localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleReadReminder = (rem: ReminderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    SpeechService.speak(
      `Reminder for ${rem.time}: ${rem.defaultTitle}`,
      0.9,
      (language as SupportedAppLanguage) || 'en'
    );
  };

  const completedPlansCount = planItems.filter((p) => p.isCompleted).length;

  return (
    <aside
      className="right-dashboard"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
      aria-label="Right Side Dashboard"
    >
      {/* 1. YOUR PROGRESS CARD */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '24px 22px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <TrendingUpIcon size={20} />
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#0F172A',
                margin: 0,
              }}
            >
              Your Progress
            </h3>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              backgroundColor: '#ECFDF5',
              color: '#059669',
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid #A7F3D0',
            }}
          >
            Level {stats.level}
          </span>
        </div>

        {/* 2x2 Progress Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              padding: '14px 12px',
              border: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Completed
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
              {stats.completedGames}
            </div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>Active Games</div>
          </div>

          <div
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              padding: '14px 12px',
              border: '1px solid #BFDBFE',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>
              Accuracy
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#2563EB', marginTop: 2 }}>
              {stats.accuracy}%
            </div>
            <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>Average Score</div>
          </div>

          <div
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 16,
              padding: '14px 12px',
              border: '1px solid #FDE68A',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
              Best Score
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706', marginTop: 2 }}>
              {stats.bestScore}%
            </div>
            <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>Top Record</div>
          </div>

          <div
            style={{
              backgroundColor: '#F5F3FF',
              borderRadius: 16,
              padding: '14px 12px',
              border: '1px solid #DDD6FE',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase' }}>
              Current Level
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#7C3AED', marginTop: 2 }}>
              Lvl {stats.level}
            </div>
            <div style={{ fontSize: 11, color: '#6D28D9', fontWeight: 600 }}>Steady Explorer</div>
          </div>
        </div>

        {/* Circular Progress Gauge & Visualization */}
        <div
          style={{
            backgroundColor: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
            borderRadius: 18,
            padding: '16px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Radial Gauge SVG */}
          <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle
                cx="34"
                cy="34"
                r="28"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="6"
              />
              <circle
                cx="34"
                cy="34"
                r="28"
                fill="none"
                stroke="#2563EB"
                strokeWidth="6"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 * (1 - stats.accuracy / 100)}
                strokeLinecap="round"
                transform="rotate(-90 34 34)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 900,
                color: '#1E293B',
              }}
            >
              {stats.accuracy}%
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
              Cognitive Resilience
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
              Consistent weekly exercise preserves memory pathways.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('progress')}
          style={{
            width: '100%',
            backgroundColor: '#F8FAFC',
            color: '#2563EB',
            border: '1px solid #BFDBFE',
            borderRadius: 14,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <span>View Full Progress Report</span>
          <ChevronRightIcon size={14} color="#2563EB" />
        </button>
      </div>

      {/* 2. TODAY'S PLAN CARD */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '24px 22px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#0F172A',
                margin: 0,
              }}
            >
              Today's Plan
            </h3>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              {completedPlansCount} of {planItems.length} activities completed
            </span>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              padding: '4px 10px',
              borderRadius: 10,
              border: '1px solid #BFDBFE',
            }}
          >
            Today
          </span>
        </div>

        {/* Plan Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {planItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleTogglePlan(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 16,
                backgroundColor: item.isCompleted ? '#F8FAFC' : '#FFFFFF',
                border: `1.5px solid ${item.isCompleted ? '#E2E8F0' : item.colorBorder}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Completed Checkmark Toggle */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    backgroundColor: item.isCompleted ? '#22C55E' : '#FFFFFF',
                    border: `2px solid ${item.isCompleted ? '#22C55E' : '#CBD5E1'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0,
                  }}
                >
                  {item.isCompleted && <CheckIcon size={16} color="#FFFFFF" />}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: item.isCompleted ? '#94A3B8' : '#0F172A',
                      textDecoration: item.isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {item.defaultTitle}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    ⏰ {item.time}
                  </div>
                </div>
              </div>

              <span style={{ fontSize: 20 }}>{item.icon}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('plan')}
          style={{
            width: '100%',
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
            border: '1.5px solid #BFDBFE',
            borderRadius: 14,
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <span>View Full Plan</span>
          <ChevronRightIcon size={16} color="#1D4ED8" />
        </button>
      </div>

      {/* 3. IMPORTANT REMINDERS CARD */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '24px 22px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⏰</span>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#0F172A',
                margin: 0,
              }}
            >
              Important Reminders
            </h3>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid #FDE68A',
            }}
          >
            Caregiver Set
          </span>
        </div>

        {/* Reminders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {reminders.map((rem) => (
            <div
              key={rem.id}
              onClick={() => handleToggleReminder(rem.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 16,
                backgroundColor: rem.isCompleted ? '#F8FAFC' : rem.colorBg,
                border: `1.5px solid ${rem.isCompleted ? '#E2E8F0' : rem.colorBorder}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{rem.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: rem.isCompleted ? '#94A3B8' : '#0F172A',
                      textDecoration: rem.isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {rem.defaultTitle}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                    {rem.time}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={(e) => handleReadReminder(rem, e)}
                  style={{
                    border: 'none',
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                  title="Read reminder aloud"
                >
                  🔊
                </button>

                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    backgroundColor: rem.isCompleted ? '#22C55E' : '#FFFFFF',
                    border: `2px solid ${rem.isCompleted ? '#22C55E' : '#CBD5E1'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                  }}
                >
                  {rem.isCompleted && <CheckIcon size={14} color="#FFFFFF" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('reminders')}
          style={{
            width: '100%',
            backgroundColor: '#F8FAFC',
            color: '#334155',
            border: '1.5px solid #CBD5E1',
            borderRadius: 14,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <span>Manage All Reminders</span>
          <ChevronRightIcon size={14} color="#475569" />
        </button>
      </div>
    </aside>
  );
};
