import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useWallet } from '@/hooks/use-wallet';
import { useGovernance } from '@/hooks/use-governance';
import { useWebSocket } from '@/hooks/use-websocket';
import { 
  Award, 
  CheckCircle,
  XCircle,
  Users,
  Clock,
  Vote,
  BarChart,
  ChevronRight,
  Plus,
  Shield,
  AlertTriangle,
  MinusCircle,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VetoGuardianSection from '@/components/governance/VetoGuardianSection';
import VetoProposalDialog from '@/components/governance/VetoProposalDialog';

export default function GovernancePage() {
  const { wallet } = useWallet();
  const { stats, proposals, vetoGuardians, vote, createProposal, veto, isLoading } = useGovernance(wallet?.address);
  useWebSocket(wallet?.address);
  
  const [activeTab, setActiveTab] = useState<'active' | 'passed' | 'rejected'>('active');
  const [selectedProposal, setSelectedProposal] = useState(proposals?.find(p => p.status === 'Active'));
  const [isVetoDialogOpen, setIsVetoDialogOpen] = useState(false);
  const [currentGuardianId, setCurrentGuardianId] = useState<number>(vetoGuardians?.[0]?.id);

  if (isLoading) {
    return (
      <PageLayout title="Governance">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </PageLayout>
    );
  }

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Ended';
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else {
      const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m remaining`;
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'economic':
        return 'bg-green-500/20 text-green-300 border-green-600/30';
      case 'feature':
        return 'bg-blue-500/20 text-blue-300 border-blue-600/30';
      case 'governance':
        return 'bg-purple-500/20 text-purple-300 border-purple-600/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-600/30';
    }
  };

  const filteredProposals = proposals?.filter(proposal => {
    switch (activeTab) {
      case 'active':
        return proposal.status === 'Active';
      case 'passed':
        return proposal.status === 'Passed';
      case 'rejected':
        return proposal.status === 'Rejected';
      default:
        return true;
    }
  }) || [];

  const handleVote = (proposalId: number, voteType: 'for' | 'against') => {
    if (!wallet) return;
    vote({
      proposalId,
      vote: voteType,
      voterAddress: wallet.address,
      votingPower: stats?.userVotingPower || 0
    });
  };

  return (
    <PageLayout title="Governance">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/70 border-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/30 p-2 rounded-full">
                  <Vote className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Your Voting Power</p>
                  <p className="text-xl font-bold text-blue-300">{stats?.userVotingPower?.toLocaleString() || 0} μPVX</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/30 p-2 rounded-full">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Active Voters</p>
                  <p className="text-xl font-bold text-blue-300">{stats?.totalVoters || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/30 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Active Proposals</p>
                  <p className="text-xl font-bold text-blue-300">{stats?.activeProposals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proposals List */}
          <div className="lg:col-span-2">
            <Card className="bg-black/70 border-blue-900/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-white">Governance Proposals</CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                  <TabsList className="bg-gray-900/60 border-gray-700">
                    <TabsTrigger value="active" className="text-gray-300">Active</TabsTrigger>
                    <TabsTrigger value="passed" className="text-gray-300">Passed</TabsTrigger>
                    <TabsTrigger value="rejected" className="text-gray-300">Rejected</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeTab} className="mt-6">
                    <div className="space-y-4">
                      {filteredProposals.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          No {activeTab} proposals found
                        </div>
                      ) : (
                        filteredProposals.map((proposal) => (
                          <Card key={proposal.id} className="bg-gray-900/50 border-gray-700 hover:border-blue-600/50 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-medium text-white">{proposal.title}</h3>
                                    <Badge className={getCategoryColor(proposal.category)}>
                                      {proposal.category}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-400 text-sm mb-3">{proposal.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>By {proposal.createdBy}</span>
                                    <span>{formatDate(proposal.createdAt)}</span>
                                    {proposal.status === 'Active' && (
                                      <span>{formatTimeRemaining(proposal.votingEnds)}</span>
                                    )}
                                  </div>
                                </div>
                                {proposal.status === 'Active' && (
                                  <div className="flex gap-2">
                                    <Button 
                                      data-testid="vote-button"
                                      size="sm" 
                                      variant="outline" 
                                      className="border-green-600 text-green-400 hover:bg-green-600/20"
                                      onClick={() => handleVote(proposal.id, 'for')}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      For
                                    </Button>
                                    <Button 
                                      data-testid="vote-button"
                                      size="sm" 
                                      variant="outline" 
                                      className="border-red-600 text-red-400 hover:bg-red-600/20"
                                      onClick={() => handleVote(proposal.id, 'against')}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Against
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              {/* Voting Progress */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>For: {proposal.votesFor}</span>
                                  <span>Against: {proposal.votesAgainst}</span>
                                  <span>Total: {proposal.totalVotes}</span>
                                </div>
                                <Progress 
                                  value={proposal.totalVotes > 0 ? (proposal.votesFor / proposal.totalVotes) * 100 : 0} 
                                  className="h-2"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Veto Guardian Section */}
          <div className="space-y-6">
            <VetoGuardianSection 
              guardians={vetoGuardians || []}
              onVetoClick={(guardianId) => {
                setCurrentGuardianId(guardianId);
                setIsVetoDialogOpen(true);
              }}
            />
          </div>
        </div>

        {/* Veto Dialog */}
        <VetoProposalDialog
          isOpen={isVetoDialogOpen}
          onClose={() => setIsVetoDialogOpen(false)}
          proposal={selectedProposal}
          guardianId={currentGuardianId}
          onVeto={(proposalId, reason) => {
            if (!wallet || !currentGuardianId) return;
            veto({
              proposalId,
              guardianAddress: wallet.address,
              reason
            });
            setIsVetoDialogOpen(false);
          }}
        />
      </div>
    </PageLayout>
  );
}