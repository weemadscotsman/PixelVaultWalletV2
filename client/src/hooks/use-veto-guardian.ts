import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

export type VetoGuardian = {
  id: number;
  address: string;
  name: string;
  description: string | null;
  isActive: boolean;
  appointedAt: string;
  activeUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateVetoGuardianRequest = {
  address: string;
  name: string;
  description?: string;
  activeUntil?: string;
};

export function useVetoGuardians() {
  return useQuery({
    queryKey: ['/api/governance/veto-guardians'],
    refetchOnWindowFocus: false,
  });
}

export function useVetoGuardianById(id: number | string) {
  return useQuery({
    queryKey: ['/api/governance/veto-guardian', id],
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

export function useVetoGuardianByAddress(address: string) {
  return useQuery({
    queryKey: ['/api/governance/veto-guardian/address', address],
    enabled: !!address,
    refetchOnWindowFocus: false,
  });
}

export function useCreateVetoGuardian() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateVetoGuardianRequest) => {
      const response = await fetch('/api/governance/veto-guardian/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create veto guardian');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardians'] });
      
      toast({
        title: 'Veto Guardian Created',
        description: 'The veto guardian has been successfully created.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Veto Guardian',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateVetoGuardian(id: number | string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<VetoGuardian>) => {
      const response = await fetch(`/api/governance/veto-guardian/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update veto guardian');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardian', id] });
      
      toast({
        title: 'Veto Guardian Updated',
        description: 'The veto guardian has been successfully updated.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Veto Guardian',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}