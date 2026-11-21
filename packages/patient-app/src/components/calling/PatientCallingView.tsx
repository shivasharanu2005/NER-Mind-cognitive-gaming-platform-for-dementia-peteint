import React, { useState, useEffect } from 'react';
import { CaretakerContact } from '@ner-mind/core';
import { CallingStorageService } from '../../calling/callingStorage.js';
import { CallingService } from '../../calling/callingService.js';
import { SpeechService } from '../../audio/speechService.js';

interface Props {
  onBack?: () => void;
}

export const PatientCallingView: React.FC<Props> = ({ onBack }) => {
  const [contacts, setContacts] = useState<CaretakerContact[]>(() => CallingStorageService.getContacts());

  useEffect(() => {
    // Initial fetch
    setContacts(CallingStorageService.getContacts());

    // Subscribe to live contact additions/edits from Caretaker
    const unsubscribe = CallingStorageService.subscribe(() => {
      setContacts(CallingStorageService.getContacts());
    });

    // Dementia-safe voice guidance
    SpeechService.speak('Tap any caretaker or family member card to start a call.');

    return () => unsubscribe();
  }, []);

  const handleStartCall = (contact: CaretakerContact) => {
    // Immediate 1-tap call initiation without extra confirmation menus
    CallingService.startCall(contact, 'video');
  };

  return (
    <div
      className="patient-calling-view"
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '20px 16px 80px 16px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      {/* Accessible Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to dashboard"
              style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #CBD5E1',
                borderRadius: 16,
                padding: '12px 18px',
                fontSize: 18,
                fontWeight: 800,
                color: '#1E293B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <span>← Back</span>
            </button>
          )}
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#0F172A',
                margin: 0,
                letterSpacing: '-0.4px',
              }}
            >
              📞 Care & Family Calls
            </h1>
            <p
              style={{
                fontSize: 16,
                color: '#475569',
                margin: '4px 0 0 0',
                fontWeight: 600,
              }}
            >
              Tap anyone below to talk face-to-face.
            </p>
          </div>
        </div>

        {/* Read Aloud Button */}
        <button
          type="button"
          onClick={() => SpeechService.speak('Tap any caretaker or family member card to start a call.')}
          style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #93C5FD',
            borderRadius: 16,
            padding: '10px 16px',
            fontSize: 15,
            fontWeight: 800,
            color: '#1D4ED8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          title="Read instructions aloud"
        >
          <span>🔊</span>
          <span>Help Me Call</span>
        </button>
      </div>

      {/* Large High-Contrast Contact Card Grid */}
      {contacts.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: '48px 24px',
            textAlign: 'center',
            border: '2px dashed #CBD5E1',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#334155', margin: '0 0 8px 0' }}>
            No Caretaker Contacts Yet
          </h3>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 420, margin: '0 auto' }}>
            Your caretaker will add your family and doctor contacts in the Caregiver Portal.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleStartCall(contact)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartCall(contact);
                }
              }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                border: '3px solid #E2E8F0',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(16, 185, 129, 0.2)';
                e.currentTarget.style.borderColor = '#10B981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.08)';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              {/* Emergency / Primary Pill */}
              {contact.isPrimary && (
                <span
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    border: '1.5px solid #BFDBFE',
                    borderRadius: 12,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  Primary
                </span>
              )}

              {/* Large Profile Photo or High-Contrast Initials Avatar */}
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  backgroundColor: contact.avatarColor || '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 44,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  marginBottom: 16,
                  border: '4px solid #FFFFFF',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                }}
              >
                {contact.photoUrl ? (
                  <img
                    src={contact.photoUrl}
                    alt={contact.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  contact.name.charAt(0)
                )}
              </div>

              {/* Name & Relationship */}
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#0F172A',
                  margin: '0 0 4px 0',
                  lineHeight: 1.2,
                }}
              >
                {contact.name}
              </h2>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#64748B',
                  marginBottom: 20,
                }}
              >
                {contact.relationship}
              </span>

              {/* Giant Green "Call" Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartCall(contact);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 18,
                  padding: '16px 20px',
                  fontSize: 18,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  transition: 'background-color 0.15s ease',
                  minHeight: 58,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
              >
                <span style={{ fontSize: 24 }}>📞</span>
                <span>Call {contact.name.split(' ')[0]}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
