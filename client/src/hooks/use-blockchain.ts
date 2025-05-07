import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlockchainStatus, Block, Transaction, MiningStats, Thringlet } from "@/types/blockchain";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useBlockchain() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Connect to blockchain
  const connectQuery = useQuery({
    queryKey: ['/api/blockchain/connect'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blockchain/connect');
      if (!res.ok) {
        throw new Error('Failed to connect to blockchain');
      }
      return await res.json() as BlockchainStatus;
    },
  });

  // Get blockchain status
  const statusQuery = useQuery({
    queryKey: ['/api/blockchain/status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blockchain/status');
      if (!res.ok) {
        throw new Error('Failed to fetch blockchain status');
      }
      return await res.json() as BlockchainStatus;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Get blockchain trend data
  const trendsQuery = useQuery({
    queryKey: ['/api/blockchain/trends'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blockchain/trends');
      if (!res.ok) {
        throw new Error('Failed to fetch blockchain trends');
      }
      return await res.json();
    },
  });

  // Get latest block
  const latestBlockQuery = useQuery({
    queryKey: ['/api/blockchain/latest-block'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blockchain/latest-block');
      if (!res.ok) {
        throw new Error('Failed to fetch latest block');
      }
      return await res.json() as Block;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Get recent blocks
  const getRecentBlocks = (limit: number = 5) => {
    return useQuery({
      queryKey: ['/api/blockchain/blocks', limit],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/blocks?limit=${limit}`);
        if (!res.ok) {
          throw new Error('Failed to fetch recent blocks');
        }
        return await res.json() as Block[];
      },
      refetchInterval: 15000, // Refetch every 15 seconds
    });
  };

  // Get block by height
  const getBlockByHeight = (height: number) => {
    return useQuery({
      queryKey: ['/api/blockchain/block', height],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/block/${height}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch block with height ${height}`);
        }
        return await res.json() as Block;
      },
      enabled: !!height, // Only run query if height is provided
    });
  };

  // Get recent transactions
  const getRecentTransactions = (limit: number = 5) => {
    return useQuery({
      queryKey: ['/api/blockchain/transactions', limit],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/transactions?limit=${limit}`);
        if (!res.ok) {
          throw new Error('Failed to fetch recent transactions');
        }
        return await res.json() as Transaction[];
      },
      refetchInterval: 15000, // Refetch every 15 seconds
    });
  };

  // Get transaction by hash
  const getTransactionByHash = (hash: string) => {
    return useQuery({
      queryKey: ['/api/blockchain/transaction', hash],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/transaction/${hash}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch transaction with hash ${hash}`);
        }
        return await res.json() as Transaction;
      },
      enabled: !!hash, // Only run query if hash is provided
    });
  };

  // Get transactions by address
  const getTransactionsByAddress = (address: string) => {
    return useQuery({
      queryKey: ['/api/blockchain/address', address, 'transactions'],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/address/${address}/transactions`);
        if (!res.ok) {
          throw new Error(`Failed to fetch transactions for address ${address}`);
        }
        return await res.json() as Transaction[];
      },
      enabled: !!address, // Only run query if address is provided
    });
  };

  // Start mining
  const startMiningMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await apiRequest('POST', '/api/blockchain/mining/start', { address });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start mining');
      }
      return await res.json() as MiningStats;
    },
    onSuccess: (data) => {
      toast({
        title: "Mining started",
        description: `Mining started for address ${data.address}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/mining/stats', data.address] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start mining",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stop mining
  const stopMiningMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await apiRequest('POST', '/api/blockchain/mining/stop', { address });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to stop mining');
      }
      return await res.json() as MiningStats;
    },
    onSuccess: (data) => {
      toast({
        title: "Mining stopped",
        description: `Mining stopped for address ${data.address}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/mining/stats', data.address] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to stop mining",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get mining stats
  const getMiningStats = (address: string) => {
    return useQuery({
      queryKey: ['/api/blockchain/mining/stats', address],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/mining/stats/${address}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Failed to fetch mining stats for address ${address}`);
        }
        return await res.json() as MiningStats;
      },
      enabled: !!address, // Only run query if address is provided
      refetchInterval: 5000, // Refetch every 5 seconds if mining is active
    });
  };

  // Interact with thringlet
  const thringletInteractionMutation = useMutation({
    mutationFn: async ({ thringletId, interactionType }: { thringletId: string, interactionType: string }) => {
      const res = await apiRequest('POST', `/api/blockchain/thringlet/${thringletId}/interact`, { interactionType });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to interact with thringlet');
      }
      return await res.json() as Thringlet;
    },
    onSuccess: (data) => {
      toast({
        title: "Interaction successful",
        description: `Your thringlet is now ${data.emotionalState}!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/thringlet', data.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Interaction failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Queries
    connectQuery,
    statusQuery,
    trendsQuery,
    latestBlockQuery,
    getRecentBlocks,
    getBlockByHeight,
    getRecentTransactions,
    getTransactionByHash,
    getTransactionsByAddress,
    getMiningStats,
    
    // Mutations
    startMiningMutation,
    stopMiningMutation,
    thringletInteractionMutation,
  };
}