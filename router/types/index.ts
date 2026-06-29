export type RouterVendor = 'tplink' | 'asus' | 'openwrt' | 'mikrotik' | 'unifi' | 'huawei' | 'zte' | 'generic';

export interface RouterInfo {
  model: string;
  firmwareVersion: string;
  wanIp: string;
  lanIp: string;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  ssid: string[];
  connectedDevicesCount: number;
  blockedDevicesCount: number;
}

export interface ConnectedDevice {
  id: string;
  hostname: string;
  vendor: string;
  macAddress: string;
  ipAddress: string;
  connectionType: '2.4G' | '5G' | 'LAN';
  signalStrength: number;
  connectedTime: number;
  uploadSpeed: number;
  downloadSpeed: number;
  dhcpLeaseTime?: number;
}

export interface BlockedMac {
  macAddress: string;
  reason?: string;
  createdTime?: string;
  vendor?: string;
}

export interface RouterStatistics {
  connectionHistory: { timestamp: string; count: number }[];
  bandwidthUsage: { timestamp: string; download: number; upload: number }[];
  averageRssi: number;
}