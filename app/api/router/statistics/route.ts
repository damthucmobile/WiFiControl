import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchStatistics } from '@/router/services/router-service';

const querySchema = z.object({
  token: z.string().min(1),
  vendor: z.enum(['tplink', 'asus', 'openwrt', 'mikrotik', 'unifi', 'huawei', 'zte', 'generic']),
  ipAddress: z.string().min(1),
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

    const data = await fetchStatistics(parsed.data);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to read router statistics' }, { status: 500 });
  }
}
