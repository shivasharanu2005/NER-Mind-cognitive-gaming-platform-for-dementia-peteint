import React, { useState, useEffect, useMemo } from 'react';
import { CognitiveDomain } from '@ner-mind/core';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { OfflineStorageService } from '../../storage/localStorage.js';
import { CheckIcon, XIcon } from '../common/Icons.js';

export type ActivityPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export type ActivityCategory =
  | 'hygiene'
  | 'meal'
  | 'water'
  | 'exercise'
  | 'cognitive'
  | 'sleep'
  | 'appointment'
  | 'routine';

export interface PlanItem {
  id: string;
  time: string; // e.g. "08:00 AM"
  period: ActivityPeriod;
  category: ActivityCategory;
  titleKey?: string;
  defaultTitle: string;
  subtitleKey?: string;
  defaultSubtitle: string;
  description?: string;
  icon: string;
  imageUrl?: string;
  colorBg: string;
  colorBorder: string;
  actionType: 'game' | 'mission' | 'family' | 'habit' | 'audio';
  domain?: CognitiveDomain;
  isCompleted: boolean;
  completedAt?: string;
}

export const DEFAULT_PLAN: PlanItem[] = [
  {
    id: 'plan_hygiene_1',
    time: '07:00 AM',
    period: 'morning',
    category: 'hygiene',
    titleKey: 'plan.morningHygiene',
    defaultTitle: 'Morning Refresh & Personal Hygiene',
    defaultSubtitle: 'Face wash, teeth brushing & fresh warm clothes',
    description: 'Start the day refreshed: wash hands and face with gentle warm water, brush teeth, and dress in clean, comfortable attire.',
    icon: '🪥',
    colorBg: '#EFF6FF',
    colorBorder: '#BFDBFE',
    actionType: 'habit',
    isCompleted: true,
    completedAt: '07:20 AM',
  },
  {
    id: 'plan_tea_1',
    time: '08:00 AM',
    period: 'morning',
    category: 'meal',
    titleKey: 'plan.morningRoutine',
    defaultTitle: 'Nutritious Breakfast & Assam Tea',
    defaultSubtitle: 'Traditional warm tea with soft pitha or oats',
    description: 'Enjoy a warm wholesome breakfast with Assam CTC tea. Proper nutrition in the morning fuels clear cognitive thinking.',
    icon: '☕',
    colorBg: '#ECFDF5',
    colorBorder: '#A7F3D0',
    actionType: 'game',
    domain: 'sequencing',
    isCompleted: true,
    completedAt: '08:25 AM',
  },
  {
    id: 'plan_water_1',
    time: '09:00 AM',
    period: 'morning',
    category: 'water',
    titleKey: 'plan.morningHydration',
    defaultTitle: 'Morning Hydration Glass (1 of 4)',
    defaultSubtitle: 'Drink 1 full glass of fresh lukewarm water',
    description: 'Hydration supports memory and circulation. Sit down comfortably and drink one complete glass of water.',
    icon: '💧',
    colorBg: '#E0F2FE',
    colorBorder: '#7DD3FC',
    actionType: 'habit',
    isCompleted: true,
    completedAt: '09:05 AM',
  },
  {
    id: 'plan_cog_1',
    time: '10:00 AM',
    period: 'morning',
    category: 'cognitive',
    titleKey: 'plan.memoryGame',
    defaultTitle: 'Cognitive Memory Game Session',
    defaultSubtitle: 'Market shopping recall & picture recognition',
    description: 'Spend 10 peaceful minutes exercising memory recall with familiar market objects and traditional items.',
    icon: '🧠',
    colorBg: '#FFF1F2',
    colorBorder: '#FECDD3',
    actionType: 'game',
    domain: 'memory',
    isCompleted: false,
  },
  {
    id: 'plan_walk_1',
    time: '11:30 AM',
    period: 'morning',
    category: 'exercise',
    titleKey: 'plan.morningWalk',
    defaultTitle: 'Gentle Garden Walk & Sunlight',
    defaultSubtitle: '15 minutes peaceful stroll & deep breathing',
    description: 'Walk around the garden or courtyard under gentle morning sunlight. Take 5 deep calming breaths.',
    icon: '🚶',
    colorBg: '#FEF3C7',
    colorBorder: '#FDE68A',
    actionType: 'habit',
    isCompleted: false,
  },
  {
    id: 'plan_lunch_1',
    time: '01:00 PM',
    period: 'afternoon',
    category: 'meal',
    titleKey: 'plan.lunchMeal',
    defaultTitle: 'Wholesome Balanced Lunch & Rest',
    defaultSubtitle: 'Warm rice, seasonal vegetables & curd',
    description: 'Eat a peaceful, unhurried lunch with fiber and proteins. Rest for 20 minutes in a comfortable armchair afterwards.',
    icon: '🍲',
    colorBg: '#FFFBEB',
    colorBorder: '#FDE68A',
    actionType: 'habit',
    isCompleted: false,
  },
  {
    id: 'plan_water_2',
    time: '02:30 PM',
    period: 'afternoon',
    category: 'water',
    titleKey: 'plan.afternoonHydration',
    defaultTitle: 'Afternoon Hydration Glass (2 of 4)',
    defaultSubtitle: 'Drink 1 fresh glass of water or lemonade',
    description: 'Stay hydrated to avoid afternoon fatigue and maintain mental sharpness.',
    icon: '💧',
    colorBg: '#E0F2FE',
    colorBorder: '#7DD3FC',
    actionType: 'habit',
    isCompleted: false,
  },
  {
    id: 'plan_cog_2',
    time: '03:30 PM',
    period: 'afternoon',
    category: 'cognitive',
    titleKey: 'plan.puzzleTime',
    defaultTitle: 'Serene Jigsaw Puzzle & Cultural Art',
    defaultSubtitle: 'Reassemble familiar regional pictures',
    description: 'Engage visuospatial harmony by assembling calming 4-piece and 9-piece landscape puzzles.',
    icon: '🧩',
    colorBg: '#F5F3FF',
    colorBorder: '#DDD6FE',
    actionType: 'game',
    domain: 'attention',
    isCompleted: false,
  },
  {
    id: 'plan_doctor_1',
    time: '04:30 PM',
    period: 'afternoon',
    category: 'appointment',
    titleKey: 'plan.healthCheck',
    defaultTitle: 'Health Vitals & Caregiver Check-In',
    defaultSubtitle: 'Check blood pressure & cheerful video call',
    description: 'Review blood pressure reading with caretaker and have a comforting 10-minute video catchup with family.',
    icon: '🩺',
    colorBg: '#EFF6FF',
    colorBorder: '#93C5FD',
    actionType: 'family',
    isCompleted: false,
  },
  {
    id: 'plan_evening_1',
    time: '06:00 PM',
    period: 'evening',
    category: 'exercise',
    titleKey: 'plan.eveningWalk',
    defaultTitle: 'Sunset Courtyard Walk & Family Stories',
    defaultSubtitle: 'Look at family photos and listen to melodies',
    description: 'Stroll in the cool evening breeze and reconnect with loved ones through family photo memories.',
    icon: '👨‍👩‍👧',
    colorBg: '#FDF2F8',
    colorBorder: '#FBCFE8',
    actionType: 'family',
    isCompleted: false,
  },
  {
    id: 'plan_dinner_1',
    time: '07:30 PM',
    period: 'evening',
    category: 'meal',
    titleKey: 'plan.dinnerMeal',
    defaultTitle: 'Comforting Light Dinner & Hydration',
    defaultSubtitle: 'Easily digestible warm evening soup or khichdi',
    description: 'A light, soothing dinner supports restful digestion and uninterrupted night sleep.',
    icon: '🥣',
    colorBg: '#FFF7ED',
    colorBorder: '#FED7AA',
    actionType: 'habit',
    isCompleted: false,
  },
  {
    id: 'plan_sleep_1',
    time: '09:30 PM',
    period: 'night',
    category: 'sleep',
    titleKey: 'plan.sleepRoutine',
    defaultTitle: 'Bedtime Routine, Dim Lights & Sleep',
    defaultSubtitle: 'Night hygiene, warm herbal milk & deep rest',
    description: 'Dim the room lights, listen to peaceful ambient chimes, and settle into warm, restorative sleep.',
    icon: '🛌',
    colorBg: '#F1F5F9',
    colorBorder: '#CBD5E1',
    actionType: 'habit',
    isCompleted: false,
  },
];

export const STORAGE_KEY_DAILY_PLAN = 'ner_mind_todays_plan_v2';
export const STORAGE_KEY_PLAN_HISTORY = 'ner_mind_activity_history_v2';

interface Props {
  onBack: () => void;
  onStartGame: (domain: CognitiveDomain) => void;
  onStartMission: () => void;
  onStartFamily: () => void;
}

// Convert "08:30 AM" or "01:15 PM" to minutes from midnight for sorting
const timeToMinutes = (timeStr: string): number => {
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Determine if an activity is missed based on current time
const isActivityMissed = (timeStr: string, isCompleted: boolean): boolean => {
  if (isCompleted) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const activityMinutes = timeToMinutes(timeStr);
  // If scheduled time has passed by more than 45 minutes and not completed, consider missed
  return currentMinutes > activityMinutes + 45;
};

export const TodaysPlanView: React.FC<Props> = ({
  onBack,
  onStartGame,
  onStartMission,
  onStartFamily,
}) => {
  const { language, t, formatBilingual } = useLocalization();

  // Primary list of activities
  const [items, setItems] = useState<PlanItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DAILY_PLAN);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PLAN;
  });

  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'all' | ActivityPeriod>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'missed'>('all');

  // Caretaker Edit / Create Modal state
  const [isCaretakerMode, setIsCaretakerMode] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTime, setFormTime] = useState('08:00 AM');
  const [formPeriod, setFormPeriod] = useState<ActivityPeriod>('morning');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('routine');
  const [formIcon, setFormIcon] = useState('📋');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Persist items to localStorage and notify storage listeners
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DAILY_PLAN, JSON.stringify(items));
      // Save daily history record
      const todayKey = new Date().toISOString().split('T')[0];
      const historyStr = localStorage.getItem(STORAGE_KEY_PLAN_HISTORY) || '{}';
      const history = JSON.parse(historyStr);
      history[todayKey] = {
        total: items.length,
        completed: items.filter((i) => i.isCompleted).length,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_PLAN_HISTORY, JSON.stringify(history));
    } catch {}
  }, [items]);

  // Sync if another tab modifies storage
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_DAILY_PLAN);
        if (stored) setItems(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sorted chronologically morning to night
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return sortedItems.filter((item) => {
      // Period filter
      if (periodFilter !== 'all' && item.period !== periodFilter) return false;

      // Status filter
      const missed = isActivityMissed(item.time, item.isCompleted);
      if (statusFilter === 'completed' && !item.isCompleted) return false;
      if (statusFilter === 'pending' && (item.isCompleted || missed)) return false;
      if (statusFilter === 'missed' && (!missed || item.isCompleted)) return false;

      return true;
    });
  }, [sortedItems, periodFilter, statusFilter]);

  const completedCount = items.filter((i) => i.isCompleted).length;
  const missedCount = items.filter((i) => isActivityMissed(i.time, i.isCompleted)).length;
  const pendingCount = items.length - completedCount - missedCount;

  // Toggle completion with speech feedback
  const handleToggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.isCompleted;
          if (next) {
            const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            SpeechService.speak(
              `Wonderful! You completed ${item.defaultTitle}. Great progress!`,
              0.85,
              (language as SupportedAppLanguage) || 'en'
            );
            return { ...item, isCompleted: true, completedAt: timeNow };
          }
          return { ...item, isCompleted: false, completedAt: undefined };
        }
        return item;
      })
    );
  };

  // Launch associated interactive activity or habit
  const handleCardClick = (item: PlanItem) => {
    if (item.actionType === 'game' && item.domain) {
      SpeechService.speakDomainInstruction(item.domain);
      onStartGame(item.domain);
    } else if (item.actionType === 'mission') {
      SpeechService.speakMissionInstruction('Daily Routine');
      onStartMission();
    } else if (item.actionType === 'family') {
      SpeechService.speakDomainInstruction('recognition');
      onStartFamily();
    } else {
      // Habit: announce instructions aloud
      const text = `${item.defaultTitle}. Scheduled for ${item.time}. Instructions: ${item.description || item.defaultSubtitle}`;
      SpeechService.speak(text, 0.85, (language as SupportedAppLanguage) || 'en');
    }
  };

  const handleSpeakItem = (item: PlanItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${item.defaultTitle}. Scheduled for ${item.time}. ${item.description || item.defaultSubtitle}`;
    SpeechService.speak(text, 0.85, (language as SupportedAppLanguage) || 'en');
  };

  // Caretaker CRUD Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormDescription('');
    setFormTime('08:00 AM');
    setFormPeriod('morning');
    setFormCategory('routine');
    setFormIcon('📋');
    setFormImageUrl('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: PlanItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormTitle(item.defaultTitle);
    setFormSubtitle(item.defaultSubtitle);
    setFormDescription(item.description || '');
    setFormTime(item.time);
    setFormPeriod(item.period);
    setFormCategory(item.category);
    setFormIcon(item.icon);
    setFormImageUrl(item.imageUrl || '');
    setShowAddModal(true);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this scheduled routine activity?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      OfflineStorageService.enqueueSyncEvent('daily_plan_activity_deleted' as any, { id });
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingItem) {
      // Edit existing
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                defaultTitle: formTitle.trim(),
                defaultSubtitle: formSubtitle.trim() || 'Caregiver Scheduled Routine',
                description: formDescription.trim(),
                time: formTime,
                period: formPeriod,
                category: formCategory,
                icon: formIcon || '📋',
                imageUrl: formImageUrl.trim() || undefined,
              }
            : i
        )
      );
      OfflineStorageService.enqueueSyncEvent('daily_plan_activity_updated' as any, { id: editingItem.id, title: formTitle });
    } else {
      // Add new
      const newItem: PlanItem = {
        id: `custom_plan_${Date.now()}`,
        time: formTime,
        period: formPeriod,
        category: formCategory,
        defaultTitle: formTitle.trim(),
        defaultSubtitle: formSubtitle.trim() || 'Personal Care Routine',
        description: formDescription.trim(),
        icon: formIcon || '📋',
        imageUrl: formImageUrl.trim() || undefined,
        colorBg: '#EFF6FF',
        colorBorder: '#BFDBFE',
        actionType: 'habit',
        isCompleted: false,
      };
      setItems((prev) => [...prev, newItem]);
      OfflineStorageService.enqueueSyncEvent('daily_plan_activity_created' as any, newItem as any);
    }

    setShowAddModal(false);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 90 }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Go Back to Dashboard"
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              width: 46,
              height: 46,
              fontSize: 22,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #E2E8F0',
            }}
          >
            ←
          </button>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: '#0F172A', letterSpacing: '-0.4px' }}>
              Daily Activities & Routine Timeline
            </h2>
            <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
              Personalized morning-to-night care schedule for daily independence
            </span>
          </div>
        </div>

        {/* Caretaker Mode Toggle & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsCaretakerMode(!isCaretakerMode)}
            style={{
              backgroundColor: isCaretakerMode ? '#EFF6FF' : '#FFFFFF',
              color: isCaretakerMode ? '#1D4ED8' : '#475569',
              border: `1.5px solid ${isCaretakerMode ? '#3B82F6' : '#CBD5E1'}`,
              borderRadius: 12,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🛡️</span>
            <span>{isCaretakerMode ? 'Caretaker Mode: ON' : 'Caretaker Access'}</span>
          </button>

          {isCaretakerMode && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}
            >
              <span>+ Add Activity</span>
            </button>
          )}
        </div>
      </div>

      {/* Daily Progress Banner & Overview Cards */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '24px 28px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
              Today's Care Completion Progress
            </h3>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              {completedCount} of {items.length} daily activities completed
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: 10 }}>
              ✅ {completedCount} Done
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '4px 10px', borderRadius: 10 }}>
              ⏳ {pendingCount} Pending
            </span>
            {missedCount > 0 && (
              <span style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '4px 10px', borderRadius: 10 }}>
                ⚠️ {missedCount} Missed
              </span>
            )}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 14,
            backgroundColor: '#EFF6FF',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)',
              borderRadius: 10,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Filter Tabs: Periods & Statuses */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {/* Morning, Afternoon, Evening, Night Time Periods */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            borderRadius: 14,
            padding: 4,
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          {[
            { id: 'all', label: 'All Day' },
            { id: 'morning', label: '🌅 Morning' },
            { id: 'afternoon', label: '☀️ Afternoon' },
            { id: 'evening', label: '🌆 Evening' },
            { id: 'night', label: '🌙 Night' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodFilter(p.id as any)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: periodFilter === p.id ? '#FFFFFF' : 'transparent',
                color: periodFilter === p.id ? '#2563EB' : '#475569',
                fontWeight: periodFilter === p.id ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: periodFilter === p.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Pending, Completed, Missed Status Filters */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            borderRadius: 14,
            padding: 4,
            gap: 4,
          }}
        >
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'missed', label: 'Missed' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id as any)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: statusFilter === st.id ? '#2563EB' : 'transparent',
                color: statusFilter === st.id ? '#FFFFFF' : '#475569',
                fontWeight: statusFilter === st.id ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Timeline Section */}
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Continuous Vertical Timeline Line */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: 20,
            bottom: 20,
            width: 4,
            backgroundColor: '#CBD5E1',
            borderRadius: 2,
          }}
        />

        {/* Activities List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {filteredItems.map((item) => {
            const missed = isActivityMissed(item.time, item.isCompleted);
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="timeline-activity-card"
                style={{
                  position: 'relative',
                  backgroundColor: item.isCompleted ? '#F8FAFC' : '#FFFFFF',
                  borderRadius: 22,
                  padding: '22px 24px',
                  border: `2px solid ${item.isCompleted ? '#BBF7D0' : missed ? '#FECACA' : '#E2E8F0'}`,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.18s ease',
                  opacity: item.isCompleted ? 0.85 : 1,
                }}
              >
                {/* Timeline Dot on Connector Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: -26,
                    top: 26,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: item.isCompleted ? '#22C55E' : missed ? '#EF4444' : '#2563EB',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 0 0 2px #CBD5E1',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  {/* Left: Icon, Details, and Time */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: '1 1 360px' }}>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 18,
                        backgroundColor: item.colorBg,
                        border: `1.5px solid ${item.colorBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>

                    <div>
                      {/* Time & Period Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: '#2563EB',
                            backgroundColor: '#EFF6FF',
                            padding: '3px 10px',
                            borderRadius: 8,
                            border: '1px solid #BFDBFE',
                          }}
                        >
                          ⏰ {item.time}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#64748B',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.period} • {item.category}
                        </span>

                        {missed && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}
                          >
                            Missed Schedule
                          </span>
                        )}
                        {item.isCompleted && item.completedAt && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              backgroundColor: '#DCFCE7',
                              color: '#16A34A',
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}
                          >
                            Done at {item.completedAt}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        style={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: item.isCompleted ? '#64748B' : '#0F172A',
                          margin: '0 0 4px 0',
                          textDecoration: item.isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        {formatBilingual(t(item.titleKey || '') || item.defaultTitle, item.defaultTitle)}
                      </h4>

                      {/* Subtitle / Description */}
                      <p style={{ fontSize: 14, color: '#475569', margin: '0 0 6px 0', lineHeight: 1.45 }}>
                        {item.description || item.defaultSubtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Read Aloud + Completion Toggle + Caretaker Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Read Aloud Button */}
                    <button
                      type="button"
                      onClick={(e) => handleSpeakItem(item, e)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        cursor: 'pointer',
                        color: '#2563EB',
                      }}
                      title="Speak routine instructions aloud"
                      aria-label={`Read aloud ${item.defaultTitle}`}
                    >
                      🔊
                    </button>

                    {/* Completion Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleComplete(item.id, e)}
                      style={{
                        minHeight: 44,
                        padding: '0 18px',
                        borderRadius: 14,
                        border: item.isCompleted ? 'none' : '2px solid #22C55E',
                        backgroundColor: item.isCompleted ? '#22C55E' : '#FFFFFF',
                        color: item.isCompleted ? '#FFFFFF' : '#15803D',
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: item.isCompleted ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
                      }}
                    >
                      {item.isCompleted ? (
                        <>
                          <CheckIcon size={16} color="#FFFFFF" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <span>Mark Done ✓</span>
                      )}
                    </button>

                    {/* Caretaker Edit & Delete Buttons */}
                    {isCaretakerMode && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(item, e)}
                          style={{
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            borderRadius: 10,
                            padding: '8px 10px',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#334155',
                          }}
                          title="Edit activity"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          style={{
                            border: '1px solid #FECDD3',
                            background: '#FFF1F2',
                            borderRadius: 10,
                            padding: '8px 10px',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#BE123C',
                          }}
                          title="Delete activity"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Caretaker Add / Edit Routine Activity Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 9999,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              maxWidth: 580,
              width: '100%',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #CBD5E1',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                {editingItem ? 'Edit Routine Activity' : 'Add New Daily Routine Activity'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Afternoon Hydration & Stretching"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                  Short Subtitle
                </label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="e.g. 1 glass water and 5 minutes seated stretch"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                  Detailed Voice & Screen Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Instructions spoken to patient during audio read-aloud..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 02:30 PM"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Time Period
                  </label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as ActivityPeriod)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  >
                    <option value="morning">🌅 Morning</option>
                    <option value="afternoon">☀️ Afternoon</option>
                    <option value="evening">🌆 Evening</option>
                    <option value="night">🌙 Night</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  >
                    <option value="hygiene">Personal Hygiene</option>
                    <option value="meal">Meal & Nutrition</option>
                    <option value="water">Water Hydration</option>
                    <option value="exercise">Walking / Exercise</option>
                    <option value="cognitive">Cognitive Game</option>
                    <option value="sleep">Sleep & Rest</option>
                    <option value="appointment">Doctor / Health Check</option>
                    <option value="routine">General Routine</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Icon Emoji
                  </label>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="e.g. 💧, 🪥, 🚶"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 16 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 12,
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .timeline-activity-card:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
        }
      `}</style>
    </div>
  );
};
