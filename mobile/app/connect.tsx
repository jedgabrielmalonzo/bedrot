import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../src/constants/theme';
import { useWebSocket } from '../src/hooks/useWebSocket';
import { saveConnectionConfig, loadConnectionConfig } from '../src/services/storage';
import { DEFAULT_PORT, DEFAULT_HOST } from '../src/constants/config';

export default function ConnectScreen() {
  const { connect, status, isConnected } = useWebSocket();
  const router = useRouter();
  const [host, setHost] = useState('');
  const [port, setPort] = useState(DEFAULT_PORT.toString());
  const [pin, setPin] = useState('');

  useEffect(() => {
    loadConnectionConfig().then(config => {
      if (config) {
        setHost(config.host || DEFAULT_HOST);
        setPort(config.port ? config.port.toString() : DEFAULT_PORT.toString());
        if (config.pin) {
          setPin(config.pin);
        }
      } else {
        setHost(DEFAULT_HOST);
      }
    });
  }, []);

  useEffect(() => {
    if (isConnected) {
      router.back();
    }
  }, [isConnected, router]);

  const handleHostChange = (text: string) => {
    let clean = text.trim().replace(/^wss?:\/\//i, '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (clean.includes(':')) {
      const parts = clean.split(':');
      clean = parts[0];
      if (parts[1]) {
        setPort(parts[1]);
      }
    }
    setHost(clean);
  };

  const handleConnect = () => {
    let cleanHost = host.trim().replace(/^wss?:\/\//i, '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    let cleanPort = parseInt(port, 10) || DEFAULT_PORT;
    if (cleanHost.includes(':')) {
      const parts = cleanHost.split(':');
      cleanHost = parts[0];
      if (parts[1]) {
        cleanPort = parseInt(parts[1], 10) || cleanPort;
      }
    }
    if (!cleanHost || !pin) return;
    const config = { host: cleanHost, port: cleanPort, pin: pin.trim() };
    saveConnectionConfig(config);
    connect(config);
  };

  const isConnecting = status === 'connecting' || status === 'connected';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Branding */}
        <View style={styles.branding}>
          <View style={styles.logo}>
            <Ionicons name="desktop" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.title}>DeskRemote</Text>
          <Text style={styles.subtitle}>Connect to your desktop</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Server IP Address</Text>
            <TextInput
              style={styles.input}
              value={host}
              onChangeText={handleHostChange}
              placeholder="192.168.1.22"
              placeholderTextColor={Colors.textMuted}
              keyboardType="default"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Port</Text>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={setPort}
              placeholder="8765"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PIN Code</Text>
            <TextInput
              style={[styles.input, styles.pinInput]}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter 6-digit PIN"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.connectBtn, (!host || !pin) && styles.connectBtnDisabled]}
            onPress={handleConnect}
            disabled={isConnecting || !host || !pin}
          >
            {isConnecting ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Ionicons name="link" size={20} color={Colors.text} />
                <Text style={styles.connectBtnText}>Connect</Text>
              </>
            )}
          </TouchableOpacity>

          {status === 'error' && (
            <Text style={styles.error}>Connection failed. Check IP, port, and PIN.</Text>
          )}
        </View>

        <Text style={styles.hint}>
          Run the DeskRemote Agent on your desktop to see the IP and PIN.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'flex-end' },
  branding: { alignItems: 'center', marginVertical: Spacing.xl },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.title, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  form: { gap: Spacing.md },
  inputGroup: { gap: Spacing.xs },
  inputLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginLeft: 4 },
  input: {
    backgroundColor: Colors.card,
    color: Colors.text,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: FontSize.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pinInput: { textAlign: 'center', letterSpacing: 8, fontSize: FontSize.xxl },
  connectBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  connectBtnDisabled: { opacity: 0.5 },
  connectBtnText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  error: { color: Colors.danger, textAlign: 'center', fontSize: FontSize.sm },
  hint: { color: Colors.textMuted, textAlign: 'center', fontSize: FontSize.sm, marginTop: Spacing.xl },
});
