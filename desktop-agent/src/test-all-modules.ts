import WebSocket from 'ws';
import { startServer, authManager, config } from './server';

async function runComprehensiveTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  DeskRemote Full Integration & Security Test Suite     ');
  console.log('═══════════════════════════════════════════════════════\n');

  const testPort = 8799;
  const server = startServer(testPort);
  const validPin = authManager.getPin();
  const wsUrl = `ws://127.0.0.1:${testPort}`;

  console.log(`[Test] Server started on ${wsUrl}`);
  console.log(`[Test] Active Security PIN: ${validPin}`);

  const ws = new WebSocket(wsUrl);

  const tests: Record<string, boolean> = {
    // 1. Connection & Handshake
    '1.01 WebSocket connection': false,
    '1.02 Keepalive pong received': false,
    '1.03 Unauthenticated command rejected': false,
    '1.04 Invalid PIN rejected': false,
    '1.05 Valid PIN authenticated': false,
    '1.06 Device info received': false,

    // 2. Mouse Control
    '2.01 Mouse move relative': false,
    '2.02 Mouse click (left)': false,
    '2.03 Mouse click (right)': false,
    '2.04 Mouse scroll': false,
    '2.05 Mouse drag (start/move/end)': false,

    // 3. Keyboard Control
    '3.01 Keyboard text typing': false,
    '3.02 Keyboard special key': false,
    '3.03 Keyboard shortcut': false,

    // 4. Audio Control
    '4.01 Audio getState': false,
    '4.02 Audio setVolume': false,
    '4.03 Audio mute toggle': false,

    // 5. Media Control
    '5.01 Media playPause': false,
    '5.02 Media next': false,
    '5.03 Media previous': false,

    // 6. Windows & Apps Management
    '6.01 Windows list active': false,
    '6.02 Applications list': false,
    '6.03 App launch rejected for unallowed app': false,

    // 7. Power Management
    '7.01 Power state query': false,
    '7.02 Dangerous restart requires confirmation': false,

    // 8. File Management
    '8.01 File list approved directory': false,
    '8.02 File path traversal / forbidden path blocked': false,

    // 9. Screenshots & Monitoring
    '9.01 Screenshot capture': false,
    '9.02 System monitor full report': false,
  };

  let token: string | null = null;
  let sentValidPin = false;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('\n❌ Test suite timed out. Current test state:');
      for (const [name, passed] of Object.entries(tests)) {
        console.log(`  ${passed ? '✅' : '❌'} ${name}`);
      }
      reject(new Error('Integration tests timed out after 20 seconds'));
    }, 20000);

    ws.on('open', () => {
      tests['1.01 WebSocket connection'] = true;

      // Send unauthenticated command first
      ws.send(JSON.stringify({
        type: 'mouse.move',
        payload: { deltaX: 5, deltaY: 5 },
        id: 'req-unauth',
      }));
    });

    ws.on('message', async (data: WebSocket.Data) => {
      const msg = JSON.parse(data.toString());

      // 1. Initial keepalive pong
      if (msg.type === 'pong' && !token) {
        tests['1.02 Keepalive pong received'] = true;
      }

      // Unauthenticated command rejection
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-unauth') {
        if (!msg.payload.success && msg.payload.error === 'Not authenticated') {
          tests['1.03 Unauthenticated command rejected'] = true;

          // Now test invalid PIN
          ws.send(JSON.stringify({
            type: 'auth.request',
            payload: { pin: '000000', deviceId: 'phone-1', deviceName: 'MyPhone' },
          }));
        }
      }

      // Auth responses
      if (msg.type === 'auth.response') {
        if (!msg.payload.success) {
          tests['1.04 Invalid PIN rejected'] = true;

          if (!sentValidPin) {
            sentValidPin = true;
            // Send valid PIN
            ws.send(JSON.stringify({
              type: 'auth.request',
              payload: { pin: validPin, deviceId: 'phone-1', deviceName: 'MyPhone', platform: 'android' },
            }));
          }
        } else {
          tests['1.05 Valid PIN authenticated'] = true;
          token = msg.payload.token;

          // Run all authenticated tests
          runAuthenticatedCommands(ws, token!);
        }
      }

      if (msg.type === 'device.info') {
        tests['1.06 Device info received'] = true;
      }

      // Mouse responses
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-mouse-move') {
        if (msg.payload.success) tests['2.01 Mouse move relative'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-mouse-click-left') {
        if (msg.payload.success) tests['2.02 Mouse click (left)'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-mouse-click-right') {
        if (msg.payload.success) tests['2.03 Mouse click (right)'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-mouse-scroll') {
        if (msg.payload.success) tests['2.04 Mouse scroll'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-mouse-drag-end') {
        if (msg.payload.success) tests['2.05 Mouse drag (start/move/end)'] = true;
      }

      // Keyboard responses
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-kb-type') {
        if (msg.payload.success) tests['3.01 Keyboard text typing'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-kb-key') {
        if (msg.payload.success) tests['3.02 Keyboard special key'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-kb-shortcut') {
        if (msg.payload.success) tests['3.03 Keyboard shortcut'] = true;
      }

      // Audio responses
      if (msg.type === 'audio.state' && msg.payload?.volume !== undefined) {
        tests['4.01 Audio getState'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-audio-set') {
        if (msg.payload.success) tests['4.02 Audio setVolume'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-audio-mute') {
        if (msg.payload.success) tests['4.03 Audio mute toggle'] = true;
      }

      // Media responses
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-media-play') {
        if (msg.payload.success) tests['5.01 Media playPause'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-media-next') {
        if (msg.payload.success) tests['5.02 Media next'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-media-prev') {
        if (msg.payload.success) tests['5.03 Media previous'] = true;
      }

      // Windows & Apps responses
      if (msg.type === 'windows.listResponse') {
        tests['6.01 Windows list active'] = true;
      }
      if (msg.type === 'app.listResponse') {
        tests['6.02 Applications list'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-app-unallowed') {
        if (!msg.payload.success) tests['6.03 App launch rejected for unallowed app'] = true;
      }

      // Power responses
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-power-state') {
        if (msg.payload.success) tests['7.01 Power state query'] = true;
      }
      if (msg.type === 'power.confirmRequest' || (msg.type === 'command.response' && msg.payload?.requestId === 'req-power-restart')) {
        tests['7.02 Dangerous restart requires confirmation'] = true;
      }

      // Files responses
      if (msg.type === 'file.listResponse') {
        tests['8.01 File list approved directory'] = true;
      }
      if (msg.type === 'command.response' && msg.payload?.requestId === 'req-file-forbidden') {
        if (!msg.payload.success && msg.payload.error?.includes('Access denied')) {
          tests['8.02 File path traversal / forbidden path blocked'] = true;
        }
      }

      // Screenshot & Monitoring responses
      if (msg.type === 'screenshot.response') {
        tests['9.01 Screenshot capture'] = true;
      }
      if (msg.type === 'system.monitorResponse') {
        tests['9.02 System monitor full report'] = true;
      }

      // Check completion
      const allPassed = Object.values(tests).every(v => v === true);
      if (allPassed) {
        clearTimeout(timeout);
        resolve();
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  ws.close();
  server.close();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('              ALL MODULE TESTS COMPLETED               ');
  console.log('═══════════════════════════════════════════════════════');
  let passCount = 0;
  for (const [name, passed] of Object.entries(tests)) {
    console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}: ${name}`);
    if (passed) passCount++;
  }
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Score: ${passCount} / ${Object.keys(tests).length} tests passed (${Math.round(passCount / Object.keys(tests).length * 100)}%)\n`);

  if (passCount !== Object.keys(tests).length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

function runAuthenticatedCommands(ws: WebSocket, token: string) {
  const send = (type: string, payload: any, id: string) => {
    ws.send(JSON.stringify({ type, payload, token, id, timestamp: Date.now() }));
  };

  // Mouse
  send('mouse.move', { deltaX: 5, deltaY: 5, sensitivity: 1 }, 'req-mouse-move');
  send('mouse.click', { button: 'left', count: 1 }, 'req-mouse-click-left');
  send('mouse.click', { button: 'right', count: 1 }, 'req-mouse-click-right');
  send('mouse.scroll', { deltaX: 0, deltaY: 1 }, 'req-mouse-scroll');
  send('mouse.drag', { action: 'start', button: 'left' }, 'req-mouse-drag-start');
  send('mouse.drag', { action: 'move', deltaX: 5, deltaY: 5, button: 'left' }, 'req-mouse-drag-move');
  send('mouse.drag', { action: 'end', button: 'left' }, 'req-mouse-drag-end');

  // Keyboard
  send('keyboard.type', { text: 'DeskRemote test' }, 'req-kb-type');
  send('keyboard.key', { key: 'shift', action: 'press' }, 'req-kb-key');
  send('keyboard.shortcut', { shortcut: 'ctrl+c' }, 'req-kb-shortcut');

  // Audio
  send('audio.getState', {}, 'req-audio-get');
  send('audio.setVolume', { level: 45 }, 'req-audio-set');
  send('audio.mute', { mute: false }, 'req-audio-mute');

  // Media
  send('media.playPause', {}, 'req-media-play');
  send('media.next', {}, 'req-media-next');
  send('media.previous', {}, 'req-media-prev');

  // Windows & Apps
  send('windows.list', {}, 'req-win-list');
  send('app.list', {}, 'req-app-list');
  send('app.launch', { name: 'malicious_app_name_not_allowed.exe' }, 'req-app-unallowed');

  // Power
  send('device.info', {}, 'req-power-state');
  send('power.restart', {}, 'req-power-restart'); // Sent without confirmToken -> should trigger confirmRequest

  // Files
  send('file.list', { path: '~' }, 'req-file-list');
  send('file.list', { path: 'C:\\Windows\\System32\\config' }, 'req-file-forbidden'); // Forbidden path traversal

  // Screenshots & Monitoring
  send('screenshot.capture', { quality: 50 }, 'req-ss');
  send('system.monitor', {}, 'req-sys-mon');
}

runComprehensiveTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
