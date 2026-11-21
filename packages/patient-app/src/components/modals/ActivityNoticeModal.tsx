import React from 'react';
import { ActivityAlarmEvent, ActivityAlarmService } from '../../services/ActivityAlarmService.js';
import { SpeechService } from '../../audio/speechService.js';

interface Props {
  alarm: ActivityAlarmEvent;
  onClose: () => void;
}

export const ActivityNoticeModal: React.FC<Props> = ({ alarm, onClose }) => {
  const handleSpeakAgain = () => {
    const text = `It is ${alarm.time}. Time for your activity: ${alarm.title}. ${alarm.description}`;
    SpeechService.speak(text);
  };

  const handleComplete = () => {
    ActivityAlarmService.markActiveAlarmCompleted();
    onClose();
  };

  const handleSnooze = () => {
    ActivityAlarmService.snoozeAlarm(10);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alarm-modal-title"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          maxWidth: 480,
          width: '100%',
          padding: '28px 24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          border: '3px solid #1677D2',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Pulsing Alert Banner */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.04em',
            border: '1.5px solid #FDE68A',
          }}
        >
          <span style={{ fontSize: 16 }}>⏰</span>
          <span>DAILY ACTIVITY TIME IS DUE NOW</span>
        </div>

        {/* Big Icon */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: '#EFF6FF',
            border: '3px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            boxShadow: '0 8px 20px rgba(22, 119, 210, 0.15)',
          }}
        >
          {alarm.icon || '⏰'}
        </div>

        {/* Time Badge */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#1677D2',
            backgroundColor: '#EAF4FF',
            padding: '4px 14px',
            borderRadius: 12,
          }}
        >
          🕒 Scheduled for {alarm.time}
        </span>

        {/* Title */}
        <h2
          id="alarm-modal-title"
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#0F172A',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {alarm.title}
        </h2>

        {/* Description / Instructions */}
        <p
          style={{
            fontSize: 16,
            color: '#334155',
            margin: 0,
            lineHeight: 1.55,
            backgroundColor: '#F8FAFC',
            padding: '14px 16px',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {alarm.description}
        </p>

        {/* Prescribed Instructions if Medicine */}
        {alarm.medicineName && (
          <div
            style={{
              backgroundColor: '#FFF1F2',
              border: '1.5px solid #FECDD3',
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 13,
              color: '#9F1239',
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'left',
            }}
          >
            <strong>💊 Medicine:</strong> {alarm.medicineName}
            {alarm.prescribedInstructions && (
              <div style={{ marginTop: 4 }}>{alarm.prescribedInstructions}</div>
            )}
          </div>
        )}

        {/* Re-listen Button */}
        <button
          type="button"
          onClick={handleSpeakAgain}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: '1.5px solid #CBD5E1',
            borderRadius: 14,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 700,
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <span>🔊</span>
          <span>Read Aloud Instructions</span>
        </button>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 4 }}>
          {/* I Did This! Primary Action */}
          <button
            type="button"
            onClick={handleComplete}
            style={{
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 16,
              padding: '16px',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 6px 16px rgba(5, 150, 105, 0.35)',
            }}
          >
            <span>✓</span>
            <span>I Have Done This!</span>
          </button>

          {/* Secondary Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={handleSnooze}
              style={{
                backgroundColor: '#F1F5F9',
                color: '#334155',
                border: '1.5px solid #CBD5E1',
                borderRadius: 14,
                padding: '12px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⏳ Remind in 10m
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                border: '1.5px solid #CBD5E1',
                borderRadius: 14,
                padding: '12px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

