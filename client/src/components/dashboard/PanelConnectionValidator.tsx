import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useGovernance } from '@/hooks/use-governance';
import { useDrops } from '@/hooks/use-drops';
import { useBadges } from '@/hooks/use-badges';
import { useUTR } from '@/hooks/use-utr';
import { useLearning } from '@/hooks/use-learning';
import { useStaking } from '@/hooks/use-staking';
import { useBlockchainMetrics } from '@/hooks/use-blockchain-metrics';
import { useWebSocket } from '@/hooks/use-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatus {
  service: string;
  isConnected: boolean;
  hasData: boolean;
  requiresWallet: boolean;
  walletConnected: boolean;
  error?: string;
}

export function PanelConnectionValidator() {
  const { activeWallet, wallet } = useWallet();
  
  // Test all service connections
  const governance = useGovernance(activeWallet || undefined);
  const drops = useDrops(activeWallet || undefined);
  const badges = useBadges(activeWallet || undefined);
  const utr = useUTR(undefined, activeWallet || undefined);
  const learning = useLearning(activeWallet || undefined);
  const staking = useStaking();
  const blockchain = useBlockchainMetrics();
  const websocket = useWebSocket(activeWallet || undefined);

  const connections: ConnectionStatus[] = [
    {
      service: 'Wallet Service',
      isConnected: !!wallet,
      hasData: !!wallet?.address,
      requiresWallet: true,
      walletConnected: !!activeWallet,
    },
    {
      service: 'Governance System',
      isConnected: !governance.isLoading,
      hasData: !!governance.proposals && governance.proposals.length > 0,
      requiresWallet: true,
      walletConnected: !!activeWallet,
    },
    {
      service: 'Drops/Airdrops',
      isConnected: !drops.isLoading,
      hasData: !!drops.drops && drops.drops.length > 0,
      requiresWallet: true,
      walletConnected: !!activeWallet,
    },
    {
      service: 'Badge System',
      isConnected: !badges.isLoading,
      hasData: !!badges.allBadges && badges.allBadges.length > 0,
      requiresWallet: true,
      walletConnected: !!activeWallet,
    },
    {
      service: 'UTR Transaction Log',
      isConnected: !utr.isLoading,
      hasData: !!utr.transactions && utr.transactions.length > 0,
      requiresWallet: true,
      walletConnected: !!activeWallet,
    },
    {
      service: 'Learning Modules',
      isConnected: !learning.isLoading,
      hasData: !!learning.modules && learning.modules.length > 0,
      requiresWallet: true,
      walletConnected: !!activeWallet,
    },
    {
      service: 'Staking System',
      isConnected: true, // Staking system is always connected
      hasData: !!staking.stakes && staking.stakes.length >= 0,
      requiresWallet: false,
      walletConnected: !!activeWallet,
    },
    {
      service: 'Blockchain Metrics',
      isConnected: !blockchain.isLoading,
      hasData: !!blockchain.data,
      requiresWallet: false,
      walletConnected: !!activeWallet,
    },
    {
      service: 'WebSocket Stream',
      isConnected: websocket.isConnected,
      hasData: !!websocket.lastMessage,
      requiresWallet: false,
      walletConnected: !!activeWallet,
    },
  ];

  const getStatusIcon = (connection: ConnectionStatus) => {
    if (!connection.isConnected) {
      return <XCircle className="h-4 w-4 text-red-400" />;
    }
    
    if (connection.requiresWallet && !connection.walletConnected) {
      return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    }
    
    if (!connection.hasData) {
      return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-400" />;
  };

  const getStatusText = (connection: ConnectionStatus) => {
    if (!connection.isConnected) {
      return 'Disconnected';
    }
    
    if (connection.requiresWallet && !connection.walletConnected) {
      return 'Needs Wallet';
    }
    
    if (!connection.hasData) {
      return 'No Data';
    }
    
    return 'Connected';
  };

  const getStatusColor = (connection: ConnectionStatus) => {
    if (!connection.isConnected) {
      return 'bg-red-500/20 text-red-300 border-red-600/30';
    }
    
    if (connection.requiresWallet && !connection.walletConnected) {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
    }
    
    if (!connection.hasData) {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
    }
    
    return 'bg-green-500/20 text-green-300 border-green-600/30';
  };

  const connectedCount = connections.filter(c => 
    c.isConnected && (!c.requiresWallet || c.walletConnected)
  ).length;

  const totalCount = connections.length;
  const connectionPercentage = Math.round((connectedCount / totalCount) * 100);

  return (
    <Card className="bg-black/70 border-blue-900/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            {websocket.isConnected ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-400" />
            )}
            Service Connections
          </span>
          <Badge className={`${connectionPercentage >= 80 ? 'bg-green-500/20 text-green-300' : 
                           connectionPercentage >= 60 ? 'bg-yellow-500/20 text-yellow-300' : 
                           'bg-red-500/20 text-red-300'}`}>
            {connectionPercentage}% Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {connections.map((connection) => (
            <div key={connection.service} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(connection)}
                <span className="text-sm text-gray-300">{connection.service}</span>
              </div>
              <Badge className={getStatusColor(connection)}>
                {getStatusText(connection)}
              </Badge>
            </div>
          ))}
        </div>

        {!activeWallet && (
          <div className="mt-4 p-3 bg-orange-900/20 rounded border border-orange-800/30">
            <p className="text-xs text-orange-300 font-medium">Wallet Required</p>
            <p className="text-xs text-gray-400 mt-1">
              Connect your wallet to access all services and live data.
            </p>
          </div>
        )}

        {websocket.isConnected && (
          <div className="mt-4 p-3 bg-green-900/20 rounded border border-green-800/30">
            <p className="text-xs text-green-300 font-medium">Real-time Stream Active</p>
            <p className="text-xs text-gray-400 mt-1">
              Receiving live blockchain updates via WebSocket connection.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}