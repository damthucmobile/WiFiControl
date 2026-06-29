import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/router/core/adapter.registry';
import { RouterVendor } from '@/router/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const ipAddress = searchParams.get('ipAddress');
  const vendor = searchParams.get('vendor') as RouterVendor;

  if (!token || !ipAddress || !vendor) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  try {
    const adapter = getAdapter(vendor);
    const devices = await adapter.getConnectedDevices(token, ipAddress);
    return NextResponse.json(devices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}