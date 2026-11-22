import { psScriptAsync } from '../utils/powershell';
import { nativeInput } from '../services/native-input';

export async function handleSetVolume(level: number): Promise<{ success: boolean; volume: number }> {
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  const volumeFloat = (clamped / 100).toFixed(2);
  
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
    int NotImpl1();
    int NotImpl2();
    int GetChannelCount(out int pnChannelCount);
    int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
    int GetMasterVolumeLevelScalar(out float pfLevel);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    int Activate(ref System.Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class AudioManager {
    public static void SetVolume(float level) {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        IMMDevice device;
        enumerator.GetDefaultAudioEndpoint(0, 1, out device);
        Guid iid = typeof(IAudioEndpointVolume).GUID;
        object o;
        device.Activate(ref iid, 1, IntPtr.Zero, out o);
        var volume = (IAudioEndpointVolume)o;
        volume.SetMasterVolumeLevelScalar(level, Guid.Empty);
    }
    public static float GetVolume() {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        IMMDevice device;
        enumerator.GetDefaultAudioEndpoint(0, 1, out device);
        Guid iid = typeof(IAudioEndpointVolume).GUID;
        object o;
        device.Activate(ref iid, 1, IntPtr.Zero, out o);
        var volume = (IAudioEndpointVolume)o;
        float level;
        volume.GetMasterVolumeLevelScalar(out level);
        return level;
    }
}
"@ -ErrorAction SilentlyContinue
[AudioManager]::SetVolume(${volumeFloat})
Write-Output "OK:$([Math]::Round([AudioManager]::GetVolume() * 100))"
`;

  try {
    const result = await psScriptAsync(script);
    const parts = result.split(':');
    return { success: true, volume: parseInt(parts[1]) || clamped };
  } catch {
    // Fallback: use nircmd-style approach through PowerShell keystrokes
    const steps = Math.round(clamped / 2);
    // Set to 0 first, then step up
    await psScriptAsync(`
$obj = New-Object -ComObject WScript.Shell
1..50 | ForEach-Object { $obj.SendKeys([char]174) }
1..${steps} | ForEach-Object { $obj.SendKeys([char]175) }
Write-Output "OK"
`);
    return { success: true, volume: clamped };
  }
}

export async function handleMute(mute: boolean): Promise<{ success: boolean; muted: boolean }> {
  if (nativeInput.available) {
    nativeInput.volMute();
    return { success: true, muted: mute };
  }
  // Send mute media key
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class AudioKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);
}
"@ -ErrorAction SilentlyContinue
[AudioKeys]::keybd_event(0xAD, 0, 0, [IntPtr]::Zero)
[AudioKeys]::keybd_event(0xAD, 0, 2, [IntPtr]::Zero)
Write-Output "OK"
`;
  await psScriptAsync(script);
  return { success: true, muted: mute };
}

export async function getAudioState(): Promise<{ volume: number; muted: boolean; deviceName: string }> {
  try {
    const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
    int NotImpl1();
    int NotImpl2();
    int GetChannelCount(out int pnChannelCount);
    int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
    int GetMasterVolumeLevelScalar(out float pfLevel);
    int SetMasterVolumeLevelScalarInternal(float fLevel, System.Guid pguidEventContext);
    int GetMasterVolumeLevelScalarInternal(out float pfLevel);
    int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, System.Guid pguidEventContext);
    int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    int Activate(ref System.Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class AudioInfo {
    public static string GetInfo() {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        IMMDevice device;
        enumerator.GetDefaultAudioEndpoint(0, 1, out device);
        Guid iid = typeof(IAudioEndpointVolume).GUID;
        object o;
        device.Activate(ref iid, 1, IntPtr.Zero, out o);
        var volume = (IAudioEndpointVolume)o;
        float level;
        volume.GetMasterVolumeLevelScalar(out level);
        bool muted;
        volume.GetMute(out muted);
        return level + "|" + muted;
    }
}
"@ -ErrorAction SilentlyContinue
Write-Output ([AudioInfo]::GetInfo())
`;
    const result = await psScriptAsync(script);
    const parts = result.split('|');
    return {
      volume: Math.round(parseFloat(parts[0]) * 100),
      muted: parts[1] === 'True',
      deviceName: 'Default Audio Device',
    };
  } catch {
    return { volume: 50, muted: false, deviceName: 'Unknown' };
  }
}
