export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'error';

export interface ConnectionConfig {
  host: string;
  port: number;
  pin: string;
}

export interface DeviceInfo {
  hostname: string;
  os: string;
  osVersion: string;
  ip: string;
  port: number;
  uptime: number;
}

export interface ServerInfo {
  serverName: string;
  serverVersion: string;
  token: string;
}

export interface SystemStats {
  cpu: { usage: number; model: string; cores: number; speed: number };
  memory: { total: number; used: number; free: number; usagePercent: number };
  disk: Array<{ drive: string; total: number; used: number; free: number; usagePercent: number }>;
  network: Array<{ interface: string; ip: string; mac: string }>;
  os: { platform: string; version: string; hostname: string; arch: string };
  uptime: number;
  processes: Array<{ name: string; pid: number; cpu: number; memory: number }>;
}

export interface WindowInfo {
  id: number;
  title: string;
  processName: string;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  extension?: string;
}

export interface AudioState {
  volume: number;
  muted: boolean;
  deviceName?: string;
}

export interface AppInfo {
  name: string;
  processName: string;
  pid: number;
  memoryMB: number;
}

export interface ScreenshotData {
  image: string;
  width: number;
  height: number;
  format: string;
  timestamp: number;
}
