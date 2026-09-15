import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { DevicesIcon, AccessIcon, WifiIcon, SettingsIcon } from '@/components/TabIcons';

type IconProps = { color: ColorValue; size: number; focused: boolean };

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { borderTopColor: '#f1f5f9' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Devices',
          tabBarIcon: ({ color, size }: IconProps) => (
            <DevicesIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="access"
        options={{
          title: 'Access',
          tabBarIcon: ({ color, size }: IconProps) => (
            <AccessIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'Wi-Fi',
          tabBarIcon: ({ color, size }: IconProps) => (
            <WifiIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: IconProps) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
