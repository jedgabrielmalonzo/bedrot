import * as os from 'os';

let lastCpuInfo = os.cpus();

export function getCpuUsage(): { usage: number; model: string; cores: number; speed: number } {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  let prevTotalIdle = 0, prevTotalTick = 0;

  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i];
    const prevCpu = lastCpuInfo[i] || cpu;
    for (const type of Object.keys(cpu.times) as Array<keyof typeof cpu.times>) {
      totalTick += cpu.times[type];
      prevTotalTick += prevCpu.times[type];
    }
    totalIdle += cpu.times.idle;
    prevTotalIdle += prevCpu.times.idle;
  }

  const idleDelta = totalIdle - prevTotalIdle;
  const totalDelta = totalTick - prevTotalTick;
  const usage = totalDelta > 0 ? Math.round((1 - idleDelta / totalDelta) * 100) : 0;

  lastCpuInfo = cpus;

  return {
    usage,
    model: cpus[0]?.model || 'Unknown',
    cores: cpus.length,
    speed: cpus[0]?.speed || 0,
  };
}

export function getMemoryUsage(): { total: number; used: number; free: number; usagePercent: number } {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    total,
    used,
    free,
    usagePercent: Math.round((used / total) * 100),
  };
}

export async function getDiskUsage(): Promise<Array<{ drive: string; total: number; used: number; free: number; usagePercent: number }>> {
  try {
    const si = require('systeminformation');
    const data = await si.fsSize();
    return data.map((d: any) => ({
      drive: d.mount || d.fs,
      total: d.size,
      used: d.used,
      free: d.available,
      usagePercent: Math.round(d.use),
    }));
  } catch {
    return [{
      drive: 'C:',
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0,
    }];
  }
}

export function getNetworkInfo(): Array<{ interface: string; ip: string; mac: string }> {
  const interfaces = os.networkInterfaces();
  const result: Array<{ interface: string; ip: string; mac: string }> = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs || []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        result.push({ interface: name, ip: addr.address, mac: addr.mac || '' });
      }
    }
  }
  return result;
}

export async function getRunningProcesses(): Promise<Array<{ name: string; pid: number; cpu: number; memory: number }>> {
  try {
    const si = require('systeminformation');
    const data = await si.processes();
    return data.list
      .sort((a: any, b: any) => (b.cpu || 0) - (a.cpu || 0))
      .slice(0, 20)
      .map((p: any) => ({
        name: p.name,
        pid: p.pid,
        cpu: Math.round((p.cpu || 0) * 10) / 10,
        memory: Math.round((p.mem || 0) * 10) / 10,
      }));
  } catch {
    return [];
  }
}

export function getSystemInfo(): { platform: string; version: string; hostname: string; arch: string; uptime: number } {
  return {
    platform: os.platform(),
    version: os.release(),
    hostname: os.hostname(),
    arch: os.arch(),
    uptime: Math.round(os.uptime()),
  };
}

export async function getFullSystemReport() {
  const cpu = getCpuUsage();
  const memory = getMemoryUsage();
  const disk = await getDiskUsage();
  const network = getNetworkInfo();
  const processes = await getRunningProcesses();
  const system = getSystemInfo();

  return {
    cpu,
    memory,
    disk,
    network,
    os: system,
    uptime: system.uptime,
    processes,
  };
}
