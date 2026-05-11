import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuth }            from '@/contexts/AuthContext';
import { AuthNavigator }      from './AuthNavigator';
import { BuyerNavigator }     from './BuyerNavigator';
import { ProviderNavigator }  from './ProviderNavigator';
import { AdminNavigator }     from './AdminNavigator';
import { Colors } from '@/theme';

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

export function AppNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NavTheme}>
      {!session
        ? <AuthNavigator />
        : profile?.role === 'admin'
          ? <AdminNavigator />
          : profile?.role === 'provider'
            ? <ProviderNavigator />
            : <BuyerNavigator />
      }
    </NavigationContainer>
  );
}
