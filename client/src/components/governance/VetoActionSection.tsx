import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle } from 'lucide-react';
import { useVetoGuardianByAddress } from '@/hooks/use-veto-guardian-by-address';
import Spinner from '@/components/ui/spinner';

interface VetoActionSectionProps {
  walletAddress: string;
  proposalId?: string;
}

export function VetoActionSection({ walletAddress, proposalId }: VetoActionSectionProps) {
  const { data: vetoGuardian, isLoading } = useVetoGuardianByAddress(walletAddress || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handleVeto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposalId) {
      toast({
        title: 'Error',
        description: 'No proposal selected to veto',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/governance/veto-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guardianId: vetoGuardian?.id,
          proposalId,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit veto action');
      }

      toast({
        title: 'Veto Action Submitted',
        description: 'Your veto has been successfully submitted',
      });
      
      setDialogOpen(false);
      setReason('');
    } catch (error) {
      toast({
        title: 'Veto Action Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (!vetoGuardian) {
    return null; // Don't show the component if the user is not a veto guardian
  }

  return (
    <Card className="mt-4 border-orange-800/50 bg-orange-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center text-orange-400">
          <Shield className="mr-2 h-4 w-4" /> Veto Guardian Actions
        </CardTitle>
        <CardDescription className="text-xs text-orange-300/70">
          As a veto guardian, you can block harmful proposals
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-orange-200/90">
          <p>You are acting as: <span className="font-medium">{vetoGuardian?.name || 'Guardian'}</span></p>
          {proposalId ? (
            <p className="mt-1">Current proposal: {proposalId.substring(0, 8)}...</p>
          ) : (
            <p className="mt-1 text-yellow-400">No proposal selected</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-0">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs gap-1 border-orange-700 bg-orange-950/50 hover:bg-orange-900/30 text-orange-300"
              disabled={!proposalId}
            >
              <AlertTriangle className="h-3 w-3" /> Veto Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="border-orange-800/70 bg-background">
            <DialogHeader>
              <DialogTitle className="text-orange-400">Submit Veto Action</DialogTitle>
              <DialogDescription>
                This action will block the proposal from execution. Please provide a reason for the veto.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleVeto}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="reason" className="text-orange-200">Veto Reason</Label>
                  <Textarea 
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="border-orange-900/70"
                    placeholder="Explain why this proposal should be blocked..."
                    rows={4}
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-orange-700 hover:bg-orange-600 text-white border-none"
                >
                  Submit Veto
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}