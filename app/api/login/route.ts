import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/router/core/adapter.registry';
import { z } from 'zod';

const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

const loginSchema = z.object({
  ipAddress: z.string().regex(ipv4Regex, { message: "Provide a valid IPv4 Target Address" }),
  username: z.string().min(1),
  password: z.string().min(1),
  vendor: z.enum(['tplink', 'asus', 'openwrt', 'mikrotik', 'unifi', 'huawei', 'zte', 'generic'])
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload details' }, { status: 400 });

    const { vendor, ipAddress, username, password } = parsed.data;
    const adapter = getAdapter(vendor);
    const token = await adapter.login({ ipAddress, username, password });
    
    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 401 });
  }
}