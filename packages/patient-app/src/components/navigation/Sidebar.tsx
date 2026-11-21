import React from 'react';
import { PatientTab } from '../patient/BottomNav.js';
import {
  BrainIcon,
  HomeIcon,
  GamepadIcon,
  CalendarCheckIcon,
  BellIcon,
  HeartIcon,
  TrendingUpIcon,
  SettingsIcon,
  HelpCircleIcon,
  XIcon,
} from '../common/Icons.js';
import { useLocalization } from '../../localization/index.js';

export type ExtendedNavTab = PatientTab | 'settings' | 'help';

interface SidebarProps {
  activeTab: PatientTab;
  onSelectTab: (tab: PatientTab) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  patientName: string;
  isOnline: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingSyncCount?: number;
}

interface NavItemDef {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  isAction?: boolean;
  actionKey?: 'settings' | 'help';
  tabKey?: PatientTab;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenHelp,
  patientName,
  isOnline,
  isOpenMobile,
  onCloseMobile,
  pendingSyncCount = 0,
}) => {
  const { t } = useLocalization();

  const navItems: NavItemDef[] = [
    {
      id: 'home',
      tabKey: 'home',
      label: t('nav.home') || 'Home',
      icon: <HomeIcon size={22} />,
    },
    {
      id: 'call',
      tabKey: 'call',
      label: 'Family & Care Calls',
      badge: 'Live',
      badgeColor: '#ECFDF5',
      icon: <span style={{ fontSize: 20 }}>📞</span>,
    },
    {
      id: 'games',
      tabKey: 'games',
      label: t('nav.games') || 'Games',
      badge: '10 Games',
      badgeColor: '#EEF2FF',
      icon: <GamepadIcon size={22} />,
    },
    {
      id: 'plan',
      tabKey: 'plan',
      label: 'Daily Activities',
      badge: 'Today',
      badgeColor: '#ECFDF5',
      icon: <CalendarCheckIcon size={22} />,
    },
    {
      id: 'reminders',
      tabKey: 'reminders',
      label: t('nav.reminders') || 'Reminders',
      badge: 'Active',
      badgeColor: '#FEF3C7',
      icon: <BellIcon size={22} />,
    },
    {
      id: 'family',
      tabKey: 'family',
      label: 'Family Memories',
      badge: 'Photos',
      badgeColor: '#FCE7F3',
      icon: <HeartIcon size={22} />,
    },
    {
      id: 'progress',
      tabKey: 'progress',
      label: t('nav.progress') || 'Progress',
      icon: <TrendingUpIcon size={22} />,
    },
    {
      id: 'settings',
      isAction: true,
      actionKey: 'settings',
      label: 'Settings',
      icon: <SettingsIcon size={22} />,
    },
    {
      id: 'help',
      isAction: true,
      actionKey: 'help',
      label: 'Help & Support',
      badge: '24/7',
      badgeColor: '#E0F2FE',
      icon: <HelpCircleIcon size={22} />,
    },
  ];

  const handleItemClick = (item: NavItemDef) => {
    if (item.isAction) {
      if (item.actionKey === 'settings') onOpenSettings();
      if (item.actionKey === 'help') onOpenHelp();
    } else if (item.tabKey) {
      onSelectTab(item.tabKey);
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 990,
            transition: 'opacity 0.2s ease',
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`modern-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}
        style={{
          width: 270,
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 995,
          boxShadow: '4px 0 20px rgba(18, 59, 99, 0.03)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px 18px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 15,
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 8px 18px rgba(37, 99, 235, 0.28)',
                flexShrink: 0,
              }}
            >
              <BrainIcon size={26} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 21,
                    fontWeight: 900,
                    letterSpacing: '-0.4px',
                    color: '#0F172A',
                  }}
                >
                  NER-MIND
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748B',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                Cognitive Care AI
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="sidebar-mobile-close"
            style={{
              display: 'none',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: 10,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
            aria-label="Close menu"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* 100% Offline Assurance Pill */}
        <div style={{ padding: '12px 18px 4px' }}>
          <div
            style={{
              background: 'linear-gradient(90deg, #ECFDF5 0%, #F0FDF4 100%)',
              border: '1px solid #BBF7D0',
              borderRadius: 12,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>🔒</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
                100% Offline Safe
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isOnline ? '#16A34A' : '#D97706',
                backgroundColor: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: 20,
                border: '1px solid #E2E8F0',
              }}
            >
              {isOnline ? 'Synced' : pendingSyncCount > 0 ? `${pendingSyncCount} in Outbox` : 'Local'}
            </span>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav
          style={{
            flex: 1,
            padding: '12px 14px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          aria-label="Sidebar Navigation"
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#94A3B8',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              padding: '8px 12px 4px',
            }}
          >
            Navigation
          </div>

          {navItems.map((item) => {
            const isActive = !item.isAction && activeTab === item.tabKey;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: 'none',
                  backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? '#1D4ED8' : '#334155',
                  cursor: 'pointer',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 15,
                  textAlign: 'left',
                  transition: 'all 0.15s ease-in-out',
                  position: 'relative',
                }}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '18%',
                      bottom: '18%',
                      width: 4,
                      backgroundColor: '#2563EB',
                      borderRadius: '0 4px 4px 0',
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      color: isActive ? '#2563EB' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: isActive ? '#DBEAFE' : (item.badgeColor || '#F1F5F9'),
                      color: isActive ? '#1E40AF' : '#475569',
                      padding: '2px 8px',
                      borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.04)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Patient Profile Card at bottom of sidebar */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #F1F5F9',
            backgroundColor: '#FAFCFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 14,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#EFF6FF',
                border: '2px solid #93C5FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              👴
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {patientName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    display: 'inline-block',
                  }}
                />
                Active Patient
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .modern-sidebar {
            position: fixed !important;
            transform: translateX(-100%);
            box-shadow: 6px 0 24px rgba(0,0,0,0.18) !important;
          }
          .modern-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .sidebar-mobile-close {
            display: flex !important;
          }
        }
        .sidebar-nav-item:hover:not(.active) {
          background-color: #F8FAFC !important;
          color: #0F172A !important;
          transform: translateX(3px);
        }
      `}</style>
    </>
  );
};
