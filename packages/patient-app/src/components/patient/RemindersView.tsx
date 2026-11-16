import React, { useState, useEffect, useMemo } from 'react';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { OfflineStorageService } from '../../storage/localStorage.js';
import { CheckIcon, XIcon } from '../common/Icons.js';

export type ReminderCategory =
  | 'medicine'
  | 'water'
  | 'meal'
  | 'appointment'
  | 'exercise'
  | 'sleep'
  | 'family';

export type ReminderRecurrence = 'daily' | 'weekly' | 'custom' | 'once';

export interface ReminderItem {
  id: string;
  time: string; // e.g. "08:00 AM"
  date?: string; // YYYY-MM-DD or undefined for recurring
  titleKey?: string;
  defaultTitle: string;
  category: ReminderCategory;
  recurrence: ReminderRecurrence;
  daysOfWeek?: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  icon: string;
  colorBg: string;
  colorBorder: string;

  // Medicine Specific Prescribed Info (NO generated dosage, strictly caretaker/doctor provided)
  medicineName?: string;
  prescribedInstructions?: string;
  prescribedBy?: string;
  scheduleInfo?: string;

  // Separate Patient Acknowledgement & Caretaker Verification (Safety Requirement)
  patientAcknowledged: boolean;
  patientAcknowledgedAt?: string;
  caretakerVerified: boolean;
  caretakerVerifiedAt?: string;

  // Snooze tracking
  snoozedUntil?: string; // e.g. "08:15 AM"
  snoozeCount: number;

  // Backward compatibility flag
  isCompleted: boolean;
}

export const DEFAULT_REMINDERS: ReminderItem[] = [
  {
    id: 'rem_med_1',
    time: '08:00 AM',
    titleKey: 'reminders.medicine',
    defaultTitle: 'Morning Blood Pressure Medication',
    category: 'medicine',
    recurrence: 'daily',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    icon: '💊',
    colorBg: '#FFF1F2',
    colorBorder: '#FECDD3',
    medicineName: 'Amlodipine 5mg',
    prescribedInstructions: 'Take 1 tablet with fresh water immediately after breakfast. Do not take on an empty stomach.',
    prescribedBy: 'Dr. B. K. Barua (Prescription #2026-NER-44)',
    scheduleInfo: 'Daily at 08:00 AM • Morning Dose',
    patientAcknowledged: true,
    patientAcknowledgedAt: '08:04 AM',
    caretakerVerified: true,
    caretakerVerifiedAt: '08:15 AM',
    snoozeCount: 0,
    isCompleted: true,
  },
  {
    id: 'rem_water_1',
    time: '10:00 AM',
    titleKey: 'reminders.water',
    defaultTitle: 'Drink 1 Glass of Fresh Warm Water',
    category: 'water',
    recurrence: 'daily',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    icon: '💧',
    colorBg: '#E0F2FE',
    colorBorder: '#7DD3FC',
    prescribedInstructions: 'Drink a full glass of warm drinking water for hydration and blood circulation.',
    patientAcknowledged: true,
    patientAcknowledgedAt: '10:02 AM',
    caretakerVerified: true,
    caretakerVerifiedAt: '10:10 AM',
    snoozeCount: 0,
    isCompleted: true,
  },
  {
    id: 'rem_meal_1',
    time: '01:00 PM',
    titleKey: 'reminders.lunch',
    defaultTitle: 'Wholesome Lunch & 20-Minute Rest',
    category: 'meal',
    recurrence: 'daily',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    icon: '🍲',
    colorBg: '#FFFBEB',
    colorBorder: '#FDE68A',
    prescribedInstructions: 'Sit comfortably at the dining table. Enjoy warm rice, dal, and fresh vegetables.',
    patientAcknowledged: false,
    caretakerVerified: false,
    snoozeCount: 0,
    isCompleted: false,
  },
  {
    id: 'rem_doctor_1',
    time: '04:30 PM',
    titleKey: 'reminders.doctor',
    defaultTitle: 'Weekly Clinic Checkup & Vitals Video Call',
    category: 'appointment',
    recurrence: 'weekly',
    daysOfWeek: ['Thu'],
    icon: '🩺',
    colorBg: '#EFF6FF',
    colorBorder: '#93C5FD',
    prescribedInstructions: 'Have blood pressure reading ready for Dr. Barua during the scheduled video review.',
    prescribedBy: 'Dr. B. K. Barua • Guwahati Clinic',
    patientAcknowledged: false,
    caretakerVerified: false,
    snoozeCount: 0,
    isCompleted: false,
  },
  {
    id: 'rem_exercise_1',
    time: '05:30 PM',
    titleKey: 'reminders.walk',
    defaultTitle: 'Evening Courtyard Walk & Deep Breathing',
    category: 'exercise',
    recurrence: 'daily',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    icon: '🚶',
    colorBg: '#ECFDF5',
    colorBorder: '#A7F3D0',
    prescribedInstructions: 'Take 15 minutes of gentle walking in the garden under the evening breeze.',
    patientAcknowledged: false,
    caretakerVerified: false,
    snoozeCount: 0,
    isCompleted: false,
  },
  {
    id: 'rem_family_1',
    time: '07:00 PM',
    titleKey: 'reminders.family',
    defaultTitle: 'Family Evening Video Call (Priya & Grandkids)',
    category: 'family',
    recurrence: 'daily',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    icon: '👨‍👩‍👧',
    colorBg: '#FDF2F8',
    colorBorder: '#FBCFE8',
    prescribedInstructions: 'Daughter Priya calls at 7:00 PM every evening. Keep tablet on the table.',
    patientAcknowledged: false,
    caretakerVerified: false,
    snoozeCount: 0,
    isCompleted: false,
  },
  {
    id: 'rem_sleep_1',
    time: '09:30 PM',
    titleKey: 'reminders.sleep',
    defaultTitle: 'Night Bedtime Routine & Calming Rest',
    category: 'sleep',
    recurrence: 'daily',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    icon: '🛌',
    colorBg: '#F1F5F9',
    colorBorder: '#CBD5E1',
    prescribedInstructions: 'Warm herbal milk, turn off bright screens, dim bedroom lighting.',
    patientAcknowledged: false,
    caretakerVerified: false,
    snoozeCount: 0,
    isCompleted: false,
  },
];

export const STORAGE_KEY_REMINDERS = 'ner_mind_reminders_v2';
export const STORAGE_KEY_REMINDER_HISTORY = 'ner_mind_reminder_history_v2';

interface Props {
  onBack: () => void;
}

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

// Check if a reminder is missed (more than 45 min past scheduled time and unacknowledged)
const isReminderMissed = (r: ReminderItem): boolean => {
  if (r.patientAcknowledged) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetTime = r.snoozedUntil ? r.snoozedUntil : r.time;
  const remMinutes = timeToMinutes(targetTime);
  return currentMinutes > remMinutes + 45;
};

export const RemindersView: React.FC<Props> = ({ onBack }) => {
  const { language, t, formatBilingual } = useLocalization();

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

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | ReminderCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'missed'>('all');

  // Caretaker Access & CRUD Modal
  const [isCaretakerMode, setIsCaretakerMode] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('08:00 AM');
  const [formCategory, setFormCategory] = useState<ReminderCategory>('medicine');
  const [formRecurrence, setFormRecurrence] = useState<ReminderRecurrence>('daily');
  const [formMedicineName, setFormMedicineName] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formPrescribedBy, setFormPrescribedBy] = useState('');
  const [formIcon, setFormIcon] = useState('💊');

  // Save to localStorage & trigger storage update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(reminders));
    } catch {}
  }, [reminders]);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
        if (stored) setReminders(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sorted chronologically
  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [reminders]);

  // Filtered Reminders
  const filteredReminders = useMemo(() => {
    return sortedReminders.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;

      const missed = isReminderMissed(r);
      const completed = r.category === 'medicine' ? (r.patientAcknowledged && r.caretakerVerified) : r.patientAcknowledged;

      if (statusFilter === 'completed' && !completed) return false;
      if (statusFilter === 'pending' && (completed || missed)) return false;
      if (statusFilter === 'missed' && (!missed || completed)) return false;

      return true;
    });
  }, [sortedReminders, categoryFilter, statusFilter]);

  const completedCount = reminders.filter((r) => r.patientAcknowledged).length;
  const missedCount = reminders.filter((r) => isReminderMissed(r)).length;
  const pendingCount = reminders.length - completedCount - missedCount;

  // Speak reminder aloud
  const handleSpeakReminder = (r: ReminderItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let text = `Reminder for ${r.time}: ${r.defaultTitle}.`;
    if (r.medicineName) {
      text += ` Medicine: ${r.medicineName}. Prescribed instructions: ${r.prescribedInstructions || ''}.`;
    } else if (r.prescribedInstructions) {
      text += ` Instructions: ${r.prescribedInstructions}.`;
    }
    SpeechService.speak(text, 0.85, (language as SupportedAppLanguage) || 'en');
  };

  // Patient Acknowledgement (Safety Requirement: does not auto-complete medicine without caretaker verification)
  const handlePatientAcknowledge = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextAck = !r.patientAcknowledged;
          if (nextAck) {
            SpeechService.speak(
              `Acknowledged. Thank you for confirming ${r.defaultTitle}.`,
              0.85,
              (language as SupportedAppLanguage) || 'en'
            );
          }
          return {
            ...r,
            patientAcknowledged: nextAck,
            patientAcknowledgedAt: nextAck ? timeNow : undefined,
            isCompleted: r.category === 'medicine' ? (nextAck && r.caretakerVerified) : nextAck,
          };
        }
        return r;
      })
    );
  };

  // Caretaker Verification (Safety Requirement: separate check)
  const handleCaretakerVerify = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextVer = !r.caretakerVerified;
          return {
            ...r,
            caretakerVerified: nextVer,
            caretakerVerifiedAt: nextVer ? timeNow : undefined,
            isCompleted: nextVer && r.patientAcknowledged,
          };
        }
        return r;
      })
    );
  };

  // Snooze functionality: delay reminder by 10 or 30 minutes
  const handleSnooze = (id: string, minutes: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozedTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          SpeechService.speak(
            `Reminder snoozed for ${minutes} minutes. We will remind you again at ${snoozedTimeStr}.`,
            0.85,
            (language as SupportedAppLanguage) || 'en'
          );
          return {
            ...r,
            snoozedUntil: snoozedTimeStr,
            snoozeCount: r.snoozeCount + 1,
          };
        }
        return r;
      })
    );
  };

  // Caretaker Add / Edit Handlers
  const handleOpenAddModal = () => {
    setEditingReminder(null);
    setFormTitle('');
    setFormTime('08:00 AM');
    setFormCategory('medicine');
    setFormRecurrence('daily');
    setFormMedicineName('');
    setFormInstructions('');
    setFormPrescribedBy('');
    setFormIcon('💊');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (r: ReminderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReminder(r);
    setFormTitle(r.defaultTitle);
    setFormTime(r.time);
    setFormCategory(r.category);
    setFormRecurrence(r.recurrence);
    setFormMedicineName(r.medicineName || '');
    setFormInstructions(r.prescribedInstructions || '');
    setFormPrescribedBy(r.prescribedBy || '');
    setFormIcon(r.icon);
    setShowAddModal(true);
  };

  const handleDeleteReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
      OfflineStorageService.enqueueSyncEvent('reminder_deleted' as any, { id });
    }
  };

  const handleSaveReminderForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingReminder) {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === editingReminder.id
            ? {
                ...r,
                defaultTitle: formTitle.trim(),
                time: formTime,
                category: formCategory,
                recurrence: formRecurrence,
                icon: formIcon || '⏰',
                medicineName: formCategory === 'medicine' ? formMedicineName.trim() : undefined,
                prescribedInstructions: formInstructions.trim() || undefined,
                prescribedBy: formPrescribedBy.trim() || undefined,
              }
            : r
        )
      );
      OfflineStorageService.enqueueSyncEvent('reminder_updated' as any, { id: editingReminder.id, title: formTitle });
    } else {
      const newRem: ReminderItem = {
        id: `custom_rem_${Date.now()}`,
        time: formTime,
        defaultTitle: formTitle.trim(),
        category: formCategory,
        recurrence: formRecurrence,
        icon: formIcon || '⏰',
        colorBg: formCategory === 'medicine' ? '#FFF1F2' : '#EFF6FF',
        colorBorder: formCategory === 'medicine' ? '#FECDD3' : '#BFDBFE',
        medicineName: formCategory === 'medicine' ? formMedicineName.trim() : undefined,
        prescribedInstructions: formInstructions.trim() || undefined,
        prescribedBy: formPrescribedBy.trim() || undefined,
        patientAcknowledged: false,
        caretakerVerified: false,
        snoozeCount: 0,
        isCompleted: false,
      };
      setReminders((prev) => [...prev, newRem]);
      OfflineStorageService.enqueueSyncEvent('reminder_created' as any, newRem as any);
    }

    setShowAddModal(false);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 90 }}>
      {/* Header */}
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
              Smart Health & Daily Reminders
            </h2>
            <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
              Caretaker-verified medicines, hydration, meals, and doctor visits
            </span>
          </div>
        </div>

        {/* Caretaker Mode & Add Button */}
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
              <span>+ Add Reminder</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Status Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          padding: '20px 24px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '0 0 4px 0' }}>
            Today's Adherence & Safety Status
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
            Medicines require both patient acknowledgment and caretaker verification for safety.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', backgroundColor: '#DCFCE7', padding: '6px 12px', borderRadius: 12 }}>
            ✅ {completedCount} Acknowledged
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '6px 12px', borderRadius: 12 }}>
            ⏳ {pendingCount} Upcoming
          </span>
          {missedCount > 0 && (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '6px 12px', borderRadius: 12 }}>
              🚨 {missedCount} Missed (Caretaker Alerted)
            </span>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Categories */}
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
            { id: 'all', label: 'All Categories' },
            { id: 'medicine', label: '💊 Medicine' },
            { id: 'water', label: '💧 Water' },
            { id: 'meal', label: '🍲 Meals' },
            { id: 'appointment', label: '🩺 Doctor' },
            { id: 'exercise', label: '🚶 Exercise' },
            { id: 'sleep', label: '🛌 Sleep' },
            { id: 'family', label: '👨‍👩‍👧 Family' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id as any)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: categoryFilter === c.id ? '#FFFFFF' : 'transparent',
                color: categoryFilter === c.id ? '#2563EB' : '#475569',
                fontWeight: categoryFilter === c.id ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: categoryFilter === c.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Statuses */}
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
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Upcoming' },
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

      {/* Reminders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredReminders.map((r) => {
          const missed = isReminderMissed(r);
          return (
            <div
              key={r.id}
              className="reminder-card"
              style={{
                backgroundColor: r.patientAcknowledged ? '#F8FAFC' : r.colorBg,
                border: `2px solid ${r.patientAcknowledged ? '#BBF7D0' : missed ? '#FECACA' : r.colorBorder}`,
                borderRadius: 22,
                padding: '22px 24px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.18s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                {/* Left: Icon & Main Details */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: '1 1 360px' }}>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 18,
                      backgroundColor: '#FFFFFF',
                      border: `1.5px solid ${r.colorBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      flexShrink: 0,
                    }}
                  >
                    {r.icon}
                  </div>

                  <div>
                    {/* Time & Category Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: '#2563EB',
                          backgroundColor: '#FFFFFF',
                          padding: '3px 10px',
                          borderRadius: 8,
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        ⏰ {r.snoozedUntil ? `Snoozed to ${r.snoozedUntil}` : r.time}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          backgroundColor: '#FFFFFF',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          textTransform: 'uppercase',
                        }}
                      >
                        {r.category} • {r.recurrence}
                      </span>

                      {missed && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            padding: '3px 8px',
                            borderRadius: 8,
                          }}
                        >
                          ⚠️ Missed Schedule (Caretaker Alerted)
                        </span>
                      )}

                      {r.snoozeCount > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                            padding: '3px 8px',
                            borderRadius: 8,
                          }}
                        >
                          Snoozed {r.snoozeCount}x
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: r.patientAcknowledged ? '#64748B' : '#0F172A',
                        margin: '0 0 4px 0',
                        textDecoration: r.patientAcknowledged ? 'line-through' : 'none',
                      }}
                    >
                      {formatBilingual(t(r.titleKey || '') || r.defaultTitle, r.defaultTitle)}
                    </h4>

                    {/* Medicine Name & Instructions */}
                    {r.medicineName && (
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: '#9F1239',
                          backgroundColor: '#FFE4E6',
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 6,
                          marginBottom: 6,
                        }}
                      >
                        Prescribed Medicine: {r.medicineName}
                      </div>
                    )}

                    {r.prescribedInstructions && (
                      <p style={{ fontSize: 14, color: '#334155', margin: '0 0 6px 0', lineHeight: 1.45, fontWeight: 500 }}>
                        {r.prescribedInstructions}
                      </p>
                    )}

                    {r.prescribedBy && (
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                        📋 Prescribed by: {r.prescribedBy}
                      </div>
                    )}

                    {/* Verification Badges (Safety Compliance) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: r.patientAcknowledged ? '#DCFCE7' : '#F1F5F9',
                          color: r.patientAcknowledged ? '#166534' : '#64748B',
                          padding: '2px 8px',
                          borderRadius: 6,
                          border: `1px solid ${r.patientAcknowledged ? '#86EFAC' : '#E2E8F0'}`,
                        }}
                      >
                        {r.patientAcknowledged
                          ? `✓ Patient Acknowledged (${r.patientAcknowledgedAt || 'Confirmed'})`
                          : '⏳ Awaiting Patient Confirmation'}
                      </span>

                      {r.category === 'medicine' && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            backgroundColor: r.caretakerVerified ? '#DBEAFE' : '#F8FAFC',
                            color: r.caretakerVerified ? '#1E40AF' : '#64748B',
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: `1px solid ${r.caretakerVerified ? '#93C5FD' : '#E2E8F0'}`,
                          }}
                        >
                          {r.caretakerVerified
                            ? `🛡️ Caretaker Verified (${r.caretakerVerifiedAt || 'Verified'})`
                            : '⏳ Awaiting Caretaker Verification'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Read Aloud + Snooze + Acknowledge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Read Aloud Button */}
                  <button
                    type="button"
                    onClick={(e) => handleSpeakReminder(r, e)}
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
                    title="Speak reminder aloud"
                  >
                    🔊
                  </button>

                  {/* Snooze 10 Mins Button */}
                  {!r.patientAcknowledged && (
                    <button
                      type="button"
                      onClick={(e) => handleSnooze(r.id, 10, e)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: 14,
                        padding: '10px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                      title="Delay reminder by 10 minutes"
                    >
                      Snooze 10m ⏳
                    </button>
                  )}

                  {/* Patient Acknowledge Button */}
                  <button
                    type="button"
                    onClick={(e) => handlePatientAcknowledge(r.id, e)}
                    style={{
                      minHeight: 44,
                      padding: '0 16px',
                      borderRadius: 14,
                      border: r.patientAcknowledged ? 'none' : '2px solid #22C55E',
                      backgroundColor: r.patientAcknowledged ? '#22C55E' : '#FFFFFF',
                      color: r.patientAcknowledged ? '#FFFFFF' : '#15803D',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {r.patientAcknowledged ? (
                      <>
                        <CheckIcon size={16} color="#FFFFFF" />
                        <span>Acknowledged</span>
                      </>
                    ) : (
                      <span>I Have Taken It ✓</span>
                    )}
                  </button>

                  {/* Caretaker Verification Button (in Caretaker Mode) */}
                  {isCaretakerMode && r.category === 'medicine' && (
                    <button
                      type="button"
                      onClick={(e) => handleCaretakerVerify(r.id, e)}
                      style={{
                        minHeight: 44,
                        padding: '0 14px',
                        borderRadius: 14,
                        backgroundColor: r.caretakerVerified ? '#1E40AF' : '#EFF6FF',
                        color: r.caretakerVerified ? '#FFFFFF' : '#1D4ED8',
                        border: '1.5px solid #93C5FD',
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {r.caretakerVerified ? 'Verified 🛡️' : 'Verify Dose'}
                    </button>
                  )}

                  {/* Caretaker Edit & Delete Buttons */}
                  {isCaretakerMode && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(r, e)}
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
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteReminder(r.id, e)}
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

      {/* Caretaker Add / Edit Reminder Modal */}
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
                {editingReminder ? 'Edit Care Reminder' : 'Add New Health & Daily Reminder'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReminderForm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                  Reminder Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Afternoon Blood Sugar Check"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Time (e.g. 02:00 PM) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 02:00 PM"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ReminderCategory)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  >
                    <option value="medicine">💊 Medicine Reminder</option>
                    <option value="water">💧 Water Hydration</option>
                    <option value="meal">🍲 Meal Reminder</option>
                    <option value="appointment">🩺 Doctor Appointment</option>
                    <option value="exercise">🚶 Exercise & Walk</option>
                    <option value="sleep">🛌 Sleeping Reminder</option>
                    <option value="family">👨‍👩‍👧 Family Event</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Recurrence
                  </label>
                  <select
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as ReminderRecurrence)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                  >
                    <option value="daily">Every Day (Daily)</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Schedule</option>
                    <option value="once">One-Time Only</option>
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
                    placeholder="e.g. 💊, 💧, 🩺"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 16 }}
                  />
                </div>
              </div>

              {/* Medicine Specific fields */}
              {formCategory === 'medicine' && (
                <div style={{ backgroundColor: '#FFF1F2', padding: 14, borderRadius: 14, border: '1px solid #FECDD3' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#9F1239', marginBottom: 10 }}>
                    Prescribed Medicine Information (Doctor/Caregiver provided)
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9F1239', marginBottom: 4 }}>
                      Exact Medicine Name
                    </label>
                    <input
                      type="text"
                      value={formMedicineName}
                      onChange={(e) => setFormMedicineName(e.target.value)}
                      placeholder="e.g. Amlodipine 5mg"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #FECDD3', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9F1239', marginBottom: 4 }}>
                      Prescribing Doctor or Clinic
                    </label>
                    <input
                      type="text"
                      value={formPrescribedBy}
                      onChange={(e) => setFormPrescribedBy(e.target.value)}
                      placeholder="e.g. Dr. B. K. Barua"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #FECDD3', fontSize: 14 }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                  Prescribed Instructions & Voice Readout
                </label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="e.g. Take with 1 glass of water immediately after eating. Do not skip."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                />
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
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
