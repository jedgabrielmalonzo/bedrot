import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { SystemStats } from '../../src/types';
import { SYSTEM_MONITOR_INTERVAL_MS } from '../../src/constants/config';
import { wsService } from '../../src/services/websocket';

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

export default function MonitorScreen() {
  const { sendCommand, isConnected } = useWebSocket();
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    
    const unsub = wsService.onMessage((type: string, payload: any) => {
      if (type === 'system.monitorResponse') setStats(payload);
    });

    sendCommand('system.monitor', {});
    const interval = setInterval(() => sendCommand('system.monitor', {}), SYSTEM_MONITOR_INTERVAL_MS);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isConnected, sendCommand]);

  if (!stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="analytics" size={48} color={Colors.textMuted} />
          <Text style={styles.placeholder}>{isConnected ? 'Loading system metrics...' : 'Not connected to desktop'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>System Monitor</Text>
          <TouchableOpacity onPress={() => sendCommand('system.monitor', {})}>
            <Ionicons name="refresh" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* System Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.hostname}>{stats.os.hostname}</Text>
              <Text style={styles.osInfo}>Windows {stats.os.version} ({stats.os.arch})</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Online</Text>
            </View>
          </View>
          <Text style={styles.uptime}>Uptime: {formatUptime(stats.uptime)}</Text>
        </View>

        {/* CPU Utilization */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="speedometer" size={20} color={Colors.accent} />
            <Text style={styles.statLabel}>CPU Utilization</Text>
            <Text style={[styles.statValue, { color: Colors.accent }]}>{stats.cpu.usage}%</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(stats.cpu.usage, 100)}%`, backgroundColor: Colors.accent }]} />
          </View>
          <Text style={styles.statDetail}>{stats.cpu.model} ({stats.cpu.cores} cores)</Text>
        </View>

        {/* RAM Utilization */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="hardware-chip" size={20} color={Colors.success} />
            <Text style={styles.statLabel}>Memory (RAM)</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>{stats.memory.usagePercent}%</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(stats.memory.usagePercent, 100)}%`, backgroundColor: Colors.success }]} />
          </View>
          <Text style={styles.statDetail}>
            {formatBytes(stats.memory.used)} used • {formatBytes(stats.memory.free)} free of {formatBytes(stats.memory.total)}
          </Text>
        </View>

        {/* Storage / Drives */}
        <Text style={styles.sectionTitle}>Storage Drives</Text>
        {stats.disk.map((d, i) => (
          <View key={i} style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="server" size={20} color={Colors.warning} />
              <Text style={styles.statLabel}>Drive {d.drive}</Text>
              <Text style={[styles.statValue, { color: Colors.warning }]}>{d.usagePercent}%</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.min(d.usagePercent, 100)}%`, backgroundColor: Colors.warning }]} />
            </View>
            <Text style={styles.statDetail}>
              {formatBytes(d.free)} available of {formatBytes(d.total)} ({formatBytes(d.used)} used)
            </Text>
          </View>
        ))}

        {/* Network Adapters */}
        <Text style={styles.sectionTitle}>Network Interfaces</Text>
        <View style={styles.netGrid}>
          {stats.network.map((net, i) => (
            <View key={i} style={styles.netCard}>
              <View style={styles.netHeader}>
                <Ionicons name="wifi" size={16} color={Colors.accentLight} />
                <Text style={styles.netName} numberOfLines={1}>{net.interface}</Text>
              </View>
              <Text style={styles.netIP}>{net.ip}</Text>
              {net.mac ? <Text style={styles.netMac}>{net.mac}</Text> : null}
            </View>
          ))}
        </View>

        {/* Running Processes */}
        <Text style={styles.sectionTitle}>Top Processes (by CPU / RAM)</Text>
        {stats.processes.slice(0, 15).map((p, i) => (
          <View key={i} style={styles.processItem}>
            <View style={styles.processMain}>
              <Text style={styles.processName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.processPID}>PID: {p.pid}</Text>
            </View>
            <View style={styles.processStats}>
              <Text style={styles.processCpu}>CPU: {p.cpu}%</Text>
              <Text style={styles.processMem}>MEM: {p.memory}%</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  placeholder: { color: Colors.textMuted, fontSize: FontSize.md },
  container: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  infoCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hostname: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  osInfo: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  badge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  badgeText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '600' },
  uptime: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
  statCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statLabel: { flex: 1, color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  statValue: { fontSize: FontSize.lg, fontWeight: '800' },
  bar: { height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  statDetail: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.sm },
  netGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  netCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  netHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  netName: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', flex: 1 },
  netIP: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
  netMac: { color: Colors.textMuted, fontSize: FontSize.xs },
  processItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  processMain: { flex: 1 },
  processName: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
  processPID: { color: Colors.textMuted, fontSize: FontSize.xs },
  processStats: { flexDirection: 'row', gap: Spacing.sm },
  processCpu: { color: Colors.accentLight, fontSize: FontSize.xs, fontWeight: '600' },
  processMem: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '600' },
});
