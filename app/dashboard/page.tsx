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
    <div className="min-h-screen bg-background p-4 text-foreground md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        
        {/* Header - Hỗ trợ Wrap linh hoạt trên Mobile */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Router overview</p>
            <h1 className="text-2xl sm:text-3xl font-semibold mt-0.5">Connected devices</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{ipAddress}</span> · <span className="uppercase font-semibold">{vendor}</span> · Auto-refresh 10s
            </p>
          </div>
          {/* Nhóm nút thu nhỏ vừa màn hình di động */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => refreshAll()}>Refresh</Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => exportCsv()}>Export CSV</Button>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-center">
              <Link href="/blocked" className="justify-center">Blocked list</Link>
            </Button>
          </div>
        </div>

        {/* Thống kê Tổng quan - Tự động đổi Grid Layout từ 2 sang 4 cột */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="shadow-none">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs sm:text-sm text-muted-foreground font-medium">Connected</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 text-xl sm:text-2xl font-bold">{isLoading ? '…' : devices.length}</CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs sm:text-sm text-muted-foreground font-medium">Blocked</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 text-xl sm:text-2xl font-bold">{isBlockedLoading ? '…' : blocked.length}</CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs sm:text-sm text-muted-foreground font-medium">Avg RSSI</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 text-xl sm:text-2xl font-bold">{statistics?.averageRssi ?? '—'} dBm</CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs sm:text-sm text-muted-foreground font-medium">Uptime</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 text-xl sm:text-2xl font-bold">{routerInfo ? `${Math.round(routerInfo.uptime / 3600)}h` : '—'}</CardContent>
          </Card>
        </div>

        {/* Nội dung chính Layout: Grid linh hoạt 1, 2 và 3 cột tùy kích thước */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          
          {/* Vùng Bảng thiết bị */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm h-fit">
            
            {/* Thanh công cụ tìm kiếm và lọc */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button size="sm" className="flex-1 md:flex-none text-xs sm:text-sm" onClick={handleBlockSelected}>Block selected</Button>
                <Button size="sm" variant="outline" className="flex-1 md:flex-none text-xs sm:text-sm" onClick={handleDisconnectSelected}>Disconnect</Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <input 
                  value={search} 
                  onChange={(event) => setSearch(event.target.value)} 
                  placeholder="Search by IP, MAC, hostname..." 
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs sm:text-sm flex-1 md:w-64 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                />
                <select 
                  value={sortBy} 
                  onChange={(event) => setSortBy(event.target.value as any)} 
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs sm:text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="connectedTime">Sort: Connection Time</option>
                  <option value="hostname">Sort: Hostname</option>
                  <option value="signalStrength">Sort: Signal Strength</option>
                  <option value="ipAddress">Sort: IP Address</option>
                </select>
              </div>
            </div>

            {/* Bảng thiết bị có hỗ trợ cuộn trục X trên Mobile */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[40px] pl-4"></TableHead>
                    <TableHead className="text-xs sm:text-sm">Device / Hostname</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs sm:text-sm">MAC Address</TableHead>
                    <TableHead className="text-xs sm:text-sm">IP Address</TableHead>
                    <TableHead className="hidden md:table-cell text-xs sm:text-sm">Band</TableHead>
                    <TableHead className="text-xs sm:text-sm">Signal</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-xs sm:text-sm text-muted-foreground">Loading router telemetry…</TableCell></TableRow>
                  ) : filteredDevices.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-xs sm:text-sm text-muted-foreground">No devices matched your search.</TableCell></TableRow>
                  ) : filteredDevices.map((device) => (
                    <TableRow 
                      key={device.id} 
                      onClick={() => setSelectedDevice(device)} 
                      className={`cursor-pointer transition-colors ${selectedDevice?.macAddress === device.macAddress ? 'bg-muted/70' : 'hover:bg-muted/30'}`}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()} className="pl-4">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                          checked={selectedMacs.includes(device.macAddress)} 
                          onChange={() => toggleSelection(device.macAddress)} 
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[120px] sm:max-w-none truncate text-xs sm:text-sm">
                        <div>{device.hostname || 'Unknown Device'}</div>
                        {/* Chi tiết phụ hiển thị thêm trên màn hình nhỏ */}
                        <div className="sm:hidden text-[10px] font-mono text-muted-foreground mt-0.5">{device.macAddress}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{device.macAddress}</TableCell>
                      <TableCell className="font-mono text-xs sm:text-sm">{device.ipAddress}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm">{device.connectionType}</TableCell>
                      <TableCell className="text-xs sm:text-sm font-medium">
                        <span className={device.signalStrength > -60 ? 'text-green-500' : device.signalStrength > -75 ? 'text-yellow-500' : 'text-red-500'}>
                          {device.signalStrength} dBm
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs sm:text-sm">{Math.round(device.connectedTime / 60)} min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Vùng chi tiết bên phải - Sắp xếp 2 hàng dọc trên PC, 2 cột ngang trên Tablet */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            <Card className="shadow-none h-full xl:h-auto">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Router details</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="font-medium text-foreground">Model</span> <span>{routerInfo?.model || '—'}</span></div>
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="font-medium text-foreground">Firmware</span> <span className="font-mono text-xs">{routerInfo?.firmwareVersion || '—'}</span></div>
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="font-medium text-foreground">WAN IP</span> <span className="font-mono">{routerInfo?.wanIp || '—'}</span></div>
                <div className="flex justify-between"><span className="font-medium text-foreground">LAN IP</span> <span className="font-mono">{routerInfo?.lanIp || '—'}</span></div>
              </CardContent>
            </Card>

            <Card className="shadow-none h-full xl:h-auto">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Device details</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 text-xs sm:text-sm text-muted-foreground">
                {selectedDevice ? (
                  <div className="space-y-2.5">
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="font-medium text-foreground">Hostname</span> <span className="text-foreground font-medium max-w-[150px] truncate">{selectedDevice.hostname}</span></div>
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="font-medium text-foreground">MAC</span> <span className="font-mono text-xs">{selectedDevice.macAddress}</span></div>
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="font-medium text-foreground">Vendor</span> <span className="uppercase">{selectedDevice.vendor}</span></div>
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="font-medium text-foreground">Signal</span> <span>{selectedDevice.signalStrength} dBm</span></div>
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="font-medium text-foreground">Upload speed</span> <span className="font-mono text-green-500">{selectedDevice.uploadSpeed}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-foreground">Download speed</span> <span className="font-mono text-blue-500">{selectedDevice.downloadSpeed}</span></div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground/80 border border-dashed border-border rounded-xl">
                    <p>Select a device from the list</p>
                    <p className="text-[11px] mt-0.5">to inspect detailed telemetry metrics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}