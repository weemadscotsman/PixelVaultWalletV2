import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BlockchainMetrics {
  currentHeight: number;
  difficulty: number;
  hashRate: string;
  lastBlockTime: Date;
  networkStatus: 'Healthy' | 'Degraded' | 'Offline';
  networkStatusPercentage: number;
  pendingTransactions: number;
  lastDayVolume: number;
  averageTxFee: number;
  txsPerBlock: number;
}

export function useBlockchainMetrics() {
  return useQuery<BlockchainMetrics>({
    queryKey: ['/api/blockchain/metrics'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blockchain/metrics');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch blockchain metrics');
      }
      const data = await res.json();
      return {
        ...data,
        lastBlockTime: new Date(data.lastBlockTime)
      };
    },
    refetchInterval: 15000 // Refetch every 15 seconds
  });
}