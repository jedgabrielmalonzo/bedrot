using System;
using System.IO;
using System.Text;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace DeskRemote
{
    class InputBridge
    {
        [DllImport("user32.dll")]
        static extern bool GetCursorPos(out POINT lpPoint);

        [DllImport("user32.dll")]
        static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, IntPtr dwExtraInfo);

        [DllImport("user32.dll")]
        static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, IntPtr dwExtraInfo);

        [DllImport("user32.dll")]
        static extern bool LockWorkStation();

        public struct POINT
        {
            public int X;
            public int Y;
        }

        const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        const uint MOUSEEVENTF_LEFTUP = 0x0004;
        const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
        const uint MOUSEEVENTF_WHEEL = 0x0800;

        const uint KEYEVENTF_KEYDOWN = 0x0000;
        const uint KEYEVENTF_KEYUP = 0x0002;

        const byte VK_VOLUME_MUTE = 0xAD;
        const byte VK_VOLUME_DOWN = 0xAE;
        const byte VK_VOLUME_UP = 0xAF;
        const byte VK_MEDIA_NEXT_TRACK = 0xB0;
        const byte VK_MEDIA_PREV_TRACK = 0xB1;
        const byte VK_MEDIA_STOP = 0xB2;
        const byte VK_MEDIA_PLAY_PAUSE = 0xB3;

        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine("DESKREMOTE_INPUT_READY");
            Console.Out.Flush();

            string line;
            while ((line = Console.ReadLine()) != null)
            {
                line = line.Trim();
                if (string.IsNullOrEmpty(line)) continue;

                try
                {
                    string[] parts = line.Split(' ');
                    string cmd = parts[0].ToLowerInvariant();

                    switch (cmd)
                    {
                        case "ping":
                            Console.WriteLine("PONG");
                            break;

                        case "m": // move: m deltaX deltaY [sensitivity]
                            if (parts.Length >= 3)
                            {
                                int dx = int.Parse(parts[1]);
                                int dy = int.Parse(parts[2]);
                                float sens = parts.Length >= 4 ? float.Parse(parts[3]) : 1.0f;
                                POINT pt;
                                GetCursorPos(out pt);
                                SetCursorPos(pt.X + (int)(dx * sens), pt.Y + (int)(dy * sens));
                                Console.WriteLine("OK");
                            }
                            break;

                        case "c": // click: c left|right|middle [count]
                            string btn = parts.Length >= 2 ? parts[1].ToLowerInvariant() : "left";
                            int count = parts.Length >= 3 ? int.Parse(parts[2]) : 1;
                            uint down = MOUSEEVENTF_LEFTDOWN;
                            uint up = MOUSEEVENTF_LEFTUP;
                            if (btn == "right") { down = MOUSEEVENTF_RIGHTDOWN; up = MOUSEEVENTF_RIGHTUP; }
                            else if (btn == "middle") { down = MOUSEEVENTF_MIDDLEDOWN; up = MOUSEEVENTF_MIDDLEUP; }

                            for (int i = 0; i < count; i++)
                            {
                                mouse_event(down, 0, 0, 0, IntPtr.Zero);
                                mouse_event(up, 0, 0, 0, IntPtr.Zero);
                            }
                            Console.WriteLine("OK");
                            break;

                        case "md": // mouse down
                            string mdBtn = parts.Length >= 2 ? parts[1].ToLowerInvariant() : "left";
                            uint mdFlag = mdBtn == "right" ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_LEFTDOWN;
                            mouse_event(mdFlag, 0, 0, 0, IntPtr.Zero);
                            Console.WriteLine("OK");
                            break;

                        case "mu": // mouse up
                            string muBtn = parts.Length >= 2 ? parts[1].ToLowerInvariant() : "left";
                            uint muFlag = muBtn == "right" ? MOUSEEVENTF_RIGHTUP : MOUSEEVENTF_LEFTUP;
                            mouse_event(muFlag, 0, 0, 0, IntPtr.Zero);
                            Console.WriteLine("OK");
                            break;

                        case "s": // scroll: s deltaY
                            if (parts.Length >= 2)
                            {
                                int scroll = int.Parse(parts[1]);
                                mouse_event(MOUSEEVENTF_WHEEL, 0, 0, scroll, IntPtr.Zero);
                                Console.WriteLine("OK");
                            }
                            break;

                        case "kp": // key press: kp vk
                            if (parts.Length >= 2)
                            {
                                byte vk = (byte)int.Parse(parts[1]);
                                keybd_event(vk, 0, KEYEVENTF_KEYDOWN, IntPtr.Zero);
                                keybd_event(vk, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                                Console.WriteLine("OK");
                            }
                            break;

                        case "kd": // key down
                            if (parts.Length >= 2)
                            {
                                byte vk = (byte)int.Parse(parts[1]);
                                keybd_event(vk, 0, KEYEVENTF_KEYDOWN, IntPtr.Zero);
                                Console.WriteLine("OK");
                            }
                            break;

                        case "ku": // key up
                            if (parts.Length >= 2)
                            {
                                byte vk = (byte)int.Parse(parts[1]);
                                keybd_event(vk, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                                Console.WriteLine("OK");
                            }
                            break;

                        case "t": // type text (base64): t <base64>
                            if (parts.Length >= 2)
                            {
                                byte[] bytes = Convert.FromBase64String(parts[1]);
                                string text = Encoding.UTF8.GetString(bytes);
                                SendKeys.SendWait(text);
                                Console.WriteLine("OK");
                            }
                            break;

                        case "media": // media playpause|next|prev|stop
                            if (parts.Length >= 2)
                            {
                                byte mvk = VK_MEDIA_PLAY_PAUSE;
                                switch (parts[1].ToLowerInvariant())
                                {
                                    case "playpause": mvk = VK_MEDIA_PLAY_PAUSE; break;
                                    case "next": mvk = VK_MEDIA_NEXT_TRACK; break;
                                    case "prev": mvk = VK_MEDIA_PREV_TRACK; break;
                                    case "stop": mvk = VK_MEDIA_STOP; break;
                                }
                                keybd_event(mvk, 0, KEYEVENTF_KEYDOWN, IntPtr.Zero);
                                keybd_event(mvk, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                                Console.WriteLine("OK");
                            }
                            break;

                        case "volmute":
                            keybd_event(VK_VOLUME_MUTE, 0, KEYEVENTF_KEYDOWN, IntPtr.Zero);
                            keybd_event(VK_VOLUME_MUTE, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                            Console.WriteLine("OK");
                            break;

                        case "volup":
                            keybd_event(VK_VOLUME_UP, 0, KEYEVENTF_KEYDOWN, IntPtr.Zero);
                            keybd_event(VK_VOLUME_UP, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                            Console.WriteLine("OK");
                            break;

                        case "voldown":
                            keybd_event(VK_VOLUME_DOWN, 0, KEYEVENTF_KEYDOWN, IntPtr.Zero);
                            keybd_event(VK_VOLUME_DOWN, 0, KEYEVENTF_KEYUP, IntPtr.Zero);
                            Console.WriteLine("OK");
                            break;

                        case "lock":
                            LockWorkStation();
                            Console.WriteLine("OK");
                            break;

                        case "exit":
                            return;

                        default:
                            Console.WriteLine("UNKNOWN");
                            break;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("ERROR " + ex.Message);
                }
                Console.Out.Flush();
            }
        }
    }
}
