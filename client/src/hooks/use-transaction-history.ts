import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/types";

export function useTransactionHistory(limit = 20) {
  return useQuery<Transaction[]>({
    queryKey: ['/api/transactions/recent', limit],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/transactions/recent?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recent transactions');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching transaction history:", error);
        // Return empty array on error
        return [];
      }
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds to get new transactions
  });
}