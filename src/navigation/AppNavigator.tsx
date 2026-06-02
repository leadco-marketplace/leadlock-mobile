import React, { createRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { useAuth }            from '@/contexts/AuthContext';
import { AuthNavigator }      from './AuthNavigator';
import { BuyerNavigator }     from './BuyerNavigator';
import { ProviderNavigator }  from './ProviderNavigator';
import { AdminNavigator }     from './AdminNavigator';
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
  const { session, profile, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={NavTheme} linking={linking}>
      {!session && !isGuest
        ? <AuthNavigator />
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
