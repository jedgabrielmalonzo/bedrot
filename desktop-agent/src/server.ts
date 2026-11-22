import * as WebSocket from 'ws';
import * as os from 'os';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
const qrcode = require('qrcode-terminal');
import { getConfig, getAllLocalIPs, SERVER_NAME, SERVER_VERSION } from './config';
import { AuthenticationManager } from './security/authentication';
import { isPublicCommand, isCommandAllowed, isDestructiveCommand, isFilePathAllowed } from './security/authorization';
import { RateLimiter } from './middleware/rate-limit';
import { validateMessage, validatePayload, sanitizeString } from './middleware/validation';
import { deviceManager } from './services/device-manager';
import * as mouseCtrl from './controllers/mouse';
import * as keyboardCtrl from './controllers/keyboard';
import * as audioCtrl from './controllers/audio';
import * as mediaCtrl from './controllers/media';
import * as windowsCtrl from './controllers/windows';
import * as appsCtrl from './controllers/applications';
import * as powerCtrl from './controllers/power';
import * as filesCtrl from './controllers/files';
import * as screenshotCtrl from './controllers/screenshots';
import * as systemMonitor from './services/system-monitor';
import { nativeInput } from './services/native-input';

export const config = getConfig();
export const authManager = new AuthenticationManager(config.pin, config.sessionTimeoutMs);
const rateLimiter = new RateLimiter(config.rateLimit.windowMs, config.rateLimit.maxRequests);

// Map ws connections to their session tokens
const connectionTokens = new Map<WebSocket.WebSocket, string>();

function createResponse(success: boolean, data?: any, error?: string, requestId?: string) {
  return JSON.stringify({
    type: 'command.response',
    payload: { success, ...(data ? { data } : {}), ...(error ? { error } : {}), ...(requestId ? { requestId } : {}) },
    timestamp: Date.now(),
  });
}

function sendJson(ws: WebSocket.WebSocket, type: string, payload: any) {
  if (ws.readyState === WebSocket.WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
  }
}

async function handleMessage(ws: WebSocket.WebSocket, raw: string): Promise<void> {
  const validation = validateMessage(raw);
  if (!validation.valid || !validation.parsed) {
    ws.send(createResponse(false, null, validation.error));
    return;
  }

  const msg = validation.parsed;
  const { type, payload, id: requestId } = msg;

  // Rate limiting
  const clientKey = connectionTokens.get(ws) || 'anonymous';
  if (!rateLimiter.check(clientKey)) {
    ws.send(createResponse(false, null, 'Rate limit exceeded', requestId));
    return;
  }

  // Handle auth request (no token needed)
  if (type === 'auth.request') {
    const { pin, deviceId, deviceName, platform } = payload;
    if (!authManager.verifyPin(pin)) {
      sendJson(ws, 'auth.response', { success: false, message: 'Invalid PIN' });
      return;
    }
    const session = authManager.createSession(deviceId, deviceName, platform || 'unknown');
    connectionTokens.set(ws, session.token);
    deviceManager.addDevice(deviceId, deviceName, platform || 'unknown', session.token);
    sendJson(ws, 'auth.response', {
      success: true,
      token: session.token,
      message: 'Authenticated successfully',
      serverName: os.hostname(),
      serverVersion: SERVER_VERSION,
    });
    // Send device info
    sendJson(ws, 'device.info', {
      hostname: os.hostname(),
      os: os.platform(),
      osVersion: os.release(),
      ip: config.host,
      port: config.port,
      uptime: Math.round(os.uptime()),
    });
    console.log(`[DeskRemote] Device authenticated: ${deviceName} (${deviceId})`);
    return;
  }

  // Handle ping (allow even without auth)
  if (type === 'ping') {
    sendJson(ws, 'pong', { timestamp: payload?.timestamp || Date.now(), serverTimestamp: Date.now() });
    return;
  }

  // All other commands require authentication
  const token = msg.token || connectionTokens.get(ws);
  if (!token) {
    ws.send(createResponse(false, null, 'Not authenticated', requestId));
    return;
  }

  const session = authManager.validateSession(token);
  if (!session) {
    ws.send(createResponse(false, null, 'Session expired or invalid', requestId));
    return;
  }

  // Check if command is allowed
  if (!isCommandAllowed(type)) {
    ws.send(createResponse(false, null, `Command not allowed: ${type}`, requestId));
    return;
  }

  // Validate payload
  const payloadValidation = validatePayload(type, payload);
  if (!payloadValidation.valid) {
    ws.send(createResponse(false, null, payloadValidation.error, requestId));
    return;
  }

  // Route commands
  try {
    let result: any;

    switch (type) {
      // Mouse
      case 'mouse.move':
        result = await mouseCtrl.handleMouseMove(payload.deltaX, payload.deltaY, payload.sensitivity);
        break;
      case 'mouse.click':
        result = await mouseCtrl.handleMouseClick(payload.button || 'left', payload.count || 1);
        break;
      case 'mouse.scroll':
        result = await mouseCtrl.handleMouseScroll(payload.deltaX || 0, payload.deltaY || 0);
        break;
      case 'mouse.drag':
        result = await mouseCtrl.handleMouseDrag(payload.action, payload.deltaX, payload.deltaY, payload.button);
        break;

      // Keyboard
      case 'keyboard.type':
        result = await keyboardCtrl.handleKeyType(sanitizeString(payload.text, 5000));
        break;
      case 'keyboard.key':
        result = await keyboardCtrl.handleKeyPress(payload.key, payload.modifiers, payload.action);
        break;
      case 'keyboard.shortcut':
        result = await keyboardCtrl.handleKeyShortcut(payload.shortcut);
        break;

      // Audio
      case 'audio.setVolume':
        result = await audioCtrl.handleSetVolume(payload.level);
        sendJson(ws, 'audio.state', result);
        break;
      case 'audio.mute':
        result = await audioCtrl.handleMute(payload.mute !== undefined ? payload.mute : true);
        break;
      case 'audio.getState':
        result = await audioCtrl.getAudioState();
        sendJson(ws, 'audio.state', result);
        break;

      // Media
      case 'media.playPause':
        result = await mediaCtrl.handlePlayPause();
        break;
      case 'media.next':
        result = await mediaCtrl.handleNext();
        break;
      case 'media.previous':
        result = await mediaCtrl.handlePrevious();
        break;

      // Windows
      case 'windows.list':
        const windows = await windowsCtrl.listWindows();
        sendJson(ws, 'windows.listResponse', { windows });
        result = { success: true };
        break;
      case 'windows.switch':
        result = await windowsCtrl.switchToWindow(payload.id);
        break;
      case 'windows.minimize':
        result = await windowsCtrl.minimizeWindow(payload.id);
        break;
      case 'windows.maximize':
        result = await windowsCtrl.maximizeWindow(payload.id);
        break;
      case 'windows.close':
        result = await windowsCtrl.closeWindow(payload.id);
        break;

      // Applications
      case 'app.launch':
        result = await appsCtrl.launchApp(payload.name, config);
        break;
      case 'app.close':
        result = await appsCtrl.closeApp(payload.processName);
        break;
      case 'app.list':
        const apps = await appsCtrl.listRunningApps();
        sendJson(ws, 'app.listResponse', { apps });
        result = { success: true };
        break;

      // Power
      case 'power.lock':
        result = await powerCtrl.lockDesktop();
        break;
      case 'power.sleep':
        result = await powerCtrl.sleepDesktop();
        break;
      case 'power.restart':
        result = await powerCtrl.restartDesktop(payload.confirmToken);
        if (result.confirmRequest) {
          sendJson(ws, 'power.confirmRequest', { action: 'restart', ...result.confirmRequest });
        }
        break;
      case 'power.shutdown':
        result = await powerCtrl.shutdownDesktop(payload.confirmToken);
        if (result.confirmRequest) {
          sendJson(ws, 'power.confirmRequest', { action: 'shutdown', ...result.confirmRequest });
        }
        break;

      // Files
      case 'file.list':
        const dirResult = await filesCtrl.listDirectory(payload.path, config);
        if (dirResult.success) {
          sendJson(ws, 'file.listResponse', { path: payload.path, items: dirResult.items, parentPath: dirResult.parentPath });
        }
        result = dirResult;
        break;
      case 'file.upload':
        result = await filesCtrl.saveFile(payload.path, payload.fileName, payload.content, config);
        break;
      case 'file.download':
        const fileResult = await filesCtrl.getFileContent(payload.path, config);
        if (fileResult.success) {
          sendJson(ws, 'file.downloadResponse', {
            path: payload.path,
            fileName: fileResult.fileName,
            content: fileResult.content,
            size: fileResult.size,
          });
        }
        result = fileResult;
        break;
      case 'file.createFolder':
        result = await filesCtrl.createFolder(payload.path, payload.name, config);
        break;
      case 'file.rename':
        result = await filesCtrl.renameItem(payload.path, payload.newName, config);
        break;
      case 'file.delete':
        result = await filesCtrl.deleteItem(payload.path, config);
        break;

      // Screenshots
      case 'screenshot.capture':
        const ssResult = await screenshotCtrl.captureScreenshot(payload?.quality);
        if (ssResult.success) {
          sendJson(ws, 'screenshot.response', {
            image: ssResult.image,
            width: ssResult.width,
            height: ssResult.height,
            format: 'png',
            timestamp: Date.now(),
          });
        }
        result = ssResult;
        break;

      // System monitoring
      case 'system.monitor':
        const sysReport = await systemMonitor.getFullSystemReport();
        sendJson(ws, 'system.monitorResponse', sysReport);
        result = { success: true };
        break;

      // Device info
      case 'device.info':
        sendJson(ws, 'device.info', {
          hostname: os.hostname(),
          os: os.platform(),
          osVersion: os.release(),
          ip: config.host,
          port: config.port,
          uptime: Math.round(os.uptime()),
        });
        result = { success: true };
        break;

      default:
        result = { success: false, error: `Unknown command: ${type}` };
    }

    // Send generic response if not already handled
    if (result && !result.confirmRequest) {
      ws.send(createResponse(result.success !== false, result, result.error, requestId));
    }

  } catch (err: any) {
    console.error(`[DeskRemote] Error handling ${type}:`, err.message);
    ws.send(createResponse(false, null, `Command failed: ${err.message}`, requestId));
  }
}

// Start Server
export function startServer(customPort?: number): { wss: WebSocket.Server; close: (cb?: () => void) => void } {
  const listenPort = customPort || config.port;
  const certPath = process.env.DESKREMOTE_CERT_PATH || path.resolve(__dirname, '../certs/cert.pem');
  const keyPath = process.env.DESKREMOTE_KEY_PATH || path.resolve(__dirname, '../certs/key.pem');
  const useTls = fs.existsSync(certPath) && fs.existsSync(keyPath);

  let wss: WebSocket.Server;
  let httpServer: http.Server | https.Server | null = null;

  if (useTls) {
    httpServer = https.createServer({
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    });
    wss = new WebSocket.Server({ server: httpServer });
    httpServer.listen(listenPort, '0.0.0.0');
  } else {
    wss = new WebSocket.Server({ port: listenPort, host: '0.0.0.0' });
  }

  const protocol = useTls ? 'wss' : 'ws';

  const allIps = getAllLocalIPs();
  const primaryIp = allIps[0]?.address || config.host;
  const otherIps = allIps.filter(ip => ip.address !== primaryIp);

  console.log('');
  console.log('=============================================');
  console.log(`  DeskRemote Desktop Agent v${SERVER_VERSION}`);
  console.log('=============================================');
  console.log(`  📡 Server (LAN):     ${protocol}://${primaryIp}:${listenPort}`);
  if (otherIps.length > 0) {
    console.log('  📡 Other Adapters:');
    for (const o of otherIps) {
      console.log(`     • ${o.name}: ${protocol}://${o.address}:${listenPort} ${o.isVirtual ? '(Virtual)' : ''}`);
    }
  }
  console.log(`  🔑 Security PIN:     ${config.pin}`);
  console.log(`  🖥️  Host:            ${os.hostname()}`);
  console.log(`  💻 OS:              Windows ${os.release()}`);
  console.log(`  🔒 Security:        ${useTls ? 'TLS/WSS Encrypted' : 'Local Network (Standard)'}`);
  console.log('=============================================');
  console.log(`  👉 In mobile app, enter IP: ${primaryIp} and PIN: ${config.pin}`);
  console.log('=============================================');
  try {
    const qrData = JSON.stringify({ host: primaryIp, port: listenPort, pin: config.pin });
    qrcode.generate(qrData, { small: true }, (qr: string) => {
      console.log('\n  📲 Scan to Pair:');
      console.log(qr);
    });
  } catch {}
  console.log('  Waiting for connections...\n');

  wss.on('connection', (ws: WebSocket.WebSocket, req) => {
    const clientIP = req.socket.remoteAddress || 'unknown';
    console.log(`[DeskRemote] Client connected from ${clientIP}`);

    ws.on('message', (data: WebSocket.Data) => {
      const raw = data.toString();
      handleMessage(ws, raw).catch(err => {
        console.error('[DeskRemote] Message handling error:', err);
        ws.send(createResponse(false, null, 'Internal server error'));
      });
    });

    ws.on('close', () => {
      const token = connectionTokens.get(ws);
      if (token) {
        authManager.revokeSession(token);
        connectionTokens.delete(ws);
      }
      console.log(`[DeskRemote] Client disconnected: ${clientIP}`);
    });

    ws.on('error', (err) => {
      console.error(`[DeskRemote] WebSocket error from ${clientIP}:`, err.message);
    });

    // Send initial ping/pong
    sendJson(ws, 'pong', { timestamp: Date.now(), serverTimestamp: Date.now() });
  });

  wss.on('error', (err) => {
    console.error('[DeskRemote] Server error:', err.message);
  });

  return {
    wss,
    close: (cb?: () => void) => {
      wss.close(() => {
        if (httpServer) {
          httpServer.close(cb);
        } else if (cb) {
          cb();
        }
      });
    },
  };
}

if (require.main === module) {
  const server = startServer();
  process.on('SIGINT', () => {
    console.log('\n[DeskRemote] Shutting down DeskRemote Agent...');
    nativeInput.stop();
    server.close(() => process.exit(0));
  });
}
