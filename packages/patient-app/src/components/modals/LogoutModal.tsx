import React from 'react';
import { LogOutIcon } from '../common/Icons.js';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  patientName: string;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
  patientName,
}) => {
  if (!isOpen) return null;

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
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.25)',
          border: '1.5px solid #FECDD3',
          padding: '28px',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            backgroundColor: '#FFF1F2',
            border: '2px solid #FECDD3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#E11D48',
          }}
        >
          <LogOutIcon size={32} />
        </div>

        <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '0 0 8px 0' }}>
          Switch Patient or Logout?
        </h3>

        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          Your game scores, completed activities, and reminders for <strong>{patientName}</strong> are safely saved locally on this device.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={onConfirmLogout}
            style={{
              backgroundColor: '#E11D48',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
            }}
          >
            Confirm Logout / Switch Profile
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#F8FAFC',
              color: '#334155',
              border: '1.5px solid #CBD5E1',
              borderRadius: 14,
              padding: '12px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel & Stay Here
          </button>
        </div>
      </div>
    </div>
  );
};
