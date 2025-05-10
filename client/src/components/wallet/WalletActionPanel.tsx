import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'wouter';
import { ArrowUpRight, Coins, Scale, Power, Server } from 'lucide-react';

interface WalletActionPanelProps {
  address: string;
  balance: string;
}

export function WalletActionPanel({ address, balance }: WalletActionPanelProps) {
  const [currentTab, setCurrentTab] = useState('quick-actions');
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'stake',
      title: 'Stake PVX',
      description: 'Earn rewards by staking your tokens in a pool',
      icon: <Coins className="h-8 w-8 text-cyan-400" />,
      action: () => navigate('/staking'),
    },
    {
      id: 'mine',
      title: 'Mine PVX',
      description: 'Start mining to earn new PVX tokens',
      icon: <Server className="h-8 w-8 text-cyan-400" />,
      action: () => navigate('/mining'),
    },
    {
      id: 'governance',
      title: 'Governance',
      description: 'Participate in blockchain governance',
      icon: <Scale className="h-8 w-8 text-cyan-400" />,
      action: () => navigate('/governance'),
    },
    {
      id: 'power',
      title: 'Thringlets',
      description: 'Interact with your digital thringlet companions',
      icon: <Power className="h-8 w-8 text-cyan-400" />,
      action: () => navigate('/thringlets'),
    }
  ];

  return (
    <Card className="bg-card shadow-lg border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center">
          <span className="text-primary text-shadow-neon">Blockchain Actions</span>
        </CardTitle>
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
                  navigate={navigate}
                />
                <StakingPoolPreview 
                  id="hodl" 
                  name="HODL Pool" 
                  apy="12.8%" 
                  minStake="10,000 μPVX"
                  lockPeriod="90 days"
                  navigate={navigate}
                />
                <StakingPoolPreview 
                  id="validator" 
                  name="Validator Pool" 
                  apy="18.4%" 
                  minStake="50,000 μPVX"
                  lockPeriod="180 days"
                  navigate={navigate}
                />
                <StakingPoolPreview 
                  id="whales" 
                  name="Whale Pool" 
                  apy="24.0%" 
                  minStake="100,000 μPVX"
                  lockPeriod="365 days"
                  navigate={navigate}
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
  navigate: (path: string) => void;
}

function StakingPoolPreview({ id, name, apy, minStake, lockPeriod, navigate }: StakingPoolPreviewProps) {
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
          onClick={() => navigate(`/staking?pool=${id}`)}
        >
          Stake Now
        </Button>
      </div>
    </div>
  );
}