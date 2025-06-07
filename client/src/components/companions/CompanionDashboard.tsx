import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CompanionCard } from "./CompanionCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Brain, Sparkles, Activity, Users } from "lucide-react";

interface BlockchainCompanion {
  id: string;
  name: string;
  owner_address: string;
  traits: {
    curiosity: number;
    loyalty: number;
    independence: number;
    analytical: number;
    social: number;
    risk_tolerance: number;
    learning_speed: number;
    energy_level: number;
  };
  state: {
    mood: 'excited' | 'calm' | 'focused' | 'curious' | 'protective' | 'adventurous';
    energy: number;
    satisfaction: number;
    stress: number;
    last_interaction: Date;
    context_memory: string[];
  };
  experience_points: number;
  level: number;
  creation_date: Date;
  last_evolution: Date;
  interaction_history: any[];
  learned_patterns: Record<string, number>;
}

export function CompanionDashboard() {
  const { toast } = useToast();
  const [newCompanionName, setNewCompanionName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(null);

  // Fetch user's companions
  const { data: companions = [], isLoading } = useQuery<BlockchainCompanion[]>({
    queryKey: ['/api/companions'],
    refetchInterval: 30000, // Refresh every 30 seconds to see personality changes
  });

  // Create companion mutation
  const createCompanionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest('POST', '/api/companions/create', { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companions'] });
      setIsCreateDialogOpen(false);
      setNewCompanionName("");
      toast({
        title: "Companion Created",
        description: "Your new blockchain companion is ready to explore!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Interact with companion mutation
  const interactMutation = useMutation({
    mutationFn: async ({ companionId, eventType, details }: { 
      companionId: string; 
      eventType: string; 
      details: Record<string, any> 
    }) => {
      const res = await apiRequest('POST', `/api/companions/${companionId}/event`, {
        eventType,
        details
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companions'] });
      toast({
        title: "Interaction Complete",
        description: "Your companion's personality has evolved from this experience.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Interaction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Simulate autonomous activity mutation
  const simulateMutation = useMutation({
    mutationFn: async (companionId: string) => {
      const res = await apiRequest('POST', `/api/companions/${companionId}/simulate`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/companions'] });
      if (data.activities && data.activities.length > 0) {
        toast({
          title: "Autonomous Activity",
          description: data.activities.join(', '),
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCompanion = () => {
    if (!newCompanionName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your companion.",
        variant: "destructive",
      });
      return;
    }
    createCompanionMutation.mutate(newCompanionName.trim());
  };

  const handleInteract = (companionId: string) => {
    // Simulate various blockchain interaction types
    const interactionTypes = [
      { eventType: 'transaction', details: { amount: Math.random() * 1000, success: true } },
      { eventType: 'mining', details: { blockNumber: Math.floor(Math.random() * 10000), success: true } },
      { eventType: 'staking', details: { amount: Math.random() * 500, duration: '30d', success: true } },
      { eventType: 'governance', details: { proposalId: Math.floor(Math.random() * 100), vote: 'yes' } },
      { eventType: 'learning', details: { module: 'blockchain_basics', completion: 100 } },
      { eventType: 'social', details: { participants: Math.floor(Math.random() * 5) + 1, success: true } }
    ];
    
    const randomInteraction = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
    interactMutation.mutate({ companionId, ...randomInteraction });
  };

  const handleSimulate = (companionId: string) => {
    simulateMutation.mutate(companionId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gradient">Blockchain Companions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-4/5"></div>
                  <div className="h-3 bg-muted rounded w-3/5"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Blockchain Companions</h2>
          <p className="text-muted-foreground">
            AI companions that evolve based on your blockchain interactions
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <Plus className="w-4 h-4 mr-2" />
              Create Companion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Companion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Companion Name</label>
                <Input
                  value={newCompanionName}
                  onChange={(e) => setNewCompanionName(e.target.value)}
                  placeholder="Enter a unique name..."
                  className="mt-1"
                />
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Companion Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Evolving personality traits based on interactions</li>
                  <li>• Autonomous blockchain exploration</li>
                  <li>• Dynamic mood and behavior adaptation</li>
                  <li>• Experience-based leveling system</li>
                </ul>
              </div>
              <Button 
                onClick={handleCreateCompanion}
                disabled={createCompanionMutation.isPending}
                className="w-full"
              >
                {createCompanionMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Create Companion
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {companions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{companions.length}</p>
                  <p className="text-sm text-muted-foreground">Active Companions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(companions.reduce((acc: number, comp: BlockchainCompanion) => acc + comp.level, 0) / companions.length)}
                  </p>
                  <p className="text-sm text-muted-foreground">Average Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {companions.reduce((acc: number, comp: BlockchainCompanion) => acc + comp.experience_points, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {companions.filter((comp: BlockchainCompanion) => 
                      comp.state.mood === 'excited' || comp.state.mood === 'curious'
                    ).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Mood</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Companions Grid */}
      {companions.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Companions Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first blockchain companion to start exploring dynamic personality traits
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Companion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companions.map((companion: BlockchainCompanion) => (
            <CompanionCard
              key={companion.id}
              companion={companion}
              onInteract={handleInteract}
              onSimulate={handleSimulate}
            />
          ))}
        </div>
      )}

      {/* Interactive Tutorial */}
      {companions.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Personality Evolution Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Interaction Types</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Trading:</strong> Increases analytical & risk tolerance</li>
                  <li>• <strong>Mining:</strong> Boosts independence & curiosity</li>
                  <li>• <strong>Staking:</strong> Enhances loyalty & reduces risk taking</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Autonomous Behaviors</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• High independence triggers self-exploration</li>
                  <li>• Social companions network with others</li>
                  <li>• Curious types discover new patterns</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}