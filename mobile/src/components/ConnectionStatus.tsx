import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { ConnectionStatus as StatusType } from '../types';

interface Props {
  status: StatusType;
  hostname?: string;
  ip?: string;
}

const statusConfig: Record<StatusType, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  disconnected: { color: Colors.danger, icon: 'cloud-offline', label: 'Disconnected' },
  connecting: { color: Colors.warning, icon: 'cloud-upload', label: 'Connecting...' },
  connected: { color: Colors.warning, icon: 'cloud', label: 'Connected' },
  authenticated: { color: Colors.success, icon: 'cloud-done', label: 'Connected' },
  error: { color: Colors.danger, icon: 'alert-circle', label: 'Error' },
};

export function ConnectionStatusBadge({ status, hostname, ip }: Props) {
  const config = statusConfig[status];

  return (
    <View style={[styles.container, { borderColor: config.color + '40' }]}>
      <Ionicons name={config.icon} size={20} color={config.color} />
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        {hostname && <Text style={styles.hostname}>{hostname}</Text>}
        {ip && <Text style={styles.ip}>{ip}</Text>}
      </View>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  textContainer: { flex: 1 },
  label: { fontSize: FontSize.md, fontWeight: '600' },
  hostname: { fontSize: FontSize.sm, color: Colors.textSecondary },
  ip: { fontSize: FontSize.xs, color: Colors.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
