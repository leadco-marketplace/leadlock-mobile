import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen }          from '@/screens/auth/LoginScreen';
import { SignupScreen }         from '@/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { Colors } from '@/theme';

export type AuthStackParamList = {
  Login:           undefined;
  Signup:          undefined;
  ForgotPassword:  undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator({ initialRouteName = 'Login' }: { initialRouteName?: 'Login' | 'Signup' }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown:   false,
        contentStyle:  { backgroundColor: Colors.bg },
        animation:     'fade',
      }}
    >
      <Stack.Screen name="Login"          component={LoginScreen}  />
      <Stack.Screen name="Signup"         component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
