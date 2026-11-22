import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { VolumeSlider } from '../../src/components/VolumeSlider';
import { MediaControls } from '../../src/components/MediaControls';
import { WindowInfo, AppInfo } from '../../src/types';
import { wsService } from '../../src/services/websocket';

export default function MediaScreen() {
  const { sendCommand, isConnected } = useWebSocket();
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [runningApps, setRunningApps] = useState<AppInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'windows' | 'apps'>('windows');

  useEffect(() => {
    if (!isConnected) return;
    
    const unsub = wsService.onMessage((type: string, payload: any) => {
      switch (type) {
        case 'audio.state':
          if (payload.volume !== undefined) setVolume(payload.volume);
          if (payload.muted !== undefined) setMuted(payload.muted);
          break;
        case 'windows.listResponse':
          setWindows(payload.windows || []);
          break;
        case 'app.listResponse':
          setRunningApps(payload.apps || []);
          break;
      }
    });

    sendCommand('audio.getState', {});
    sendCommand('windows.list', {});
    sendCommand('app.list', {});
    
    return unsub;
  }, [isConnected, sendCommand]);

  const refreshWindows = () => {
    sendCommand('windows.list', {});
  };

  const refreshApps = () => {
    sendCommand('app.list', {});
  };

  const closeRunningApp = (app: AppInfo) => {
    Alert.alert('Close Application', `Close "${app.name || app.processName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: () => {
          sendCommand('app.close', { processName: app.processName });
          setTimeout(refreshApps, 1000);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Media & Windows</Text>

        {/* Audio Volume */}
        <VolumeSlider
          volume={volume}
          muted={muted}
          onVolumeChange={(level) => {
            setVolume(level);
            sendCommand('audio.setVolume', { level });
          }}
          onMuteToggle={() => {
            const nextMuted = !muted;
            setMuted(nextMuted);
            sendCommand('audio.mute', { mute: nextMuted });
          }}
        />

        {/* Media Controls */}
        <MediaControls
          onPlayPause={() => sendCommand('media.playPause', {})}
          onNext={() => sendCommand('media.next', {})}
          onPrevious={() => sendCommand('media.previous', {})}
        />

        {/* App Launcher Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Launch Application</Text>
          <View style={styles.appGrid}>
            {[
              { id: 'browser', label: 'Edge', icon: 'globe-outline' },
              { id: 'notepad', label: 'Notepad', icon: 'document-text-outline' },
              { id: 'calculator', label: 'Calc', icon: 'calculator-outline' },
              { id: 'explorer', label: 'Files', icon: 'folder-outline' },
              { id: 'task manager', label: 'Tasks', icon: 'speedometer-outline' },
              { id: 'settings', label: 'Settings', icon: 'settings-outline' },
            ].map(app => (
              <TouchableOpacity
                key={app.id}
                style={styles.launcherBtn}
                onPress={() => sendCommand('app.launch', { name: app.id })}
                activeOpacity={0.7}
              >
                <Ionicons name={app.icon as any} size={22} color={Colors.accent} />
                <Text style={styles.launcherLabel}>{app.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Window & App Switcher Tab Bar */}
        <View style={styles.switchTabs}>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'windows' && styles.switchTabActive]}
            onPress={() => { setActiveTab('windows'); refreshWindows(); }}
          >
            <Text style={[styles.switchTabText, activeTab === 'windows' && styles.switchTabTextActive]}>
              Active Windows ({windows.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'apps' && styles.switchTabActive]}
            onPress={() => { setActiveTab('apps'); refreshApps(); }}
          >
            <Text style={[styles.switchTabText, activeTab === 'apps' && styles.switchTabTextActive]}>
              Running Apps ({runningApps.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Windows List */}
        {activeTab === 'windows' && (
          <View style={styles.section}>
            {windows.map((win) => (
              <View key={win.id} style={styles.windowItem}>
                <View style={styles.windowInfo}>
                  <Text style={styles.windowTitle} numberOfLines={1}>{win.title}</Text>
                  <Text style={styles.windowProcess}>{win.processName}</Text>
                </View>
                <View style={styles.windowActions}>
                  <TouchableOpacity
                    style={styles.winActionBtn}
                    onPress={() => sendCommand('windows.switch', { id: win.id })}
                  >
                    <Ionicons name="arrow-up-circle" size={24} color={Colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.winActionBtn}
                    onPress={() => sendCommand('windows.minimize', { id: win.id })}
                  >
                    <Ionicons name="remove-circle" size={24} color={Colors.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.winActionBtn}
                    onPress={() => sendCommand('windows.maximize', { id: win.id })}
                  >
                    <Ionicons name="scan-circle" size={24} color={Colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.winActionBtn}
                    onPress={() => {
                      sendCommand('windows.close', { id: win.id });
                      setTimeout(refreshWindows, 600);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {windows.length === 0 && (
              <Text style={styles.emptyText}>No active windows found</Text>
            )}
          </View>
        )}

        {/* Running Apps List */}
        {activeTab === 'apps' && (
          <View style={styles.section}>
            {runningApps.map((app, i) => (
              <View key={i} style={styles.windowItem}>
                <View style={styles.windowInfo}>
                  <Text style={styles.windowTitle} numberOfLines={1}>{app.name || app.processName}</Text>
                  <Text style={styles.windowProcess}>{app.processName} • {app.memoryMB} MB RAM</Text>
                </View>
                <TouchableOpacity
                  style={styles.appCloseBtn}
                  onPress={() => closeRunningApp(app)}
                >
                  <Text style={styles.appCloseText}>End Task</Text>
                </TouchableOpacity>
              </View>
            ))}
            {runningApps.length === 0 && (
              <Text style={styles.emptyText}>No running apps found</Text>
            )}
          </View>
        )}
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
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  launcherBtn: {
    width: '31%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  launcherLabel: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '500' },
  switchTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  switchTabActive: {
    backgroundColor: Colors.surface,
  },
  switchTabText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  switchTabTextActive: {
    color: Colors.accent,
  },
  windowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  windowInfo: { flex: 1, marginRight: Spacing.sm },
  windowTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },
  windowProcess: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  windowActions: { flexDirection: 'row', gap: Spacing.xs },
  winActionBtn: { padding: 2 },
  appCloseBtn: {
    backgroundColor: Colors.danger + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
  },
  appCloseText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    fontSize: FontSize.sm,
  },
});
