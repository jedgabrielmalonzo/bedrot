import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import { nativeInput } from '../services/native-input';

/** Pending confirmation tokens for destructive actions */
const confirmationTokens: Map<string, { action: string; expiresAt: number }> = new Map();

export function createConfirmationToken(action: string): { token: string; expiresIn: number } {
  const token = uuidv4();
  const expiresIn = 30; // 30 seconds
  confirmationTokens.set(token, { action, expiresAt: Date.now() + expiresIn * 1000 });
  return { token, expiresIn };
}

export function validateConfirmationToken(token: string, action: string): boolean {
  const entry = confirmationTokens.get(token);
  if (!entry) return false;
  if (entry.action !== action) return false;
  if (Date.now() > entry.expiresAt) {
    confirmationTokens.delete(token);
    return false;
  }
  confirmationTokens.delete(token);
  return true;
}

export async function lockDesktop(): Promise<{ success: boolean }> {
  if (nativeInput.available) {
    nativeInput.lock();
    return { success: true };
  }
  return new Promise((resolve) => {
    exec('rundll32.exe user32.dll,LockWorkStation', (error) => {
      resolve({ success: !error });
    });
  });
}

export async function sleepDesktop(): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0', (error) => {
      resolve({ success: !error });
    });
  });
}

export async function restartDesktop(confirmToken?: string): Promise<{ success: boolean; message?: string; confirmRequest?: { token: string; expiresIn: number } }> {
  if (!confirmToken) {
    const tokenInfo = createConfirmationToken('restart');
    return {
      success: false,
      message: 'Confirmation required for restart',
      confirmRequest: tokenInfo,
    };
  }
  if (!validateConfirmationToken(confirmToken, 'restart')) {
    return { success: false, message: 'Invalid or expired confirmation token' };
  }
  return new Promise((resolve) => {
    exec('shutdown /r /t 5 /f', (error) => {
      resolve({ success: !error, message: error ? error.message : 'Restarting in 5 seconds' });
    });
  });
}

export async function shutdownDesktop(confirmToken?: string): Promise<{ success: boolean; message?: string; confirmRequest?: { token: string; expiresIn: number } }> {
  if (!confirmToken) {
    const tokenInfo = createConfirmationToken('shutdown');
    return {
      success: false,
      message: 'Confirmation required for shutdown',
      confirmRequest: tokenInfo,
    };
  }
  if (!validateConfirmationToken(confirmToken, 'shutdown')) {
    return { success: false, message: 'Invalid or expired confirmation token' };
  }
  return new Promise((resolve) => {
    exec('shutdown /s /t 5 /f', (error) => {
      resolve({ success: !error, message: error ? error.message : 'Shutting down in 5 seconds' });
    });
  });
}

export async function getPowerState(): Promise<{ state: string; uptime: number }> {
  return { state: 'active', uptime: Math.round(os.uptime()) };
}
