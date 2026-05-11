import React from 'react';
import { createBottomTabNavigator }  from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { MySubmissionsScreen } from '@/screens/provider/MySubmissionsScreen';
import { SubmitLeadScreen }    from '@/screens/provider/SubmitLeadScreen';
import { AccountScreen }       from '@/screens/shared/AccountScreen';
import { Colors, FontSize } from '@/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

// Wrap My Submissions + Submit Lead in a stack so Submit is accessible from the tab
function SubmissionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="MySubmissions" component={MySubmissionsScreen} />
      <Stack.Screen name="SubmitLead"    component={SubmitLeadScreen}    />
    </Stack.Navigator>
  );
}

export function ProviderNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
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
        tabBarLabelStyle: { fontSize: FontSize.xs - 1, fontWeight: '600', marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="SubmissionsTab"
        component={SubmissionsStack}
        options={{
          title: 'My Leads',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SubmitLeadTab"
        component={SubmitLeadScreen}
        options={{
          title: 'Submit Lead',
          tabBarIcon: ({ focused }) => <TabIcon emoji="➕" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
