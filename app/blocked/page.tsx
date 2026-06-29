'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/use-session-store';
import { useDeviceStore } from '@/store/use-device-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function BlockedPage() {
  const router = useRouter();
  const { token, vendor, ipAddress, isAuthenticated } = useSessionStore();
  const { blocked, setBlocked } = useDeviceStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !token || !vendor || !ipAddress) {
      router.replace('/');
    }
  }, [isAuthenticated, token, vendor, ipAddress, router]);

  const { isLoading } = useQuery({
    queryKey: ['blocked', token, vendor, ipAddress],
    queryFn: async () => {
      const res = await axios.get(`/api/unblock?token=${token}&vendor=${vendor}&ipAddress=${ipAddress}`);
      setBlocked(res.data);
      return res.data;
    },
    enabled: Boolean(token && vendor && ipAddress),
  });

  const unblockMutation = useMutation({
    mutationFn: async (macAddress: string) => {
      await axios.post('/api/unblock', { token, vendor, ipAddress, macAddress });
    },
    onSuccess: () => {
      toast.success('Device removed from the block list');
      queryClient.invalidateQueries({ queryKey: ['blocked'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Unable to unblock this device');
    },
  });

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Router control</p>
            <h1 className="text-3xl font-semibold">Blocked devices</h1>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Block list</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading blocked entries…</p>
            ) : blocked.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blocked entries are present right now.</p>
            ) : (
              <div className="space-y-3">
                {blocked.map((entry) => (
                  <div key={entry.macAddress} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{entry.macAddress}</p>
                      <p className="text-sm text-muted-foreground">{entry.reason || 'Manual block'} · {entry.vendor || 'Unknown vendor'}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => unblockMutation.mutate(entry.macAddress)}>
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
