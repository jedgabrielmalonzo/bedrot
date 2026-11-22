import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { useRouter } from 'expo-router';
import { loadSensitivity, saveSensitivity } from '../../src/services/storage';
import { APP_VERSION } from '../../src/constants/config';

export default function SettingsScreen() {
  const { deviceInfo, isConnected, disconnect } = useWebSocket();
  const router = useRouter();
  const [sensitivity, setSensitivityState] = useState(1.5);

  useEffect(() => {
    loadSensitivity().then(setSensitivityState);
  }, []);

  const updateSensitivity = (val: number) => {
    const clamped = Math.max(0.5, Math.min(3.0, val));
    setSensitivityState(clamped);
    saveSensitivity(clamped);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.value, { color: isConnected ? Colors.success : Colors.danger }]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            {deviceInfo && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Server</Text>
                  <Text style={styles.value}>{deviceInfo.hostname}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>IP Address</Text>
                  <Text style={styles.value}>{deviceInfo.ip}:{deviceInfo.port}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.connectButton} onPress={() => router.push('/connect')}>
              <Ionicons name="link" size={18} color={Colors.text} />
              <Text style={styles.buttonText}>Connect</Text>
            </TouchableOpacity>
            {isConnected && (
              <TouchableOpacity style={[styles.connectButton, styles.disconnectButton]} onPress={disconnect}>
                <Ionicons name="unlink" size={18} color={Colors.danger} />
                <Text style={[styles.buttonText, { color: Colors.danger }]}>Disconnect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Touchpad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Touchpad</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Sensitivity</Text>
              <Text style={styles.value}>{sensitivity.toFixed(1)}x</Text>
            </View>
            <View style={styles.sliderRow}>
              <TouchableOpacity onPress={() => updateSensitivity(sensitivity - 0.1)}>
                <Ionicons name="remove-circle" size={28} color={Colors.accent} />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((sensitivity - 0.5) / 2.5) * 100}%` }]} />
              </View>
              <TouchableOpacity onPress={() => updateSensitivity(sensitivity + 0.1)}>
                <Ionicons name="add-circle" size={28} color={Colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Version</Text>
              <Text style={styles.value}>{APP_VERSION}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>App</Text>
              <Text style={styles.value}>DeskRemote</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: Colors.textSecondary, fontSize: FontSize.md },
  value: { color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  disconnectButton: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.danger + '40' },
  buttonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sliderTrack: { flex: 1, height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
});
