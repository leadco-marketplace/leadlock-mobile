import React, { createRef, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { useAuth }            from '@/contexts/AuthContext';
import { AuthNavigator }      from './AuthNavigator';
import { BuyerNavigator }     from './BuyerNavigator';
import { ProviderNavigator }  from './ProviderNavigator';
import { AdminNavigator }     from './AdminNavigator';
import { OnboardingScreen }   from '@/screens/onboarding/OnboardingScreen';
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
  const { session, profile, loading, isGuest, authStart } = useAuth();
  const { setPreDashboard } = useTheme();

  // Pre-dashboard surfaces (launch, login, signup, onboarding) are always
  // DARK. The user's saved theme preference only kicks in once they reach
  // the app proper (guest feed counts as "in the app").
  const preDashboard =
    loading ||
    (!session && !isGuest) ||
    (!!session && !isGuest && profile?.role === 'buyer' && !profile?.onboarding_complete);

  useEffect(() => {
    setPreDashboard(preDashboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preDashboard]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    );
  }

  // Buyers must finish onboarding (profile + verified phone + services +
  // areas) before entering the app — mirrors the web /onboarding middleware
  // gate. Rendered outside NavigationContainer: it's a single screen with
  // no navigation of its own; when refreshProfile() picks up
  // onboarding_complete=true this component re-renders into BuyerNavigator.
  if (session && !isGuest && profile && profile.role === 'buyer' && !profile.onboarding_complete) {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={NavTheme} linking={linking}>
      {!session && !isGuest
        ? <AuthNavigator initialRouteName={authStart} />
        : isGuest
          ? <BuyerNavigator />
          : profile?.role === 'admin'
            ? <AdminNavigator />
            : profile?.role === 'provider'
              ? <ProviderNavigator />
              : <BuyerNavigator />
      }
    </NavigationContainer>
  );
}
