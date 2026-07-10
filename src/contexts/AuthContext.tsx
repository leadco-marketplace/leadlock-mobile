import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Profile, profileApi } from '@/lib/api';
import { THEME_STORAGE_KEY } from '@/contexts/ThemeContext';

type AuthContextValue = {
  session:  Session | null;
  user:     User    | null;
  profile:  Profile | null;
  loading:  boolean;
  isGuest:  boolean;
  /** Which auth screen to land on when logged out — 'Signup' after a guest
   *  taps an action (unlock, banner), 'Login' otherwise. */
  authStart: 'Login' | 'Signup';
  signIn:   (email: string, password: string) => Promise<string | null>;
  signUp:   (email: string, password: string, role: 'buyer' | 'provider') => Promise<string | null>;
  signOut:  () => Promise<void>;
  signInAsGuest: () => void;
  /** Guest tapped an action — exit guest mode straight into the Signup page. */
  exitGuestToSignup: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isGuest, setIsGuest]   = useState(false);
  const [authStart, setAuthStart] = useState<'Login' | 'Signup'>('Login');

  async function loadProfile() {
    try {
      const p = await profileApi.get();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    // COLD-START POLICY: the app always opens at the Login page. Any session
    // persisted from a previous run is cleared when the process starts fresh.
    // (Backgrounding the app does NOT re-run this — only a full close/reopen.)
    // scope:'local' clears only THIS device — it never logs the user out of
    // the website or other devices.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* offline — local storage is still cleared */ }
      }
      setSession(null);
      setLoading(false);
    });

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setProfile(null); // Clear stale profile immediately before fetching the new one
        loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string, role: 'buyer' | 'provider'): Promise<string | null> {
    try {
      const res = await fetch(
        `${require('expo-constants').default.expoConfig?.extra?.apiBaseUrl}/api/auth/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // termsAccepted: the Signup screen gates this call behind the
          // required Terms of Use checkbox, so acceptance is always true here.
          body: JSON.stringify({ email, password, role, termsAccepted: true }),
        }
      );
      const body = await res.json();
      if (!res.ok) return body.error ?? 'Signup failed';
      // A brand-new account always starts in DARK mode: clear any theme
      // preference a previous user/account left saved on this device.
      AsyncStorage.removeItem(THEME_STORAGE_KEY).catch(() => {});
      // Sign in immediately after
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    } catch (e: any) {
      return e.message ?? 'Network error';
    }
  }

  function signInAsGuest() {
    setAuthStart('Login');
    setIsGuest(true);
  }

  function exitGuestToSignup() {
    setAuthStart('Signup');
    setIsGuest(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setIsGuest(false);
    setAuthStart('Login');
  }

  async function refreshProfile() {
    await loadProfile();
  }

  return (
    <AuthContext.Provider value={{
      session,
      user:    session?.user ?? null,
      profile,
      loading,
      isGuest,
      authStart,
      signIn,
      signUp,
      signOut,
      signInAsGuest,
      exitGuestToSignup,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
