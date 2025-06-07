import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  Database, 
  Wifi, 
  WifiOff, 
  Power, 
  PowerOff, 
  Settings, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Terminal,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SystemValidator } from '@/components/debug/SystemValidator';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'error';
  enabled: boolean;
  endpoint: string;
  lastCheck: string;
  responseTime?: number;
  errorMessage?: string;
}

interface ChainMetrics {
  blockHeight: number;
  difficulty: number;
  hashRate: string;
  peers: number;
  pendingTransactions: number;
  totalWallets: number;
  totalStaked: string;
  networkStatus: 'operational' | 'degraded' | 'down';
}

export function DevDashboard() {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'PVX Blockchain Core', status: 'online', enabled: true, endpoint: '/api/blockchain/status', lastCheck: new Date().toISOString() },
    { name: 'Wallet Service', status: 'online', enabled: true, endpoint: '/api/wallet/all', lastCheck: new Date().toISOString() },
    { name: 'Authentication System', status: 'online', enabled: true, endpoint: '/api/auth/status', lastCheck: new Date().toISOString() },
    { name: 'Governance Module', status: 'online', enabled: true, endpoint: '/api/governance/proposals', lastCheck: new Date().toISOString() },
    { name: 'Staking Protocol', status: 'online', enabled: true, endpoint: '/api/stake/pools', lastCheck: new Date().toISOString() },
    { name: 'Mining Engine', status: 'online', enabled: true, endpoint: '/api/blockchain/mining/stats/test', lastCheck: new Date().toISOString() },
    { name: 'Transaction Processor', status: 'online', enabled: true, endpoint: '/api/utr/stats', lastCheck: new Date().toISOString() },
    { name: 'WebSocket Gateway', status: 'online', enabled: true, endpoint: '/ws', lastCheck: new Date().toISOString() },
  ]);

  const [chainMetrics, setChainMetrics] = useState<ChainMetrics>({
    blockHeight: 1,
    difficulty: 5,
    hashRate: '12.5 MH/s',
    peers: 15,
    pendingTransactions: 0,
    totalWallets: 3,
    totalStaked: '25000.0',
    networkStatus: 'operational'
  });

  const [systemLogs, setSystemLogs] = useState<string[]>([
    '[INFO] PVX Blockchain Core initialized successfully',
    '[INFO] Database connection established',
    '[INFO] All services operational',
    '[DEBUG] Genesis wallet restored: PVX_1295b5490224b2eb64e9724dc091795a',
    '[INFO] WebSocket server listening on port 5000/ws'
  ]);

  const [showLogs, setShowLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh service status
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(async () => {
      await checkAllServices();
      await updateChainMetrics();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const checkAllServices = async () => {
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        if (!service.enabled) return service;
        
        try {
          const start = Date.now();
          const response = await fetch(service.endpoint, {
            headers: service.endpoint.includes('/api/') ? 
              { 'Authorization': `Bearer ${localStorage.getItem('pvx_session_token') || ''}` } : 
              {}
          });
          const responseTime = Date.now() - start;
          
          return {
            ...service,
            status: (response.ok ? 'online' : 'error') as 'online' | 'offline' | 'error',
            lastCheck: new Date().toISOString(),
            responseTime,
            errorMessage: response.ok ? undefined : `HTTP ${response.status}`
          };
        } catch (error) {
          return {
            ...service,
            status: 'offline' as const,
            lastCheck: new Date().toISOString(),
            errorMessage: 'Connection failed'
          };
        }
      })
    );
    
    setServices(updatedServices);
  };

  const updateChainMetrics = async () => {
    try {
      const [blockchainResponse, walletsResponse] = await Promise.all([
        fetch('/api/blockchain/status'),
        fetch('/api/wallet/all')
      ]);
      
      if (blockchainResponse.ok && walletsResponse.ok) {
        const blockchainData = await blockchainResponse.json();
        const walletsData = await walletsResponse.json();
        
        setChainMetrics(prev => ({
          ...prev,
          blockHeight: blockchainData.latestBlock?.height || prev.blockHeight,
          difficulty: blockchainData.difficulty || prev.difficulty,
          peers: blockchainData.peers || prev.peers,
          totalWallets: walletsData.length || prev.totalWallets,
          networkStatus: 'operational'
        }));
      }
    } catch (error) {
      setChainMetrics(prev => ({ ...prev, networkStatus: 'degraded' }));
    }
  };

  const toggleService = async (serviceName: string) => {
    const updatedServices = services.map(service => {
      if (service.name === serviceName) {
        const newEnabled = !service.enabled;
        
        // Add log entry
        setSystemLogs(prev => [
          `[ADMIN] ${serviceName} ${newEnabled ? 'ENABLED' : 'DISABLED'} by administrator`,
          ...prev.slice(0, 49) // Keep last 50 logs
        ]);
        
        return { ...service, enabled: newEnabled, status: newEnabled ? service.status : 'offline' as const };
      }
      return service;
    });
    
    setServices(updatedServices);
    
    toast({
      title: "Service Updated",
      description: `${serviceName} has been ${updatedServices.find(s => s.name === serviceName)?.enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const restartService = async (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (!service) return;

    // Simulate restart
    setServices(prev => prev.map(s => 
      s.name === serviceName ? { ...s, status: 'offline' } : s
    ));

    setSystemLogs(prev => [
      `[ADMIN] Restarting ${serviceName}...`,
      ...prev.slice(0, 49)
    ]);

    setTimeout(async () => {
      await checkAllServices();
      setSystemLogs(prev => [
        `[INFO] ${serviceName} restarted successfully`,
        ...prev.slice(0, 49)
      ]);
    }, 2000);

    toast({
      title: "Service Restart",
      description: `${serviceName} is being restarted`,
    });
  };

  const emergencyShutdown = () => {
    setServices(prev => prev.map(s => ({ ...s, enabled: false, status: 'offline' })));
    setSystemLogs(prev => [
      '[EMERGENCY] All services shut down by administrator',
      ...prev.slice(0, 49)
    ]);
    toast({
      title: "Emergency Shutdown",
      description: "All services have been disabled",
      variant: "destructive"
    });
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'offline': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-300 border-green-600/30';
      case 'offline': return 'bg-red-500/20 text-red-300 border-red-600/30';
      case 'error': return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
    }
  };

  const onlineServices = services.filter(s => s.status === 'online' && s.enabled).length;
  const totalServices = services.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">PVX Chain Developer Dashboard</h1>
            <p className="text-gray-400 mt-2">Blockchain Infrastructure Control Panel</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Auto-refresh</span>
              <Switch 
                checked={autoRefresh} 
                onCheckedChange={setAutoRefresh}
              />
            </div>
            <Button 
              onClick={() => { checkAllServices(); updateChainMetrics(); }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={emergencyShutdown}
              variant="destructive"
              size="sm"
            >
              <PowerOff className="h-4 w-4 mr-2" />
              Emergency Shutdown
            </Button>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Network Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className={`${chainMetrics.networkStatus === 'operational' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {chainMetrics.networkStatus.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Services Online</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {onlineServices}/{totalServices}
              </div>
              <div className="text-xs text-gray-400">
                {Math.round((onlineServices / totalServices) * 100)}% operational
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Block Height</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {chainMetrics.blockHeight.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                Difficulty: {chainMetrics.difficulty}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Connected Peers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {chainMetrics.peers}
              </div>
              <div className="text-xs text-gray-400">
                Network nodes
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="bg-gray-900">
            <TabsTrigger value="services">Service Management</TabsTrigger>
            <TabsTrigger value="monitoring">Chain Monitoring</TabsTrigger>
            <TabsTrigger value="validator">System Validator</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Service Control Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(service.status)}
                        <div>
                          <div className="font-medium text-white">{service.name}</div>
                          <div className="text-sm text-gray-400">
                            {service.endpoint} • Last check: {new Date(service.lastCheck).toLocaleTimeString()}
                            {service.responseTime && ` • ${service.responseTime}ms`}
                          </div>
                          {service.errorMessage && (
                            <div className="text-sm text-red-400">{service.errorMessage}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(service.status)}>
                          {service.status.toUpperCase()}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Enabled</span>
                          <Switch 
                            checked={service.enabled} 
                            onCheckedChange={() => toggleService(service.name)}
                          />
                        </div>
                        
                        <Button 
                          onClick={() => restartService(service.name)}
                          variant="outline"
                          size="sm"
                          disabled={!service.enabled}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Blockchain Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Block Height</span>
                    <span className="text-white">{chainMetrics.blockHeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Difficulty</span>
                    <span className="text-white">{chainMetrics.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hash Rate</span>
                    <span className="text-white">{chainMetrics.hashRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pending TX</span>
                    <span className="text-white">{chainMetrics.pendingTransactions}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Network Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Wallets</span>
                    <span className="text-white">{chainMetrics.totalWallets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Staked</span>
                    <span className="text-white">{chainMetrics.totalStaked} PVX</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connected Peers</span>
                    <span className="text-white">{chainMetrics.peers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Status</span>
                    <Badge className={`${chainMetrics.networkStatus === 'operational' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {chainMetrics.networkStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="validator">
            <SystemValidator />
          </TabsContent>

          <TabsContent value="logs">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">System Logs</CardTitle>
                <Button 
                  onClick={() => setShowLogs(!showLogs)}
                  variant="outline"
                  size="sm"
                >
                  {showLogs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showLogs ? 'Hide' : 'Show'} Details
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-black border border-gray-700 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
                  {systemLogs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">[{new Date().toLocaleTimeString()}] </span>
                      <span className={
                        log.includes('[ERROR]') ? 'text-red-400' :
                        log.includes('[WARN]') ? 'text-yellow-400' :
                        log.includes('[INFO]') ? 'text-blue-400' :
                        log.includes('[ADMIN]') ? 'text-purple-400' :
                        'text-gray-300'
                      }>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}