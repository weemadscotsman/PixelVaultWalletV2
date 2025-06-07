import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface UTRTransaction {
  id: string;
  hash: string;
  type: 'transfer' | 'mining' | 'staking' | 'governance' | 'airdrop';
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight: number;
  timestamp: Date;
  confirmations: number;
  gasUsed: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: {
    poolId?: string;
    proposalId?: string;
    dropId?: string;
    hardware?: string;
  };
}

export interface UTRStats {
  totalTransactions: number;
  totalVolume: string;
  averageFee: string;
  pendingCount: number;
  confirmedToday: number;
  networkThroughput: number;
}

export interface UTRFilter {
  type?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: string;
  maxAmount?: string;
  address?: string;
}

export function useUTR(filter?: UTRFilter, walletAddress?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query params
  const queryParams = new URLSearchParams();
  if (filter?.type) queryParams.set('type', filter.type);
  if (filter?.status) queryParams.set('status', filter.status);
  if (filter?.fromDate) queryParams.set('fromDate', filter.fromDate.toISOString());
  if (filter?.toDate) queryParams.set('toDate', filter.toDate.toISOString());
  if (filter?.minAmount) queryParams.set('minAmount', filter.minAmount);
  if (filter?.maxAmount) queryParams.set('maxAmount', filter.maxAmount);
  if (filter?.address) queryParams.set('address', filter.address);
  if (walletAddress) queryParams.set('userAddress', walletAddress);

  // Get UTR transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/utr/transactions', queryParams.toString()],
    queryFn: async () => {
      const url = `/api/utr/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await apiRequest('GET', url);
      if (!res.ok) throw new Error('Failed to fetch UTR transactions');
      const data = await res.json();
      return data.map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp)
      })) as UTRTransaction[];
    },
  });

  // Get UTR statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/utr/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/utr/stats');
      if (!res.ok) throw new Error('Failed to fetch UTR stats');
      return await res.json() as UTRStats;
    },
  });

  // Get real-time transaction stream
  const { data: realtimeTransactions = [], isLoading: realtimeLoading } = useQuery({
    queryKey: ['/api/utr/realtime'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/utr/realtime');
      if (!res.ok) throw new Error('Failed to fetch realtime transactions');
      const data = await res.json();
      return data.map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp)
      })) as UTRTransaction[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get transaction details
  const getTransactionDetails = (hash: string) => {
    return useQuery({
      queryKey: ['/api/utr/transaction', hash],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/utr/transaction/${hash}`);
        if (!res.ok) throw new Error('Failed to fetch transaction details');
        const data = await res.json();
        return {
          ...data,
          timestamp: new Date(data.timestamp)
        } as UTRTransaction;
      },
      enabled: !!hash,
    });
  };

  // Retry failed transaction mutation
  const retryTransactionMutation = useMutation({
    mutationFn: async (data: { hash: string; newGasPrice?: string }) => {
      const res = await apiRequest('POST', `/api/utr/transaction/${data.hash}/retry`, {
        newGasPrice: data.newGasPrice
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to retry transaction');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Retried",
        description: "Transaction has been resubmitted to the network",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/utr/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/utr/realtime'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to retry transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel pending transaction mutation
  const cancelTransactionMutation = useMutation({
    mutationFn: async (data: { hash: string; gasPrice: string }) => {
      const res = await apiRequest('POST', `/api/utr/transaction/${data.hash}/cancel`, {
        gasPrice: data.gasPrice
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to cancel transaction');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Cancelled",
        description: "Cancellation transaction has been submitted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/utr/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/utr/realtime'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getPendingTransactions = (): UTRTransaction[] => {
    return transactions.filter(tx => tx.status === 'pending');
  };

  const getConfirmedTransactions = (): UTRTransaction[] => {
    return transactions.filter(tx => tx.status === 'confirmed');
  };

  const getFailedTransactions = (): UTRTransaction[] => {
    return transactions.filter(tx => tx.status === 'failed');
  };

  const getTransactionsByType = (type: string): UTRTransaction[] => {
    return transactions.filter(tx => tx.type === type);
  };

  const getTotalVolume = (): string => {
    return transactions
      .filter(tx => tx.status === 'confirmed')
      .reduce((total, tx) => total + parseFloat(tx.amount), 0)
      .toFixed(6);
  };

  const getAverageFee = (): string => {
    const confirmedTxs = getConfirmedTransactions();
    if (confirmedTxs.length === 0) return '0';
    
    const totalFees = confirmedTxs.reduce((total, tx) => total + parseFloat(tx.fee), 0);
    return (totalFees / confirmedTxs.length).toFixed(6);
  };

  const getUserTransactions = (): UTRTransaction[] => {
    if (!walletAddress) return [];
    return transactions.filter(
      tx => tx.fromAddress === walletAddress || tx.toAddress === walletAddress
    );
  };

  const getTransactionCount = (): number => {
    return transactions.length;
  };

  return {
    // Data
    transactions,
    realtimeTransactions,
    stats,
    
    // Loading states
    isLoading: transactionsLoading || statsLoading || realtimeLoading,
    
    // Mutations
    retryTransaction: retryTransactionMutation.mutate,
    cancelTransaction: cancelTransactionMutation.mutate,
    
    // Mutation states
    isRetrying: retryTransactionMutation.isPending,
    isCancelling: cancelTransactionMutation.isPending,
    
    // Helper functions
    getTransactionDetails,
    getPendingTransactions,
    getConfirmedTransactions,
    getFailedTransactions,
    getTransactionsByType,
    getTotalVolume,
    getAverageFee,
    getUserTransactions,
    getTransactionCount,
  };
}