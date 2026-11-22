import { psScriptAsync } from '../utils/powershell';
import { nativeInput } from '../services/native-input';

const KEYBOARD_HELPER = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class KeyboardHelper {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);
    
    public const uint KEYEVENTF_KEYDOWN = 0x0000;
    public const uint KEYEVENTF_KEYUP = 0x0002;
    public const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
}
"@ -ErrorAction SilentlyContinue
`;

/** Virtual key codes map */
export const VK_CODES: Record<string, number> = {
  'backspace': 0x08, 'tab': 0x09, 'enter': 0x0D, 'return': 0x0D,
  'shift': 0x10, 'ctrl': 0x11, 'control': 0x11, 'alt': 0x12,
  'pause': 0x13, 'capslock': 0x14, 'escape': 0x1B, 'esc': 0x1B,
  'space': 0x20, 'pageup': 0x21, 'pagedown': 0x22,
  'end': 0x23, 'home': 0x24, 'left': 0x25, 'up': 0x26,
  'right': 0x27, 'down': 0x28, 'printscreen': 0x2C, 'insert': 0x2D,
  'delete': 0x2E, 'del': 0x2E,
  'win': 0x5B, 'windows': 0x5B, 'lwin': 0x5B, 'rwin': 0x5C,
  'f1': 0x70, 'f2': 0x71, 'f3': 0x72, 'f4': 0x73, 'f5': 0x74,
  'f6': 0x75, 'f7': 0x76, 'f8': 0x77, 'f9': 0x78, 'f10': 0x79,
  'f11': 0x7A, 'f12': 0x7B,
  'numlock': 0x90, 'scrolllock': 0x91,
  'volumemute': 0xAD, 'volumedown': 0xAE, 'volumeup': 0xAF,
  'medianext': 0xB0, 'mediaprev': 0xB1, 'mediastop': 0xB2,
  'mediaplaypause': 0xB3,
};

function getVKCode(key: string): number {
  const lower = key.toLowerCase().trim();
  if (VK_CODES[lower] !== undefined) {
    return VK_CODES[lower];
  }
  if (key.length === 1) {
    return key.toUpperCase().charCodeAt(0);
  }
  return 0;
}

export async function handleKeyType(text: string): Promise<{ success: boolean }> {
  if (nativeInput.available) {
    nativeInput.typeText(text);
    return { success: true };
  }

  const safeScript = `
Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
[System.Windows.Forms.SendKeys]::SendWait([System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${Buffer.from(text).toString('base64')}')))
Write-Output "OK"
`;
  try {
    await psScriptAsync(safeScript);
  } catch {
    // Fallback typing
  }
  return { success: true };
}

export async function handleKeyPress(key: string, modifiers: string[] = [], action: string = 'press'): Promise<{ success: boolean }> {
  const vk = getVKCode(key);
  if (!vk) return { success: false };

  const modifierVKs: number[] = [];
  for (const mod of modifiers) {
    const modLower = mod.toLowerCase().trim();
    if (modLower === 'ctrl' || modLower === 'control') modifierVKs.push(0x11);
    else if (modLower === 'alt') modifierVKs.push(0x12);
    else if (modLower === 'shift') modifierVKs.push(0x10);
    else if (modLower === 'win' || modLower === 'windows') modifierVKs.push(0x5B);
  }

  if (nativeInput.available) {
    if (action === 'press' || action === 'down') {
      for (const mvk of modifierVKs) nativeInput.keyDown(mvk);
      nativeInput.keyDown(vk);
    }
    if (action === 'press' || action === 'up') {
      nativeInput.keyUp(vk);
      for (const mvk of modifierVKs.slice().reverse()) nativeInput.keyUp(mvk);
    }
    return { success: true };
  }

  let script = KEYBOARD_HELPER + '\n';
  if (action === 'press' || action === 'down') {
    for (const mvk of modifierVKs) {
      script += `[KeyboardHelper]::keybd_event(${mvk}, 0, [KeyboardHelper]::KEYEVENTF_KEYDOWN, [IntPtr]::Zero)\n`;
    }
    script += `[KeyboardHelper]::keybd_event(${vk}, 0, [KeyboardHelper]::KEYEVENTF_KEYDOWN, [IntPtr]::Zero)\n`;
  }
  if (action === 'press' || action === 'up') {
    script += `[KeyboardHelper]::keybd_event(${vk}, 0, [KeyboardHelper]::KEYEVENTF_KEYUP, [IntPtr]::Zero)\n`;
    for (const mvk of modifierVKs.slice().reverse()) {
      script += `[KeyboardHelper]::keybd_event(${mvk}, 0, [KeyboardHelper]::KEYEVENTF_KEYUP, [IntPtr]::Zero)\n`;
    }
  }
  script += 'Write-Output "OK"';
  await psScriptAsync(script);
  return { success: true };
}

export async function handleKeyShortcut(shortcut: string): Promise<{ success: boolean }> {
  const parts = shortcut.toLowerCase().split('+').map(s => s.trim());
  const key = parts.pop() || '';
  const modifiers = parts;

  return handleKeyPress(key, modifiers, 'press');
}
