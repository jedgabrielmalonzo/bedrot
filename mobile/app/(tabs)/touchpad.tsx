import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { TouchPad } from '../../src/components/TouchPad';
import { MouseButtons } from '../../src/components/MouseButtons';
import { loadSensitivity, saveSensitivity } from '../../src/services/storage';

export default function TouchpadScreen() {
  const { isConnected, sendCommand } = useWebSocket();
  const [sensitivity, setSensitivity] = useState(1.5);
  const [isDragLocked, setIsDragLocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSensitivity().then(setSensitivity);
  }, []);

  const toggleDragMode = () => {
    Vibration.vibrate(25);
    if (!isDragLocked) {
      setIsDragLocked(true);
      sendCommand('mouse.drag', { action: 'start', button: 'left' });
    } else {
      setIsDragLocked(false);
      sendCommand('mouse.drag', { action: 'end', button: 'left' });
    }
  };

  const handleSensitivityCycle = () => {
    const next = sensitivity === 1.0 ? 1.5 : sensitivity === 1.5 ? 2.0 : 1.0;
    setSensitivity(next);
    saveSensitivity(next);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Touchpad</Text>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.toolBtn, isDragLocked && styles.toolBtnActive]}
              onPress={toggleDragMode}
            >
              <Ionicons
                name="hand-right"
                size={18}
                color={isDragLocked ? Colors.warning : Colors.textSecondary}
              />
              <Text style={[styles.toolBtnText, isDragLocked && { color: Colors.warning }]}>
                {isDragLocked ? 'DRAGGING' : 'Drag'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleSensitivityCycle}>
              <Text style={styles.toolBtnText}>{sensitivity.toFixed(1)}x</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={() => router.push('/(tabs)/keyboard')}>
              <Ionicons name="keypad" size={18} color={Colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Touchpad Surface */}
        <TouchPad
          sensitivity={sensitivity}
          onMove={(dx, dy) => {
            if (isDragLocked) {
              sendCommand('mouse.drag', { action: 'move', deltaX: dx, deltaY: dy, button: 'left' });
            } else {
              sendCommand('mouse.move', { deltaX: dx, deltaY: dy, sensitivity: 1 });
            }
          }}
          onTap={() => {
            if (isDragLocked) {
              setIsDragLocked(false);
              sendCommand('mouse.drag', { action: 'end', button: 'left' });
            } else {
              sendCommand('mouse.click', { button: 'left', count: 1 });
            }
          }}
          onDoubleTap={() => sendCommand('mouse.click', { button: 'left', count: 2 })}
          onTwoFingerTap={() => sendCommand('mouse.click', { button: 'right', count: 1 })}
          onScroll={(dy) => sendCommand('mouse.scroll', { deltaX: 0, deltaY: dy })}
        />

        {/* Instructions strip */}
        <View style={styles.hintsRow}>
          <Text style={styles.hintText}>1-Tap: Left Click</Text>
          <Text style={styles.hintText}>•</Text>
          <Text style={styles.hintText}>2-Tap: Right Click</Text>
          <Text style={styles.hintText}>•</Text>
          <Text style={styles.hintText}>2-Finger: Scroll</Text>
        </View>

        {/* Mouse Buttons */}
        <MouseButtons
          onLeftClick={() => sendCommand('mouse.click', { button: 'left', count: 1 })}
          onRightClick={() => sendCommand('mouse.click', { button: 'right', count: 1 })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  toolBtnActive: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + '20',
  },
  toolBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  hintsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
