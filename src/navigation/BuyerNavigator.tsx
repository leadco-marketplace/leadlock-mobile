import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { LiveFeedScreen }    from '@/screens/buyer/LiveFeedScreen';
import { MyLeadsScreen }     from '@/screens/buyer/MyLeadsScreen';
import { AlertsScreen }      from '@/screens/buyer/AlertsScreen';
import { AccountScreen }     from '@/screens/shared/AccountScreen';
import { LeadDetailScreen }  from '@/screens/buyer/LeadDetailScreen';
import { AreaPickerScreen }  from '@/screens/buyer/AreaPickerScreen';
import { GuestLockedScreen } from '@/screens/shared/GuestLockedScreen';
import { useAuth }           from '@/contexts/AuthContext';
import { Colors, FontSize }  from '@/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{
      fontSize:  22,
      opacity:   focused ? 1 : 0.65,
      transform: [{ scale: focused ? 1.08 : 1 }],
    }}>
      {emoji}
    </Text>
  );
}

// Guest teaser wrappers — Tab.Screen needs stable component references,
// so define them once at module level rather than inline closures.
const GuestMyLeads = () => <GuestLockedScreen tab="myleads" />;
const GuestAlerts  = () => <GuestLockedScreen tab="alerts"  />;
const GuestAccount = () => <GuestLockedScreen tab="account" />;

/** The four-tab buyer bottom bar. Guests see all tabs, but My Leads /
 *  Alerts / Account open teaser screens with a Sign Up CTA instead. */
function BuyerTabs() {
  const { isGuest } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.panel,
          borderTopColor:  'rgba(59,130,246,0.35)',
          borderTopWidth:  1.5,
          paddingBottom:   8,
          paddingTop:      4,
          height:          66,
          shadowColor:     '#000',
          shadowOffset:    { width: 0, height: -4 },
          shadowOpacity:   0.25,
          shadowRadius:    12,
          elevation:       12,
        },
        tabBarActiveTintColor:   Colors.orange,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize:      FontSize.xs,
          fontWeight:    '700',
          marginTop:     -2,
          letterSpacing: 0.2,
        },
      }}
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
        component={isGuest ? GuestMyLeads : MyLeadsScreen}
        options={{
          title: 'My Leads',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔓" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={isGuest ? GuestAlerts : AlertsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={isGuest ? GuestAccount : AccountScreen}
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * BuyerNavigator = Stack wrapping the tab bar + LeadDetail.
 * This allows the detail screen to push on top of (and fully cover) the tabs.
 */
export function BuyerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BuyerTabs"   component={BuyerTabs} />
      <Stack.Screen name="LeadDetail"  component={LeadDetailScreen} />
      <Stack.Screen name="AreaPicker"  component={AreaPickerScreen} />
    </Stack.Navigator>
  );
}
