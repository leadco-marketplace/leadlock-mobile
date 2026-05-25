import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, applyTheme, Colors, DarkColors, LightColors, InnerLightColors } from '@/theme';

const STORAGE_KEY = '@leadco/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  setMode: () => {},
  isDark: true,
  isLight: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'inner-light') {
        applyTheme(saved);
        setModeState(saved);
      }
    });
  }, []);

  function setMode(newMode: ThemeMode) {
    applyTheme(newMode);
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  }

  return (
    <ThemeContext.Provider value={{
      mode,
      setMode,
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
