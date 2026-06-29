// Dashboard Code placeholder - To keep script concise
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouterStore } from '@/store/use-router-store';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { token, vendor, ipAddress } = useRouterStore();
  const [search, setSearch] = useState('');

  // Auto-refreshes device ecosystem telemetry metrics silently every 10 seconds
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices', token],
    queryFn: async () => {
      const res = await axios.get(`/api/devices?token=${token}&vendor=${vendor}&ipAddress=${ipAddress}`);
      return res.data;
    },
    refetchInterval: 10000, 
    enabled: !!token
  });

  const blockMutation = useMutation({
    mutationFn: async (mac: string) => {
      await axios.post('/api/block', { token, vendor, ipAddress, macAddress: mac, reason: 'Admin Manual Termination' });
    },
    onSuccess: () => {
      toast.success("Target Address dropped and moved to containment matrix");
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  });

  if (isLoading) return <div className="p-8 text-zinc-400 font-mono animate-pulse">Polling Target Gateway Matrix...</div>;

  const filteredDevices = devices?.filter((d: any) => 
    d.hostname.toLowerCase().includes(search.toLowerCase()) || 
    d.macAddress.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-8 space-y-6 bg-zinc-950 min-h-screen text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Active Interfaces ({devices?.length || 0})</h1>
          <p className="text-zinc-400 text-sm">Target node: {ipAddress} managed via adaptive layer [{vendor}]</p>
        </div>
        <input 
          type="text" 
          placeholder="Filter Endpoint Signature..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm w-64"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-850 text-white">
          <CardHeader><CardTitle className="text-xs uppercase text-zinc-400">Average Radio RSSI</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">-58 dBm</CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-850 text-white">
          <CardHeader><CardTitle className="text-xs uppercase text-zinc-400">Auto Telemetry Interval</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">10000 ms</CardContent>
        </Card>
      </div>

      <div className="border border-zinc-850 rounded-lg bg-zinc-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-850">
            <TableRow>
              <TableHead className="text-zinc-300">Hostname Identification</TableHead>
              <TableHead className="text-zinc-300">IP Pointer</TableHead>
              <TableHead className="text-zinc-300">Physical Signature (MAC)</TableHead>
              <TableHead className="text-zinc-300">Radio Band</TableHead>
              <TableHead className="text-zinc-300">Signal</TableHead>
              <TableHead className="text-zinc-300 text-right">Emergency Matrix Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map((device: any) => (
              <TableRow key={device.id} className="border-zinc-850 hover:bg-zinc-800/50">
                <TableCell className="font-medium text-zinc-100">{device.hostname}</TableCell>
                <TableCell className="font-mono text-zinc-400">{device.ipAddress}</TableCell>
                <TableCell className="font-mono text-zinc-400">{device.macAddress}</TableCell>
                <TableCell className="text-zinc-300">{device.connectionType}</TableCell>
                <TableCell className="text-zinc-300">{device.signalStrength} dBm</TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" size="sm" onClick={() => blockMutation.mutate(device.macAddress)}>
                    Drop Connection
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}