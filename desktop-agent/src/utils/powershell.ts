import { execSync, exec } from 'child_process';

/**
 * Execute a PowerShell command synchronously.
 * Returns the stdout output.
 */
export function psExec(command: string): string {
  try {
    const result = execSync(
      `powershell.exe -NoProfile -NonInteractive -Command "${command.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 10000, windowsHide: true }
    );
    return result.trim();
  } catch (err: any) {
    throw new Error(`PowerShell command failed: ${err.message}`);
  }
}

/**
 * Execute a PowerShell command asynchronously.
 */
export function psExecAsync(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `powershell.exe -NoProfile -NonInteractive -Command "${command.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 10000, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`PowerShell command failed: ${error.message}`));
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}

/**
 * Execute a PowerShell script block (multi-line).
 */
export function psScript(script: string): string {
  try {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const result = execSync(
      `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { encoding: 'utf8', timeout: 15000, windowsHide: true }
    );
    return result.trim();
  } catch (err: any) {
    throw new Error(`PowerShell script failed: ${err.message}`);
  }
}

/**
 * Execute a PowerShell script block asynchronously.
 */
export function psScriptAsync(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    exec(
      `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { encoding: 'utf8', timeout: 15000, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`PowerShell script failed: ${error.message}`));
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}
