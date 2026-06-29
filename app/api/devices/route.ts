import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchConnectedDevices } from '@/router/services/router-service';

const querySchema = z.object({
  token: z.string().min(1),
  vendor: z.enum(['tplink', 'asus', 'openwrt', 'mikrotik', 'unifi', 'huawei', 'zte', 'generic']),
  ipAddress: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    token: searchParams.get('token'),
    vendor: searchParams.get('vendor'),
    ipAddress: searchParams.get('ipAddress'),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }

  try {
    const devices = await fetchConnectedDevices(parsed.data);
    return NextResponse.json(devices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to fetch connected devices' }, { status: 500 });
  }
}