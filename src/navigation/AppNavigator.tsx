import React, { createRef, useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { useAuth }            from '@/contexts/AuthContext';
import { AuthNavigator }      from './AuthNavigator';
import { BuyerNavigator }     from './BuyerNavigator';
import { ProviderNavigator }  from './ProviderNavigator';
import { AdminNavigator }     from './AdminNavigator';
import { OnboardingScreen }   from '@/screens/onboarding/OnboardingScreen';
import { ChooseAccountScreen } from '@/screens/auth/ChooseAccountScreen';
import { maybePromptForReview } from '@/lib/rateApp';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/theme';

/**
 * A ref to the NavigationContainer. Used by App.tsx (push notification
 * response handler) to navigate programmatically without needing a hook.
 */
export const navigationRef = createRef<NavigationContainerRef<any>>();

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background:  Colors.bg,
    card:        Colors.panel,
    text:        Colors.foreground,
    border:      Colors.border,
    notification: Colors.orange,
    primary:     Colors.orange,
  },
};

/**
 * Deep-link configuration.
 *
 * After a mobile payment completes, the website redirects to:
 *   leadco://my-leads   → buyer opens My Leads tab
 *   leadco://account    → buyer opens Account tab
 *
 * React Navigation handles both cold-start and foreground URL events
 * automatically when a `linking` prop is passed to NavigationContainer.
 */
const linking: LinkingOptions<any> = {
  prefixes: ['leadco://'],
  config: {
    screens: {
      // BuyerNavigator is a Stack → BuyerTabs (Tab) → individual screens.
      // The nested path must mirror the actual navigator hierarchy so that
      // leadco://my-leads correctly reaches the MyLeads Tab screen.
      BuyerTabs: {
        screens: {
          LiveFeed: 'live-feed',
          MyLeads:  'my-leads',
          Alerts:   'alerts',
          Account:  'account',
        },
      },
    },
  },
};

export function AppNavigator() {
  const { session, profile, loading, isGuest, authStart, dual, activeRole, effectiveRole } = useAuth();
  const { setPreDashboard } = useTheme();

  // Dual account that hasn't picked a side yet → the sign-in gate. Single-role
  // accounts are never dual, so this is always false for them.
  const needsGate = !!session && !isGuest && !!profile && dual && !activeRole;

  // Buyer side needs onboarding. Single-role buyers use onboarding_complete
  // exactly as before; a dual account's buyer side uses its own buyer_ready flag.
  const buyerNeedsOnboarding =
    !!session && !isGuest && !!profile && effectiveRole === 'buyer' &&
    (dual ? !profile.buyer_ready : !profile.onboarding_complete);

  // Pre-dashboard surfaces (launch, login, signup, gate, onboarding) are always DARK.
  const preDashboard =
    loading || (!session && !isGuest) || needsGate || buyerNeedsOnboarding;

  useEffect(() => {
    setPreDashboard(preDashboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preDashboard]);

  // Once the user is signed in and fully in the app (past the gate/onboarding),
  // consider the gentle one-time "Rate this app?" soft-ask. The helper itself
  // enforces "only after a few days, only once", so this is safe to trigger on
  // entry; we just guard against re-firing within a single app session.
  const reviewAsked = useRef(false);
  useEffect(() => {
    const inApp = !!session && !isGuest && !!profile && !needsGate && !buyerNeedsOnboarding;
    if (inApp && !reviewAsked.current) {
      reviewAsked.current = true;
      const t = setTimeout(() => { maybePromptForReview(); }, 4000); // let the UI settle first
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isGuest, profile, needsGate, buyerNeedsOnboarding]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    );
  }

  // Gate first: a dual account must pick which side to open.
  if (needsGate) {
    return <ChooseAccountScreen />;
  }

  // Buyer onboarding gate (mirrors web middleware). Single screen, no nav.
  if (buyerNeedsOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={NavTheme} linking={linking}>
      {!session && !isGuest
        ? <AuthNavigator initialRouteName={authStart} />
        : isGuest
          ? <BuyerNavigator />
          : effectiveRole === 'admin'
            ? <AdminNavigator />
            : effectiveRole === 'provider'
              ? <ProviderNavigator />
              : <BuyerNavigator />
      }
    </NavigationContainer>
  );
}
