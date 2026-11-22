import { exec } from 'child_process';
import { AgentConfig } from '../config';
import { isAppAllowed, getAppPath } from '../security/authorization';
import { psScriptAsync } from '../utils/powershell';

export async function launchApp(name: string, config: AgentConfig): Promise<{ success: boolean; message: string }> {
  const appPath = getAppPath(name, config);
  if (!appPath) {
    return { success: false, message: `Application "${name}" is not in the allowed list` };
  }

  return new Promise((resolve) => {
    const cmd = `start "" "${appPath}"`;
    
    exec(cmd, { shell: 'cmd.exe', windowsHide: false }, (error) => {
      if (error) {
        resolve({ success: false, message: `Failed to launch: ${error.message}` });
      } else {
        resolve({ success: true, message: `Launched ${name}` });
      }
    });
  });
}

export async function closeApp(processName: string): Promise<{ success: boolean; message: string }> {
  try {
    await psScriptAsync(`Stop-Process -Name "${processName}" -Force -ErrorAction SilentlyContinue`);
    return { success: true, message: `Closed ${processName}` };
  } catch {
    return { success: false, message: `Failed to close ${processName}` };
  }
}

export async function listRunningApps(): Promise<Array<{ name: string; processName: string; pid: number; memoryMB: number }>> {
  try {
    const result = await psScriptAsync(`
Get-Process | Where-Object { $_.MainWindowTitle -ne '' } |
  Select-Object @{N='name';E={$_.MainWindowTitle}},
                @{N='processName';E={$_.ProcessName}},
                @{N='pid';E={$_.Id}},
                @{N='memoryMB';E={[Math]::Round($_.WorkingSet64/1MB, 1)}} |
  ConvertTo-Json -Compress
`);
    if (!result) return [];
    const parsed = JSON.parse(result);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}
