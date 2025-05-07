import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Textarea } from '@/components/ui/textarea';

interface VetoProposalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number | string;
  proposalTitle: string;
  guardianId: number;
}

const VetoProposalDialog: React.FC<VetoProposalDialogProps> = ({
  isOpen,
  onClose,
  proposalId,
  proposalTitle,
  guardianId,
}) => {
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vetoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/governance/proposal/${proposalId}/veto`, {
        guardian_id: guardianId,
        reason,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardians'] });
      toast({
        title: 'Proposal vetoed',
        description: 'The proposal has been successfully vetoed',
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleVeto = () => {
    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the veto',
        variant: 'destructive',
      });
      return;
    }
    
    vetoMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-red-900/50 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-red-300 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Veto Proposal
          </DialogTitle>
          <DialogDescription>
            You are about to veto the proposal: <span className="text-blue-300 font-semibold">{proposalTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-950/20 p-4 rounded border border-red-900/30">
            <p className="text-sm text-gray-300">
              As a Veto Guardian, you have the responsibility to protect the network from harmful proposals.
              This action is irreversible and should only be used for proposals that:
            </p>
            <ul className="text-sm list-disc list-inside mt-2 text-gray-300">
              <li>Pose security risks to the network</li>
              <li>Contain malicious code or intent</li>
              <li>Violate the core principles of the DAO</li>
              <li>Would cause significant harm to users</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Veto Reason (Required)</label>
            <Textarea
              placeholder="Provide a detailed reason for vetoing this proposal"
              className="bg-gray-800 border-gray-700 min-h-[100px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Your reason will be publicly visible and recorded on-chain
            </p>
          </div>
        </div>
        
        <DialogFooter className="pt-2">
          <Button variant="outline" className="border-gray-700 text-gray-300" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            className="bg-red-700 hover:bg-red-600 text-white"
            onClick={handleVeto}
            disabled={vetoMutation.isPending}
          >
            {vetoMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Vetoing...
              </>
            ) : (
              'Confirm Veto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VetoProposalDialog;