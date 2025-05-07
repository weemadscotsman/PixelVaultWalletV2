import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useToast } from './use-toast';

// Types
export type Token = {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  total_supply: string;
  is_native: boolean;
  contract_address: string;
};

export type LiquidityPool = {
  id: number;
  token0_id: number;
  token1_id: number;
  token0_amount: string;
  token1_amount: string;
  swap_fee_percent: string;
  lp_token_supply: string;
  pool_address: string;
  created_at: Date;
};

export type LPPosition = {
  id: number;
  pool_id: number;
  owner_address: string;
  lp_token_amount: string;
  token0_amount: string;
  token1_amount: string;
  created_at: Date;
};

export type Swap = {
  id: number;
  pool_id: number;
  trader_address: string;
  token_in_id: number;
  token_out_id: number;
  amount_in: string;
  amount_out: string;
  fee_amount: string;
  tx_hash: string;
  price_impact_percent: string;
  slippage_tolerance_percent: string;
  timestamp: Date;
};

export type SwapQuote = {
  amountOut: string;
  fee: string;
  priceImpact: string;
  exchangeRate: string;
};

// Hooks for querying data
export function useTokens() {
  return useQuery({
    queryKey: ['/api/dex/tokens'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dex/tokens');
      return await response.json() as Token[];
    },
  });
}

export function useLiquidityPools() {
  return useQuery({
    queryKey: ['/api/dex/pools'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dex/pools');
      return await response.json() as LiquidityPool[];
    },
  });
}

export function useUserLPPositions(address: string) {
  return useQuery({
    queryKey: ['/api/dex/positions', address],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/dex/positions?address=${address}`);
      return await response.json() as LPPosition[];
    },
    enabled: !!address,
  });
}

export function useSwaps(limit: number = 10) {
  return useQuery({
    queryKey: ['/api/dex/swaps', { limit }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/dex/swaps?limit=${limit}`);
      return await response.json() as Swap[];
    },
  });
}

export function useUserSwaps(address: string, limit: number = 10) {
  return useQuery({
    queryKey: ['/api/dex/swaps/user', address, { limit }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/dex/swaps/user?address=${address}&limit=${limit}`);
      return await response.json() as Swap[];
    },
    enabled: !!address,
  });
}

export function useSwapQuote(poolId: number, tokenInId: number, amountIn: string) {
  return useQuery({
    queryKey: ['/api/dex/quote', poolId, tokenInId, amountIn],
    queryFn: async () => {
      if (!poolId || !tokenInId || !amountIn || amountIn === '0') return null;
      const response = await apiRequest('GET', `/api/dex/quote?pool_id=${poolId}&token_in_id=${tokenInId}&amount_in=${amountIn}`);
      return await response.json() as SwapQuote;
    },
    enabled: !!poolId && !!tokenInId && !!amountIn && amountIn !== '0',
  });
}

// Mutations for state changes
export function useExecuteSwap() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (swapData: {
      pool_id: number;
      trader_address: string;
      token_in_id: number;
      token_out_id: number;
      amount_in: string;
      amount_out: string;
      fee_amount: string;
      tx_hash: string;
      price_impact_percent: string;
      slippage_tolerance_percent: string;
    }) => {
      const response = await apiRequest('POST', '/api/dex/swap', swapData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dex/swaps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dex/swaps/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dex/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      
      toast({
        title: 'Swap Executed',
        description: 'Your token swap was successful.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Swap Failed',
        description: error.message || 'There was an error executing your swap.',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateLPPosition() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (positionData: {
      pool_id: number;
      owner_address: string;
      lp_token_amount: string;
      token0_amount: string;
      token1_amount: string;
    }) => {
      const response = await apiRequest('POST', '/api/dex/position', positionData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dex/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dex/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      
      toast({
        title: 'Liquidity Added',
        description: 'You have successfully added liquidity to the pool.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add Liquidity',
        description: error.message || 'There was an error adding liquidity.',
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveLPPosition() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ positionId, amount }: { positionId: number; amount: string }) => {
      const response = await apiRequest('POST', '/api/dex/position/remove', { position_id: positionId, amount });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dex/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dex/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      
      toast({
        title: 'Liquidity Removed',
        description: 'You have successfully removed liquidity from the pool.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Remove Liquidity',
        description: error.message || 'There was an error removing liquidity.',
        variant: 'destructive',
      });
    },
  });
}

export function useCreatePool() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (poolData: {
      token0_id: number;
      token1_id: number;
      token0_amount: string;
      token1_amount: string;
      lp_token_supply: string;
      swap_fee_percent: string;
      pool_address: string;
    }) => {
      const response = await apiRequest('POST', '/api/dex/pool', poolData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dex/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      
      toast({
        title: 'Pool Created',
        description: 'You have successfully created a new liquidity pool.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Pool',
        description: error.message || 'There was an error creating the pool.',
        variant: 'destructive',
      });
    },
  });
}