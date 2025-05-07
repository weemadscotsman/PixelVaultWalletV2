import { useQuery, useMutation } from "@tanstack/react-query";
import { VetoGuardian, VetoAction } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface CreateVetoGuardianData {
  address: string;
  name: string;
  description?: string;
  active_until?: Date;
}

export interface VetoProposalData {
  guardianId: number;
  reason: string;
}

export function useVetoGuardians() {
  return useQuery<VetoGuardian[]>({
    queryKey: ['/api/governance/veto-guardians'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useVetoGuardian(id?: number) {
  return useQuery<VetoGuardian>({
    queryKey: ['/api/governance/veto-guardian', id],
    enabled: !!id,
  });
}

export function useVetoGuardianByAddress(address?: string) {
  return useQuery<VetoGuardian>({
    queryKey: ['/api/governance/veto-guardian/address', address],
    enabled: !!address,
  });
}

export function useCreateVetoGuardian() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: CreateVetoGuardianData) => {
      const res = await apiRequest('POST', '/api/governance/veto-guardian/create', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Veto Guardian Created",
        description: "New veto guardian has been successfully created.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardians'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Veto Guardian",
        description: error.message || "An error occurred while creating the veto guardian.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateVetoGuardian() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/governance/veto-guardian/${id}`, { is_active: isActive });
      return await res.json();
    },
    onSuccess: (data) => {
      const status = data.is_active ? "activated" : "deactivated";
      toast({
        title: `Guardian ${status}`,
        description: `The veto guardian has been successfully ${status}.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardian'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Veto Guardian",
        description: error.message || "An error occurred while updating the veto guardian.",
        variant: "destructive",
      });
    },
  });
}

export function useVetoProposal() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ proposalId, data }: { proposalId: number; data: VetoProposalData }) => {
      const res = await apiRequest('POST', `/api/governance/proposal/${proposalId}/veto`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Vetoed",
        description: "The proposal has been successfully vetoed.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/proposals'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Veto Proposal",
        description: error.message || "An error occurred while vetoing the proposal.",
        variant: "destructive",
      });
    },
  });
}