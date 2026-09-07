import { createRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

/**
 * A ref to the NavigationContainer. Lives in its own module (imported by both
 * AppNavigator and WelcomeTour) so there's no circular import between them.
 * App.tsx uses it for push-notification navigation; WelcomeTour uses it to drive
 * the interactive tour between tabs.
 */
export const navigationRef = createRef<NavigationContainerRef<any>>();
