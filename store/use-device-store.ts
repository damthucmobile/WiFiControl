import { create } from 'zustand';
import type { ConnectedDevice, BlockedMac, RouterStatistics, RouterInfo } from '@/router/types';

interface DeviceState {
  devices: ConnectedDevice[];
  blocked: BlockedMac[];
  routerInfo: RouterInfo | null;
  statistics: RouterStatistics | null;
  setDevices: (devices: ConnectedDevice[]) => void;
  setBlocked: (blocked: BlockedMac[]) => void;
  setRouterInfo: (routerInfo: RouterInfo | null) => void;
  setStatistics: (statistics: RouterStatistics | null) => void;
  clear: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  blocked: [],
  routerInfo: null,
  statistics: null,
  setDevices: (devices) => set({ devices }),
  setBlocked: (blocked) => set({ blocked }),
  setRouterInfo: (routerInfo) => set({ routerInfo }),
  setStatistics: (statistics) => set({ statistics }),
  clear: () => set({ devices: [], blocked: [], routerInfo: null, statistics: null }),
}));
