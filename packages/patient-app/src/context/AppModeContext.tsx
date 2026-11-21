import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type AppUiMode = 'android' | 'website';

export interface AppModeContextValue {
  mode: AppUiMode;
  setMode: (mode: AppUiMode) => void;
  toggleMode: () => void;
  isAndroid: boolean;
  isWebsite: boolean;
  isNativePlatform: boolean;
}

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined);

export const AppModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppUiMode>(() => {
    if (typeof window === 'undefined') return 'website';
    const saved = localStorage.getItem('ner_mind_app_ui_mode');
    if (saved === 'android' || saved === 'website') return saved;
    // Auto-detect native Android or small screen mobile view
    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android') {
      return 'android';
    }
    if (window.innerWidth <= 768) {
      return 'android';
    }
    return 'website';
  });

  const isNative =
    typeof window !== 'undefined'
      ? Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android'
      : false;

  const setMode = (newMode: AppUiMode) => {
    setModeState(newMode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ner_mind_app_ui_mode', newMode);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'android' ? 'website' : 'android');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('mode-android-app', mode === 'android');
      document.body.classList.toggle('mode-website', mode === 'website');
    }
  }, [mode]);

  return (
    <AppModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isAndroid: mode === 'android',
        isWebsite: mode === 'website',
        isNativePlatform: isNative,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = (): AppModeContextValue => {
  const ctx = useContext(AppModeContext);
  if (!ctx) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return ctx;
};

