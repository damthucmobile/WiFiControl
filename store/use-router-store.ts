import { create } from 'zustand';
import { RouterVendor } from '../router/types';

interface SessionState {
  token: string | null;
  vendor: RouterVendor | null;
  ipAddress: string | null;
  isAuthenticated: boolean;
  setSession: (token: string, vendor: RouterVendor, ipAddress: string) => void;
  clearSession: () => void;
}

export const useRouterStore = create<SessionState>((set) => ({
  token: null,
  vendor: null,
  ipAddress: null,
  isAuthenticated: false,
  setSession: (token, vendor, ipAddress) => set({ token, vendor, ipAddress, isAuthenticated: true }),
  clearSession: () => set({ token: null, vendor: null, ipAddress: null, isAuthenticated: false }),
}));