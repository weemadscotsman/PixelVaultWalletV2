import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ArrowRight, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useVetoActions, useCreateVetoAction, VetoAction } from '@/hooks/use-veto-action';
import Spinner from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface VetoActionSectionProps {
  walletAddress: string;
  proposalId?: string;
}

function VetoActionSection({ walletAddress, proposalId }: VetoActionSectionProps) {
  const { data: vetoActions, isLoading, error } = useVetoActions(proposalId);
  const createMutation = useCreateVetoAction();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    reason: ''
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId) {
      toast({
        title: "Error",
        description: "No proposal selected for veto action",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate({
      proposalId,
      reason: formData.reason
    });
    setCreateDialogOpen(false);
    setFormData({ reason: '' });
  };

  if (isLoading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center border-border/50 bg-background/50">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-border/50 bg-background/50">
        <CardHeader>
          <CardTitle className="flex items-center text-neon-blue">
            <ShieldAlert className="mr-2 h-5 w-5" /> Veto Actions
          </CardTitle>
          <CardDescription>Proposal protection history</CardDescription>
        </CardHeader>
        <CardContent className="text-center p-6">
          <p className="text-red-500">Error loading veto actions: {(error as Error).message}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border/50 bg-background/50">
      <CardHeader>
        <CardTitle className="flex items-center text-neon-blue">
          <ShieldAlert className="mr-2 h-5 w-5" /> Veto Actions
        </CardTitle>
        <CardDescription>Proposal protection history</CardDescription>
      </CardHeader>
      <CardContent>
        {vetoActions && Array.isArray(vetoActions) && vetoActions.length > 0 ? (
          <div className="space-y-4">
            {vetoActions.map((action: VetoAction) => (
              <div key={action.id} className="p-4 border rounded-md bg-background/70 hover:bg-background/90 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium flex items-center">
                      Guardian Action
                      <Badge variant="outline" className="ml-2 bg-red-900/30 text-red-400 border-red-700">
                        Veto Initiated
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      By: {action.guardianName || action.guardianId}
                    </p>
                  </div>
                </div>
                
                {action.reason && (
                  <div className="mt-3 p-3 bg-background/80 rounded border border-border/50">
                    <p className="text-sm flex items-start">
                      <Info className="h-4 w-4 mr-2 mt-0.5 text-neon-blue" />
                      <span>{action.reason}</span>
                    </p>
                  </div>
                )}
                
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Created: {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}</span>
                  {action.actionDate && (
                    <span>• Action taken: {new Date(action.actionDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 border rounded-md border-dashed">
            <p className="text-muted-foreground">No veto actions for this proposal</p>
            {proposalId && (
              <p className="text-xs text-muted-foreground mt-2">
                Guardians have not flagged this proposal for review
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {proposalId && walletAddress && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1 text-neon-blue border-neon-blue/50 hover:bg-red-900/10">
                <ShieldAlert className="h-4 w-4" /> Initiate Veto Action
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Guardian Veto Action</DialogTitle>
                <DialogDescription>
                  As a veto guardian, you can initiate action against proposals that pose a risk to the network.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="proposal">Proposal</Label>
                    <Input 
                      id="proposal" 
                      value={proposalId}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason for Veto <span className="text-red-500">*</span></Label>
                    <Textarea 
                      id="reason" 
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      placeholder="Explain why this proposal should be vetoed..." 
                      rows={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Provide a clear explanation for network transparency</p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || !formData.reason}
                    className="gap-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {createMutation.isPending && <Spinner size="sm" />}
                    Confirm Veto Action <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}

export { VetoActionSection };
export default VetoActionSection;