interface RateLimitEntry {
  timestamps: number[];
}

export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;
  private cleanupTimer: NodeJS.Timeout;

  constructor(windowMs: number = 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  check(clientId: string): boolean {
    const now = Date.now();
    const entry = this.entries.get(clientId) || { timestamps: [] };
    const windowStart = now - this.windowMs;
    
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);
    
    if (entry.timestamps.length >= this.maxRequests) {
      return false;
    }

    entry.timestamps.push(now);
    this.entries.set(clientId, entry);
    return true;
  }

  reset(clientId: string): void {
    this.entries.delete(clientId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      entry.timestamps = entry.timestamps.filter(t => t > now - this.windowMs);
      if (entry.timestamps.length === 0) {
        this.entries.delete(key);
      }
    }
  }
}
