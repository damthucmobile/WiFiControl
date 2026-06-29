'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouterStore } from '@/store/use-router-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

// Định nghĩa schema với các enum chuẩn
const schema = z.object({
  ipAddress: z.string().regex(ipv4Regex, { message: "Provide a valid IPv4 Target Address" }),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Access secret missing"),
  vendor: z.enum(['tplink', 'asus', 'openwrt', 'mikrotik', 'unifi', 'huawei', 'zte', 'viettel', 'generic']),
});

export default function LoginPage() {
  const router = useRouter();
  const setSession = useRouterStore((state: any) => state.setSession);

  // Khai báo react-hook-form liên kết trực tiếp bằng register
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { 
      vendor: 'generic',
      ipAddress: '',
      username: '',
      password: ''
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const res = await axios.post('/api/login', values);
      return { token: res.data.token, values };
    },
    onSuccess: ({ token, values }) => {
      setSession(token, values.vendor, values.ipAddress);
      toast.success("Router handshake successful!");
      router.push('/dashboard');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Connection timed out");
    }
  });

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Access Router Control Plane</h1>
        
        {/* Phần Select HTML nguyên bản đã được sửa lỗi */}
        <div className="space-y-2">
          <label className="text-xs uppercase font-semibold text-zinc-400">Router Core Driver</label>
          <div className="relative">
            <select
              {...register('vendor')}
              className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="generic" className="bg-zinc-900">Generic Management Bridge</option>
              <option value="viettel" className="bg-zinc-900">Viettel Telecom Gateway</option> {/* Thêm dòng này */}
              <option value="tplink" className="bg-zinc-900">TP-Link Smart System</option>
              <option value="asus" className="bg-zinc-900">ASUSWRT Engine</option>
              <option value="openwrt" className="bg-zinc-900">OpenWrt LuCI Framework</option>
              <option value="mikrotik" className="bg-zinc-900">MikroTik RouterOS</option>
              <option value="unifi" className="bg-zinc-900">UniFi Controller</option>
              <option value="huawei" className="bg-zinc-900">Huawei Enterprise</option>
              <option value="zte" className="bg-zinc-900">ZTE Home Gateway</option>
            </select>
            
            {/* Mũi tên icon nhỏ bên góc phải */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
          {errors.vendor && <p className="text-red-400 text-xs">{errors.vendor.message}</p>}
        </div>

        <div className="space-y-2">
          <input {...register('ipAddress')} placeholder="Gateway Host Address (e.g. 192.168.1.1)" className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white" />
          {errors.ipAddress && <p className="text-red-400 text-xs">{errors.ipAddress.message}</p>}
        </div>

        <div className="space-y-2">
          <input {...register('username')} placeholder="Username" className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white" />
          {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <input type="password" {...register('password')} placeholder="Password" className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white" />
          {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
          {mutation.isPending ? "Configuring Pipeline..." : "Establish Pipeline"}
        </Button>
      </form>
    </div>
  );
}