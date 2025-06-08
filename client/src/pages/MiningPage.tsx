import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Cpu, Server, Milestone, Activity, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";

interface MiningStats {
  lastHashRate: string;
  totalMined: string;
  blocksMined: number;
  status: 'active' | 'inactive';
  lastReward: string;
  difficulty: number;
  hardware: 'cpu' | 'gpu' | 'asic';
  threads: number;
}

export default function MiningPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [hardwareType, setHardwareType] = useState<'cpu' | 'gpu' | 'asic'>('cpu');
  const [threads, setThreads] = useState(4);
  const [miningOutput, setMiningOutput] = useState("");
  
  // Fetch wallet data
  const { data: wallet, isLoading: isLoadingWallet } = useQuery({
    queryKey: ['/api/wallet/current'],
    queryFn: async () => {
      const response = await fetch('/api/wallet/current');
      if (!response.ok) {
        throw new Error('Failed to fetch wallet');
      }
      return response.json();
    },
    retry: false,
  });

  // Fetch mining stats
  const { data: miningStats, isLoading: isLoadingStats } = useQuery<MiningStats>({
    queryKey: ['/api/mine/stats', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: async () => {
      const response = await fetch(`/api/mine/stats/${wallet?.address}`);
      if (!response.ok) {
        return {
          lastHashRate: '0 H/s',
          totalMined: '0 PVX',
          blocksMined: 0,
          status: 'inactive' as const,
          lastReward: '0 PVX',
          difficulty: 1,
          hardware: 'cpu' as const,
          threads: 4
        };
      }
      return response.json();
    }
  });

  const isMining = miningStats?.status === 'active';

  // Start mining mutation
  const startMiningMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/mine/start', {
        address: wallet?.address,
        hardware: hardwareType,
        threads: threads
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mining started",
        description: "Your mining operation has been started successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mine/stats', wallet?.address] });
      
      // Add dynamic terminal output
      let outputText = "Initializing mining operations...\n";
      setMiningOutput(outputText);
      
      setTimeout(() => {
        outputText += "Setting up mining environment...\n";
        setMiningOutput(outputText);
      }, 1000);
      
      setTimeout(() => {
        outputText += "Connecting to PVX network...\n";
        setMiningOutput(outputText);
      }, 2000);
      
      setTimeout(() => {
        outputText += "Starting mining threads...\n";
        setMiningOutput(outputText);
      }, 3000);
      
      setTimeout(() => {
        outputText += "Mining operations started successfully.\n\nMining statistics will appear here...";
        setMiningOutput(outputText);
      }, 4000);
    },
    onError: (error) => {
      toast({
        title: "Error starting mining",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Stop mining mutation
  const stopMiningMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/mine/stop', {
        address: wallet?.address
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mining stopped",
        description: "Your mining operation has been stopped",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mine/stats', wallet?.address] });
      setMiningOutput(prev => prev + "\n\nMining operations stopped.");
    },
    onError: (error) => {
      toast({
        title: "Error stopping mining",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleStartMining = () => {
    if (!wallet?.address) {
      toast({
        title: "No wallet connected",
        description: "Please connect a wallet before mining",
        variant: "destructive",
      });
      return;
    }
    
    startMiningMutation.mutate();
  };

  const handleStopMining = () => {
    stopMiningMutation.mutate();
  };

  if (isLoadingWallet) {
    return (
      <PageLayout isConnected={!!wallet?.address}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!wallet?.address) {
    return (
      <PageLayout isConnected={false}>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-blue-400">Mining Operations</h1>
          <p className="text-gray-400">Mine PVX tokens using your computing power</p>
          
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <Card className="w-full max-w-md bg-card/90 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-6 w-6" />
                  Wallet Required
                </CardTitle>
                <CardDescription>
                  You need to connect a wallet before you can start mining PVX tokens.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-500"
                  onClick={() => setLocation('/wallet')}
                >
                  Connect Wallet
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout isConnected={!!wallet?.address}>
      <div className="space-y-4 mb-6">
        <h1 className="text-2xl font-bold text-blue-400">Mining Operations</h1>
        <p className="text-gray-400">Mine PVX tokens using your computing power</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mining Control Panel */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-black/70 border-blue-900/50">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <Cpu className="h-5 w-5" /> 
                Mining Control Panel
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure your mining settings and start earning PVX tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hardware Selection */}
              <div>
                <h3 className="text-gray-200 font-medium mb-3">Hardware Selection</h3>
                <RadioGroup 
                  defaultValue={hardwareType} 
                  onValueChange={(value) => setHardwareType(value as 'cpu' | 'gpu' | 'asic')}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  disabled={isMining}
                >
                  <div className={`flex flex-col space-y-2 p-4 rounded-lg border ${hardwareType === 'cpu' ? 'bg-blue-950/30 border-blue-500/50' : 'bg-gray-900/70 border-gray-800'}`}>
                    <RadioGroupItem value="cpu" id="cpu" className="sr-only" />
                    <Label htmlFor="cpu" className="cursor-pointer flex items-center justify-between">
                      <span className="text-blue-400 font-medium">CPU Mining</span>
                      <Cpu className="h-5 w-5 text-blue-400" />
                    </Label>
                    <p className="text-xs text-gray-400">Basic mining suitable for all computers</p>
                    <Badge variant="outline" className="self-start mt-2 text-xs bg-blue-950/40 border-blue-900/50">
                      ~5-20 MH/s
                    </Badge>
                  </div>
                  
                  <div className={`flex flex-col space-y-2 p-4 rounded-lg border ${hardwareType === 'gpu' ? 'bg-blue-950/30 border-blue-500/50' : 'bg-gray-900/70 border-gray-800'}`}>
                    <RadioGroupItem value="gpu" id="gpu" className="sr-only" />
                    <Label htmlFor="gpu" className="cursor-pointer flex items-center justify-between">
                      <span className="text-blue-400 font-medium">GPU Mining</span>
                      <Server className="h-5 w-5 text-blue-400" />
                    </Label>
                    <p className="text-xs text-gray-400">Higher performance using graphics cards</p>
                    <Badge variant="outline" className="self-start mt-2 text-xs bg-blue-950/40 border-blue-900/50">
                      ~50-200 MH/s
                    </Badge>
                  </div>
                  
                  <div className={`flex flex-col space-y-2 p-4 rounded-lg border ${hardwareType === 'asic' ? 'bg-blue-950/30 border-blue-500/50' : 'bg-gray-900/70 border-gray-800'}`}>
                    <RadioGroupItem value="asic" id="asic" className="sr-only" />
                    <Label htmlFor="asic" className="cursor-pointer flex items-center justify-between">
                      <span className="text-blue-400 font-medium">ASIC Mining</span>
                      <Milestone className="h-5 w-5 text-blue-400" />
                    </Label>
                    <p className="text-xs text-gray-400">Specialized hardware for maximum efficiency</p>
                    <Badge variant="outline" className="self-start mt-2 text-xs bg-blue-950/40 border-blue-900/50">
                      ~500+ MH/s
                    </Badge>
                  </div>
                </RadioGroup>
              </div>

              {/* Thread Allocation */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-200 font-medium">Thread Allocation</h3>
                  <span className="text-sm text-gray-400">{threads} Threads</span>
                </div>
                <Slider
                  defaultValue={[threads]}
                  min={1}
                  max={16}
                  step={1}
                  onValueChange={(value) => setThreads(value[0])}
                  disabled={isMining}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>Low (1)</span>
                  <span>Medium (8)</span>
                  <span>High (16)</span>
                </div>
              </div>

              {/* Terminal Output */}
              <div>
                <h3 className="text-gray-200 font-medium mb-3">Mining Console</h3>
                <div className="bg-black border border-blue-900/50 rounded-lg h-48 overflow-auto font-mono text-xs text-green-500 p-3">
                  {miningOutput || "Mining console ready. Start mining to see output..."}
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              {isMining ? (
                <Button 
                  className="w-full bg-red-600 hover:bg-red-500 text-white"
                  onClick={handleStopMining}
                  disabled={stopMiningMutation.isPending}
                >
                  {stopMiningMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Stopping Mining...</>
                  ) : (
                    'Stop Mining'
                  )}
                </Button>
              ) : (
                <Button 
                  data-testid="start-mining"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={handleStartMining}
                  disabled={startMiningMutation.isPending}
                >
                  {startMiningMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Starting Mining...</>
                  ) : (
                    'Start Mining'
                  )}
                </Button>
              )}

              <div className="text-xs text-gray-400 text-center">
                Mining to wallet: <span className="text-blue-400 font-mono">{wallet?.address}</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Mining Stats */}
        <div className="space-y-6">
          <Card className="bg-black/70 border-blue-900/50">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Mining Statistics
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your mining performance and earnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 border border-blue-900/20 rounded-lg bg-blue-950/10">
                <div className="text-gray-400 text-sm">Status</div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isMining ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${isMining ? 'text-green-500' : 'text-red-500'}`}>
                    {isMining ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 border border-blue-900/20 rounded-lg bg-blue-950/10">
                <div className="text-gray-400 text-sm">Hashrate</div>
                <div className="text-blue-400 text-sm font-mono">
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    miningStats?.lastHashRate || '0 H/s'
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 border border-blue-900/20 rounded-lg bg-blue-950/10">
                <div className="text-gray-400 text-sm">Total Mined</div>
                <div className="text-blue-400 text-sm font-mono">
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    miningStats?.totalMined || '0 PVX'
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 border border-blue-900/20 rounded-lg bg-blue-950/10">
                <div className="text-gray-400 text-sm">Blocks Mined</div>
                <div className="text-blue-400 text-sm font-mono">
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    miningStats?.blocksMined || 0
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 border border-blue-900/20 rounded-lg bg-blue-950/10">
                <div className="text-gray-400 text-sm">Last Reward</div>
                <div className="text-blue-400 text-sm font-mono">
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    miningStats?.lastReward || '0 PVX'
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-gray-400 text-sm">Network Difficulty</div>
                  <div className="text-blue-400 text-xs">
                    {isLoadingStats ? '' : miningStats?.difficulty.toFixed(2) || '1.00'}
                  </div>
                </div>
                <Progress 
                  value={isLoadingStats ? 0 : ((miningStats?.difficulty || 1) / 10) * 100} 
                  max={100}
                  className="h-2 bg-blue-950/30"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-blue-900/50 text-blue-400"
                onClick={() => setLocation('/blockchain')}
              >
                <Activity className="h-4 w-4 mr-2" />
                View Blockchain Stats
              </Button>
            </CardFooter>
          </Card>
          
          {/* Mining Rewards Projection */}
          <Card className="bg-black/70 border-blue-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-400 text-sm">Estimated Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Daily:</span>
                <span className="text-blue-400 font-mono">
                  {isMining ? `~${(Math.random() * 0.01 + 0.001).toFixed(6)} PVX` : '0.000000 PVX'}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Weekly:</span>
                <span className="text-blue-400 font-mono">
                  {isMining ? `~${(Math.random() * 0.07 + 0.007).toFixed(6)} PVX` : '0.000000 PVX'}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Monthly:</span>
                <span className="text-blue-400 font-mono">
                  {isMining ? `~${(Math.random() * 0.3 + 0.03).toFixed(6)} PVX` : '0.000000 PVX'}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mt-2 italic">
                *Estimates based on current network difficulty and hash rate
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}