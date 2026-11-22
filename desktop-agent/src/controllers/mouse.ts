import { psScriptAsync } from '../utils/powershell';
import { nativeInput } from '../services/native-input';

const MOUSE_HELPER = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MouseHelper {
    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, IntPtr dwExtraInfo);
    
    public struct POINT { public int X; public int Y; }
    
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
    public const uint MOUSEEVENTF_WHEEL = 0x0800;
}
"@ -ErrorAction SilentlyContinue
`;

export async function handleMouseMove(deltaX: number, deltaY: number, sensitivity: number = 1.0): Promise<{ success: boolean }> {
  if (nativeInput.available) {
    nativeInput.move(deltaX, deltaY, sensitivity);
    return { success: true };
  }

  const script = `
${MOUSE_HELPER}
$pos = New-Object MouseHelper+POINT
[MouseHelper]::GetCursorPos([ref]$pos) | Out-Null
$newX = $pos.X + [int](${deltaX} * ${sensitivity})
$newY = $pos.Y + [int](${deltaY} * ${sensitivity})
[MouseHelper]::SetCursorPos($newX, $newY) | Out-Null
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true };
}

export async function handleMouseClick(button: string = 'left', count: number = 1): Promise<{ success: boolean }> {
  if (nativeInput.available) {
    nativeInput.click(button, count);
    return { success: true };
  }

  let downFlag: string, upFlag: string;
  switch (button) {
    case 'right':
      downFlag = '[MouseHelper]::MOUSEEVENTF_RIGHTDOWN';
      upFlag = '[MouseHelper]::MOUSEEVENTF_RIGHTUP';
      break;
    case 'middle':
      downFlag = '[MouseHelper]::MOUSEEVENTF_MIDDLEDOWN';
      upFlag = '[MouseHelper]::MOUSEEVENTF_MIDDLEUP';
      break;
    default:
      downFlag = '[MouseHelper]::MOUSEEVENTF_LEFTDOWN';
      upFlag = '[MouseHelper]::MOUSEEVENTF_LEFTUP';
  }

  const clicks = Math.min(Math.max(count, 1), 3);
  let clickScript = '';
  for (let i = 0; i < clicks; i++) {
    clickScript += `
[MouseHelper]::mouse_event(${downFlag}, 0, 0, 0, [IntPtr]::Zero)
[MouseHelper]::mouse_event(${upFlag}, 0, 0, 0, [IntPtr]::Zero)
`;
  }

  const script = `
${MOUSE_HELPER}
${clickScript}
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true };
}

export async function handleMouseScroll(deltaX: number, deltaY: number): Promise<{ success: boolean }> {
  if (nativeInput.available) {
    nativeInput.scroll(deltaY);
    return { success: true };
  }

  const scrollAmount = Math.round(deltaY * 120);
  const script = `
${MOUSE_HELPER}
[MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_WHEEL, 0, 0, ${scrollAmount}, [IntPtr]::Zero)
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true };
}

let isDragging = false;

export async function handleMouseDrag(action: string, deltaX?: number, deltaY?: number, button: string = 'left'): Promise<{ success: boolean }> {
  if (nativeInput.available) {
    if (action === 'start') {
      isDragging = true;
      nativeInput.mouseDown(button);
    } else if (action === 'move' && isDragging && deltaX !== undefined && deltaY !== undefined) {
      nativeInput.move(deltaX, deltaY);
    } else if (action === 'end') {
      isDragging = false;
      nativeInput.mouseUp(button);
    }
    return { success: true };
  }

  const downFlag = button === 'right' ? '[MouseHelper]::MOUSEEVENTF_RIGHTDOWN' : '[MouseHelper]::MOUSEEVENTF_LEFTDOWN';
  const upFlag = button === 'right' ? '[MouseHelper]::MOUSEEVENTF_RIGHTUP' : '[MouseHelper]::MOUSEEVENTF_LEFTUP';

  if (action === 'start') {
    isDragging = true;
    const script = `
${MOUSE_HELPER}
[MouseHelper]::mouse_event(${downFlag}, 0, 0, 0, [IntPtr]::Zero)
Write-Output "OK"
`;
    await psScriptAsync(script);
  } else if (action === 'move' && isDragging && deltaX !== undefined && deltaY !== undefined) {
    await handleMouseMove(deltaX, deltaY);
  } else if (action === 'end') {
    isDragging = false;
    const script = `
${MOUSE_HELPER}
[MouseHelper]::mouse_event(${upFlag}, 0, 0, 0, [IntPtr]::Zero)
Write-Output "OK"
`;
    await psScriptAsync(script);
  }

  return { success: true };
}
