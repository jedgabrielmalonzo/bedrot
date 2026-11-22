import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';

const BIN_PATH = path.resolve(__dirname, '../../bin/deskremote-screen.exe');

export async function captureScreenshot(quality: number = 65): Promise<{
  success: boolean;
  image?: string;
  width?: number;
  height?: number;
  error?: string;
}> {
  const q = Math.max(10, Math.min(100, Math.round(quality || 65)));
  const tmpFile = path.join(os.tmpdir(), `deskremote-ss-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.jpg`);

  return new Promise((resolve) => {
    // If native compiled binary exists, use it
    if (fs.existsSync(BIN_PATH)) {
      execFile(BIN_PATH, [tmpFile, q.toString()], { windowsHide: true, timeout: 5000 }, async (err, stdout) => {
        if (err) {
          return resolve({ success: false, error: `Screenshot execution failed: ${err.message}` });
        }

        const out = stdout.trim();
        if (out.startsWith('ERROR')) {
          return resolve({ success: false, error: out });
        }

        try {
          const [wStr, hStr] = out.split('|');
          const buffer = await fs.promises.readFile(tmpFile);
          await fs.promises.unlink(tmpFile).catch(() => {});

          resolve({
            success: true,
            image: buffer.toString('base64'),
            width: parseInt(wStr, 10) || 1920,
            height: parseInt(hStr, 10) || 1080,
          });
        } catch (readErr: any) {
          resolve({ success: false, error: `Failed to read screenshot file: ${readErr.message}` });
        }
      });
    } else {
      resolve({ success: false, error: 'Screen capture binary not found' });
    }
  });
}
