import React, { useState, useEffect } from 'react';
import {
  Volume2Icon,
  VolumeXIcon,
  GlobeIcon,
  ShieldCheckIcon,
  LogOutIcon,
  MenuIcon,
} from '../common/Icons.js';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';
import { SupportedLanguage } from '@ner-mind/core';

interface DashboardHeaderProps {
  patientName: string;
  onToggleSidebarMobile: () => void;
  onOpenCaregiver: () => void;
  onLogout: () => void;
  isOnline: boolean;
  pendingSyncCount?: number;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  patientName,
  onToggleSidebarMobile,
  onOpenCaregiver,
  onLogout,
  isOnline,
  pendingSyncCount = 0,
  onManualSync,
  isSyncing = false,
}) => {
  const { language, setLanguage } = useLocalization();
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(() => SpeechService.isEnabled);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync internal voice state if changed externally
  useEffect(() => {
    setIsVoiceActive(SpeechService.isEnabled);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (language === 'hi') {
      if (hour < 12) return `शुभ प्रभात, ${patientName}!`;
      if (hour < 17) return `शुभ दोपहर, ${patientName}!`;
      return `शुभ संध्या, ${patientName}!`;
    }
    if (language === 'kn') {
      if (hour < 12) return `ಶುಭೋದಯ, ${patientName}!`;
      if (hour < 17) return `ಶುಭ ಮಧ್ಯಾಹ್ನ, ${patientName}!`;
      return `ಶುಭ ಸಂಜೆ, ${patientName}!`;
    }
    if (hour < 12) return `Good morning, ${patientName}!`;
    if (hour < 17) return `Good afternoon, ${patientName}!`;
    return `Good evening, ${patientName}!`;
  };

  const handleToggleVoice = () => {
    const nextState = !isVoiceActive;
    setIsVoiceActive(nextState);
    SpeechService.setEnabled(nextState);
    if (nextState) {
      const msg = language === 'hi' ? 'आवाज़ सहायता चालू है' : language === 'kn' ? 'ಧ್ವನಿ ಸಹಾಯ ಆನ್ ಆಗಿದೆ' : 'Voice assistance is turned on';
      SpeechService.speak(msg, 0.9, (language as SupportedAppLanguage) || 'en');
    }
  };

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const formattedDate = currentTime.toLocaleDateString(
    language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  );

  const formattedTime = currentTime.toLocaleTimeString(
    language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }
  );

  return (
    <header
      className="dashboard-header"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 900,
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Left: Mobile Menu Toggle + Greeting & Patient Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          className="header-mobile-menu-btn"
          style={{
            display: 'none',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: 12,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1E293B',
          }}
          aria-label="Open Navigation Menu"
        >
          <MenuIcon size={24} />
        </button>

        {/* Patient Profile Avatar */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '2.5px solid #3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.22)',
            }}
            title={patientName}
          >
            👴
          </div>
          {/* Online/Offline status indicator dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: isOnline ? '#22C55E' : '#F59E0B',
              border: '2.5px solid #FFFFFF',
            }}
            title={isOnline ? 'Online Synced' : 'Offline Mode'}
          />
        </div>

        {/* Welcome Message & Date/Time */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: '#0F172A',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              {getGreeting()}
            </h1>
            <button
              type="button"
              onClick={() => {
                SpeechService.speak(getGreeting(), 0.9, (language as SupportedAppLanguage) || 'en');
              }}
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 8,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#2563EB',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Speak greeting aloud"
              aria-label="Read greeting aloud"
            >
              <span>🔊</span>
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 4,
              fontSize: 13,
              color: '#64748B',
              fontWeight: 500,
            }}
          >
            <span style={{ fontWeight: 600, color: '#334155' }}>
              📅 {formattedDate}
            </span>
            <span>•</span>
            <span style={{ fontWeight: 600, color: '#2563EB' }}>
              ⏰ {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Voice Toggle, Language Selector, Caretaker Access, Logout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* Offline / Outbox Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isOnline ? '#F0FDF4' : '#FEF3C7',
            color: isOnline ? '#15803D' : '#B45309',
            border: `1.5px solid ${isOnline ? '#BBF7D0' : '#FDE68A'}`,
            borderRadius: 20,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 700,
          }}
          className="header-status-pill"
        >
          <span>{isOnline ? '🟢 Online' : '🟡 Offline'}</span>
          {pendingSyncCount > 0 && <span>• {pendingSyncCount} in Outbox</span>}
          {onManualSync && (
            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: 'inherit',
                fontWeight: 800,
                padding: 0,
                marginLeft: 2,
              }}
              title="Sync Outbox"
            >
              {isSyncing ? '⏳' : '🔄'}
            </button>
          )}
        </div>

        {/* Voice ON/OFF Toggle Button */}
        <button
          type="button"
          onClick={handleToggleVoice}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: isVoiceActive ? '#EFF6FF' : '#F8FAFC',
            color: isVoiceActive ? '#1D4ED8' : '#64748B',
            border: `1.5px solid ${isVoiceActive ? '#93C5FD' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={isVoiceActive ? 'Voice Assistant is ON (Click to mute)' : 'Voice Assistant is OFF (Click to turn on)'}
          aria-label={isVoiceActive ? 'Turn off voice assistant' : 'Turn on voice assistant'}
        >
          {isVoiceActive ? <Volume2Icon size={18} color="#2563EB" /> : <VolumeXIcon size={18} color="#94A3B8" />}
          <span>{isVoiceActive ? 'Voice ON' : 'Voice OFF'}</span>
        </button>

        {/* Language Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#FFFFFF',
              color: '#1E293B',
              border: '1.5px solid #CBD5E1',
              borderRadius: 14,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
            data-testid="header-language-indicator"
            aria-expanded={showLanguageDropdown}
            aria-label="Select Application Language"
          >
            <GlobeIcon size={16} color="#475569" />
            <span>
              {language === 'hi' ? 'हिन्दी' : language === 'kn' ? 'ಕನ್ನಡ' : 'English'}
            </span>
            <span style={{ fontSize: 10, color: '#94A3B8' }}>▼</span>
          </button>

          {showLanguageDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: '6px',
                minWidth: 180,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {[
                { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
                { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
                { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelectLanguage(item.code as SupportedLanguage)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: language === item.code ? '#EFF6FF' : 'transparent',
                    color: language === item.code ? '#1D4ED8' : '#334155',
                    fontWeight: language === item.code ? 800 : 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{item.flag}</span>
                    <span>{item.native}</span>
                  </span>
                  {language === item.code && <span style={{ color: '#2563EB', fontWeight: 900 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Caretaker Access Button */}
        <button
          type="button"
          onClick={onOpenCaregiver}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
            border: '1.5px solid #BFDBFE',
            borderRadius: 14,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Open Caregiver Portal"
        >
          <ShieldCheckIcon size={17} color="#2563EB" />
          <span>Caretaker</span>
        </button>

        {/* Logout Option */}
        <button
          type="button"
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#FFF1F2',
            color: '#BE123C',
            border: '1.5px solid #FECDD3',
            borderRadius: 14,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Logout / Switch Patient"
          aria-label="Logout"
        >
          <LogOutIcon size={16} color="#E11D48" />
          <span className="logout-text">Logout</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .header-mobile-menu-btn {
            display: flex !important;
          }
        }
        @media (max-width: 768px) {
          .dashboard-header {
            padding: 12px 16px !important;
          }
          .header-status-pill {
            display: none !important;
          }
          .logout-text {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
