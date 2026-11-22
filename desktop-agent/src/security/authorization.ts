import { AgentConfig } from '../config';
import * as path from 'path';

/** All commands that require authentication */
const ALLOWED_COMMANDS = new Set([
  'ping',
  'mouse.move', 'mouse.click', 'mouse.scroll', 'mouse.drag',
  'keyboard.type', 'keyboard.key', 'keyboard.shortcut',
  'audio.setVolume', 'audio.mute', 'audio.getState',
  'media.playPause', 'media.next', 'media.previous',
  'windows.list', 'windows.switch', 'windows.minimize', 'windows.maximize', 'windows.close',
  'app.launch', 'app.close', 'app.list',
  'power.lock', 'power.sleep', 'power.restart', 'power.shutdown',
  'file.list', 'file.upload', 'file.download', 'file.createFolder', 'file.rename', 'file.delete',
  'screenshot.capture',
  'system.monitor',
  'device.info',
]);

/** Commands that do NOT require authentication */
const PUBLIC_COMMANDS = new Set(['auth.request', 'ping']);

/** Destructive commands that need confirmation */
const DESTRUCTIVE_COMMANDS = new Set(['power.restart', 'power.shutdown', 'file.delete']);

export function isPublicCommand(command: string): boolean {
  return PUBLIC_COMMANDS.has(command);
}

export function isCommandAllowed(command: string): boolean {
  return ALLOWED_COMMANDS.has(command) || PUBLIC_COMMANDS.has(command);
}

export function isDestructiveCommand(command: string): boolean {
  return DESTRUCTIVE_COMMANDS.has(command);
}

export function isFilePathAllowed(filePath: string, config: AgentConfig): boolean {
  const resolved = path.resolve(filePath);
  const normalized = resolved.toLowerCase();
  return config.allowedDirectories.some(dir => {
    const normDir = path.resolve(dir).toLowerCase();
    return normalized === normDir || normalized.startsWith(normDir + path.sep);
  });
}

export function isAppAllowed(appName: string, config: AgentConfig): boolean {
  return appName.toLowerCase() in config.allowedApps;
}

export function getAppPath(appName: string, config: AgentConfig): string | null {
  const key = appName.toLowerCase();
  return config.allowedApps[key] || null;
}

/** Simple rate limiter */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(clientId) || [];
    const windowStart = now - this.windowMs;
    const recent = timestamps.filter(t => t > windowStart);
    if (recent.length >= this.maxRequests) {
      return false;
    }
    recent.push(now);
    this.requests.set(clientId, recent);
    return true;
  }

  reset(clientId: string): void {
    this.requests.delete(clientId);
  }
}
