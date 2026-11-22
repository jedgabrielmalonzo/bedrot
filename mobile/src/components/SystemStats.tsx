import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  percentage?: number;
  color: string;
}

function StatCard({ icon, label, value, percentage, color }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      {percentage !== undefined && (
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

interface Props {
  cpu?: { usage: number };
  memory?: { usagePercent: number; used: number; total: number };
  uptime?: number;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function SystemStats({ cpu, memory, uptime }: Props) {
  return (
    <View style={styles.container}>
      <StatCard
        icon="speedometer"
        label="CPU"
        value={cpu ? `${cpu.usage}%` : '--'}
        percentage={cpu?.usage}
        color={Colors.accent}
      />
      <StatCard
        icon="hardware-chip"
        label="RAM"
        value={memory ? `${memory.usagePercent}%` : '--'}
        percentage={memory?.usagePercent}
        color={Colors.success}
      />
      <StatCard
        icon="time"
        label="Uptime"
        value={uptime ? formatUptime(uptime) : '--'}
        color={Colors.warning}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: Spacing.sm },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLabel: { color: Colors.textSecondary, fontSize: FontSize.xs },
  cardValue: { fontSize: FontSize.lg, fontWeight: '700' },
  bar: { height: 3, backgroundColor: Colors.surface, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
});
