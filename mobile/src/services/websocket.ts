import { ConnectionConfig, ConnectionStatus, DeviceInfo, ServerInfo } from '../types';
import { PING_INTERVAL_MS, RECONNECT_INTERVAL_MS, MAX_RECONNECT_ATTEMPTS } from '../constants/config';

type MessageHandler = (type: string, payload: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig | null = null;
  private token: string | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();
  private deviceInfo: DeviceInfo | null = null;
  private serverInfo: ServerInfo | null = null;

  connect(config: ConnectionConfig): void {
    this.config = config;
    this.reconnectAttempts = 0;
    this.doConnect();
  }

  private doConnect(): void {
    if (!this.config) return;
    
    this.setStatus('connecting');
    
    let host = (this.config.host || '').trim();
    let port = this.config.port || 8765;

    // Clean protocol prefixes
    host = host.replace(/^wss?:\/\//i, '').replace(/^https?:\/\//i, '');
    // Clean trailing slashes or paths
    host = host.replace(/\/.*$/, '');

    // Auto-detect and fix host:port in the host string
    if (host.includes(':')) {
      const parts = host.split(':');
      host = parts[0].trim();
      if (parts[1]) {
        const parsedPort = parseInt(parts[1].trim(), 10);
        if (!isNaN(parsedPort) && parsedPort > 0) {
          port = parsedPort;
        }
      }
    }

    const url = `ws://${host}:${port}`;
    console.log(`[WS] Connecting to ${url}...`);
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('[WS] Connected to ' + url);
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.authenticate();
        this.startPing();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string);
          this.handleIncoming(msg);
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        this.stopPing();
        if (this.status === 'authenticated' || this.status === 'connected') {
          this.setStatus('disconnected');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.setStatus('error');
      };
    } catch (err) {
      console.error('[WS] Connection exception:', err);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private authenticate(): void {
    if (!this.config || !this.ws) return;
    
    const deviceId = `mobile-${Date.now()}`;
    this.send('auth.request', {
      pin: this.config.pin,
      deviceId,
      deviceName: 'DeskRemote Mobile',
      platform: 'android',
    });
  }

  private handleIncoming(msg: { type: string; payload: any }): void {
    const { type, payload } = msg;

    switch (type) {
      case 'auth.response':
        if (payload.success) {
          this.token = payload.token;
          this.serverInfo = {
            serverName: payload.serverName,
            serverVersion: payload.serverVersion,
            token: payload.token,
          };
          this.setStatus('authenticated');
          console.log('[WS] Authenticated successfully!');
        } else {
          console.error('[WS] Auth failed:', payload.message);
          this.setStatus('error');
        }
        break;
      case 'device.info':
        this.deviceInfo = payload;
        break;
      case 'pong':
        break;
    }

    this.messageHandlers.forEach(handler => handler(type, payload));
  }

  send(type: string, payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const msg = {
      type,
      payload,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      ...(this.token ? { token: this.token } : {}),
    };
    
    this.ws.send(JSON.stringify(msg));
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send('ping', { timestamp: Date.now() });
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[WS] Max reconnect attempts reached');
      this.setStatus('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = RECONNECT_INTERVAL_MS * Math.min(this.reconnectAttempts, 5);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, delay);
  }

  disconnect(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.token = null;
    this.setStatus('disconnected');
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusHandlers.forEach(handler => handler(status));
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  getStatus(): ConnectionStatus { return this.status; }
  getDeviceInfo(): DeviceInfo | null { return this.deviceInfo; }
  getServerInfo(): ServerInfo | null { return this.serverInfo; }
  getToken(): string | null { return this.token; }
  isConnected(): boolean { return this.status === 'authenticated'; }
}

export const wsService = new WebSocketService();
