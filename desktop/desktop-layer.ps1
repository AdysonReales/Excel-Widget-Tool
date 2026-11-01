param([Parameter(Mandatory=$true)][long]$Handle, [Parameter(Mandatory=$true)][string]$Mode)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class DesktopLayer {
  public delegate bool EnumWindowsProc(IntPtr window, IntPtr param);
  [DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)] public static extern IntPtr FindWindow(string cls, string title);
  [DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)] public static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string cls, string title);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr param);
  [DllImport("user32.dll", SetLastError=true)] public static extern IntPtr SendMessageTimeout(IntPtr window, uint msg, IntPtr w, IntPtr l, uint flags, uint timeout, out IntPtr result);
  [DllImport("user32.dll", SetLastError=true)] public static extern IntPtr SetParent(IntPtr child, IntPtr parent);
  [DllImport("user32.dll", SetLastError=true)] public static extern bool SetWindowPos(IntPtr window, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll", SetLastError=true)] public static extern IntPtr GetParent(IntPtr window);
  public static IntPtr GetLayer() {
    IntPtr progman = FindWindow("Progman", null), result;
    if (progman == IntPtr.Zero) throw new Exception("Windows desktop was not found.");
    SendMessageTimeout(progman, 0x052C, IntPtr.Zero, IntPtr.Zero, 2, 1000, out result);
    IntPtr layer = IntPtr.Zero;
    EnumWindows((top, param) => {
      if (FindWindowEx(top, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero) {
        layer = FindWindowEx(IntPtr.Zero, top, "WorkerW", null);
        return false;
      }
      return true;
    }, IntPtr.Zero);
    if (layer == IntPtr.Zero) throw new Exception("Could not find the desktop wallpaper layer.");
    return layer;
  }
}
'@
$window = [IntPtr]$Handle
if ($Mode -eq 'attach') {
  $layer = [DesktopLayer]::GetLayer()
  [void][DesktopLayer]::SetParent($window, $layer)
  if ([DesktopLayer]::GetParent($window) -ne $layer) { throw 'Could not attach to the desktop layer.' }
} elseif ($Mode -eq 'detach') {
  [void][DesktopLayer]::SetParent($window, [IntPtr]::Zero)
  if ([DesktopLayer]::GetParent($window) -ne [IntPtr]::Zero) { throw 'Could not detach from the desktop layer.' }
} else { throw 'Invalid mode.' }
