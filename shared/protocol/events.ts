/**
 * Event name constants for DeskRemote protocol.
 */

export const Events = {
  // Auth
  AUTH_REQUEST: 'auth.request',
  AUTH_RESPONSE: 'auth.response',
  AUTH_STATUS: 'auth.status',
  DEVICE_INFO: 'device.info',

  // Connection
  PING: 'ping',
  PONG: 'pong',

  // Mouse
  MOUSE_MOVE: 'mouse.move',
  MOUSE_CLICK: 'mouse.click',
  MOUSE_SCROLL: 'mouse.scroll',
  MOUSE_DRAG: 'mouse.drag',

  // Keyboard
  KEYBOARD_TYPE: 'keyboard.type',
  KEYBOARD_KEY: 'keyboard.key',
  KEYBOARD_SHORTCUT: 'keyboard.shortcut',

  // Audio
  AUDIO_SET_VOLUME: 'audio.setVolume',
  AUDIO_MUTE: 'audio.mute',
  AUDIO_GET_STATE: 'audio.getState',
  AUDIO_STATE: 'audio.state',

  // Media
  MEDIA_PLAY_PAUSE: 'media.playPause',
  MEDIA_NEXT: 'media.next',
  MEDIA_PREVIOUS: 'media.previous',
  MEDIA_STATE: 'media.state',

  // Windows
  WINDOWS_LIST: 'windows.list',
  WINDOWS_LIST_RESPONSE: 'windows.listResponse',
  WINDOWS_SWITCH: 'windows.switch',
  WINDOWS_MINIMIZE: 'windows.minimize',
  WINDOWS_MAXIMIZE: 'windows.maximize',
  WINDOWS_CLOSE: 'windows.close',

  // Apps
  APP_LAUNCH: 'app.launch',
  APP_CLOSE: 'app.close',
  APP_LIST: 'app.list',
  APP_LIST_RESPONSE: 'app.listResponse',

  // Power
  POWER_LOCK: 'power.lock',
  POWER_SLEEP: 'power.sleep',
  POWER_RESTART: 'power.restart',
  POWER_SHUTDOWN: 'power.shutdown',
  POWER_STATE: 'power.state',
  POWER_CONFIRM_REQUEST: 'power.confirmRequest',

  // Files
  FILE_LIST: 'file.list',
  FILE_LIST_RESPONSE: 'file.listResponse',
  FILE_UPLOAD: 'file.upload',
  FILE_DOWNLOAD: 'file.download',
  FILE_DOWNLOAD_RESPONSE: 'file.downloadResponse',
  FILE_CREATE_FOLDER: 'file.createFolder',
  FILE_RENAME: 'file.rename',
  FILE_DELETE: 'file.delete',

  // Screenshots
  SCREENSHOT_CAPTURE: 'screenshot.capture',
  SCREENSHOT_RESPONSE: 'screenshot.response',

  // System
  SYSTEM_MONITOR: 'system.monitor',
  SYSTEM_MONITOR_RESPONSE: 'system.monitorResponse',

  // Generic
  COMMAND_RESPONSE: 'command.response',
} as const;

export type EventName = typeof Events[keyof typeof Events];
