import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlockchainStatus, Block, Transaction, MiningStats, Thringlet } from "@/types/blockchain";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";
import { withRetry } from "@/lib/backoffRetry";

// Log format for retries 
const logRetry = (endpoint: string, attempt: number, error: any) => {
  console.warn(`Retry ${attempt} for ${endpoint} due to: ${error?.message || 'Unknown error'}`);
};

export function useBlockchain() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Connect to blockchain with retry logic
  const connectQuery = useQuery({
    queryKey: ['/api/blockchain/connect'],
    queryFn: async () => {
      return withRetry(
        async () => {
          const res = await apiRequest('GET', '/api/blockchain/connect');
          if (!res.ok) {
            throw new Error(`Failed to connect to blockchain: ${res.status}`);
          }
          const data = await res.json();
          return data as BlockchainStatus;
        },
        { 
          maxRetries: 3, 
          onRetry: (attempt, error) => logRetry('/api/blockchain/connect', attempt, error)
        }
      );
    },
    // Always retry on error
    retry: 3,
    // Shorter stale time to ensure fresh data
    staleTime: 10000,
  });

  // Get blockchain status with retry logic
  const statusQuery = useQuery({
    queryKey: ['/api/blockchain/status'],
    queryFn: async () => {
      return withRetry(
        async () => {
          const res = await apiRequest('GET', '/api/blockchain/status');
          if (!res.ok) {
            throw new Error(`Failed to fetch blockchain status: ${res.status}`);
          }
          const data = await res.json();
          return data as BlockchainStatus;
        },
        { 
          maxRetries: 3, 
          onRetry: (attempt, error) => logRetry('/api/blockchain/status', attempt, error)
        }
      );
    },
    // More frequent updates for real-time data
    refetchInterval: 5000,
    // Always retry on error
    retry: 3,
  });

  // Get blockchain trend data with retry
  const trendsQuery = useQuery({
    queryKey: ['/api/blockchain/trends'],
    queryFn: async () => {
      return withRetry(
        async () => {
          const res = await apiRequest('GET', '/api/blockchain/trends');
          if (!res.ok) {
            throw new Error(`Failed to fetch blockchain trends: ${res.status}`);
          }
          return await res.json();
        },
        { 
          maxRetries: 3, 
          onRetry: (attempt, error) => logRetry('/api/blockchain/trends', attempt, error)
        }
      );
    },
    // Refresh every 30 seconds since trends don't change as rapidly
    refetchInterval: 30000,
    retry: 2,
  });

  // Get latest block with retry
  const latestBlockQuery = useQuery({
    queryKey: ['/api/blockchain/latest-block'],
    queryFn: async () => {
      return withRetry(
        async () => {
          const res = await apiRequest('GET', '/api/blockchain/latest-block');
          if (!res.ok) {
            throw new Error(`Failed to fetch latest block: ${res.status}`);
          }
          return await res.json() as Block;
        },
        { 
          maxRetries: 3, 
          onRetry: (attempt, error) => logRetry('/api/blockchain/latest-block', attempt, error)
        }
      );
    },
    // More frequent updates for real-time block data
    refetchInterval: 5000,
    retry: 3,
  });

  // Get recent blocks with retry
  const getRecentBlocks = (limit: number = 5) => {
    return useQuery({
      queryKey: ['/api/blockchain/blocks', limit],
      queryFn: async () => {
        return withRetry(
          async () => {
            const res = await apiRequest('GET', `/api/blockchain/blocks?limit=${limit}`);
            if (!res.ok) {
              throw new Error(`Failed to fetch recent blocks: ${res.status}`);
            }
            return await res.json() as Block[];
          },
          { 
            maxRetries: 3, 
            onRetry: (attempt, error) => logRetry(`/api/blockchain/blocks?limit=${limit}`, attempt, error)
          }
        );
      },
      refetchInterval: 5000,
      retry: 3,
    });
  };

  // Get block by height with retry
  const getBlockByHeight = (height: number) => {
    return useQuery({
      queryKey: ['/api/blockchain/block', height],
      queryFn: async () => {
        return withRetry(
          async () => {
            const res = await apiRequest('GET', `/api/blockchain/block/${height}`);
            if (!res.ok) {
              throw new Error(`Failed to fetch block with height ${height}: ${res.status}`);
            }
            return await res.json() as Block;
          },
          { 
            maxRetries: 3, 
            onRetry: (attempt, error) => logRetry(`/api/blockchain/block/${height}`, attempt, error)
          }
        );
      },
      enabled: !!height,
      retry: 3,
    });
  };

  // Get recent transactions with retry
  const getRecentTransactions = (limit: number = 5) => {
    return useQuery({
      queryKey: ['/api/blockchain/transactions', limit],
      queryFn: async () => {
        return withRetry(
          async () => {
            const res = await apiRequest('GET', `/api/blockchain/transactions?limit=${limit}`);
            if (!res.ok) {
              throw new Error(`Failed to fetch recent transactions: ${res.status}`);
            }
            return await res.json() as Transaction[];
          },
          { 
            maxRetries: 3, 
            onRetry: (attempt, error) => logRetry(`/api/blockchain/transactions?limit=${limit}`, attempt, error)
          }
        );
      },
      refetchInterval: 5000,
      retry: 3,
    });
  };

  // Get transaction by hash with retry
  const getTransactionByHash = (hash: string) => {
    return useQuery({
      queryKey: ['/api/blockchain/transaction', hash],
      queryFn: async () => {
        return withRetry(
          async () => {
            const res = await apiRequest('GET', `/api/blockchain/transaction/${hash}`);
            if (!res.ok) {
              throw new Error(`Failed to fetch transaction with hash ${hash}: ${res.status}`);
            }
            return await res.json() as Transaction;
          },
          { 
            maxRetries: 3, 
            onRetry: (attempt, error) => logRetry(`/api/blockchain/transaction/${hash}`, attempt, error)
          }
        );
      },
      enabled: !!hash,
      retry: 3,
    });
  };

  // Get transactions by address with retry
  const getTransactionsByAddress = (address: string) => {
    return useQuery({
      queryKey: ['/api/blockchain/address', address, 'transactions'],
      queryFn: async () => {
        return withRetry(
          async () => {
            const res = await apiRequest('GET', `/api/blockchain/address/${address}/transactions`);
            if (!res.ok) {
              throw new Error(`Failed to fetch transactions for address ${address}: ${res.status}`);
            }
            return await res.json() as Transaction[];
          },
          { 
            maxRetries: 3, 
            onRetry: (attempt, error) => logRetry(`/api/blockchain/address/${address}/transactions`, attempt, error)
          }
        );
      },
      enabled: !!address,
      refetchInterval: 10000,
      retry: 3,
    });
  };

  // Start mining with retry
  const startMiningMutation = useMutation({
    mutationFn: async (address: string) => {
      return withRetry(
        async () => {
          const res = await apiRequest('POST', '/api/blockchain/mining/start', { address });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to start mining: ${res.status}`);
          }
          return await res.json() as MiningStats;
        },
        { 
          maxRetries: 3, 
          onRetry: (attempt, error) => logRetry('/api/blockchain/mining/start', attempt, error)
        }
      );
    },
    onSuccess: (data) => {
      toast({
        title: "Mining started",
        description: `Mining started for wallet ${data.address.substring(0, 8)}...`,
      });
      // Invalidate multiple queries to ensure all data is fresh
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/mining/stats', data.address] });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet', data.address] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start mining",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stop mining with retry
  const stopMiningMutation = useMutation({
    mutationFn: async (address: string) => {
      return withRetry(
        async () => {
          const res = await apiRequest('POST', '/api/blockchain/mining/stop', { address });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to stop mining: ${res.status}`);
          }
          return await res.json() as MiningStats;
        },
        { 
          maxRetries: 3, 
          onRetry: (attempt, error) => logRetry('/api/blockchain/mining/stop', attempt, error)
        }
      );
    },
    onSuccess: (data) => {
      toast({
        title: "Mining stopped",
        description: `Mining stopped for wallet ${data.address.substring(0, 8)}...`,
      });
      // Invalidate multiple queries to ensure all data is fresh
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/mining/stats', data.address] });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet', data.address] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to stop mining",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get mining stats with retry
  const getMiningStats = (address: string) => {
    return useQuery({
      queryKey: ['/api/blockchain/mining/stats', address],
      queryFn: async () => {
        return withRetry(
          async () => {
            const res = await apiRequest('GET', `/api/blockchain/mining/stats/${address}`);
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to fetch mining stats: ${res.status}`);
            }
            return await res.json() as MiningStats;
          },
          { 
            maxRetries: 3, 
            onRetry: (attempt, error) => logRetry(`/api/blockchain/mining/stats/${address}`, attempt, error)
          }
        );
      },
      enabled: !!address,
      // More frequent updates for active mining
      refetchInterval: 3000,
      retry: 3,
    });
  };

  // Interact with thringlet with retry
  const thringletInteractionMutation = useMutation({
    mutationFn: async ({ thringletId, interactionType }: { thringletId: string, interactionType: string }) => {
      return withRetry(
        async () => {
          const res = await apiRequest('POST', `/api/blockchain/thringlet/${thringletId}/interact`, { interactionType });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to interact with thringlet: ${res.status}`);
          }
          return await res.json() as Thringlet;
        },
        { 
          maxRetries: 3, 
          onRetry: (attempt, error) => logRetry(`/api/blockchain/thringlet/${thringletId}/interact`, attempt, error)
        }
      );
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