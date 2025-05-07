import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Token, LiquidityPool, LPPosition, Swap } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// Token hooks
export function useTokens() {
  return useQuery<Token[]>({
    queryKey: ['/api/dex/tokens'],
  });
}

export function useToken(id: number) {
  return useQuery<Token>({
    queryKey: ['/api/dex/tokens', id],
    enabled: !!id,
  });
}

export function useTokenBySymbol(symbol: string) {
  return useQuery<Token>({
    queryKey: ['/api/dex/tokens/symbol', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/dex/tokens/symbol/${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch token');
      return await res.json();
    },
    enabled: !!symbol,
  });
}

// Liquidity Pool hooks
export function useLiquidityPools() {
  return useQuery<LiquidityPool[]>({
    queryKey: ['/api/dex/pools'],
  });
}

export function useLiquidityPool(id: number) {
  return useQuery<LiquidityPool>({
    queryKey: ['/api/dex/pools', id],
    enabled: !!id,
  });
}

export function usePoolsByToken(tokenId: number) {
  return useQuery<LiquidityPool[]>({
    queryKey: ['/api/dex/pools/token', tokenId],
    queryFn: async () => {
      const res = await fetch(`/api/dex/pools/token/${tokenId}`);
      if (!res.ok) throw new Error('Failed to fetch pools');
      return await res.json();
    },
    enabled: !!tokenId,
  });
}

export function usePoolStats(poolId: number) {
  return useQuery<{
    volume24h: string;
    volume7d: string;
    fees24h: string;
    tvl: string;
    apr: string;
  }>({
    queryKey: ['/api/dex/pools', poolId, 'stats'],
    queryFn: async () => {
      const res = await fetch(`/api/dex/pools/${poolId}/stats`);
      if (!res.ok) throw new Error('Failed to fetch pool stats');
      return await res.json();
    },
    enabled: !!poolId,
  });
}

// LP Position hooks
export function useUserLPPositions(address: string) {
  return useQuery<LPPosition[]>({
    queryKey: ['/api/dex/positions', address],
    queryFn: async () => {
      const res = await fetch(`/api/dex/positions?address=${address}`);
      if (!res.ok) throw new Error('Failed to fetch positions');
      return await res.json();
    },
    enabled: !!address,
  });
}

export function useLPPosition(id: number) {
  return useQuery<LPPosition>({
    queryKey: ['/api/dex/positions', id],
    enabled: !!id,
  });
}

export function useLPPositionValue(id: number) {
  return useQuery<{
    position_id: number;
    token0Amount: string;
    token1Amount: string;
    totalValue: string;
  }>({
    queryKey: ['/api/dex/positions', id, 'value'],
    queryFn: async () => {
      const res = await fetch(`/api/dex/positions/${id}/value`);
      if (!res.ok) throw new Error('Failed to fetch position value');
      return await res.json();
    },
    enabled: !!id,
  });
}

// Swap hooks
export function useSwaps(limit?: number) {
  return useQuery<Swap[]>({
    queryKey: ['/api/dex/swaps', { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/dex/swaps${limit ? `?limit=${limit}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch swaps');
      return await res.json();
    },
  });
}

export function useUserSwaps(address: string, limit?: number) {
  return useQuery<Swap[]>({
    queryKey: ['/api/dex/swaps', address, { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/dex/swaps?address=${address}${limit ? `&limit=${limit}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch user swaps');
      return await res.json();
    },
    enabled: !!address,
  });
}

export function usePoolSwaps(poolId: number, limit?: number) {
  return useQuery<Swap[]>({
    queryKey: ['/api/dex/swaps', { poolId, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/dex/swaps?poolId=${poolId}${limit ? `&limit=${limit}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch pool swaps');
      return await res.json();
    },
    enabled: !!poolId,
  });
}

export function useSwapQuote(poolId: number, tokenInId: number, amountIn: string) {
  return useQuery<{
    amountOut: string;
    priceImpact: string;
    fee: string;
    exchangeRate: string;
  }>({
    queryKey: ['/api/dex/swap/quote', { poolId, tokenInId, amountIn }],
    queryFn: async () => {
      if (!amountIn || amountIn === '0' || !poolId || !tokenInId) {
        throw new Error('Invalid quote parameters');
      }
      const res = await fetch(`/api/dex/swap/quote?poolId=${poolId}&tokenInId=${tokenInId}&amountIn=${amountIn}`);
      if (!res.ok) throw new Error('Failed to fetch swap quote');
      return await res.json();
    },
    enabled: !!poolId && !!tokenInId && !!amountIn && amountIn !== '0',
    refetchOnWindowFocus: false,
  });
}

// Mutation hooks
export function useCreateLPPosition() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      pool_id: number;
      owner_address: string;
      lp_token_amount: string;
      token0_amount: string;
      token1_amount: string;
    }) => {
      const res = await apiRequest('POST', '/api/dex/positions', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dex/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dex/pools'] });
      toast({
        title: 'Success',
        description: 'Added liquidity successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add liquidity',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useExecuteSwap() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      pool_id: number;
      trader_address: string;
      token_in_id: number;
      token_out_id: number;
      amount_in: string;
      amount_out: string;
      fee_amount: string;
      tx_hash: string;
      price_impact_percent?: string;
      slippage_tolerance_percent?: string;
    }) => {
      const res = await apiRequest('POST', '/api/dex/swap', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dex/swaps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dex/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      
      toast({
        title: 'Success',
        description: 'Swap executed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Swap failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreatePool() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      token0_id: number;
      token1_id: number;
      token0_amount: string;
      token1_amount: string;
      lp_token_supply: string;
      swap_fee_percent: string;
      pool_address: string;
    }) => {
      const res = await apiRequest('POST', '/api/dex/pools', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dex/pools'] });
      toast({
        title: 'Success',
        description: 'Liquidity pool created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create pool',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreateToken() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      symbol: string;
      name: string;
      logo_url?: string;
      decimals?: number;
      contract_address?: string;
      description?: string;
      total_supply?: string;
    }) => {
      const res = await apiRequest('POST', '/api/dex/tokens', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dex/tokens'] });
      toast({
        title: 'Success',
        description: 'Token created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create token',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}