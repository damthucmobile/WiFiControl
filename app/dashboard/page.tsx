'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouterStore } from '@/store/use-router-store';
import { useDeviceStore } from '@/store/use-device-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ConnectedDevice } from '@/router/types';

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, vendor, ipAddress, isAuthenticated } = useRouterStore();
  const { setDevices, setBlocked, setRouterInfo, setStatistics } = useDeviceStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'connectedTime' | 'hostname' | 'signalStrength' | 'ipAddress'>('connectedTime');
  const [selectedMacs, setSelectedMacs] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ConnectedDevice | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token || !vendor || !ipAddress) {
      router.replace('/');
    }
  }, [isAuthenticated, token, vendor, ipAddress, router]);

  const { data: devices = [], isLoading: isDevicesLoading, refetch: refetchDevices } = useQuery({
    queryKey: ['devices', token, vendor, ipAddress],
    queryFn: async () => {
      const res = await axios.get(`/api/devices?token=${token}&vendor=${vendor}&ipAddress=${ipAddress}`);
      setDevices(res.data);
      return res.data as ConnectedDevice[];
    },
    refetchInterval: 10000,
    enabled: Boolean(token && vendor && ipAddress),
  });

  const { data: routerInfo, isLoading: isRouterInfoLoading } = useQuery({
    queryKey: ['router-info', token, vendor, ipAddress],
    queryFn: async () => {
      const res = await axios.get(`/api/router/info?token=${token}&vendor=${vendor}&ipAddress=${ipAddress}`);
      setRouterInfo(res.data);
      return res.data;
    },
    enabled: Boolean(token && vendor && ipAddress),
  });

  const { data: statistics, isLoading: isStatisticsLoading } = useQuery({
    queryKey: ['router-statistics', token, vendor, ipAddress],
    queryFn: async () => {
      const res = await axios.get(`/api/router/statistics?token=${token}&vendor=${vendor}&ipAddress=${ipAddress}`);
      setStatistics(res.data);
      return res.data;
    },
    enabled: Boolean(token && vendor && ipAddress),
  });

  const { data: blocked = [], isLoading: isBlockedLoading } = useQuery({
    queryKey: ['blocked', token, vendor, ipAddress],
    queryFn: async () => {
      const res = await axios.get(`/api/unblock?token=${token}&vendor=${vendor}&ipAddress=${ipAddress}`);
      setBlocked(res.data);
      return res.data;
    },
    enabled: Boolean(token && vendor && ipAddress),
  });

  const filteredDevices = useMemo(() => {
    const filtered = devices.filter((device) => {
      const haystack = `${device.hostname} ${device.macAddress} ${device.ipAddress} ${device.vendor}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'hostname') return a.hostname.localeCompare(b.hostname);
      if (sortBy === 'ipAddress') return a.ipAddress.localeCompare(b.ipAddress);
      if (sortBy === 'signalStrength') return b.signalStrength - a.signalStrength;
      return b.connectedTime - a.connectedTime;
    });
  }, [devices, search, sortBy]);

  const toggleSelection = (macAddress: string) => {
    setSelectedMacs((current) => {
      if (current.includes(macAddress)) return current.filter((value) => value !== macAddress);
      return [...current, macAddress];
    });
  };

  const handleBlockSelected = async () => {
    if (selectedMacs.length === 0) {
      toast.error('Choose at least one device first');
      return;
    }

    try {
      await Promise.all(selectedMacs.map((macAddress) => axios.post('/api/block', { token, vendor, ipAddress, macAddress, reason: 'Admin requested block' })));
      toast.success(`Blocked ${selectedMacs.length} device(s)`);
      setSelectedMacs([]);
      await queryClient.invalidateQueries({ queryKey: ['devices'] });
      await queryClient.invalidateQueries({ queryKey: ['blocked'] });
      await queryClient.invalidateQueries({ queryKey: ['router-info'] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to block the selected device(s)');
    }
  };

  const handleDisconnectSelected = async () => {
    if (selectedMacs.length === 0) {
      toast.error('Choose at least one device first');
      return;
    }

    try {
      await Promise.all(selectedMacs.map((macAddress) => axios.post('/api/disconnect', { token, vendor, ipAddress, macAddress, reason: 'Admin requested disconnect' })));
      toast.success(`Disconnected ${selectedMacs.length} device(s)`);
      setSelectedMacs([]);
      await queryClient.invalidateQueries({ queryKey: ['devices'] });
      await queryClient.invalidateQueries({ queryKey: ['router-info'] });
      await queryClient.invalidateQueries({ queryKey: ['router-statistics'] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to disconnect the selected device(s)');
    }
  };

  const exportCsv = () => {
    const rows = filteredDevices.map((device) => [device.hostname, device.macAddress, device.ipAddress, device.vendor, device.connectionType, device.signalStrength, device.connectedTime]);
    const csv = ['Hostname,MAC,IP,Vendor,Connection Type,Signal,Connected Time', ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'router-devices.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const refreshAll = async () => {
    await Promise.all([
      refetchDevices(),
      queryClient.invalidateQueries({ queryKey: ['router-info'] }),
      queryClient.invalidateQueries({ queryKey: ['router-statistics'] }),
      queryClient.invalidateQueries({ queryKey: ['blocked'] }),
    ]);
  };

  const isLoading = isDevicesLoading || isRouterInfoLoading || isStatisticsLoading;

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Router overview</p>
            <h1 className="text-3xl font-semibold">Connected devices</h1>
            <p className="mt-1 text-sm text-muted-foreground">{ipAddress} · {vendor} · Auto-refresh every 10 seconds</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refreshAll()}>Refresh</Button>
            <Button variant="outline" onClick={() => exportCsv()}>Export CSV</Button>
            <Button asChild variant="outline">
              <Link href="/blocked">Blocked list</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader><CardTitle>Connected devices</CardTitle></CardHeader>
            <CardContent>{isLoading ? '…' : devices.length}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Blocked devices</CardTitle></CardHeader>
            <CardContent>{isBlockedLoading ? '…' : blocked.length}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Average RSSI</CardTitle></CardHeader>
            <CardContent>{statistics?.averageRssi ?? '—'} dBm</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Uptime</CardTitle></CardHeader>
            <CardContent>{routerInfo ? `${Math.round(routerInfo.uptime / 3600)}h` : '—'}</CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleBlockSelected}>Block selected</Button>
                <Button size="sm" variant="outline" onClick={handleDisconnectSelected}>Disconnect selected</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by hostname, MAC, IP or vendor" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'connectedTime' | 'hostname' | 'signalStrength' | 'ipAddress')} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="connectedTime">Sort by connection time</option>
                  <option value="hostname">Sort by hostname</option>
                  <option value="signalStrength">Sort by signal</option>
                  <option value="ipAddress">Sort by IP</option>
                </select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>MAC</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Connection time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Loading router telemetry…</TableCell></TableRow>
                ) : filteredDevices.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No devices matched your search.</TableCell></TableRow>
                ) : filteredDevices.map((device) => (
                  <TableRow key={device.id} onClick={() => setSelectedDevice(device)} className="cursor-pointer">
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <input type="checkbox" checked={selectedMacs.includes(device.macAddress)} onChange={() => toggleSelection(device.macAddress)} />
                    </TableCell>
                    <TableCell className="font-medium">{device.hostname}</TableCell>
                    <TableCell className="font-mono text-xs">{device.macAddress}</TableCell>
                    <TableCell>{device.ipAddress}</TableCell>
                    <TableCell>{device.connectionType}</TableCell>
                    <TableCell>{device.signalStrength} dBm</TableCell>
                    <TableCell>{Math.round(device.connectedTime / 60)} min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Router details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Model:</span> {routerInfo?.model || '—'}</p>
                <p><span className="font-medium text-foreground">Firmware:</span> {routerInfo?.firmwareVersion || '—'}</p>
                <p><span className="font-medium text-foreground">WAN IP:</span> {routerInfo?.wanIp || '—'}</p>
                <p><span className="font-medium text-foreground">LAN IP:</span> {routerInfo?.lanIp || '—'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Device details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {selectedDevice ? (
                  <>
                    <p><span className="font-medium text-foreground">Hostname:</span> {selectedDevice.hostname}</p>
                    <p><span className="font-medium text-foreground">MAC:</span> {selectedDevice.macAddress}</p>
                    <p><span className="font-medium text-foreground">Vendor:</span> {selectedDevice.vendor}</p>
                    <p><span className="font-medium text-foreground">Signal:</span> {selectedDevice.signalStrength} dBm</p>
                    <p><span className="font-medium text-foreground">Upload speed:</span> {selectedDevice.uploadSpeed}</p>
                    <p><span className="font-medium text-foreground">Download speed:</span> {selectedDevice.downloadSpeed}</p>
                  </>
                ) : (
                  <p>Select a device to inspect its details.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}