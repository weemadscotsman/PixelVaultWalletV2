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
import { ArrowDownUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useTokens, useLiquidityPools, useSwapQuote, useExecuteSwap } from '@/hooks/use-dex';
import { formatTokenAmount } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Helper for calculating slippage
const calculateSlippage = (amount: string, percentage: number, isAdd: boolean = false): string => {
  const value = BigInt(amount);
  const factor = BigInt(Math.floor(percentage * 100));
  const adjustment = (value * factor) / BigInt(10000);
  
  return isAdd ? 
    (value + adjustment).toString() : 
    (value - adjustment).toString();
};

export default function SwapInterface() {
  const { wallet } = useWallet();
  const { toast } = useToast();
  
  // State for swap inputs
  const [fromTokenId, setFromTokenId] = useState<number | undefined>();
  const [toTokenId, setToTokenId] = useState<number | undefined>();
  const [fromAmount, setFromAmount] = useState<string>('');
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5); // 0.5%
  
  // Load tokens and pools data
  const { data: tokens, isLoading: isLoadingTokens } = useTokens();
  const { data: pools, isLoading: isLoadingPools } = useLiquidityPools();
  
  // Find the right pool for the selected token pair
  const [selectedPool, setSelectedPool] = useState<any | null>(null);
  
  useEffect(() => {
    if (fromTokenId && toTokenId && pools) {
      // Try to find a direct pool
      const pool = pools.find(p => 
        (p.token0_id === fromTokenId && p.token1_id === toTokenId) || 
        (p.token0_id === toTokenId && p.token1_id === fromTokenId)
      );
      
      setSelectedPool(pool || null);
    } else {
      setSelectedPool(null);
    }
  }, [fromTokenId, toTokenId, pools]);
  
  // Fetch swap quote
  const { data: swapQuote, isLoading: isLoadingQuote } = useSwapQuote(
    selectedPool?.id || 0,
    fromTokenId || 0,
    fromAmount
  );
  
  // Execute swap mutation
  const swapMutation = useExecuteSwap();
  
  // Swap the tokens
  const handleSwapTokens = () => {
    const temp = fromTokenId;
    setFromTokenId(toTokenId);
    setToTokenId(temp);
  };
  
  // Execute the swap
  const executeSwap = async () => {
    if (!wallet || !selectedPool || !fromTokenId || !toTokenId || !swapQuote) {
      toast({
        title: "Cannot execute swap",
        description: "Please check your inputs and try again",
        variant: "destructive"
      });
      return;
    }
    
    // Generate a random tx hash (in a real app, this would come from a wallet signature)
    const txHash = `0x${Math.random().toString(16).substring(2)}`;
    
    try {
      await swapMutation.mutateAsync({
        pool_id: selectedPool.id,
        trader_address: wallet.address,
        token_in_id: fromTokenId,
        token_out_id: toTokenId,
        amount_in: fromAmount,
        amount_out: swapQuote.amountOut,
        fee_amount: swapQuote.fee,
        tx_hash: txHash,
        price_impact_percent: swapQuote.priceImpact,
        slippage_tolerance_percent: slippageTolerance.toString()
      });
      
      // Reset the form after successful swap
      setFromAmount('');
    } catch (error) {
      console.error("Failed to execute swap:", error);
    }
  };
  
  // Get token details
  const fromToken = tokens?.find(t => t.id === fromTokenId);
  const toToken = tokens?.find(t => t.id === toTokenId);
  
  // Calculate minimum amount out based on slippage
  const minAmountOut = swapQuote 
    ? calculateSlippage(swapQuote.amountOut, slippageTolerance, false) 
    : '0';
  
  const isSwapDisabled = 
    !wallet?.address ||
    !fromToken ||
    !toToken ||
    !selectedPool ||
    !fromAmount ||
    fromAmount === '0' ||
    !swapQuote ||
    swapMutation.isPending;
  
  return (
    <Card className="w-full max-w-md mx-auto bg-black/80 backdrop-blur-lg border-slate-800 shadow-lg shadow-blue-500/10">
      <CardHeader className="space-y-1 pb-3 border-b border-slate-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
            PVX Swap
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Exchange tokens securely on the ZK-chain
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        {/* From Token Section */}
        <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-blue-400">From</label>
            {fromToken && wallet && (
              <span className="text-xs text-gray-400">
                Balance: {formatTokenAmount(wallet.balance, fromToken.decimals)} {fromToken.symbol}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="0.0"
              className="flex-1 bg-slate-900/50 border-slate-700/50 text-lg font-medium"
              value={fromAmount}
              onChange={(e) => {
                // Only allow numbers and decimals
                const value = e.target.value.replace(/[^0-9.]/g, '');
                // Ensure only one decimal point
                if (value.split('.').length > 2) return;
                setFromAmount(value);
              }}
            />
            
            <Select
              value={fromTokenId?.toString()}
              onValueChange={(value) => setFromTokenId(parseInt(value))}
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
                      disabled={token.id === toTokenId}
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
        
        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800/50 z-10 shadow-md"
            onClick={handleSwapTokens}
          >
            <ArrowDownUp className="h-4 w-4 text-blue-400" />
          </Button>
        </div>
        
        {/* To Token Section */}
        <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-violet-400">To (estimated)</label>
            {toToken && wallet && (
              <span className="text-xs text-gray-400">
                Balance: {formatTokenAmount(wallet.balance, toToken.decimals)} {toToken.symbol}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-1 bg-slate-900/50 rounded-md border border-slate-700/50 px-3 py-2 text-lg font-medium h-10">
              {isLoadingQuote ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                swapQuote ? formatTokenAmount(swapQuote.amountOut, toToken?.decimals || 6) : '0.0'
              )}
            </div>
            
            <Select
              value={toTokenId?.toString()}
              onValueChange={(value) => setToTokenId(parseInt(value))}
            >
              <SelectTrigger className="w-32 bg-slate-900/80 border-slate-700/50">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {isLoadingTokens ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  </div>
                ) : (
                  tokens?.map((token) => (
                    <SelectItem 
                      key={token.id} 
                      value={token.id.toString()}
                      disabled={token.id === fromTokenId}
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
        
        {/* Swap Details */}
        {swapQuote && fromToken && toToken && (
          <div className="bg-slate-950/70 p-3 rounded-md space-y-2 text-sm border border-slate-800/50">
            <div className="flex justify-between">
              <span className="text-gray-500">Rate</span>
              <span className="text-white">
                1 {fromToken.symbol} = {formatTokenAmount(swapQuote.exchangeRate, toToken.decimals)} {toToken.symbol}
              </span>
            </div>
            
            <Separator className="bg-slate-800/50 my-1" />
            
            <div className="flex justify-between">
              <span className="text-gray-500">Fee</span>
              <span className="text-white">{formatTokenAmount(swapQuote.fee, fromToken.decimals)} {fromToken.symbol}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Price Impact</span>
              <span className={parseFloat(swapQuote.priceImpact) > 5 ? "text-red-400" : "text-white"}>
                {swapQuote.priceImpact}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Minimum Received</span>
              <span className="text-white">{formatTokenAmount(minAmountOut, toToken.decimals)} {toToken.symbol}</span>
            </div>
            
            <Separator className="bg-slate-800/50 my-1" />
            
            <div>
              <span className="text-gray-500 text-xs">Slippage Tolerance</span>
              <div className="flex justify-between mt-1">
                {[0.1, 0.5, 1.0, 3.0].map((tolerance) => (
                  <Button
                    key={tolerance}
                    variant={slippageTolerance === tolerance ? "default" : "outline"}
                    size="sm"
                    className={`h-7 px-2 text-xs ${
                      slippageTolerance === tolerance ? 
                      "bg-blue-600 hover:bg-blue-700 text-white" : 
                      "bg-slate-900 text-gray-400 hover:text-white border-slate-800"
                    }`}
                    onClick={() => setSlippageTolerance(tolerance)}
                  >
                    {tolerance}%
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Pool warning */}
        {fromTokenId && toTokenId && !selectedPool && (
          <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-md flex items-start space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-red-300">
              No liquidity pool exists for this token pair. Try a different pair or create a new pool.
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-blue-900/30"
          onClick={executeSwap}
          disabled={isSwapDisabled}
        >
          {swapMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Swapping...
            </>
          ) : !wallet?.address ? (
            "Connect Wallet"
          ) : !fromToken || !toToken ? (
            "Select Tokens"
          ) : !selectedPool ? (
            "No Pool Available"
          ) : !fromAmount || fromAmount === '0' ? (
            "Enter Amount"
          ) : (
            `Swap ${fromToken.symbol} for ${toToken.symbol}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}