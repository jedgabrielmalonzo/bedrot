import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { ConnectionStatusBadge } from '../../src/components/ConnectionStatus';
import { QuickActions } from '../../src/components/QuickActions';
import { SystemStats } from '../../src/components/SystemStats';
import { PowerControls } from '../../src/components/PowerControls';
import { ScreenshotViewer } from '../../src/components/ScreenshotViewer';
import { SystemStats as SystemStatsType, ScreenshotData } from '../../src/types';
import { wsService } from '../../src/services/websocket';

export default function HomeScreen() {
  const { status, deviceInfo, isConnected, sendCommand } = useWebSocket();
  const [systemStats, setSystemStats] = useState<SystemStatsType | null>(null);
  const [screenshot, setScreenshot] = useState<ScreenshotData | null>(null);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [isLiveScreenshot, setIsLiveScreenshot] = useState(false);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) return;
    
    const unsub = wsService.onMessage((type: string, payload: any) => {
      if (type === 'system.monitorResponse') {
        setSystemStats(payload);
      } else if (type === 'screenshot.response') {
        setScreenshot(payload);
        setScreenshotLoading(false);
      }
    });
    
    sendCommand('system.monitor', {});
    const interval = setInterval(() => sendCommand('system.monitor', {}), 10000);
    
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isConnected, sendCommand]);

  useEffect(() => {
    if (isLiveScreenshot && screenshotModalVisible && isConnected) {
      liveIntervalRef.current = setInterval(() => {
        sendCommand('screenshot.capture', { quality: 50 });
      }, 2500);
    } else {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    }

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLiveScreenshot, screenshotModalVisible, isConnected, sendCommand]);

  const handleOpenScreenshot = () => {
    setScreenshotModalVisible(true);
    setScreenshotLoading(true);
    sendCommand('screenshot.capture', { quality: 75 });
  };

  const handleRefreshScreenshot = () => {
    setScreenshotLoading(true);
    sendCommand('screenshot.capture', { quality: 75 });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>DeskRemote</Text>
            <Text style={styles.subtitle}>Wireless Desktop Control</Text>
          </View>
          {!isConnected && (
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={() => router.push('/connect')}
            >
              <Ionicons name="link" size={18} color={Colors.text} />
              <Text style={styles.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Connection Status */}
        <ConnectionStatusBadge
          status={status}
          hostname={deviceInfo?.hostname}
          ip={deviceInfo?.ip}
        />

        {/* System Stats */}
        {isConnected && systemStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System</Text>
            <SystemStats
              cpu={systemStats.cpu}
              memory={systemStats.memory}
              uptime={systemStats.uptime}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <QuickActions
            onScreenshot={handleOpenScreenshot}
          />
        </View>

        {/* Power Controls */}
        {isConnected && (
          <PowerControls
            onLock={() => sendCommand('power.lock', {})}
            onSleep={() => sendCommand('power.sleep', {})}
            onRestart={() => sendCommand('power.restart', {})}
            onShutdown={() => sendCommand('power.shutdown', {})}
          />
        )}

        {/* Screenshot Viewer Modal */}
        <ScreenshotViewer
          visible={screenshotModalVisible}
          screenshot={screenshot}
          loading={screenshotLoading}
          onClose={() => {
            setScreenshotModalVisible(false);
            setIsLiveScreenshot(false);
          }}
          onRefresh={handleRefreshScreenshot}
          isLive={isLiveScreenshot}
          onToggleLive={() => setIsLiveScreenshot(!isLiveScreenshot)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.title, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    gap: Spacing.xs,
  },
  connectBtnText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
});
