'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouterStore } from '@/store/use-router-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const useLogin = () => {
  return useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const res = await axios.post('/api/login', values);
      return { token: res.data.token, values };
    },
  }
  )
}

const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const schema = z.object({
  ipAddress: z.string().regex(ipv4Regex, { message: 'Provide a valid IPv4 address' }),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  vendor: z.enum(['tplink', 'asus', 'openwrt', 'mikrotik', 'unifi', 'huawei', 'zte', 'generic']),
});

export default function LoginPage() {
  const router = useRouter();
  const setSession = useRouterStore((state: any) => state.setSession);
  const mutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendor: 'zte',
      ipAddress: '192.168.1.1',
      username: 'admin',
      password: 'ZTEGCE55234A',
    },
  });

  const handleLogin = (data: z.infer<typeof schema>) => {
    mutation.mutate(data, {
      onSuccess: (response) => {
        setSession(response.token, response.values.vendor, response.values.ipAddress);
        toast.success('Router connected successfully');
        router.push('/dashboard');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Unable to connect to the router');
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <form
        method="post"
        onSubmit={handleSubmit(handleLogin)}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Router management</p>
          <h1 className="text-3xl font-semibold">Connect to your router</h1>
          <p className="text-sm text-muted-foreground">Use a supported management API or documented interface for the selected vendor.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Router vendor</label>
            <select
              {...register('vendor')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-ring"
            >
              <option value="generic">Generic HTTP adapter</option>
              <option value="tplink">TP-Link</option>
              <option value="asus">ASUS</option>
              <option value="openwrt">OpenWrt</option>
              <option value="mikrotik">MikroTik</option>
              <option value="unifi">UniFi</option>
              <option value="huawei">Huawei</option>
              <option value="zte">ZTE</option>
            </select>
            {errors.vendor ? <p className="text-sm text-destructive">{errors.vendor.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Router IP</label>
            <input {...register('ipAddress')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-ring" />
            {errors.ipAddress ? <p className="text-sm text-destructive">{errors.ipAddress.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input {...register('username')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-ring" />
            {errors.username ? <p className="text-sm text-destructive">{errors.username.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input type="password" {...register('password')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-ring" />
            {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
          </div>
        </div>

        <Button type="submit" disabled={mutation.isPending} className="mt-6 w-full">
          {mutation.isPending ? 'Connecting…' : 'Connect'}
        </Button>
      </form>
    </div>
  );
}