import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUSH_TOKEN_STORAGE_KEY } from '@/lib/pushToken';
import { supabase } from '@/lib/supabase';
import { Profile, profileApi, pushApi } from '@/lib/api';
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
  signUp:   (email: string, password: string, role: 'buyer' | 'provider' | 'both') => Promise<string | null>;
  signOut:  () => Promise<void>;
  /** Dual-role accounts only: which side is active this session (from the gate). */
  activeRole: 'buyer' | 'provider' | null;
  setActiveRole: (r: 'buyer' | 'provider') => Promise<void>;
  /** Account has BOTH a buyer and a seller side. */
  dual: boolean;
  /** The role to actually render: activeRole for dual accounts, else the profile role. */
  effectiveRole: 'buyer' | 'provider' | 'admin' | null;
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
  const [activeRole, setActiveRoleState] = useState<'buyer' | 'provider' | null>(null);

  const ACTIVE_ROLE_KEY = 'nb_active_role';

  async function setActiveRole(r: 'buyer' | 'provider') {
    setActiveRoleState(r);
    try { await AsyncStorage.setItem(ACTIVE_ROLE_KEY, r); } catch { /* ignore */ }
  }

  // Dual = both sides. effectiveRole picks the active side for dual accounts,
  // otherwise it's exactly the profile role (single-role accounts unchanged).
  const dual = !!profile?.can_buy && !!profile?.can_sell;
  const effectiveRole: 'buyer' | 'provider' | 'admin' | null =
    !profile ? null : dual ? activeRole : profile.role;

  async function loadProfile(): Promise<Profile | null> {
    try {
      const p = await profileApi.get();
      setProfile(p);
      return p;
    } catch {
      setProfile(null);
      return null;
    }
  }

  // Restore the chosen active side (dual accounts). Cleared on sign-out, so the
  // gate re-appears after every fresh login (matches web).
  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_ROLE_KEY).then(v => {
      if (v === 'buyer' || v === 'provider') setActiveRoleState(v);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // COLD-START POLICY:
    //  • Logged-in, fully onboarded account → session persists, open the app
    //    (live feed). Push-alert taps keep working without re-login.
    //  • Logged out → Login page.
    //  • HALF-FINISHED signup (buyer who never completed onboarding) → sign
    //    out (this device only) so reopening never lands on the onboarding
    //    form uninvited; the user logs in and resumes onboarding.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      setSession(session);
      const p = await loadProfile();
      if (p && p.role === 'buyer' && !p.onboarding_complete) {
        try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* offline — local session still cleared */ }
        setSession(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setProfile(null); // Clear stale profile immediately before fetching the new one
        loadProfile();
        import('@/lib/api').then(m => m.sessionApi.ping().catch(() => {})).catch(() => {}); // last-active + login IP
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

  async function signUp(email: string, password: string, role: 'buyer' | 'provider' | 'both'): Promise<string | null> {
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
    // Stop this DEVICE from receiving the account's pushes before the session
    // is destroyed (the API call needs the still-valid auth token). Never
    // block logout on it — 4s cap, errors swallowed.
    try {
      const deviceToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (deviceToken) {
        await Promise.race([
          pushApi.unregister(deviceToken),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ]);
      }
    } catch { /* logout must never fail because of push cleanup */ }
    await supabase.auth.signOut();
    setProfile(null);
    setIsGuest(false);
    setAuthStart('Login');
    // Clear the active side so a dual account re-picks at the gate next login.
    setActiveRoleState(null);
    AsyncStorage.removeItem(ACTIVE_ROLE_KEY).catch(() => {});
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
      activeRole,
      setActiveRole,
      dual,
      effectiveRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
