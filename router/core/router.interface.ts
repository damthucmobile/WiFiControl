import { RouterInfo, ConnectedDevice, BlockedMac, RouterStatistics } from '../types';

export interface RouterCredentials {
  ipAddress: string;
  username?: string;
  password?: string;
  extraConfig?: Record<string, any>;
}

export interface RouterAdapter {
  login(credentials: RouterCredentials): Promise<string>;
  logout(token: string, ipAddress: string): Promise<boolean>;
  getRouterInfo(token: string, ipAddress: string): Promise<RouterInfo>;
  getConnectedDevices(token: string, ipAddress: string): Promise<ConnectedDevice[]>;
  getBlockedMacs(token: string, ipAddress: string): Promise<BlockedMac[]>;
  blockMac(token: string, ipAddress: string, macAddress: string, reason?: string): Promise<boolean>;
  unblockMac(token: string, ipAddress: string, macAddress: string): Promise<boolean>;
  disconnectDevice(token: string, ipAddress: string, macAddress: string, reason?: string): Promise<boolean>;
  getStatistics(token: string, ipAddress: string): Promise<RouterStatistics>;
}