import React, { useState } from 'react';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { XIcon } from '../common/Icons.js';

interface EmergencySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
}

type ScenarioId = 'stove' | 'doorbell' | 'lost' | 'medical';

interface ScenarioDef {
  id: ScenarioId;
  title: string;
  icon: string;
  prompt: string;
  steps: string[];
  alertLevel: 'medium' | 'high';
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: 'stove',
    title: 'Kitchen Stove Safety Check',
    icon: '🔥',
    prompt: 'You notice the kitchen stove is on and you are not cooking right now.',
    steps: [
      '1. Take a slow, deep breath. You are safe.',
      '2. Walk slowly to the stove without rushing.',
      '3. Turn the stove knob to the OFF position.',
      '4. If you smell gas, open the window and press the Alert button.',
    ],
    alertLevel: 'medium',
  },
  {
    id: 'doorbell',
    title: 'Unexpected Doorbell at the Door',
    icon: '🚪',
    prompt: 'The doorbell rings and you are not expecting a visitor today.',
    steps: [
      '1. Do not rush to open the main door immediately.',
      '2. Look through the peephole or window first.',
      '3. Ask through the closed door: "Who is it please?"',
      '4. If you do not recognise them, call your caregiver.',
    ],
    alertLevel: 'medium',
  },
  {
    id: 'lost',
    title: 'Feeling Confused or Disoriented',
    icon: '🧭',
    prompt: 'You feel unsure about which room you are in or what time of day it is.',
    steps: [
      '1. Sit down comfortably in the nearest armchair.',
      '2. Drink 1 sip of water from your table.',
      '3. Look at the wall clock and window sunlight.',
      '4. Remember: your family loves you and your caregiver is nearby.',
    ],
    alertLevel: 'medium',
  },
  {
    id: 'medical',
    title: 'Sudden Dizziness or Unwell Feeling',
    icon: '🩺',
    prompt: 'You feel unsteady, dizzy, or need medical assistance right now.',
    steps: [
      '1. Sit or lie down immediately to avoid falling.',
      '2. Press the red "Call Caregiver" button below.',
      '3. Keep calm and breathe slowly until help arrives.',
    ],
    alertLevel: 'high',
  },
];

export const EmergencySimulatorModal: React.FC<EmergencySimulatorModalProps> = ({
  isOpen,
  onClose,
  patientName,
}) => {
  const { language } = useLocalization();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('stove');
  const [alertSent, setAlertSent] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentScenario = SCENARIOS.find((s) => s.id === selectedScenario) || SCENARIOS[0];

  const handleReadScenario = () => {
    const text = `${currentScenario.title}. ${currentScenario.prompt}. Recommended steps: ${currentScenario.steps.join(' ')}`;
    SpeechService.speak(text, 0.85, (language as SupportedAppLanguage) || 'en');
  };

  const handleTriggerEmergencyAlert = () => {
    setAlertSent(true);
    const msg = `Emergency simulator alert activated for ${patientName}. Caregiver notified for peace of mind. Please remain seated comfortably.`;
    SpeechService.speak(msg, 0.85, (language as SupportedAppLanguage) || 'en');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          maxWidth: 680,
          width: '100%',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.25)',
          border: '3px solid #FECDD3',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            backgroundColor: '#FFF1F2',
            borderBottom: '2px solid #FECDD3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>🚨</span>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: '#9F1239', margin: 0 }}>
                Safety & Emergency Simulator
              </h3>
              <span style={{ fontSize: 13, color: '#BE123C', fontWeight: 600 }}>
                Calm practice for elderly independence & home reassurance
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #FECDD3',
              borderRadius: 12,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#9F1239',
            }}
            aria-label="Close modal"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {/* Scenario selector tabs */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
              Select Scenario to Rehearse:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedScenario(s.id);
                    setAlertSent(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 16,
                    border: `2px solid ${selectedScenario === s.id ? '#E11D48' : '#E2E8F0'}`,
                    backgroundColor: selectedScenario === s.id ? '#FFF1F2' : '#FFFFFF',
                    color: selectedScenario === s.id ? '#9F1239' : '#334155',
                    cursor: 'pointer',
                    fontWeight: selectedScenario === s.id ? 800 : 600,
                    fontSize: 14,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Scenario Card */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 20,
              padding: '20px 24px',
              border: '1.5px solid #E2E8F0',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{currentScenario.icon}</span>
                <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  {currentScenario.title}
                </h4>
              </div>

              <button
                type="button"
                onClick={handleReadScenario}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: 10,
                  padding: '6px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#2563EB',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>🔊 Read Aloud</span>
              </button>
            </div>

            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0', fontWeight: 600 }}>
              {currentScenario.prompt}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentScenario.steps.map((st, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: '10px 14px',
                    border: '1px solid #E2E8F0',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1E293B',
                  }}
                >
                  {st}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Alert Feedback */}
          {alertSent ? (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '2px solid #A7F3D0',
                borderRadius: 18,
                padding: '16px 20px',
                textAlign: 'center',
                color: '#065F46',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              ✅ Caregiver has been notified! Stay seated comfortably. Everything is under control.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTriggerEmergencyAlert}
              style={{
                width: '100%',
                backgroundColor: '#E11D48',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 18,
                padding: '16px',
                fontSize: 17,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 8px 20px rgba(225, 29, 72, 0.35)',
              }}
            >
              <span>🚨 Test Emergency Alert to Caregiver</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 15,
              fontWeight: 800,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
