import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useStaking } from "@/hooks/use-staking";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { Proposal, VoteOption } from "@/types/blockchain";

interface ProposalCardProps {
  proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const { vote, hasVoted } = useStaking();
  const { wallet } = useWallet();
  const { toast } = useToast();
  
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState<VoteOption>(VoteOption.YES);
  const [isVoting, setIsVoting] = useState(false);
  
  // Calculate remaining days
  const endDate = new Date(proposal.endTime);
  const today = new Date();
  const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate quorum percentage
  const quorumPercentage = Math.min(100, Math.round((proposal.voteCount / proposal.quorum) * 100));
  
  // Calculate yes/no percentages
  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage = totalVotes > 0 ? Math.round((proposal.yesVotes / totalVotes) * 100) : 0;
  const noPercentage = totalVotes > 0 ? Math.round((proposal.noVotes / totalVotes) * 100) : 0;
  
  // Check if user has already voted on this proposal
  const userHasVoted = hasVoted(proposal.id);
  
  const handleVote = async () => {
    if (!wallet) return;
    
    try {
      setIsVoting(true);
      await vote(wallet.publicAddress, proposal.id, selectedOption);
      
      toast({
        title: "Vote Submitted",
        description: `You voted ${selectedOption.toLowerCase()} on proposal ${proposal.title}`,
      });
      
      setShowVoteDialog(false);
    } catch (error) {
      console.error("Voting error:", error);
      toast({
        title: "Voting Failed",
        description: error instanceof Error ? error.message : "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };
  
  return (
    <div className="bg-background p-4 rounded-md">
      <div className="flex justify-between items-start mb-2">
        <h5 className="text-white font-medium">{proposal.title}</h5>
        <span className="text-xs px-2 py-0.5 bg-primary-dark text-white rounded-full">
          Active
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-3">
        {proposal.description}
      </p>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Quorum: {quorumPercentage}% / 100%</span>
          <span>Ends in {remainingDays} {remainingDays === 1 ? 'day' : 'days'}</span>
        </div>
        <Progress value={quorumPercentage} className="h-2" />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex space-x-3">
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-status-success rounded-full mr-1"></span>
            <span className="text-gray-400">Yes: {yesPercentage}%</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-status-error rounded-full mr-1"></span>
            <span className="text-gray-400">No: {noPercentage}%</span>
          </div>
        </div>
        
        <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="link" 
              className="text-primary hover:text-primary-light text-sm p-0"
              disabled={userHasVoted || !wallet}
            >
              {userHasVoted ? "Voted" : "Vote"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vote on Proposal</DialogTitle>
              <DialogDescription>
                {proposal.title}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <RadioGroup value={selectedOption} onValueChange={(value) => setSelectedOption(value as VoteOption)}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={VoteOption.YES} id="vote-yes" />
                  <Label htmlFor="vote-yes">Yes, I support this proposal</Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={VoteOption.NO} id="vote-no" />
                  <Label htmlFor="vote-no">No, I do not support this proposal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={VoteOption.ABSTAIN} id="vote-abstain" />
                  <Label htmlFor="vote-abstain">Abstain (count towards quorum only)</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleVote} 
                disabled={isVoting}
              >
                {isVoting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  "Submit Vote"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
