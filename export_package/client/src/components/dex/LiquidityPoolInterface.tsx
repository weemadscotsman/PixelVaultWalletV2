import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { PlusCircle, DropletIcon, WalletIcon, Percent, BarChart2 } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useTokens, useLiquidityPools, useCreateLPPosition, useCreatePool } from '@/hooks/use-dex';
// Import format utilities directly from relative path
import { formatTokenAmount, formatPercent } from '../../lib/format';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LiquidityPoolInterface() {
  const { wallet } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('add');
  
  // Pool creation/addition state
  const [token0Id, setToken0Id] = useState<number | undefined>();
  const [token1Id, setToken1Id] = useState<number | undefined>();
  const [token0Amount, setToken0Amount] = useState<string>('');
  const [token1Amount, setToken1Amount] = useState<string>('');
  const [selectedPoolId, setSelectedPoolId] = useState<number | undefined>();
  const [feePercentage, setFeePercentage] = useState<string>('0.3');
  
  // Load data
  const { data: tokens, isLoading: isLoadingTokens } = useTokens();
  const { data: pools, isLoading: isLoadingPools } = useLiquidityPools();
  
  // Mutations
  const createPositionMutation = useCreateLPPosition();
  const createPoolMutation = useCreatePool();
  
  // Get selected tokens
  const token0 = tokens?.find(t => t.id === token0Id);
  const token1 = tokens?.find(t => t.id === token1Id);
  const selectedPool = pools?.find(p => p.id === selectedPoolId);
  
  // Effect to auto-select pool if tokens are selected
  useEffect(() => {
    if (token0Id && token1Id && pools && activeTab === 'add') {
      const matchingPool = pools.find(p => 
        (p.token0_id === token0Id && p.token1_id === token1Id) || 
        (p.token0_id === token1Id && p.token1_id === token0Id)
      );
      
      if (matchingPool) {
        setSelectedPoolId(matchingPool.id);
      } else {
        setSelectedPoolId(undefined);
      }
    }
  }, [token0Id, token1Id, pools, activeTab]);
  
  // Calculate LP token amount for add liquidity
  const calculateLPTokens = (): string => {
    if (!selectedPool || !token0Amount || !token1Amount) return '0';
    
    // Simple proportion calculation
    // lp_tokens = sqrt(token0_amount * token1_amount) proportional to existing ratio
    const token0BigInt = BigInt(token0Amount);
    const token1BigInt = BigInt(token1Amount);
    const existingToken0 = BigInt(selectedPool.token0_amount);
    const existingToken1 = BigInt(selectedPool.token1_amount);
    const existingLP = BigInt(selectedPool.lp_token_supply);
    
    // Calculate based on minimum proportion to avoid price impact
    const lpFromToken0 = (token0BigInt * existingLP) / existingToken0;
    const lpFromToken1 = (token1BigInt * existingLP) / existingToken1;
    
    // Return the smaller value to avoid price impact
    return lpFromToken0 < lpFromToken1 ? lpFromToken0.toString() : lpFromToken1.toString();
  };
  
  // Calculate liquidity pool token supply for new pool
  const calculateNewPoolLPSupply = (): string => {
    if (!token0Amount || !token1Amount) return '0';
    
    // For a new pool, LP tokens = sqrt(token0_amount * token1_amount) * 1000
    const token0Num = Number(token0Amount);
    const token1Num = Number(token1Amount);
    
    // Scale factor for readability (1000 LP tokens per unit of liquidity)
    const scaleFactor = 1000;
    
    return Math.floor(Math.sqrt(token0Num * token1Num) * scaleFactor).toString();
  };
  
  // Add liquidity to existing pool
  const handleAddLiquidity = async () => {
    if (!wallet || !selectedPool || !token0Id || !token1Id || !token0Amount || !token1Amount) {
      toast({
        title: "Cannot add liquidity",
        description: "Please check your inputs and try again",
        variant: "destructive"
      });
      return;
    }
    
    const lpTokenAmount = calculateLPTokens();
    
    try {
      await createPositionMutation.mutateAsync({
        pool_id: selectedPool.id,
        owner_address: wallet.address,
        lp_token_amount: lpTokenAmount,
        token0_amount: token0Amount,
        token1_amount: token1Amount
      });
      
      // Reset form on success
      setToken0Amount('');
      setToken1Amount('');
    } catch (error) {
      console.error("Failed to add liquidity:", error);
    }
  };
  
  // Create new liquidity pool
  const handleCreatePool = async () => {
    if (!wallet || !token0Id || !token1Id || !token0Amount || !token1Amount || !feePercentage) {
      toast({
        title: "Cannot create pool",
        description: "Please check your inputs and try again",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure tokens are in correct order (lower ID first)
    const sortedToken0Id = Math.min(token0Id, token1Id);
    const sortedToken1Id = Math.max(token0Id, token1Id);
    
    // Ensure token amounts match the sorted order
    const sortedToken0Amount = sortedToken0Id === token0Id ? token0Amount : token1Amount;
    const sortedToken1Amount = sortedToken0Id === token0Id ? token1Amount : token0Amount;
    
    const lpTokenSupply = calculateNewPoolLPSupply();
    const poolAddress = `zk_PVX:pool:${sortedToken0Id}-${sortedToken1Id}`;
    
    try {
      await createPoolMutation.mutateAsync({
        token0_id: sortedToken0Id,
        token1_id: sortedToken1Id,
        token0_amount: sortedToken0Amount,
        token1_amount: sortedToken1Amount,
        lp_token_supply: lpTokenSupply,
        swap_fee_percent: feePercentage,
        pool_address: poolAddress
      });
      
      // Reset form on success
      setToken0Amount('');
      setToken1Amount('');
      setFeePercentage('0.3');
    } catch (error) {
      console.error("Failed to create pool:", error);
    }
  };
  
  // Form validation
  const isAddLiquidityDisabled = 
    !wallet?.address ||
    !selectedPool ||
    !token0Amount ||
    !token1Amount ||
    token0Amount === '0' ||
    token1Amount === '0' ||
    createPositionMutation.isPending;
  
  const isCreatePoolDisabled = 
    !wallet?.address ||
    !token0Id ||
    !token1Id ||
    token0Id === token1Id ||
    !token0Amount ||
    !token1Amount ||
    token0Amount === '0' ||
    token1Amount === '0' ||
    !feePercentage ||
    createPoolMutation.isPending;
  
  return (
    <Card className="w-full max-w-md mx-auto bg-black/80 backdrop-blur-lg border-slate-800 shadow-lg shadow-blue-500/10">
      <CardHeader className="space-y-1 pb-3 border-b border-slate-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
            Liquidity
          </CardTitle>
          <Badge variant="outline" className="text-xs">Provide Liquidity, Earn Fees</Badge>
        </div>
        <CardDescription>
          Provide tokens to liquidity pools and earn trading fees
        </CardDescription>
      </CardHeader>
      
      <Tabs 
        defaultValue="add" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900">
            <TabsTrigger 
              value="add"
              className={`${activeTab === 'add' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              Add
            </TabsTrigger>
            <TabsTrigger 
              value="create"
              className={`${activeTab === 'create' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="view"
              className={`${activeTab === 'view' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              Pools
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="add" className="p-0 mt-0">
          <CardContent className="space-y-4 pt-4">
            {/* Pool Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-400">Pool</label>
              <Select
                value={selectedPoolId?.toString()}
                onValueChange={(value) => {
                  const poolId = parseInt(value);
                  setSelectedPoolId(poolId);
                  
                  // Update token selections based on pool
                  const pool = pools?.find(p => p.id === poolId);
                  if (pool) {
                    setToken0Id(pool.token0_id);
                    setToken1Id(pool.token1_id);
                  }
                }}
              >
                <SelectTrigger className="w-full bg-slate-900/80 border-slate-700/50">
                  <SelectValue placeholder="Select a pool" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 max-h-80">
                  {isLoadingPools ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                  ) : pools?.length === 0 ? (
                    <div className="p-3 text-center text-gray-400">
                      No pools available. Create one first.
                    </div>
                  ) : (
                    pools?.map((pool) => {
                      const token0 = tokens?.find(t => t.id === pool.token0_id);
                      const token1 = tokens?.find(t => t.id === pool.token1_id);
                      
                      return (
                        <SelectItem key={pool.id} value={pool.id.toString()}>
                          <div className="flex items-center">
                            <span>{token0?.symbol}/{token1?.symbol}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{pool.swap_fee_percent}%</Badge>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Token 0 Input */}
            <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-green-400">Token 0</label>
                {token0 && wallet && (
                  <span className="text-xs text-gray-400">
                    Balance: {formatTokenAmount(wallet.balance, token0.decimals)} {token0.symbol}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="0.0"
                  className="flex-1 bg-slate-900/50 border-slate-700/50 text-lg font-medium"
                  value={token0Amount}
                  disabled={!selectedPool}
                  onChange={(e) => {
                    // Only allow numbers and decimals
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    if (value.split('.').length > 2) return;
                    setToken0Amount(value);
                    
                    // TODO: Auto-calculate token1 amount based on pool ratio
                  }}
                />
                
                <div className="w-24 px-3 py-2 h-10 bg-slate-900/80 border border-slate-700/50 rounded-md flex items-center justify-center">
                  {token0 ? (
                    <span className="text-sm font-medium">{token0.symbol}</span>
                  ) : (
                    <Skeleton className="h-4 w-12" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Token 1 Input */}
            <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-pink-400">Token 1</label>
                {token1 && wallet && (
                  <span className="text-xs text-gray-400">
                    Balance: {formatTokenAmount(wallet.balance, token1.decimals)} {token1.symbol}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="0.0"
                  className="flex-1 bg-slate-900/50 border-slate-700/50 text-lg font-medium"
                  value={token1Amount}
                  disabled={!selectedPool}
                  onChange={(e) => {
                    // Only allow numbers and decimals
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    if (value.split('.').length > 2) return;
                    setToken1Amount(value);
                    
                    // TODO: Auto-calculate token0 amount based on pool ratio
                  }}
                />
                
                <div className="w-24 px-3 py-2 h-10 bg-slate-900/80 border border-slate-700/50 rounded-md flex items-center justify-center">
                  {token1 ? (
                    <span className="text-sm font-medium">{token1.symbol}</span>
                  ) : (
                    <Skeleton className="h-4 w-12" />
                  )}
                </div>
              </div>
            </div>
            
            {/* LP Tokens Received */}
            {selectedPool && token0Amount && token1Amount && (
              <div className="bg-slate-900/40 p-3 rounded-md text-center">
                <span className="text-sm text-gray-400">You will receive</span>
                <div className="text-lg font-bold text-white mt-1">
                  {formatTokenAmount(calculateLPTokens())} LP Tokens
                </div>
                <span className="text-xs text-gray-500 block mt-1">
                  ({token0?.symbol}/{token1?.symbol} Pool Shares)
                </span>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-2">
            <Button 
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-900/30"
              onClick={handleAddLiquidity}
              disabled={isAddLiquidityDisabled}
            >
              {createPositionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding Liquidity...
                </>
              ) : !wallet?.address ? (
                "Connect Wallet"
              ) : !selectedPool ? (
                "Select a Pool"
              ) : !token0Amount || !token1Amount || token0Amount === '0' || token1Amount === '0' ? (
                "Enter Token Amounts"
              ) : (
                "Add Liquidity"
              )}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="create" className="p-0 mt-0">
          <CardContent className="space-y-4 pt-4">
            {/* Token 0 Selection & Amount */}
            <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-green-400">Token 0</label>
                {token0 && wallet && (
                  <span className="text-xs text-gray-400">
                    Balance: {formatTokenAmount(wallet.balance, token0.decimals)} {token0.symbol}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="0.0"
                  className="flex-1 bg-slate-900/50 border-slate-700/50 text-lg font-medium"
                  value={token0Amount}
                  onChange={(e) => {
                    // Only allow numbers and decimals
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    if (value.split('.').length > 2) return;
                    setToken0Amount(value);
                  }}
                />
                
                <Select
                  value={token0Id?.toString()}
                  onValueChange={(value) => setToken0Id(parseInt(value))}
                >
                  <SelectTrigger className="w-32 bg-slate-900/80 border-slate-700/50">
                    <SelectValue placeholder="Token" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {isLoadingTokens ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      </div>
                    ) : (
                      tokens?.map((token) => (
                        <SelectItem 
                          key={token.id} 
                          value={token.id.toString()}
                          disabled={token.id === token1Id}
                        >
                          <div className="flex items-center">
                            <span>{token.symbol}</span>
                            {token.is_native && (
                              <Badge variant="outline" className="ml-2 text-xs">Native</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Token 1 Selection & Amount */}
            <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-pink-400">Token 1</label>
                {token1 && wallet && (
                  <span className="text-xs text-gray-400">
                    Balance: {formatTokenAmount(wallet.balance, token1.decimals)} {token1.symbol}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="0.0"
                  className="flex-1 bg-slate-900/50 border-slate-700/50 text-lg font-medium"
                  value={token1Amount}
                  onChange={(e) => {
                    // Only allow numbers and decimals
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    if (value.split('.').length > 2) return;
                    setToken1Amount(value);
                  }}
                />
                
                <Select
                  value={token1Id?.toString()}
                  onValueChange={(value) => setToken1Id(parseInt(value))}
                >
                  <SelectTrigger className="w-32 bg-slate-900/80 border-slate-700/50">
                    <SelectValue placeholder="Token" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {isLoadingTokens ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      </div>
                    ) : (
                      tokens?.map((token) => (
                        <SelectItem 
                          key={token.id} 
                          value={token.id.toString()}
                          disabled={token.id === token0Id}
                        >
                          <div className="flex items-center">
                            <span>{token.symbol}</span>
                            {token.is_native && (
                              <Badge variant="outline" className="ml-2 text-xs">Native</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Fee Percentage */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-400">Swap Fee</label>
              <div className="flex space-x-2">
                {['0.1', '0.3', '0.5', '1.0'].map((fee) => (
                  <Button
                    key={fee}
                    variant={feePercentage === fee ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 ${
                      feePercentage === fee ? 
                      "bg-blue-600 hover:bg-blue-700 text-white" : 
                      "bg-slate-900 text-gray-400 hover:text-white border-slate-800"
                    }`}
                    onClick={() => setFeePercentage(fee)}
                  >
                    {fee}%
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lower fees attract more volume, higher fees mean more revenue per trade
              </p>
            </div>
            
            {/* Pool Preview */}
            {token0Id && token1Id && token0Id !== token1Id && token0Amount && token1Amount && (
              <div className="bg-slate-900/40 p-3 rounded-md space-y-2">
                <div className="text-center">
                  <span className="text-sm text-gray-400">Initial LP Token Supply</span>
                  <div className="text-lg font-bold text-white mt-1">
                    {formatTokenAmount(calculateNewPoolLPSupply())} LP Tokens
                  </div>
                </div>
                
                <Separator className="bg-slate-800/50 my-2" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Starting Price:</span>
                  <span className="text-white">
                    1 {token0?.symbol} = {(Number(token1Amount) / Number(token0Amount)).toFixed(6)} {token1?.symbol}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-2">
            <Button 
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-900/30"
              onClick={handleCreatePool}
              disabled={isCreatePoolDisabled}
            >
              {createPoolMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Pool...
                </>
              ) : !wallet?.address ? (
                "Connect Wallet"
              ) : !token0Id || !token1Id ? (
                "Select Tokens"
              ) : token0Id === token1Id ? (
                "Tokens Must Be Different"
              ) : !token0Amount || !token1Amount || token0Amount === '0' || token1Amount === '0' ? (
                "Enter Token Amounts"
              ) : (
                "Create Liquidity Pool"
              )}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="view" className="p-0 mt-0">
          <CardContent className="space-y-4 pt-4">
            {isLoadingPools ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : pools?.length === 0 ? (
              <div className="text-center p-8 text-gray-400">
                <DropletIcon className="h-12 w-12 mx-auto text-gray-700 mb-3" />
                <h3 className="text-lg font-medium">No Liquidity Pools</h3>
                <p className="text-sm mt-1">Create a new pool to get started</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-slate-700"
                  onClick={() => setActiveTab('create')}
                >
                  Create Pool
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-800">
                      <TableHead className="w-[120px]">Pool</TableHead>
                      <TableHead className="text-right">TVL</TableHead>
                      <TableHead className="text-right">24h Vol</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                      <TableHead className="text-right w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPools ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                            <span className="text-gray-400">Loading pools...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : !pools || pools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <DropletIcon className="h-6 w-6 text-blue-400 mb-2" />
                            <span className="text-gray-400">No liquidity pools available</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pools.map((pool) => {
                        const token0 = tokens?.find(t => t.id === pool.token0_id);
                        const token1 = tokens?.find(t => t.id === pool.token1_id);
                        
                        // Simplified calculations for demo
                        const tvl = formatTokenAmount(
                          (BigInt(pool.token0_amount) + BigInt(pool.token1_amount)).toString(),
                          6
                        );
                        const volume = Math.floor(Math.random() * 100000).toString();
                        
                        return (
                          <TableRow key={pool.id} className="border-slate-800">
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-violet-500 rounded-full mr-2" />
                                <div>
                                  <span className="flex items-center">
                                    {token0?.symbol}/{token1?.symbol}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTokenAmount(pool.lp_token_supply, 0)} LP
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{tvl}</span>
                              <span className="text-xs text-gray-500 block">PVX</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{formatTokenAmount(volume, 6)}</span>
                              <span className="text-xs text-gray-500 block">PVX</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{pool.swap_fee_percent}%</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-800"
                                onClick={() => {
                                  setSelectedPoolId(pool.id);
                                  setToken0Id(pool.token0_id);
                                  setToken1Id(pool.token1_id);
                                  setActiveTab('add');
                                }}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}