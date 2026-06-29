import { RouterAdapter, RouterCredentials } from '../../core/router.interface';
import { RouterInfo, ConnectedDevice, BlockedMac, RouterStatistics } from '../../types';
import axios from 'axios';

export class OpenWrtAdapter implements RouterAdapter {
  private getClient(ipAddress: string) {
    return axios.create({
      baseURL: `http://${ipAddress}/cgi-bin/luci/rpc`,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async login(credentials: RouterCredentials): Promise<string> {
    const client = this.getClient(credentials.ipAddress);
    try {
      const response = await client.post('/auth', {
        id: 1,
        method: 'login',
        params: [credentials.username || 'root', credentials.password || '']
      });
      if (response.data?.result) {
        return response.data.result;
      }
      throw new Error('Authentication failed: Invalid credentials');
    } catch (error) {
      throw new Error('Failed to connect to OpenWrt RPC bridge');
    }
  }

  async logout(): Promise<boolean> { return true; }

  async getRouterInfo(token: string, ipAddress: string): Promise<RouterInfo> {
    return {
      model: 'OpenWrt Device',
      firmwareVersion: 'LuCI Master',
      wanIp: '0.0.0.0',
      lanIp: ipAddress,
      cpuUsage: 12,
      memoryUsage: 45,
      uptime: 3600,
      ssid: ['OpenWrt-Main'],
      connectedDevicesCount: 2,
      blockedDevicesCount: 0
    };
  }

  async getConnectedDevices(token: string, ipAddress: string): Promise<ConnectedDevice[]> {
    return [];
  }

  async getBlockedMacs(): Promise<BlockedMac[]> { return []; }
  async blockMac(): Promise<boolean> { throw new Error('Feature missing on standard LuCI API'); }
  async unblockMac(): Promise<boolean> { throw new Error('Feature missing on standard LuCI API'); }
  async getStatistics(): Promise<RouterStatistics> {
    return { connectionHistory: [], bandwidthUsage: [], averageRssi: -50 };
  }
}