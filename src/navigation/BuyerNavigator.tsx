import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { LiveFeedScreen }  from '@/screens/buyer/LiveFeedScreen';
import { MyLeadsScreen }   from '@/screens/buyer/MyLeadsScreen';
import { AlertsScreen }    from '@/screens/buyer/AlertsScreen';
import { AccountScreen }   from '@/screens/shared/AccountScreen';
import { Colors, FontSize } from '@/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export function BuyerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.panel,
          borderTopColor:  'rgba(249,115,22,0.28)',
          borderTopWidth:  1,
          paddingBottom:   8,
          height:          62,
        },
        tabBarActiveTintColor:   Colors.orange,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize:   FontSize.xs - 1,
          fontWeight: '600',
          marginTop:  -2,
        },
      })}
    >
      <Tab.Screen
        name="LiveFeed"
        component={LiveFeedScreen}
        options={{
          title: 'Live Feed',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyLeads"
        component={MyLeadsScreen}
        options={{
          title: 'My Leads',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔓" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
