import { psScriptAsync } from '../utils/powershell';
import { nativeInput } from '../services/native-input';

const MEDIA_HELPER = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MediaKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);
    public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
    public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
    public const byte VK_MEDIA_PREV_TRACK = 0xB1;
    public const byte VK_MEDIA_STOP = 0xB2;
}
"@ -ErrorAction SilentlyContinue
`;

async function sendMediaKey(vkByte: string, nativeAction: string): Promise<{ success: boolean }> {
  if (nativeInput.available) {
    nativeInput.media(nativeAction);
    return { success: true };
  }

  const script = `
${MEDIA_HELPER}
[MediaKeys]::keybd_event([MediaKeys]::${vkByte}, 0, 0, [IntPtr]::Zero)
[MediaKeys]::keybd_event([MediaKeys]::${vkByte}, 0, 2, [IntPtr]::Zero)
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true };
}

export async function handlePlayPause(): Promise<{ success: boolean }> {
  return sendMediaKey('VK_MEDIA_PLAY_PAUSE', 'playpause');
}

export async function handleNext(): Promise<{ success: boolean }> {
  return sendMediaKey('VK_MEDIA_NEXT_TRACK', 'next');
}

export async function handlePrevious(): Promise<{ success: boolean }> {
  return sendMediaKey('VK_MEDIA_PREV_TRACK', 'prev');
}

export async function handleStop(): Promise<{ success: boolean }> {
  return sendMediaKey('VK_MEDIA_STOP', 'stop');
}

export async function getMediaState(): Promise<{ playing: boolean; title?: string; artist?: string }> {
  return { playing: false };
}
