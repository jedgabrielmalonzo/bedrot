import WebSocket from 'ws';
import { startServer, authManager, config } from './server';

async function runTests() {
  console.log('--- Starting DeskRemote Phase 1 & 2 Live Verification ---');
  
  const testPort = 8798;
  const server = startServer(testPort);
  const validPin = authManager.getPin();
  const wsUrl = `ws://127.0.0.1:${testPort}`;
  
  console.log(`Server PIN is: ${validPin}`);
  console.log(`Connecting test client to ${wsUrl}...`);
  
  const ws = new WebSocket(wsUrl);

  const testResults: Record<string, boolean> = {
    'WebSocket connection established': false,
    'Received initial keepalive pong': false,
    'Unauthenticated command rejected': false,
    'Invalid PIN rejected': false,
    'Valid PIN authenticated successfully': false,
    'Received device.info upon auth': false,
    'Authenticated command (ping) succeeded': false,
    'Authenticated command (device.info) succeeded': false,
    'Authenticated command (audio.getState) succeeded': false,
    'Authenticated command (system.monitor) succeeded': false,
  };

  let sessionToken: string | null = null;
  let triedInvalidPin = false;
  let sentValidPin = false;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('Test timed out. Current test results:', testResults);
      reject(new Error('Test timed out after 15 seconds'));
    }, 15000);

    ws.on('open', () => {
      testResults['WebSocket connection established'] = true;
      console.log('✓ Test Client Connected');

      // Test 1: Try unauthenticated command
      ws.send(JSON.stringify({
        type: 'mouse.move',
        payload: { deltaX: 10, deltaY: 10 },
        id: 'test-unauth-1',
      }));
    });

    ws.on('message', (data: WebSocket.Data) => {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'pong' && !sessionToken) {
        testResults['Received initial keepalive pong'] = true;
      }

      if (msg.type === 'command.response' && msg.payload?.requestId === 'test-unauth-1') {
        if (!msg.payload.success && msg.payload.error === 'Not authenticated') {
          testResults['Unauthenticated command rejected'] = true;
          console.log('✓ Unauthenticated command correctly rejected');

          // Test 2: Try invalid PIN
          triedInvalidPin = true;
          ws.send(JSON.stringify({
            type: 'auth.request',
            payload: {
              pin: '000000_INVALID',
              deviceId: 'test-device-id',
              deviceName: 'Test Phone',
              platform: 'android',
            },
          }));
        }
      }

      if (msg.type === 'auth.response') {
        if (!msg.payload.success) {
          testResults['Invalid PIN rejected'] = true;
          console.log('✓ Invalid PIN correctly rejected');

          if (!sentValidPin) {
            sentValidPin = true;
            // Test 3: Try valid PIN
            console.log(`Sending valid PIN: ${validPin}`);
            ws.send(JSON.stringify({
              type: 'auth.request',
              payload: {
                pin: validPin,
                deviceId: 'test-device-id',
                deviceName: 'Test Phone',
                platform: 'android',
              },
            }));
          }
        } else {
          testResults['Valid PIN authenticated successfully'] = true;
          sessionToken = msg.payload.token;
          console.log('✓ Authenticated with token:', sessionToken);

          // Test 4: Send authenticated ping
          ws.send(JSON.stringify({
            type: 'ping',
            token: sessionToken,
            payload: { timestamp: Date.now() },
          }));

          // Test 5: Send authenticated device.info request
          ws.send(JSON.stringify({
            type: 'device.info',
            token: sessionToken,
            payload: {},
            id: 'test-device-info',
          }));

          // Test 6: Send authenticated audio.getState request
          ws.send(JSON.stringify({
            type: 'audio.getState',
            token: sessionToken,
            payload: {},
            id: 'test-audio-state',
          }));

          // Test 7: Send authenticated system.monitor request
          ws.send(JSON.stringify({
            type: 'system.monitor',
            token: sessionToken,
            payload: {},
            id: 'test-sys-monitor',
          }));
        }
      }

      if (msg.type === 'device.info') {
        testResults['Received device.info upon auth'] = true;
        console.log('✓ Received device.info:', msg.payload.hostname, msg.payload.os);
      }

      if (msg.type === 'pong' && sessionToken) {
        testResults['Authenticated command (ping) succeeded'] = true;
      }

      if (msg.type === 'audio.state') {
        testResults['Authenticated command (audio.getState) succeeded'] = true;
        console.log('✓ Received audio.state: volume =', msg.payload.volume);
      }

      if (msg.type === 'system.monitorResponse') {
        testResults['Authenticated command (system.monitor) succeeded'] = true;
        console.log('✓ Received system.monitorResponse: CPU =', msg.payload.cpu?.usage + '%', 'RAM =', msg.payload.memory?.usagePercent + '%');
      }

      if (msg.type === 'command.response' && msg.payload?.requestId === 'test-device-info') {
        testResults['Authenticated command (device.info) succeeded'] = true;
      }

      // Check if all tests pass
      const allPassed = Object.values(testResults).every(v => v === true);
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

  console.log('\n=============================================');
  console.log('           TEST RESULTS SUMMARY              ');
  console.log('=============================================');
  let passCount = 0;
  for (const [testName, passed] of Object.entries(testResults)) {
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName}`);
    if (passed) passCount++;
  }
  console.log('=============================================');
  console.log(`Total: ${passCount} / ${Object.keys(testResults).length} passed\n`);

  if (passCount !== Object.keys(testResults).length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
