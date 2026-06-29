import { RouterAdapter } from '../../core/router.interface';
import { RouterInfo, ConnectedDevice, BlockedMac, RouterStatistics } from '../../types';

export class GenericHttpAdapter implements RouterAdapter {
  async login(): Promise<string> { return "GENERIC_STUB_TOKEN"; }
  async logout(): Promise<boolean> { return true; }
  
  async getRouterInfo(token: string, ipAddress: string): Promise<RouterInfo> {
    return {
      model: "Generic Gateway",
      firmwareVersion: "1.0.0",
      wanIp: "203.0.113.45",
      lanIp: ipAddress,
      cpuUsage: 8,
      memoryUsage: 32,
      uptime: 86400,
      ssid: ["Generic-Wi-Fi"],
      connectedDevicesCount: 2,
      blockedDevicesCount: 1
    };
  }

  async getConnectedDevices(): Promise<ConnectedDevice[]> {
    return [
      { id: "00:1A:2B:3C:4D:5E", hostname: "Workstation-PC", vendor: "Intel", macAddress: "00:1A:2B:3C:4D:5E", ipAddress: "192.168.1.50", connectionType: "LAN", signalStrength: 100, connectedTime: 14400, uploadSpeed: 250000, downloadSpeed: 1200000 },
      { id: "AA:BB:CC:DD:EE:FF", hostname: "Personal-iPhone", vendor: "Apple", macAddress: "AA:BB:CC:DD:EE:FF", ipAddress: "192.168.1.112", connectionType: "5G", signalStrength: -54, connectedTime: 1200, uploadSpeed: 45000, downloadSpeed: 980000 }
    ];
  }

  async getBlockedMacs(): Promise<BlockedMac[]> {
    return [{ macAddress: "11:22:33:44:55:66", reason: "Unauthorized", createdTime: "2026-06-25T14:32:00Z", vendor: "Samsung" }];
  }

  async blockMac(): Promise<boolean> { return true; }
  async unblockMac(): Promise<boolean> { return true; }
  async getStatistics(): Promise<RouterStatistics> {
    return { connectionHistory: [], bandwidthUsage: [], averageRssi: -62 };
  }
}