import { psScriptAsync } from '../utils/powershell';

export interface WindowEntry {
  id: number;
  title: string;
  processName: string;
  isMinimized: boolean;
  isMaximized: boolean;
}

export async function listWindows(): Promise<WindowEntry[]> {
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;
public class WindowLister {
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool IsZoomed(IntPtr hWnd);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
}
"@ -ErrorAction SilentlyContinue

$windows = @()
Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -ne '' } | ForEach-Object {
    $hwnd = $_.MainWindowHandle
    $windows += @{
        id = [int64]$hwnd
        title = $_.MainWindowTitle
        processName = $_.ProcessName
        isMinimized = [WindowLister]::IsIconic($hwnd)
        isMaximized = [WindowLister]::IsZoomed($hwnd)
    }
}
$windows | ConvertTo-Json -Compress
`;
  try {
    const result = await psScriptAsync(script);
    if (!result || result === '') return [];
    const parsed = JSON.parse(result);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export async function switchToWindow(id: number): Promise<{ success: boolean }> {
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinSwitch {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
}
"@ -ErrorAction SilentlyContinue
$hwnd = [IntPtr]::new(${id})
if ([WinSwitch]::IsIconic($hwnd)) {
    [WinSwitch]::ShowWindow($hwnd, 9) | Out-Null
}
[WinSwitch]::SetForegroundWindow($hwnd) | Out-Null
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true };
}

export async function minimizeWindow(id: number): Promise<{ success: boolean }> {
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinMin {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@ -ErrorAction SilentlyContinue
[WinMin]::ShowWindow([IntPtr]::new(${id}), 6) | Out-Null
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true };
}

export async function maximizeWindow(id: number): Promise<{ success: boolean }> {
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinMax {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool IsZoomed(IntPtr hWnd);
}
"@ -ErrorAction SilentlyContinue
$hwnd = [IntPtr]::new(${id})
if ([WinMax]::IsZoomed($hwnd)) {
    [WinMax]::ShowWindow($hwnd, 9) | Out-Null
} else {
    [WinMax]::ShowWindow($hwnd, 3) | Out-Null
}
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true };
}

export async function closeWindow(id: number): Promise<{ success: boolean }> {
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinClose {
    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    public const uint WM_CLOSE = 0x0010;
}
"@ -ErrorAction SilentlyContinue
[WinClose]::SendMessage([IntPtr]::new(${id}), [WinClose]::WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true };
}
