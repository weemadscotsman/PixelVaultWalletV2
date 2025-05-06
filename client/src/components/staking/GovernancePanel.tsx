import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStaking } from "@/hooks/use-staking";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { VetoGuardiansPanel } from "@/components/governance/VetoGuardiansPanel";
import { useState } from "react";
import { ProposalCard } from "./ProposalCard";

export function GovernancePanel() {
  const { proposals, votesCount, createProposal } = useStaking();
  const { wallet } = useWallet();
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ttl, setTtl] = useState("7");
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateProposal = async () => {
    if (!wallet) return;
    
    try {
      setIsCreating(true);
      await createProposal(wallet.publicAddress, title, description, parseInt(ttl));
      
      toast({
        title: "Proposal Created",
        description: "Your governance proposal has been submitted",
      });
      
      // Reset form and close dialog
      setTitle("");
      setDescription("");
      setTtl("7");
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Proposal creation error:", error);
      toast({
        title: "Proposal Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create proposal",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="bg-card rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <i className="ri-government-line mr-2 text-primary"></i>
        Governance
      </h3>
      
      <div className="space-y-6">
        {/* Governance Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background p-3 rounded-md">
            <div className="text-sm text-gray-400">Active Proposals</div>
            <div className="text-xl text-white">{proposals.length}</div>
          </div>
          <div className="bg-background p-3 rounded-md">
            <div className="text-sm text-gray-400">Your Votes</div>
            <div className="text-xl text-white">{votesCount}</div>
          </div>
        </div>
        
        {/* Governance Tabs */}
        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="w-full mb-3 bg-background/60 text-shadow-neon">
            <TabsTrigger 
              value="proposals" 
              className="data-[state=active]:bg-primary-dark/30 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Active Proposals
            </TabsTrigger>
            <TabsTrigger 
              value="veto" 
              className="data-[state=active]:bg-primary-dark/30 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Veto Guardians
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="proposals" className="space-y-4 mt-0">
            <div className="flex justify-between items-center">
              <h4 className="text-sm uppercase text-gray-400">PIXELVAULT // GOVERNANCE</h4>
              {proposals.length > 2 && (
                <Button 
                  variant="link" 
                  className="text-xs text-primary hover:text-primary-light"
                >
                  View All
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {proposals.length > 0 ? (
                proposals.slice(0, 2).map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 italic bg-background/80 rounded-md border border-gray-800 text-shadow-neon">
                  <code>{'>'} No active proposals found in mempool</code>
                  <p className="mt-2 text-xs text-muted-foreground">Create a proposal to initiate network-wide voting</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="veto" className="mt-0">
            <div className="text-xs text-muted-foreground mb-3 bg-background/80 p-2 rounded-md border border-gray-800 text-shadow-neon">
              <code className="text-primary-light">SYSTEM://</code> Veto guardians are entrusted with emergency powers to protect the network from malicious proposals
            </div>
            <VetoGuardiansPanel />
          </TabsContent>
        </Tabs>
        
        {/* Create Proposal */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              className="w-full bg-background hover:bg-muted text-white"
            >
              <i className="ri-add-line mr-2"></i>
              Create Proposal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Governance Proposal</DialogTitle>
              <DialogDescription>
                Proposals require 1,000 vPVX voting power minimum to create
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input 
                  id="title" 
                  placeholder="PIP-XX: Short descriptive title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Detailed description of the proposal and its benefits..." 
                  rows={4}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ttl">Voting Period (days)</Label>
                <select 
                  id="ttl"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={ttl}
                  onChange={(e) => setTtl(e.target.value)}
                >
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleCreateProposal} 
                disabled={isCreating || !title || !description}
              >
                {isCreating ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  "Submit Proposal"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <p className="text-xs text-gray-400 text-center">
          Requires minimum 1,000 vPVX voting power to create proposals
        </p>
      </div>
    </div>
  );
}
