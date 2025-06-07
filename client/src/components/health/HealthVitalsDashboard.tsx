import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Heart,
  Loader2,
  Server,
  Wifi,
  Zap
} from 'lucide-react';

interface HealthMetrics {
  systemUptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  queueDepth: number;
  errorRate: number;
  lastUpdated: number;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  responseTime: number;
  uptime: number;
  errorCount: number;
  lastCheck: number;
}

interface BlockchainVitals {
  blockHeight: number;
  blockTime: number;
  networkHashRate: number;
  difficulty: number;
  peerCount: number;
  syncStatus: boolean;
  chainIntegrity: number;
  consensusHealth: number;
}

export default function HealthVitalsDashboard() {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [blockchainVitals, setBlockchainVitals] = useState<BlockchainVitals | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async () => {
    setIsLoading(true);
    try {
      const [metricsResponse, servicesResponse, blockchainResponse] = await Promise.all([
        fetch('/api/health/metrics'),
        fetch('/api/health/services'),
        fetch('/api/health/blockchain')
      ]);

      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();
        setHealthMetrics(metrics);
      }

      if (servicesResponse.ok) {
        const services = await servicesResponse.json();
        setServiceHealth(services);
      }

      if (blockchainResponse.ok) {
        const vitals = await blockchainResponse.json();
        setBlockchainVitals(vitals);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'critical': return 'text-orange-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'offline': return <Server className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="w-6 h-6 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Blockchain Health Vitals</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={fetchHealthData}
            disabled={isLoading}
            className="bg-blue-700 hover:bg-blue-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            className={autoRefresh ? "bg-green-700 hover:bg-green-600" : ""}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/20 to-black border-blue-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-400 text-sm font-medium">System Uptime</h3>
                <div className="text-2xl font-bold text-white">
                  {healthMetrics ? formatUptime(healthMetrics.systemUptime) : 'Loading...'}
                </div>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-black border-green-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-400 text-sm font-medium">CPU Usage</h3>
                <div className="text-2xl font-bold text-white">
                  {healthMetrics ? `${healthMetrics.cpuUsage}%` : 'Loading...'}
                </div>
                {healthMetrics && (
                  <Progress 
                    value={healthMetrics.cpuUsage} 
                    className="mt-2 h-2" 
                  />
                )}
              </div>
              <Cpu className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-purple-400 text-sm font-medium">Memory Usage</h3>
                <div className="text-2xl font-bold text-white">
                  {healthMetrics ? `${healthMetrics.memoryUsage}%` : 'Loading...'}
                </div>
                {healthMetrics && (
                  <Progress 
                    value={healthMetrics.memoryUsage} 
                    className="mt-2 h-2" 
                  />
                )}
              </div>
              <Database className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-400 text-sm font-medium">Network Latency</h3>
                <div className="text-2xl font-bold text-white">
                  {healthMetrics ? `${healthMetrics.networkLatency}ms` : 'Loading...'}
                </div>
              </div>
              <Wifi className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Health Matrix */}
      <Card className="bg-gradient-to-br from-gray-900/20 to-black border-gray-700/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Server className="w-5 h-5 mr-2 text-gray-400" />
            Service Health Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceHealth.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceHealth.map((service, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={getStatusColor(service.status)}>
                        {getStatusIcon(service.status)}
                      </div>
                      <span className="text-white font-medium">{service.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(service.status)} border-current`}
                    >
                      {service.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Response Time:</span>
                      <span className="text-white">{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-white">{service.uptime.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Error Count:</span>
                      <span className={service.errorCount > 0 ? "text-red-400" : "text-green-400"}>
                        {service.errorCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Loading service health data...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blockchain Vitals */}
      <Card className="bg-gradient-to-br from-indigo-900/20 to-black border-indigo-700/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-400" />
            Blockchain Network Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockchainVitals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-indigo-900/20 rounded-lg p-4">
                <h4 className="text-indigo-400 text-sm font-medium mb-2">Block Height</h4>
                <div className="text-2xl font-bold text-white">{blockchainVitals.blockHeight}</div>
                <div className="text-xs text-gray-400">Current chain height</div>
              </div>
              
              <div className="bg-green-900/20 rounded-lg p-4">
                <h4 className="text-green-400 text-sm font-medium mb-2">Block Time</h4>
                <div className="text-2xl font-bold text-white">{blockchainVitals.blockTime}s</div>
                <div className="text-xs text-gray-400">Average block time</div>
              </div>
              
              <div className="bg-purple-900/20 rounded-lg p-4">
                <h4 className="text-purple-400 text-sm font-medium mb-2">Network Hash Rate</h4>
                <div className="text-2xl font-bold text-white">{blockchainVitals.networkHashRate.toFixed(1)}</div>
                <div className="text-xs text-gray-400">MH/s total</div>
              </div>
              
              <div className="bg-orange-900/20 rounded-lg p-4">
                <h4 className="text-orange-400 text-sm font-medium mb-2">Difficulty</h4>
                <div className="text-2xl font-bold text-white">{blockchainVitals.difficulty}</div>
                <div className="text-xs text-gray-400">Current difficulty</div>
              </div>
              
              <div className="bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-blue-400 text-sm font-medium mb-2">Peer Count</h4>
                <div className="text-2xl font-bold text-white">{blockchainVitals.peerCount}</div>
                <div className="text-xs text-gray-400">Connected peers</div>
              </div>
              
              <div className="bg-yellow-900/20 rounded-lg p-4">
                <h4 className="text-yellow-400 text-sm font-medium mb-2">Sync Status</h4>
                <div className={`text-2xl font-bold ${blockchainVitals.syncStatus ? 'text-green-400' : 'text-red-400'}`}>
                  {blockchainVitals.syncStatus ? 'SYNCED' : 'SYNCING'}
                </div>
                <div className="text-xs text-gray-400">Network sync status</div>
              </div>
              
              <div className="bg-cyan-900/20 rounded-lg p-4">
                <h4 className="text-cyan-400 text-sm font-medium mb-2">Chain Integrity</h4>
                <div className="text-2xl font-bold text-white">{blockchainVitals.chainIntegrity}%</div>
                <Progress value={blockchainVitals.chainIntegrity} className="mt-2 h-2" />
              </div>
              
              <div className="bg-pink-900/20 rounded-lg p-4">
                <h4 className="text-pink-400 text-sm font-medium mb-2">Consensus Health</h4>
                <div className="text-2xl font-bold text-white">{blockchainVitals.consensusHealth.toFixed(1)}%</div>
                <Progress value={blockchainVitals.consensusHealth} className="mt-2 h-2" />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Loading blockchain vitals...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {healthMetrics && (
        <Card className="bg-gradient-to-br from-red-900/20 to-black border-red-700/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-red-400" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-900/20 rounded-lg p-4">
                <h4 className="text-red-400 text-sm font-medium mb-2">Active Connections</h4>
                <div className="text-2xl font-bold text-white">{healthMetrics.activeConnections}</div>
                <div className="text-xs text-gray-400">WebSocket connections</div>
              </div>
              
              <div className="bg-yellow-900/20 rounded-lg p-4">
                <h4 className="text-yellow-400 text-sm font-medium mb-2">Queue Depth</h4>
                <div className="text-2xl font-bold text-white">{healthMetrics.queueDepth}</div>
                <div className="text-xs text-gray-400">Pending operations</div>
              </div>
              
              <div className="bg-orange-900/20 rounded-lg p-4">
                <h4 className="text-orange-400 text-sm font-medium mb-2">Error Rate</h4>
                <div className="text-2xl font-bold text-white">{healthMetrics.errorRate.toFixed(2)}%</div>
                <div className="text-xs text-gray-400">Last 24 hours</div>
                <Progress value={healthMetrics.errorRate} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      {healthMetrics && (
        <div className="text-center text-gray-400 text-sm">
          Last updated: {new Date(healthMetrics.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}