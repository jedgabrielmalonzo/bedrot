/**
 * DeskRemote Shared Protocol — Message Type Definitions
 * All messages exchanged between mobile app and desktop agent.
 */

// ─── Base Message ────────────────────────────────────────────
export interface BaseMessage {
  type: string;
  payload: Record<string, unknown>;
  id?: string;
  timestamp?: number;
  token?: string;
}

// ─── Authentication ──────────────────────────────────────────
export interface AuthRequestMessage extends BaseMessage {
  type: 'auth.request';
  payload: {
    pin: string;
    deviceId: string;
    deviceName: string;
    platform: string;
  };
}

export interface AuthResponseMessage extends BaseMessage {
  type: 'auth.response';
  payload: {
    success: boolean;
    token?: string;
    message?: string;
    serverName?: string;
    serverVersion?: string;
  };
}

export interface AuthStatusMessage extends BaseMessage {
  type: 'auth.status';
  payload: {
    authenticated: boolean;
    deviceId?: string;
    sessionExpiresAt?: number;
  };
}

export interface DeviceInfoMessage extends BaseMessage {
  type: 'device.info';
  payload: {
    hostname: string;
    os: string;
    osVersion: string;
    ip: string;
    port: number;
    uptime: number;
  };
}

// ─── Connection ──────────────────────────────────────────────
export interface PingMessage extends BaseMessage {
  type: 'ping';
  payload: { timestamp: number };
}

export interface PongMessage extends BaseMessage {
  type: 'pong';
  payload: { timestamp: number; serverTimestamp: number };
}

// ─── Mouse Control ───────────────────────────────────────────
export interface MouseMoveMessage extends BaseMessage {
  type: 'mouse.move';
  payload: { deltaX: number; deltaY: number; sensitivity?: number };
}

export interface MouseClickMessage extends BaseMessage {
  type: 'mouse.click';
  payload: { button: 'left' | 'right' | 'middle'; count?: number };
}

export interface MouseScrollMessage extends BaseMessage {
  type: 'mouse.scroll';
  payload: { deltaX: number; deltaY: number };
}

export interface MouseDragMessage extends BaseMessage {
  type: 'mouse.drag';
  payload: {
    action: 'start' | 'move' | 'end';
    deltaX?: number;
    deltaY?: number;
    button?: 'left' | 'right';
  };
}

// ─── Keyboard Control ────────────────────────────────────────
export interface KeyboardTypeMessage extends BaseMessage {
  type: 'keyboard.type';
  payload: { text: string };
}

export interface KeyboardKeyMessage extends BaseMessage {
  type: 'keyboard.key';
  payload: {
    key: string;
    modifiers?: Array<'ctrl' | 'alt' | 'shift' | 'win'>;
    action?: 'press' | 'down' | 'up';
  };
}

export interface KeyboardShortcutMessage extends BaseMessage {
  type: 'keyboard.shortcut';
  payload: { shortcut: string }; // e.g. "ctrl+c", "alt+tab"
}

// ─── Audio Control ───────────────────────────────────────────
export interface AudioSetVolumeMessage extends BaseMessage {
  type: 'audio.setVolume';
  payload: { level: number }; // 0-100
}

export interface AudioMuteMessage extends BaseMessage {
  type: 'audio.mute';
  payload: { mute: boolean };
}

export interface AudioGetStateMessage extends BaseMessage {
  type: 'audio.getState';
  payload: Record<string, never>;
}

export interface AudioStateMessage extends BaseMessage {
  type: 'audio.state';
  payload: {
    volume: number;
    muted: boolean;
    deviceName?: string;
  };
}

// ─── Media Control ───────────────────────────────────────────
export interface MediaPlayPauseMessage extends BaseMessage {
  type: 'media.playPause';
  payload: Record<string, never>;
}

export interface MediaNextMessage extends BaseMessage {
  type: 'media.next';
  payload: Record<string, never>;
}

export interface MediaPreviousMessage extends BaseMessage {
  type: 'media.previous';
  payload: Record<string, never>;
}

export interface MediaStateMessage extends BaseMessage {
  type: 'media.state';
  payload: {
    playing?: boolean;
    title?: string;
    artist?: string;
  };
}

// ─── Window Management ───────────────────────────────────────
export interface WindowsListMessage extends BaseMessage {
  type: 'windows.list';
  payload: Record<string, never>;
}

export interface WindowInfo {
  id: number;
  title: string;
  processName: string;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface WindowsListResponseMessage extends BaseMessage {
  type: 'windows.listResponse';
  payload: { windows: WindowInfo[] };
}

export interface WindowsSwitchMessage extends BaseMessage {
  type: 'windows.switch';
  payload: { id: number };
}

export interface WindowsMinimizeMessage extends BaseMessage {
  type: 'windows.minimize';
  payload: { id: number };
}

export interface WindowsMaximizeMessage extends BaseMessage {
  type: 'windows.maximize';
  payload: { id: number };
}

export interface WindowsCloseMessage extends BaseMessage {
  type: 'windows.close';
  payload: { id: number };
}

// ─── Application Management ─────────────────────────────────
export interface AppLaunchMessage extends BaseMessage {
  type: 'app.launch';
  payload: { name: string; path?: string; args?: string[] };
}

export interface AppCloseMessage extends BaseMessage {
  type: 'app.close';
  payload: { processName: string };
}

export interface AppListMessage extends BaseMessage {
  type: 'app.list';
  payload: Record<string, never>;
}

export interface AppInfo {
  name: string;
  processName: string;
  pid: number;
  memoryMB: number;
  cpuPercent?: number;
}

export interface AppListResponseMessage extends BaseMessage {
  type: 'app.listResponse';
  payload: { apps: AppInfo[] };
}

// ─── Power Management ────────────────────────────────────────
export interface PowerActionMessage extends BaseMessage {
  type: 'power.lock' | 'power.sleep' | 'power.restart' | 'power.shutdown';
  payload: { confirmToken?: string };
}

export interface PowerStateMessage extends BaseMessage {
  type: 'power.state';
  payload: {
    state: 'active' | 'idle' | 'locked';
    uptime: number;
    batteryLevel?: number;
    isCharging?: boolean;
  };
}

export interface PowerConfirmRequestMessage extends BaseMessage {
  type: 'power.confirmRequest';
  payload: {
    action: 'restart' | 'shutdown';
    confirmToken: string;
    expiresIn: number; // seconds
  };
}

// ─── File Management ─────────────────────────────────────────
export interface FileListMessage extends BaseMessage {
  type: 'file.list';
  payload: { path: string };
}

export interface FileItemInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  extension?: string;
}

export interface FileListResponseMessage extends BaseMessage {
  type: 'file.listResponse';
  payload: {
    path: string;
    items: FileItemInfo[];
    parentPath?: string;
  };
}

export interface FileUploadMessage extends BaseMessage {
  type: 'file.upload';
  payload: {
    path: string;
    fileName: string;
    content: string; // base64
    size: number;
  };
}

export interface FileDownloadMessage extends BaseMessage {
  type: 'file.download';
  payload: { path: string };
}

export interface FileDownloadResponseMessage extends BaseMessage {
  type: 'file.downloadResponse';
  payload: {
    path: string;
    fileName: string;
    content: string; // base64
    size: number;
    mimeType?: string;
  };
}

export interface FileCreateFolderMessage extends BaseMessage {
  type: 'file.createFolder';
  payload: { path: string; name: string };
}

export interface FileRenameMessage extends BaseMessage {
  type: 'file.rename';
  payload: { path: string; newName: string };
}

export interface FileDeleteMessage extends BaseMessage {
  type: 'file.delete';
  payload: { path: string; confirmToken?: string };
}

// ─── Screenshots ─────────────────────────────────────────────
export interface ScreenshotCaptureMessage extends BaseMessage {
  type: 'screenshot.capture';
  payload: { quality?: number; display?: number };
}

export interface ScreenshotResponseMessage extends BaseMessage {
  type: 'screenshot.response';
  payload: {
    image: string; // base64
    width: number;
    height: number;
    format: string;
    timestamp: number;
  };
}

// ─── System Monitoring ───────────────────────────────────────
export interface SystemMonitorMessage extends BaseMessage {
  type: 'system.monitor';
  payload: Record<string, never>;
}

export interface SystemMonitorResponseMessage extends BaseMessage {
  type: 'system.monitorResponse';
  payload: {
    cpu: { usage: number; model: string; cores: number; speed: number };
    memory: { total: number; used: number; free: number; usagePercent: number };
    disk: Array<{ drive: string; total: number; used: number; free: number; usagePercent: number }>;
    network: Array<{ interface: string; ip: string; mac: string; speed?: number }>;
    os: { platform: string; version: string; hostname: string; arch: string };
    uptime: number;
    processes: Array<{ name: string; pid: number; cpu: number; memory: number }>;
  };
}

// ─── Generic Response ────────────────────────────────────────
export interface CommandResponseMessage extends BaseMessage {
  type: 'command.response';
  payload: {
    success: boolean;
    message?: string;
    data?: unknown;
    requestId?: string;
    error?: string;
  };
}

// ─── Union Types ─────────────────────────────────────────────
export type DeskRemoteMessage =
  | AuthRequestMessage
  | AuthResponseMessage
  | AuthStatusMessage
  | DeviceInfoMessage
  | PingMessage
  | PongMessage
  | MouseMoveMessage
  | MouseClickMessage
  | MouseScrollMessage
  | MouseDragMessage
  | KeyboardTypeMessage
  | KeyboardKeyMessage
  | KeyboardShortcutMessage
  | AudioSetVolumeMessage
  | AudioMuteMessage
  | AudioGetStateMessage
  | AudioStateMessage
  | MediaPlayPauseMessage
  | MediaNextMessage
  | MediaPreviousMessage
  | MediaStateMessage
  | WindowsListMessage
  | WindowsListResponseMessage
  | WindowsSwitchMessage
  | WindowsMinimizeMessage
  | WindowsMaximizeMessage
  | WindowsCloseMessage
  | AppLaunchMessage
  | AppCloseMessage
  | AppListMessage
  | AppListResponseMessage
  | PowerActionMessage
  | PowerStateMessage
  | PowerConfirmRequestMessage
  | FileListMessage
  | FileListResponseMessage
  | FileUploadMessage
  | FileDownloadMessage
  | FileDownloadResponseMessage
  | FileCreateFolderMessage
  | FileRenameMessage
  | FileDeleteMessage
  | ScreenshotCaptureMessage
  | ScreenshotResponseMessage
  | SystemMonitorMessage
  | SystemMonitorResponseMessage
  | CommandResponseMessage;

/** All valid message type strings */
export type MessageType = DeskRemoteMessage['type'];
