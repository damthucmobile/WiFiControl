import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { blockDevice } from '@/router/services/router-service';

const bodySchema = z.object({
  token: z.string().min(1),
  vendor: z.enum(['tplink', 'asus', 'openwrt', 'mikrotik', 'unifi', 'huawei', 'zte', 'generic']),
  ipAddress: z.string().min(1),
  macAddress: z.string().min(1),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const success = await blockDevice(parsed.data, parsed.data.macAddress, parsed.data.reason);
    if (!success) {
      return NextResponse.json({ error: 'Blocking is unavailable for this router adapter' }, { status: 501 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to block device' }, { status: 500 });
  }
}