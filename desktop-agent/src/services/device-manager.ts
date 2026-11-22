export interface ConnectedDevice {
  deviceId: string;
  deviceName: string;
  platform: string;
  connectedAt: number;
  lastSeen: number;
  sessionToken: string;
}

class DeviceManager {
  private devices: Map<string, ConnectedDevice> = new Map();

  addDevice(deviceId: string, deviceName: string, platform: string, sessionToken: string): ConnectedDevice {
    const device: ConnectedDevice = {
      deviceId,
      deviceName,
      platform,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      sessionToken,
    };
    this.devices.set(deviceId, device);
    return device;
  }

  removeDevice(deviceId: string): boolean {
    return this.devices.delete(deviceId);
  }

  updateLastSeen(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeen = Date.now();
    }
  }

  getDevice(deviceId: string): ConnectedDevice | undefined {
    return this.devices.get(deviceId);
  }

  getConnectedDevices(): ConnectedDevice[] {
    return Array.from(this.devices.values());
  }

  getDeviceCount(): number {
    return this.devices.size;
  }

  removeAll(): void {
    this.devices.clear();
  }
}

export const deviceManager = new DeviceManager();
