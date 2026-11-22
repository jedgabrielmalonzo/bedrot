import { useState, useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket';
import { ConnectionStatus, ConnectionConfig } from '../types';

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>(wsService.getStatus());
  const [deviceInfo, setDeviceInfo] = useState(wsService.getDeviceInfo());

  useEffect(() => {
    const unsubStatus = wsService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setDeviceInfo(wsService.getDeviceInfo());
    });

    const unsubMsg = wsService.onMessage((type, payload) => {
      if (type === 'device.info') {
        setDeviceInfo(payload);
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, []);

  const connect = useCallback((config: ConnectionConfig) => {
    wsService.connect(config);
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  const sendCommand = useCallback((type: string, payload: any) => {
    wsService.send(type, payload);
  }, []);

  return {
    status,
    deviceInfo,
    isConnected: status === 'authenticated',
    connect,
    disconnect,
    sendCommand,
  };
}
