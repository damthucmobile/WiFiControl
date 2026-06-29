import { RouterAdapter } from './router.interface';
import { RouterVendor } from '../types';
import { OpenWrtAdapter } from '../adapters/openwrt';
import { GenericHttpAdapter } from '../adapters/generic';

const registry: Record<RouterVendor, RouterAdapter> = {
  generic: new GenericHttpAdapter(),
  openwrt: new OpenWrtAdapter(),
  tplink: new GenericHttpAdapter(), 
  asus: new GenericHttpAdapter(),
  mikrotik: new GenericHttpAdapter(), 
  unifi: new GenericHttpAdapter(),
  huawei: new GenericHttpAdapter(),
  zte: new GenericHttpAdapter()
};

export function getAdapter(vendor: RouterVendor): RouterAdapter {
  const adapter = registry[vendor];
  if (!adapter) {
    throw new Error(`Unsupported router vendor: ${vendor}`);
  }
  return adapter;
}