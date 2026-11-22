import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useRouter } from 'expo-router';

interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string | null;
  color: string;
}

const actions: ActionItem[] = [
  { icon: 'hand-left', label: 'Touchpad', route: '/(tabs)/touchpad', color: Colors.accent },
  { icon: 'keypad', label: 'Keyboard', route: '/(tabs)/keyboard', color: '#e17055' },
  { icon: 'musical-notes', label: 'Media', route: '/(tabs)/media', color: '#00b894' },
  { icon: 'folder-open', label: 'Files', route: '/(tabs)/files', color: '#fdcb6e' },
  { icon: 'analytics', label: 'Monitor', route: '/(tabs)/monitor', color: '#74b9ff' },
  { icon: 'camera', label: 'Screenshot', route: null, color: '#fd79a8' },
];

interface Props {
  onScreenshot?: () => void;
}

export function QuickActions({ onScreenshot }: Props) {
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.card}
          onPress={() => {
            if (action.route) {
              router.push(action.route as any);
            } else if (action.label === 'Screenshot' && onScreenshot) {
              onScreenshot();
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
            <Ionicons name={action.icon} size={24} color={action.color} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
