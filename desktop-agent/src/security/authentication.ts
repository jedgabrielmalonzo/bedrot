import { v4 as uuidv4 } from 'uuid';

export interface Session {
  token: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  lastActivity: number;
}

class AuthenticationManager {
  private sessions: Map<string, Session> = new Map();
  private pin: string;
  private sessionTimeoutMs: number;

  constructor(pin: string, sessionTimeoutMs: number) {
    this.pin = pin;
    this.sessionTimeoutMs = sessionTimeoutMs;
  }

  verifyPin(pin: string): boolean {
    return pin === this.pin;
  }

  createSession(deviceId: string, deviceName: string, platform: string): Session {
    // Revoke any existing session for this device
    for (const [token, session] of this.sessions) {
      if (session.deviceId === deviceId) {
        this.revokeSession(token);
      }
    }

    const now = Date.now();
    const session: Session = {
      token: uuidv4(),
      deviceId,
      deviceName,
      platform,
      createdAt: now,
      expiresAt: now + this.sessionTimeoutMs,
      isActive: true,
      lastActivity: now,
    };

    this.sessions.set(session.token, session);
    return session;
  }

  validateSession(token: string): Session | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (!session.isActive) return null;
    if (Date.now() > session.expiresAt) {
      this.revokeSession(token);
      return null;
    }
    // Refresh activity
    session.lastActivity = Date.now();
    // Extend session on activity
    session.expiresAt = Date.now() + this.sessionTimeoutMs;
    return session;
  }

  revokeSession(token: string): boolean {
    const session = this.sessions.get(token);
    if (session) {
      session.isActive = false;
      this.sessions.delete(token);
      return true;
    }
    return false;
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  revokeAllSessions(): void {
    this.sessions.clear();
  }

  getPin(): string {
    return this.pin;
  }
}

export { AuthenticationManager };
