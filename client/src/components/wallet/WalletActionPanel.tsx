import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { ArrowUpRight, Coins, Scale, Power, Server, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import { ExportWalletKeys } from './ExportWalletKeys';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface WalletActionPanelProps {
  address: string;
  balance: string;
  connectionError?: boolean;
}

export function WalletActionPanel({ address, balance, connectionError = false }: WalletActionPanelProps) {
  const [currentTab, setCurrentTab] = useState('quick-actions');
  const [, setLocation] = useLocation();
  const { refreshWalletBalance } = useWallet();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'unstable' | 'disconnected'>('connected');

  // Check network status periodically
  useEffect(() => {
    // Initial check
    checkNetworkStatus();
    
    // Set up periodic checks
    const intervalId = setInterval(checkNetworkStatus, 15000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Check network connection to server
  const checkNetworkStatus = async () => {
    try {
      const result = await apiRequest('GET', '/api/health', undefined, { 
        retryCount: 1 // Only try once, we don't want too many retries
      });
      if (result.ok) {
        setNetworkStatus('connected');
      } else {
        setNetworkStatus('unstable');
      }
    } catch (error) {
      setNetworkStatus('unstable');
    }
  };
  
  // Manual refresh of wallet data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWalletBalance();
      await checkNetworkStatus();
      toast({
        title: "Data refreshed",
        description: "Wallet data has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh wallet data. Will retry automatically.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const quickActions = [
    {
      id: 'stake',
      title: 'Stake PVX',
      description: 'Earn rewards by staking your tokens in a pool',
      icon: <Coins className="h-8 w-8 text-cyan-400" />,
      action: () => setLocation('/staking'),
    },
    {
      id: 'mine',
      title: 'Mine PVX',
      description: 'Start mining to earn new PVX tokens',
      icon: <Server className="h-8 w-8 text-cyan-400" />,
      action: () => setLocation('/mining'),
    },
    {
      id: 'governance',
      title: 'Governance',
      description: 'Participate in blockchain governance',
      icon: <Scale className="h-8 w-8 text-cyan-400" />,
      action: () => setLocation('/governance'),
    },
    {
      id: 'power',
      title: 'Thringlets',
      description: 'Interact with your digital thringlet companions',
      icon: <Power className="h-8 w-8 text-cyan-400" />,
      action: () => setLocation('/thringlets'),
    }
  ];

  return (
    <Card className={`bg-card shadow-lg ${connectionError || networkStatus === 'unstable' ? 'border-amber-600/50' : 'border-border'}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary text-shadow-neon">Blockchain Actions</span>
            
            {/* Network status indicator */}
            {connectionError || networkStatus === 'unstable' ? (
              <div className="flex items-center gap-1 text-xs bg-amber-900/30 text-amber-400 px-2 py-1 rounded-full">
                <AlertTriangle size={12} />
                <span>Unstable Connection</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                <Shield size={12} />
                <span>Connected</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className="text-primary" />
            </Button>
            <ExportWalletKeys walletAddress={address} />
          </div>
        </CardTitle>
        
        {/* Connection error warning banner */}
        {connectionError && (
          <div className="bg-amber-950/30 border border-amber-700/30 text-amber-400 p-3 rounded-md text-sm mt-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Connection issues detected</p>
                <p className="text-amber-300/70 text-xs mt-1">
                  Some wallet data may not be current. Data will be automatically synchronized when the connection improves.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 h-auto">
            <TabsTrigger value="quick-actions" className="py-2">Quick Actions</TabsTrigger>
            <TabsTrigger value="staking-pools" className="py-2">Staking Pools</TabsTrigger>
          </TabsList>

          <TabsContent value="quick-actions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <div 
                  key={action.id}
                  className="bg-gray-900 p-4 rounded-lg border border-primary-dark hover:border-primary transition-all cursor-pointer"
                  onClick={action.action}
                >
                  <div className="flex items-start space-x-4">
                    <div className="mt-1 bg-black bg-opacity-50 p-2 rounded-lg">
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary flex items-center">
                        {action.title}
                        <ArrowUpRight className="ml-1 h-4 w-4" />
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staking-pools" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <StakingPoolPreview 
                  id="genesis" 
                  name="Genesis Pool" 
                  apy="6.5%" 
                  minStake="1,000 μPVX"
                  lockPeriod="30 days"
                  setLocation={setLocation}
                />
                <StakingPoolPreview 
                  id="hodl" 
                  name="HODL Pool" 
                  apy="12.8%" 
                  minStake="10,000 μPVX"
                  lockPeriod="90 days"
                  setLocation={setLocation}
                />
                <StakingPoolPreview 
                  id="validator" 
                  name="Validator Pool" 
                  apy="18.4%" 
                  minStake="50,000 μPVX"
                  lockPeriod="180 days"
                  setLocation={setLocation}
                />
                <StakingPoolPreview 
                  id="whales" 
                  name="Whale Pool" 
                  apy="24.0%" 
                  minStake="100,000 μPVX"
                  lockPeriod="365 days"
                  setLocation={setLocation}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface StakingPoolPreviewProps {
  id: string;
  name: string;
  apy: string;
  minStake: string;
  lockPeriod: string;
  setLocation: (path: string) => void;
}

function StakingPoolPreview({ id, name, apy, minStake, lockPeriod, setLocation }: StakingPoolPreviewProps) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-primary-dark hover:border-primary transition-all">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-primary text-shadow-neon">{name}</h3>
          <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-gray-400">
            <div>
              <p className="text-xs uppercase">APY</p>
              <p className="font-medium text-emerald-400">{apy}</p>
            </div>
            <div>
              <p className="text-xs uppercase">Min Stake</p>
              <p>{minStake}</p>
            </div>
            <div>
              <p className="text-xs uppercase">Lock Period</p>
              <p>{lockPeriod}</p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation(`/staking?pool=${id}`)}
        >
          Stake Now
        </Button>
      </div>
    </div>
  );
}