import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile, profileApi } from '@/lib/api';

type AuthContextValue = {
  session:  Session | null;
  user:     User    | null;
  profile:  Profile | null;
  loading:  boolean;
  isGuest:  boolean;
  signIn:   (email: string, password: string) => Promise<string | null>;
  signUp:   (email: string, password: string, role: 'buyer' | 'provider') => Promise<string | null>;
  signOut:  () => Promise<void>;
  signInAsGuest: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isGuest, setIsGuest]   = useState(false);

  async function loadProfile() {
    try {
      const p = await profileApi.get();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile().finally(() => setLoading(false));
      else         setLoading(false);
    });

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile();
      else         setProfile(null);
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
          body: JSON.stringify({ email, password, role }),
        }
      );
      const body = await res.json();
      if (!res.ok) return body.error ?? 'Signup failed';
      // Sign in immediately after
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    } catch (e: any) {
      return e.message ?? 'Network error';
    }
  }

  function signInAsGuest() {
    setIsGuest(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setIsGuest(false);
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
      signIn,
      signUp,
      signOut,
      signInAsGuest,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
