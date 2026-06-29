import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/router/core/adapter.registry';
import { RouterVendor } from '@/router/types';

export async function POST(req: NextRequest) {
  try {
    const { token, ipAddress, vendor, macAddress, reason } = await req.json();
    const adapter = getAdapter(vendor as RouterVendor);
    await adapter.blockMac(token, ipAddress, macAddress, reason);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}