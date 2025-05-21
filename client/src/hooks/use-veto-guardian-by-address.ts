import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export type VetoGuardian = {
  id: number;
  address: string;
  name: string;
  description: string;
  isActive: boolean;
  appointedAt: Date;
  activeUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function useVetoGuardianByAddress(address: string) {
  return useQuery({
    queryKey: ['/api/governance/veto-guardian/address', address],
    queryFn: async () => {
      if (!address) return null;
      try {
        const response = await apiRequest('GET', `/api/governance/veto-guardian/address/${address}`);
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Failed to fetch veto guardian for address ${address}`);
        }
        return await response.json() as VetoGuardian;
      } catch (error) {
        console.error('Error fetching veto guardian by address:', error);
        return null;
      }
    },
    enabled: !!address,
  });
}