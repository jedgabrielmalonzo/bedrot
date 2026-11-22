import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConnectionConfig } from '../types';

const KEYS = {
  CONNECTION_CONFIG: 'deskremote_connection',
  SENSITIVITY: 'deskremote_sensitivity',
  CONNECTION_HISTORY: 'deskremote_history',
};

export async function saveConnectionConfig(config: ConnectionConfig): Promise<void> {
  await AsyncStorage.setItem(KEYS.CONNECTION_CONFIG, JSON.stringify(config));
}

export async function loadConnectionConfig(): Promise<ConnectionConfig | null> {
  const raw = await AsyncStorage.getItem(KEYS.CONNECTION_CONFIG);
  if (!raw) return null;
  try {
    const config = JSON.parse(raw);
    // Sanitize virtualbox or empty hosts
    if (!config?.host || config.host.startsWith('192.168.56.') || config.host === '127.0.0.1' || config.host === 'localhost') {
      config.host = '192.168.1.22';
    }
    return config;
  } catch {
    return null;
  }
}

export async function saveSensitivity(value: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.SENSITIVITY, value.toString());
}

export async function loadSensitivity(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.SENSITIVITY);
  return raw ? parseFloat(raw) : 1.5;
}

export async function saveConnectionHistory(entries: ConnectionConfig[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CONNECTION_HISTORY, JSON.stringify(entries.slice(0, 10)));
}

export async function loadConnectionHistory(): Promise<ConnectionConfig[]> {
  const raw = await AsyncStorage.getItem(KEYS.CONNECTION_HISTORY);
  return raw ? JSON.parse(raw) : [];
}
