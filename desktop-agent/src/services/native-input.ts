import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

class NativeInputManager {
  private process: ChildProcessWithoutNullStreams | null = null;
  private isAvailable: boolean = false;
  private binPath: string;

  constructor() {
    this.binPath = path.resolve(__dirname, '../../bin/deskremote-input.exe');
    this.init();
  }

  private init(): void {
    if (!fs.existsSync(this.binPath)) {
      console.log('[NativeInput] Native binary not found at', this.binPath, '- will use PowerShell fallback');
      this.isAvailable = false;
      return;
    }

    try {
      this.process = spawn(this.binPath, [], { windowsHide: true });
      this.isAvailable = true;

      this.process.stdout.on('data', (data) => {
        // Output from native bridge
      });

      this.process.stderr.on('data', (data) => {
        console.error('[NativeInput] Stderr:', data.toString());
      });

      this.process.on('close', (code) => {
        console.log(`[NativeInput] Process closed with code ${code}, restarting...`);
        this.isAvailable = false;
        setTimeout(() => this.init(), 1000);
      });

      this.process.on('error', (err) => {
        console.error('[NativeInput] Process error:', err.message);
        this.isAvailable = false;
      });

      console.log('[NativeInput] High-speed native input engine active');
    } catch (err: any) {
      console.error('[NativeInput] Failed to spawn native bridge:', err.message);
      this.isAvailable = false;
    }
  }

  private sendCommand(cmd: string): boolean {
    if (!this.isAvailable || !this.process || !this.process.stdin.writable) {
      return false;
    }
    try {
      this.process.stdin.write(cmd + '\n');
      return true;
    } catch {
      return false;
    }
  }

  get available(): boolean {
    return this.isAvailable;
  }

  move(dx: number, dy: number, sensitivity: number = 1.0): boolean {
    return this.sendCommand(`m ${Math.round(dx)} ${Math.round(dy)} ${sensitivity}`);
  }

  click(button: string = 'left', count: number = 1): boolean {
    return this.sendCommand(`c ${button} ${count}`);
  }

  mouseDown(button: string = 'left'): boolean {
    return this.sendCommand(`md ${button}`);
  }

  mouseUp(button: string = 'left'): boolean {
    return this.sendCommand(`mu ${button}`);
  }

  scroll(dy: number): boolean {
    return this.sendCommand(`s ${Math.round(dy * 120)}`);
  }

  keyPress(vk: number): boolean {
    return this.sendCommand(`kp ${vk}`);
  }

  keyDown(vk: number): boolean {
    return this.sendCommand(`kd ${vk}`);
  }

  keyUp(vk: number): boolean {
    return this.sendCommand(`ku ${vk}`);
  }

  typeText(text: string): boolean {
    const b64 = Buffer.from(text).toString('base64');
    return this.sendCommand(`t ${b64}`);
  }

  media(action: string): boolean {
    return this.sendCommand(`media ${action}`);
  }

  volUp(): boolean {
    return this.sendCommand('volup');
  }

  volDown(): boolean {
    return this.sendCommand('voldown');
  }

  volMute(): boolean {
    return this.sendCommand('volmute');
  }

  lock(): boolean {
    return this.sendCommand('lock');
  }

  stop(): void {
    if (this.process) {
      this.sendCommand('exit');
      this.process.kill();
      this.process = null;
    }
  }
}

export const nativeInput = new NativeInputManager();
