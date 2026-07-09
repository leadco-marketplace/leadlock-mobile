import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, applyTheme, Colors, DarkColors, LightColors, InnerLightColors } from '@/theme';

const STORAGE_KEY = '@leadco/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Lock theme to dark for pre-dashboard surfaces (launch/auth/onboarding). */
  setPreDashboard: (locked: boolean) => void;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  setMode: () => {},
  setPreDashboard: () => {},
  isDark: true,
  isLight: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode,     setModeState] = useState<ThemeMode>('dark');
  // Pre-dashboard surfaces (launch, login, signup, onboarding) are ALWAYS
  // dark — the saved preference only applies once the user is in the app.
  const [themeLocked, setThemeLocked] = useState(true);

  // Load persisted theme on mount — but only apply it if not locked to dark.
  useEffect(() => {
    if (themeLocked) {
      applyTheme('dark');
      setModeState('dark');
      return;
    }
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'inner-light') {
        applyTheme(saved);
        setModeState(saved);
      } else {
        applyTheme('dark');
        setModeState('dark');
      }
    });
  }, [themeLocked]);

  function setMode(newMode: ThemeMode) {
    applyTheme(newMode);
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  }

  /** Called by AppNavigator: true = force dark (pre-dashboard), false = restore saved. */
  function setPreDashboard(locked: boolean) {
    setThemeLocked(locked);
  }

  return (
    <ThemeContext.Provider value={{
      mode,
      setMode,
      setPreDashboard,
      isDark: mode === 'dark' || mode === 'inner-light',
      isLight: mode === 'light',
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
