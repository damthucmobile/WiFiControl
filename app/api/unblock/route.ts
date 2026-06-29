import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchBlockedMacs, unblockDevice } from '@/router/services/router-service';

const querySchema = z.object({
  token: z.string().min(1),
  vendor: z.enum(['tplink', 'asus', 'openwrt', 'mikrotik', 'unifi', 'huawei', 'zte', 'generic']),
  ipAddress: z.string().min(1),
});

const bodySchema = z.object({
  token: z.string().min(1),
  vendor: z.enum(['tplink', 'asus', 'openwrt', 'mikrotik', 'unifi', 'huawei', 'zte', 'generic']),
  ipAddress: z.string().min(1),
  macAddress: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      token: searchParams.get('token'),
      vendor: searchParams.get('vendor'),
      ipAddress: searchParams.get('ipAddress'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const blocked = await fetchBlockedMacs(parsed.data);
    return NextResponse.json(blocked);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to load blocked list' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const success = await unblockDevice(parsed.data, parsed.data.macAddress);
    if (!success) {
      return NextResponse.json({ error: 'Unblocking is unavailable for this router adapter' }, { status: 501 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to unblock device' }, { status: 500 });
  }
}
