import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface AgentConfig {
  port: number;
  pin: string;
  host: string;
  sessionTimeoutMs: number;
  rateLimit: { windowMs: number; maxRequests: number };
  allowedDirectories: string[];
  allowedApps: Record<string, string>;
  maxFileSize: number;
  screenshotQuality: number;
}

const userHome = os.homedir();
const pinFilePath = path.resolve(__dirname, '../.pin');

export function getOrGeneratePin(): string {
  if (process.env.DESKREMOTE_PIN) {
    return process.env.DESKREMOTE_PIN;
  }
  try {
    if (fs.existsSync(pinFilePath)) {
      const savedPin = fs.readFileSync(pinFilePath, 'utf-8').trim();
      if (/^\d{6}$/.test(savedPin)) {
        return savedPin;
      }
    }
  } catch {}

  const newPin = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    fs.writeFileSync(pinFilePath, newPin, 'utf-8');
  } catch {}
  return newPin;
}

export interface LocalIPEntry {
  name: string;
  address: string;
  isVirtual: boolean;
  isPreferred: boolean;
}

export function getAllLocalIPs(): LocalIPEntry[] {
  const interfaces = os.networkInterfaces();
  const results: LocalIPEntry[] = [];

  for (const name of Object.keys(interfaces)) {
    const isVirtual = /vEthernet|virtual|vbox|vmware|wsl|hyper-v|loopback|tap|docker|zerotier|tailscale/i.test(name);
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isVboxSubnet = iface.address.startsWith('192.168.56.');
        const isVirt = isVirtual || isVboxSubnet || iface.mac?.toLowerCase().startsWith('0a:00:27');
        const isPreferred = !isVirt && (
          iface.address.startsWith('192.168.1.') ||
          iface.address.startsWith('192.168.0.') ||
          /wi-?fi|wlan|wireless|ethernet/i.test(name)
        );
        results.push({ name, address: iface.address, isVirtual: isVirt, isPreferred });
      }
    }
  }

  results.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1;
    if (a.isVirtual !== b.isVirtual) return a.isVirtual ? 1 : -1;
    return 0;
  });

  return results;
}

export function getLocalIP(): string {
  if (process.env.DESKREMOTE_HOST) {
    return process.env.DESKREMOTE_HOST;
  }
  const ips = getAllLocalIPs();
  return ips[0]?.address || '127.0.0.1';
}

export function getConfig(): AgentConfig {
  return {
    port: parseInt(process.env.DESKREMOTE_PORT || '8765', 10),
    pin: getOrGeneratePin(),
    host: getLocalIP(),
    sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
    rateLimit: { windowMs: 1000, maxRequests: 100 },
    allowedDirectories: [
      userHome,
      path.join(userHome, 'Desktop'),
      path.join(userHome, 'Documents'),
      path.join(userHome, 'Downloads'),
      path.join(userHome, 'Pictures'),
      path.join(userHome, 'Music'),
      path.join(userHome, 'Videos'),
    ],
    allowedApps: {
      'notepad': 'notepad.exe',
      'calculator': 'calc.exe',
      'explorer': 'explorer.exe',
      'paint': 'mspaint.exe',
      'cmd': 'cmd.exe',
      'powershell': 'powershell.exe',
      'task manager': 'taskmgr.exe',
      'settings': 'ms-settings:',
      'browser': 'start microsoft-edge:',
      'snipping tool': 'snippingtool.exe',
    },
    maxFileSize: 50 * 1024 * 1024, // 50MB
    screenshotQuality: 80,
  };
}

export const SERVER_VERSION = '1.0.0';
export const SERVER_NAME = 'DeskRemote Agent';
