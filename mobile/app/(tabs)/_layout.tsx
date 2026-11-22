import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSize.xs },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="touchpad"
        options={{
          title: 'Touchpad',
          tabBarIcon: ({ color, size }) => <Ionicons name="hand-left" size={size} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="keyboard"
        options={{
          title: 'Keyboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="keypad" size={size} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Media',
          tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title: 'Files',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-open" size={size} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color as any} />,
        }}
      />
    </Tabs>
  );
}
