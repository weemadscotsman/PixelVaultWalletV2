import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Heart, Zap, Eye, Users, Shield, TrendingUp, Activity } from "lucide-react";

interface PersonalityTraits {
  curiosity: number;
  loyalty: number;
  independence: number;
  analytical: number;
  social: number;
  risk_tolerance: number;
  learning_speed: number;
  energy_level: number;
}

interface CompanionState {
  mood: 'excited' | 'calm' | 'focused' | 'curious' | 'protective' | 'adventurous';
  energy: number;
  satisfaction: number;
  stress: number;
  last_interaction: Date;
  context_memory: string[];
}

interface BlockchainCompanion {
  id: string;
  name: string;
  owner_address: string;
  traits: PersonalityTraits;
  state: CompanionState;
  experience_points: number;
  level: number;
  creation_date: Date;
  last_evolution: Date;
  interaction_history: any[];
  learned_patterns: Record<string, number>;
}

interface CompanionCardProps {
  companion: BlockchainCompanion;
  onInteract: (companionId: string) => void;
  onSimulate: (companionId: string) => void;
}

const getMoodIcon = (mood: CompanionState['mood']) => {
  switch (mood) {
    case 'excited': return <Zap className="w-4 h-4 text-yellow-500" />;
    case 'calm': return <Heart className="w-4 h-4 text-blue-500" />;
    case 'focused': return <Eye className="w-4 h-4 text-purple-500" />;
    case 'curious': return <Brain className="w-4 h-4 text-green-500" />;
    case 'protective': return <Shield className="w-4 h-4 text-red-500" />;
    case 'adventurous': return <TrendingUp className="w-4 h-4 text-orange-500" />;
    default: return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const getMoodColor = (mood: CompanionState['mood']) => {
  switch (mood) {
    case 'excited': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500';
    case 'calm': return 'bg-blue-500/20 text-blue-700 border-blue-500';
    case 'focused': return 'bg-purple-500/20 text-purple-700 border-purple-500';
    case 'curious': return 'bg-green-500/20 text-green-700 border-green-500';
    case 'protective': return 'bg-red-500/20 text-red-700 border-red-500';
    case 'adventurous': return 'bg-orange-500/20 text-orange-700 border-orange-500';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500';
  }
};

const getTraitIcon = (trait: keyof PersonalityTraits) => {
  switch (trait) {
    case 'curiosity': return <Brain className="w-3 h-3" />;
    case 'loyalty': return <Heart className="w-3 h-3" />;
    case 'independence': return <TrendingUp className="w-3 h-3" />;
    case 'analytical': return <Eye className="w-3 h-3" />;
    case 'social': return <Users className="w-3 h-3" />;
    case 'risk_tolerance': return <Zap className="w-3 h-3" />;
    case 'learning_speed': return <Activity className="w-3 h-3" />;
    case 'energy_level': return <Shield className="w-3 h-3" />;
  }
};

export function CompanionCard({ companion, onInteract, onSimulate }: CompanionCardProps) {
  const dominantTrait = Object.entries(companion.traits).reduce((max, current) => 
    current[1] > max[1] ? current : max
  );

  const xpForNextLevel = companion.level * 100;
  const levelProgress = (companion.experience_points / xpForNextLevel) * 100;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-gradient">
              {companion.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Level {companion.level}</p>
          </div>
          <Badge className={`${getMoodColor(companion.state.mood)} flex items-center gap-1`}>
            {getMoodIcon(companion.state.mood)}
            {companion.state.mood}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>XP Progress</span>
            <span>{companion.experience_points}/{xpForNextLevel}</span>
          </div>
          <Progress value={levelProgress} className="h-1" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* State Indicators */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Zap className="w-3 h-3" />
              Energy
            </div>
            <Progress value={companion.state.energy} className="h-1" />
            <span className="text-xs text-muted-foreground">{Math.round(companion.state.energy)}%</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Heart className="w-3 h-3" />
              Satisfaction
            </div>
            <Progress value={companion.state.satisfaction} className="h-1" />
            <span className="text-xs text-muted-foreground">{Math.round(companion.state.satisfaction)}%</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Activity className="w-3 h-3" />
              Stress
            </div>
            <Progress value={companion.state.stress} className="h-1" />
            <span className="text-xs text-muted-foreground">{Math.round(companion.state.stress)}%</span>
          </div>
        </div>

        {/* Dominant Trait */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            {getTraitIcon(dominantTrait[0] as keyof PersonalityTraits)}
            <span className="text-sm font-medium capitalize">
              {dominantTrait[0].replace('_', ' ')}
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round(dominantTrait[1])}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Primary personality trait driving behavior and decision-making
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onInteract(companion.id)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Brain className="w-3 h-3 mr-1" />
            Interact
          </Button>
          <Button
            onClick={() => onSimulate(companion.id)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Activity className="w-3 h-3 mr-1" />
            Simulate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}