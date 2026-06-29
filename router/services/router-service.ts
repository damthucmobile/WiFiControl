import { getAdapter } from '@/router/core/adapter.registry';
import type { RouterAdapter, RouterCredentials } from '@/router/core/router.interface';
import type { ConnectedDevice, RouterInfo, RouterStatistics, BlockedMac, RouterVendor } from '@/router/types';
import { logger } from '@/lib/logger';

export interface RouterSessionContext {
  token: string;
  vendor: RouterVendor;
  ipAddress: string;
}

export interface LoginPayload extends RouterCredentials {
  vendor: RouterVendor;
}

export function getAdapterForVendor(vendor: RouterVendor): RouterAdapter {
  return getAdapter(vendor);
}

export async function authenticateRouter(payload: LoginPayload): Promise<RouterSessionContext> {
  const adapter = getAdapter(payload.vendor);
  const token = await adapter.login(payload);
  logger.info('router login', payload.vendor, payload.ipAddress);
  return { token, vendor: payload.vendor, ipAddress: payload.ipAddress };
}

export async function logoutRouter(session: RouterSessionContext): Promise<boolean> {
  const adapter = getAdapter(session.vendor);
  return adapter.logout(session.token, session.ipAddress);
}

export async function fetchRouterInfo(session: RouterSessionContext): Promise<RouterInfo> {
  const adapter = getAdapter(session.vendor);
  return adapter.getRouterInfo(session.token, session.ipAddress);
}

export async function fetchConnectedDevices(session: RouterSessionContext): Promise<ConnectedDevice[]> {
  const adapter = getAdapter(session.vendor);
  return adapter.getConnectedDevices(session.token, session.ipAddress);
}

export async function fetchBlockedMacs(session: RouterSessionContext): Promise<BlockedMac[]> {
  const adapter = getAdapter(session.vendor);
  return adapter.getBlockedMacs(session.token, session.ipAddress);
}

export async function fetchStatistics(session: RouterSessionContext): Promise<RouterStatistics> {
  const adapter = getAdapter(session.vendor);
  return adapter.getStatistics(session.token, session.ipAddress);
}

export async function blockDevice(session: RouterSessionContext, macAddress: string, reason?: string): Promise<boolean> {
  const adapter = getAdapter(session.vendor);
  return adapter.blockMac(session.token, session.ipAddress, macAddress, reason);
}

export async function unblockDevice(session: RouterSessionContext, macAddress: string): Promise<boolean> {
  const adapter = getAdapter(session.vendor);
  return adapter.unblockMac(session.token, session.ipAddress, macAddress);
}

export async function disconnectDevice(session: RouterSessionContext, macAddress: string, reason?: string): Promise<boolean> {
  const adapter = getAdapter(session.vendor);
  return adapter.disconnectDevice(session.token, session.ipAddress, macAddress, reason);
}
