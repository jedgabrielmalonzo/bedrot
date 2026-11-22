import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface Props {
  onLock: () => void;
  onSleep: () => void;
  onRestart: () => void;
  onShutdown: () => void;
}

interface PowerButton {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  action: () => void;
  dangerous: boolean;
}

export function PowerControls({ onLock, onSleep, onRestart, onShutdown }: Props) {
  const confirmAction = (action: string, fn: () => void) => {
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action.toLowerCase()} the desktop?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action, style: 'destructive', onPress: fn },
      ]
    );
  };

  const buttons: PowerButton[] = [
    { icon: 'lock-closed', label: 'Lock', color: Colors.warning, action: onLock, dangerous: false },
    { icon: 'moon', label: 'Sleep', color: Colors.accentLight, action: onSleep, dangerous: false },
    { icon: 'refresh', label: 'Restart', color: Colors.warning, action: () => confirmAction('Restart', onRestart), dangerous: true },
    { icon: 'power', label: 'Shutdown', color: Colors.danger, action: () => confirmAction('Shutdown', onShutdown), dangerous: true },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Power</Text>
      <View style={styles.grid}>
        {buttons.map((btn) => (
          <TouchableOpacity
            key={btn.label}
            style={[styles.button, btn.dangerous && styles.dangerBorder]}
            onPress={btn.action}
            activeOpacity={0.7}
          >
            <Ionicons name={btn.icon} size={24} color={btn.color} />
            <Text style={[styles.label, { color: btn.color }]}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  title: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  grid: { flexDirection: 'row', gap: Spacing.sm },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dangerBorder: { borderColor: Colors.danger + '30' },
  label: { fontSize: FontSize.xs, fontWeight: '500' },
});
