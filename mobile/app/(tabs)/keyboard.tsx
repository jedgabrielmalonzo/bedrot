import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ScrollView, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useWebSocket } from '../../src/hooks/useWebSocket';

interface Shortcut {
  label: string;
  shortcut: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SHORTCUTS: Shortcut[] = [
  { label: 'Ctrl+C', shortcut: 'ctrl+c', icon: 'copy' },
  { label: 'Ctrl+V', shortcut: 'ctrl+v', icon: 'clipboard' },
  { label: 'Ctrl+Z', shortcut: 'ctrl+z', icon: 'arrow-undo' },
  { label: 'Ctrl+A', shortcut: 'ctrl+a', icon: 'checkbox' },
  { label: 'Ctrl+S', shortcut: 'ctrl+s', icon: 'save' },
  { label: 'Alt+Tab', shortcut: 'alt+tab', icon: 'swap-horizontal' },
  { label: 'Win+D', shortcut: 'win+d', icon: 'desktop' },
  { label: 'Win+E', shortcut: 'win+e', icon: 'folder' },
  { label: 'Ctrl+Shift+Esc', shortcut: 'ctrl+shift+escape', icon: 'list' },
  { label: 'Alt+F4', shortcut: 'alt+f4', icon: 'close-circle' },
  { label: 'Enter', shortcut: 'enter', icon: 'return-down-back' },
  { label: 'Esc', shortcut: 'escape', icon: 'close' },
  { label: 'Tab', shortcut: 'tab', icon: 'arrow-forward' },
  { label: 'Del', shortcut: 'delete', icon: 'trash' },
];

export default function KeyboardScreen() {
  const { sendCommand } = useWebSocket();
  const [text, setText] = useState('');
  const [customShortcut, setCustomShortcut] = useState('');

  const sendText = () => {
    if (text.length > 0) {
      sendCommand('keyboard.type', { text });
      setText('');
      Vibration.vibrate(10);
    }
  };

  const sendShortcut = (shortcut: string) => {
    Vibration.vibrate(15);
    sendCommand('keyboard.shortcut', { shortcut });
  };

  const sendKey = (key: string) => {
    Vibration.vibrate(10);
    sendCommand('keyboard.key', { key, modifiers: [], action: 'press' });
  };

  const sendCustomShortcut = () => {
    if (customShortcut.trim()) {
      sendShortcut(customShortcut.trim());
      setCustomShortcut('');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Keyboard & Shortcuts</Text>

        {/* Live Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type text to send to PC..."
            placeholderTextColor={Colors.textMuted}
            multiline
            autoFocus
            onSubmitEditing={sendText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendText}>
            <Ionicons name="send" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Custom Shortcut Creator */}
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customShortcut}
            onChangeText={setCustomShortcut}
            placeholder="Custom shortcut (e.g., ctrl+alt+t)"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.customBtn} onPress={sendCustomShortcut}>
            <Text style={styles.customBtnText}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Special Keys */}
        <Text style={styles.sectionTitle}>Special Keys</Text>
        <View style={styles.keysRow}>
          {['backspace', 'enter', 'tab', 'escape', 'space'].map(key => (
            <TouchableOpacity key={key} style={styles.keyBtn} onPress={() => sendKey(key)}>
              <Text style={styles.keyLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Arrow Keys */}
        <Text style={styles.sectionTitle}>Arrow Navigation</Text>
        <View style={styles.arrowContainer}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => sendKey('up')}>
            <Ionicons name="arrow-up" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.arrowRow}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => sendKey('left')}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => sendKey('down')}>
              <Ionicons name="arrow-down" size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => sendKey('right')}>
              <Ionicons name="arrow-forward" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preset Shortcuts */}
        <Text style={styles.sectionTitle}>Common Shortcuts</Text>
        <View style={styles.shortcutsGrid}>
          {SHORTCUTS.map((s) => (
            <TouchableOpacity
              key={s.shortcut}
              style={styles.shortcutBtn}
              onPress={() => sendShortcut(s.shortcut)}
            >
              <Ionicons name={s.icon} size={18} color={Colors.accent} />
              <Text style={styles.shortcutLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
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
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: Colors.text,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    minHeight: 60,
  },
  sendBtn: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.accent,
  },
  customRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  customBtnText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  keysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  keyBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keyLabel: { color: Colors.text, fontSize: FontSize.sm },
  arrowContainer: { alignItems: 'center', gap: Spacing.xs },
  arrowRow: { flexDirection: 'row', gap: Spacing.xs },
  arrowBtn: {
    width: 56,
    height: 56,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shortcutsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shortcutLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
