import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
  RefreshCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VetoGuardianSection from '@/components/governance/VetoGuardianSection';
import VetoProposalDialog from '@/components/governance/VetoProposalDialog';

// Example governance data
const governanceData = {
  activeProposals: 2,
  votingPower: 8500,
  votingStatus: 'Open',
  nextVoteEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
  totalVoters: 247,
  proposals: [
    {
      id: 'prop-001',
      title: 'Increase Staking Rewards by 2%',
      description: 'This proposal aims to increase the staking rewards from the current 8% to 10% annually to incentivize more users to stake their PVX tokens and enhance network security.',
      status: 'Active',
      proposer: '0x3a4b...7c9d',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      category: 'Economic',
      votes: {
        for: 62,
        against: 18,
        abstain: 5
      },
      quorum: 85,
      yourVote: 'For',
      vetoPossible: true
    },
    {
      id: 'prop-002',
      title: 'Add New NFT Marketplace Feature',
      description: 'Implement a new NFT marketplace feature within the PVX platform to enable users to trade their Thringlets and other NFTs directly, with a 1% transaction fee that goes to the treasury.',
      status: 'Active',
      proposer: '0x8e2d...4f9a',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      category: 'Feature',
      votes: {
        for: 75,
        against: 10,
        abstain: 3
      },
      quorum: 80,
      yourVote: null,
      vetoPossible: true
    },
    {
      id: 'prop-003',
      title: 'Reduce Transaction Fees by 10%',
      description: 'This proposal suggests reducing the standard transaction fees by 10% to make the platform more accessible and competitive compared to other alternatives.',
      status: 'Passed',
      proposer: '0x7e2f...1a5b',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      category: 'Economic',
      votes: {
        for: 82,
        against: 12,
        abstain: 2
      },
      quorum: 95,
      yourVote: 'For',
      implementationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      vetoPossible: false
    },
    {
      id: 'prop-004',
      title: 'Add Veto Guardian Role',
      description: 'Create a new role called "Veto Guardian" that will be assigned to trusted community members who can veto malicious proposals before they are implemented.',
      status: 'Rejected',
      proposer: '0x9d4e...5c2f',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      category: 'Governance',
      votes: {
        for: 35,
        against: 60,
        abstain: 5
      },
      quorum: 90,
      yourVote: 'Against',
      vetoPossible: false
    }
  ],
  vetoGuardians: [
    {
      id: 1,
      address: '0x3a4b...7c9d',
      status: 'Active',
      vetoPower: 100,
      appointedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)
    }
  ]
};

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<'active' | 'passed' | 'rejected'>('active');
  const [selectedProposal, setSelectedProposal] = useState(governanceData.proposals.find(p => p.status === 'Active'));
  const [isVetoDialogOpen, setIsVetoDialogOpen] = useState(false);
  const [currentGuardianId, setCurrentGuardianId] = useState<number>(governanceData.vetoGuardians[0]?.id);
  
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
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-500/20 text-blue-300 border-blue-600/30';
      case 'passed':
        return 'bg-green-500/20 text-green-300 border-green-600/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-600/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-600/30';
    }
  };
  
  const getVoteColor = (vote: string | null) => {
    if (!vote) return 'bg-gray-500/20 text-gray-300 border-gray-600/30';
    
    switch (vote.toLowerCase()) {
      case 'for':
        return 'bg-green-500/20 text-green-300 border-green-600/30';
      case 'against':
        return 'bg-red-500/20 text-red-300 border-red-600/30';
      case 'abstain':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-600/30';
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <Award className="inline-block mr-2 h-6 w-6" /> 
            PVX Governance
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/70 border-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/30 p-2 rounded-full">
                  <Vote className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Your Voting Power</p>
                  <p className="text-xl font-bold text-blue-300">{governanceData.votingPower.toLocaleString()} μPVX</p>
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
                  <p className="text-xl font-bold text-blue-300">{governanceData.totalVoters}</p>
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
                  <p className="text-xs text-gray-400">Next Vote Ends</p>
                  <p className="text-xl font-bold text-blue-300">{formatTimeRemaining(governanceData.nextVoteEnd)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <Card className="bg-black/70 border-blue-900/50">
              <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-blue-300">Proposals</CardTitle>
                  <div className="flex h-8 items-center justify-center rounded-md bg-blue-900/20 p-0.5 text-blue-300 w-full sm:w-auto">
                    <button
                      className={`flex-1 sm:flex-auto inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        activeTab === 'active' 
                          ? 'bg-blue-800 text-white shadow-sm' 
                          : 'text-blue-300 hover:bg-blue-800/20'
                      }`}
                      onClick={() => {
                        setActiveTab('active');
                        setSelectedProposal(governanceData.proposals.find(p => p.status === 'Active'));
                      }}
                    >
                      <Vote className="mr-1.5 h-3 w-3" />
                      Active
                    </button>
                    <button
                      className={`flex-1 sm:flex-auto inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        activeTab === 'passed' 
                          ? 'bg-blue-800 text-white shadow-sm' 
                          : 'text-blue-300 hover:bg-blue-800/20'
                      }`}
                      onClick={() => {
                        setActiveTab('passed');
                        setSelectedProposal(governanceData.proposals.find(p => p.status === 'Passed'));
                      }}
                    >
                      <CheckCircle className="mr-1.5 h-3 w-3" />
                      Passed
                    </button>
                    <button
                      className={`flex-1 sm:flex-auto inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        activeTab === 'rejected' 
                          ? 'bg-blue-800 text-white shadow-sm' 
                          : 'text-blue-300 hover:bg-blue-800/20'
                      }`}
                      onClick={() => {
                        setActiveTab('rejected');
                        setSelectedProposal(governanceData.proposals.find(p => p.status === 'Rejected'));
                      }}
                    >
                      <XCircle className="mr-1.5 h-3 w-3" />
                      Rejected
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {governanceData.proposals.filter(p => {
                    if (activeTab === 'active') return p.status === 'Active';
                    if (activeTab === 'passed') return p.status === 'Passed';
                    if (activeTab === 'rejected') return p.status === 'Rejected';
                    return true;
                  }).map((proposal) => (
                    <div 
                      key={proposal.id} 
                      className={`p-4 rounded border cursor-pointer transition-all hover:border-blue-400/50 ${selectedProposal?.id === proposal.id ? 'bg-blue-950/30 border-blue-400/70' : 'bg-gray-900/30 border-blue-900/30'}`}
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-blue-300">{proposal.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getCategoryColor(proposal.category)}>
                              {proposal.category}
                            </Badge>
                            {proposal.yourVote && (
                              <Badge variant="outline" className={getVoteColor(proposal.yourVote)}>
                                Your Vote: {proposal.yourVote}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                      </div>
                      
                      {proposal.status === 'Active' ? (
                        <div>
                          <div className="flex justify-between mb-1">
                            <p className="text-xs text-gray-400">Current Votes</p>
                            <p className="text-xs text-blue-300">Quorum: {proposal.quorum}%</p>
                          </div>
                          <div className="w-full h-2 bg-gray-900/60 rounded-full overflow-hidden mb-1">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${proposal.votes.for}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <p className="text-green-400">For: {proposal.votes.for}%</p>
                            <p className="text-red-400">Against: {proposal.votes.against}%</p>
                            <p className="text-yellow-400">Abstain: {proposal.votes.abstain}%</p>
                          </div>
                          <div className="text-xs text-gray-400 mt-2 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatTimeRemaining(proposal.endDate)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>Ended on {formatDate(proposal.endDate)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
                <Button 
                  className="w-full h-10 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-medium shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Proposal</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {selectedProposal && (
              <Card className="bg-black/70 border-blue-900/50 h-full">
                <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-400">Proposal Details</p>
                      <CardTitle className="text-blue-300">{selectedProposal.title}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getCategoryColor(selectedProposal.category)}>
                        {selectedProposal.category}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(selectedProposal.status)}>
                        {selectedProposal.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-900/30 p-3 rounded">
                        <p className="text-xs text-gray-400">Proposer</p>
                        <p className="text-sm font-mono text-gray-300">{selectedProposal.proposer}</p>
                      </div>
                      <div className="bg-gray-900/30 p-3 rounded">
                        <p className="text-xs text-gray-400">Created</p>
                        <p className="text-sm text-gray-300">{formatDate(selectedProposal.createdAt)}</p>
                      </div>
                      <div className="bg-gray-900/30 p-3 rounded">
                        <p className="text-xs text-gray-400">Voting Ends</p>
                        <p className="text-sm text-gray-300">{formatDate(selectedProposal.endDate)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 mb-2">Description</p>
                      <p className="text-gray-300 bg-gray-900/40 p-4 rounded border border-blue-900/30">
                        {selectedProposal.description}
                      </p>
                    </div>
                    
                    {selectedProposal.status === 'Active' && (
                      <>
                        <div>
                          <p className="text-gray-400 mb-3">Current Voting Results</p>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between mb-1">
                                <p className="text-sm text-green-400">For</p>
                                <p className="text-sm text-green-400">{selectedProposal.votes.for}%</p>
                              </div>
                              <div className="w-full h-3 bg-gray-900/60 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500" 
                                  style={{ width: `${selectedProposal.votes.for}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <p className="text-sm text-red-400">Against</p>
                                <p className="text-sm text-red-400">{selectedProposal.votes.against}%</p>
                              </div>
                              <div className="w-full h-3 bg-gray-900/60 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500" 
                                  style={{ width: `${selectedProposal.votes.against}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <p className="text-sm text-yellow-400">Abstain</p>
                                <p className="text-sm text-yellow-400">{selectedProposal.votes.abstain}%</p>
                              </div>
                              <div className="w-full h-3 bg-gray-900/60 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-500" 
                                  style={{ width: `${selectedProposal.votes.abstain}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-950/20 p-4 rounded border border-blue-900/30">
                          <p className="text-gray-400 mb-3">Cast Your Vote</p>
                          
                          {selectedProposal.yourVote ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center w-full mb-3">
                                <Badge className="px-4 py-2 text-base" variant="outline">
                                  You voted: <span className="font-bold ml-1">{selectedProposal.yourVote}</span>
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400 mb-4 text-center">You have already cast your vote on this proposal.</p>
                              <Button 
                                variant="outline" 
                                className="h-9 border-blue-900/50 text-blue-300 flex items-center gap-2 w-2/3"
                              >
                                <RefreshCcw className="h-3.5 w-3.5" />
                                <span>Change Vote</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex w-full bg-black/60 rounded-lg overflow-hidden border border-blue-900/50">
                                <button className="w-1/3 py-3 bg-green-700/30 hover:bg-green-700/50 border-r border-r-blue-900/50 transition-colors flex flex-col items-center gap-1.5">
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                  <span className="text-sm font-medium text-green-400">For</span>
                                </button>
                                <button className="w-1/3 py-3 bg-red-700/30 hover:bg-red-700/50 border-r border-r-blue-900/50 transition-colors flex flex-col items-center gap-1.5">
                                  <XCircle className="h-5 w-5 text-red-400" />
                                  <span className="text-sm font-medium text-red-400">Against</span>
                                </button>
                                <button className="w-1/3 py-3 bg-yellow-700/30 hover:bg-yellow-700/50 transition-colors flex flex-col items-center gap-1.5">
                                  <MinusCircle className="h-5 w-5 text-yellow-400" />
                                  <span className="text-sm font-medium text-yellow-400">Abstain</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {selectedProposal.vetoPossible && governanceData.vetoGuardians.length > 0 && (
                          <div className="bg-red-950/20 p-4 rounded border border-red-900/30">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                              <p className="text-gray-300">Veto Guardian Controls</p>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">
                              As a Veto Guardian, you have the power to veto this proposal if you believe it is harmful to the network.
                            </p>
                            <Button 
                              variant="destructive" 
                              className="bg-red-700 hover:bg-red-600 text-white"
                              onClick={() => setIsVetoDialogOpen(true)}
                            >
                              Veto Proposal
                            </Button>
                          </div>
                        )}
                        
                        {/* Veto Proposal Dialog */}
                        {selectedProposal && (
                          <VetoProposalDialog
                            isOpen={isVetoDialogOpen}
                            onClose={() => setIsVetoDialogOpen(false)}
                            proposalId={selectedProposal.id}
                            proposalTitle={selectedProposal.title}
                            guardianId={currentGuardianId}
                          />
                        )}
                      </>
                    )}
                    
                    {selectedProposal.status === 'Passed' && (
                      <div className="bg-green-950/20 p-4 rounded border border-green-900/30">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <p className="text-gray-300">Implementation Details</p>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          This proposal has passed and will be implemented on {formatDate(selectedProposal.implementationDate!)}
                        </p>
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-green-400">Final Result:</p>
                            <p className="text-sm text-green-400 font-bold">{selectedProposal.votes.for}% in favor</p>
                          </div>
                          <Button variant="outline" className="border-blue-900/50 text-blue-300 h-9 flex items-center gap-2">
                            <span>View Details</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {selectedProposal.status === 'Rejected' && (
                      <div className="bg-red-950/20 p-4 rounded border border-red-900/30">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="h-5 w-5 text-red-400" />
                          <p className="text-gray-300">Rejection Details</p>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          This proposal has been rejected by the community and will not be implemented.
                        </p>
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-red-400">Final Result:</p>
                            <p className="text-sm text-red-400 font-bold">{selectedProposal.votes.against}% against</p>
                          </div>
                          <Button variant="outline" className="border-blue-900/50 text-blue-300 h-9 flex items-center gap-2">
                            <span>View Details</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Add Veto Guardian section */}
        <div className="mt-6">
          <VetoGuardianSection />
        </div>
      </div>
    </DashboardLayout>
  );
}