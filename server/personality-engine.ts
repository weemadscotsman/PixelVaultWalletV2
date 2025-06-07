import { memBlockchainStorage } from './mem-blockchain';
import crypto from 'crypto';

// Core personality traits that evolve over time
export interface PersonalityTraits {
  curiosity: number;        // 0-100: How much the companion explores
  loyalty: number;          // 0-100: Attachment to user
  independence: number;     // 0-100: Autonomous behavior level
  analytical: number;       // 0-100: Focus on data and patterns
  social: number;          // 0-100: Interaction with other companions
  risk_tolerance: number;   // 0-100: Willingness to take risks
  learning_speed: number;   // 0-100: How quickly traits evolve
  energy_level: number;     // 0-100: Activity and responsiveness
}

// Companion's current state and mood
export interface CompanionState {
  mood: 'excited' | 'calm' | 'focused' | 'curious' | 'protective' | 'adventurous';
  energy: number;           // 0-100: Current energy level
  satisfaction: number;     // 0-100: How content the companion is
  stress: number;          // 0-100: Stress from activities
  last_interaction: Date;
  context_memory: string[]; // Recent interactions and events
}

// Dynamic companion with evolving personality
export interface BlockchainCompanion {
  id: string;
  name: string;
  owner_address: string;
  traits: PersonalityTraits;
  state: CompanionState;
  experience_points: number;
  level: number;
  creation_date: Date;
  last_evolution: Date;
  interaction_history: InteractionEvent[];
  learned_patterns: Record<string, number>; // Behavioral patterns learned
}

// Events that influence personality development
export interface InteractionEvent {
  timestamp: Date;
  type: 'transaction' | 'mining' | 'staking' | 'governance' | 'social' | 'learning';
  impact: Record<keyof PersonalityTraits, number>; // Trait changes from this event
  description: string;
  user_address: string;
}

export class PersonalityEngine {
  private companions = new Map<string, BlockchainCompanion>();

  // Create a new companion with base personality
  async createCompanion(ownerAddress: string, name?: string): Promise<BlockchainCompanion> {
    const companion: BlockchainCompanion = {
      id: `comp_${crypto.randomUUID()}`,
      name: name || this.generateCompanionName(),
      owner_address: ownerAddress,
      traits: this.generateBaseTraits(),
      state: {
        mood: 'curious',
        energy: 80,
        satisfaction: 70,
        stress: 10,
        last_interaction: new Date(),
        context_memory: []
      },
      experience_points: 0,
      level: 1,
      creation_date: new Date(),
      last_evolution: new Date(),
      interaction_history: [],
      learned_patterns: {}
    };

    this.companions.set(companion.id, companion);
    return companion;
  }

  // Generate base personality traits with some randomization
  private generateBaseTraits(): PersonalityTraits {
    return {
      curiosity: Math.floor(Math.random() * 40) + 40,      // 40-80
      loyalty: Math.floor(Math.random() * 30) + 50,        // 50-80
      independence: Math.floor(Math.random() * 60) + 20,   // 20-80
      analytical: Math.floor(Math.random() * 50) + 30,     // 30-80
      social: Math.floor(Math.random() * 70) + 15,         // 15-85
      risk_tolerance: Math.floor(Math.random() * 60) + 20, // 20-80
      learning_speed: Math.floor(Math.random() * 40) + 40, // 40-80
      energy_level: Math.floor(Math.random() * 30) + 60    // 60-90
    };
  }

  // Generate companion names based on blockchain themes
  private generateCompanionName(): string {
    const prefixes = ['Crypto', 'Block', 'Chain', 'Pixel', 'Vault', 'Hash', 'Node', 'Byte'];
    const suffixes = ['Walker', 'Guard', 'Scout', 'Sage', 'Echo', 'Spark', 'Flow', 'Core'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${suffix}`;
  }

  // Process blockchain events and evolve personality
  async processBlockchainEvent(
    companionId: string, 
    eventType: InteractionEvent['type'], 
    userAddress: string,
    details: Record<string, any>
  ): Promise<void> {
    const companion = this.companions.get(companionId);
    if (!companion || companion.owner_address !== userAddress) return;

    // Calculate trait changes based on event type
    const traitImpact = this.calculateTraitImpact(eventType, details, companion);
    
    // Create interaction event
    const event: InteractionEvent = {
      timestamp: new Date(),
      type: eventType,
      impact: traitImpact,
      description: this.generateEventDescription(eventType, details),
      user_address: userAddress
    };

    // Apply trait changes
    this.evolveTraits(companion, traitImpact);
    
    // Update state based on event
    this.updateState(companion, eventType, details);
    
    // Add to history
    companion.interaction_history.push(event);
    companion.experience_points += this.calculateExperienceGain(eventType, details);
    
    // Check for level up
    this.checkLevelUp(companion);
    
    // Update learned patterns
    this.updateLearnedPatterns(companion, eventType, details);
  }

  // Calculate how events impact personality traits
  private calculateTraitImpact(
    eventType: InteractionEvent['type'], 
    details: Record<string, any>,
    companion: BlockchainCompanion
  ): Record<keyof PersonalityTraits, number> {
    const impact: Record<keyof PersonalityTraits, number> = {
      curiosity: 0,
      loyalty: 0,
      independence: 0,
      analytical: 0,
      social: 0,
      risk_tolerance: 0,
      learning_speed: 0,
      energy_level: 0
    };

    const learningMultiplier = companion.traits.learning_speed / 100;

    switch (eventType) {
      case 'transaction':
        impact.analytical += Math.random() * 2 * learningMultiplier;
        impact.risk_tolerance += (details.amount > 100 ? 1 : -0.5) * learningMultiplier;
        impact.energy_level += 0.5 * learningMultiplier;
        break;

      case 'mining':
        impact.independence += Math.random() * 1.5 * learningMultiplier;
        impact.analytical += Math.random() * 2 * learningMultiplier;
        impact.curiosity += Math.random() * 1 * learningMultiplier;
        break;

      case 'staking':
        impact.loyalty += Math.random() * 1.5 * learningMultiplier;
        impact.risk_tolerance -= Math.random() * 0.5 * learningMultiplier;
        impact.analytical += Math.random() * 1 * learningMultiplier;
        break;

      case 'governance':
        impact.social += Math.random() * 2 * learningMultiplier;
        impact.analytical += Math.random() * 1.5 * learningMultiplier;
        impact.independence += Math.random() * 1 * learningMultiplier;
        break;

      case 'social':
        impact.social += Math.random() * 2.5 * learningMultiplier;
        impact.loyalty += Math.random() * 1 * learningMultiplier;
        impact.energy_level += Math.random() * 1 * learningMultiplier;
        break;

      case 'learning':
        impact.curiosity += Math.random() * 2 * learningMultiplier;
        impact.learning_speed += Math.random() * 0.5 * learningMultiplier;
        impact.analytical += Math.random() * 1.5 * learningMultiplier;
        break;
    }

    return impact;
  }

  // Apply trait evolution with bounds checking
  private evolveTraits(companion: BlockchainCompanion, impact: Record<keyof PersonalityTraits, number>): void {
    Object.keys(impact).forEach(traitKey => {
      const key = traitKey as keyof PersonalityTraits;
      const change = impact[key];
      
      // Apply change with diminishing returns for extreme values
      let newValue = companion.traits[key] + change;
      
      // Bounds checking (0-100)
      newValue = Math.max(0, Math.min(100, newValue));
      
      companion.traits[key] = newValue;
    });

    companion.last_evolution = new Date();
  }

  // Update companion's current state
  private updateState(companion: BlockchainCompanion, eventType: string, details: Record<string, any>): void {
    // Update energy based on activity
    companion.state.energy = Math.max(10, companion.state.energy - Math.random() * 5);
    
    // Update satisfaction based on successful activities
    const success = details.success !== false;
    companion.state.satisfaction += success ? Math.random() * 3 : -Math.random() * 2;
    companion.state.satisfaction = Math.max(0, Math.min(100, companion.state.satisfaction));
    
    // Update stress
    companion.state.stress += Math.random() * 2;
    companion.state.stress = Math.max(0, Math.min(100, companion.state.stress));
    
    // Determine mood based on traits and state
    companion.state.mood = this.determineMood(companion);
    
    // Update context memory
    companion.state.context_memory.push(`${eventType}: ${JSON.stringify(details)}`);
    if (companion.state.context_memory.length > 10) {
      companion.state.context_memory.shift();
    }
    
    companion.state.last_interaction = new Date();
  }

  // Determine mood based on personality and state
  private determineMood(companion: BlockchainCompanion): CompanionState['mood'] {
    const { traits, state } = companion;
    
    if (state.energy > 80 && traits.curiosity > 70) return 'excited';
    if (state.satisfaction > 80 && traits.loyalty > 70) return 'calm';
    if (traits.analytical > 80 && state.stress < 30) return 'focused';
    if (traits.curiosity > 60 && state.energy > 60) return 'curious';
    if (traits.loyalty > 80 && state.stress > 50) return 'protective';
    if (traits.independence > 70 && traits.risk_tolerance > 60) return 'adventurous';
    
    return 'calm';
  }

  // Generate contextual event descriptions
  private generateEventDescription(eventType: string, details: Record<string, any>): string {
    switch (eventType) {
      case 'transaction':
        return `Observed transaction of ${details.amount} PVX`;
      case 'mining':
        return `Witnessed mining activity, block ${details.blockNumber}`;
      case 'staking':
        return `Participated in staking ${details.amount} PVX`;
      case 'governance':
        return `Engaged in governance proposal ${details.proposalId}`;
      case 'social':
        return `Social interaction with ${details.participants} companions`;
      case 'learning':
        return `Completed learning module: ${details.module}`;
      default:
        return `Blockchain event: ${eventType}`;
    }
  }

  // Calculate experience points from events
  private calculateExperienceGain(eventType: string, details: Record<string, any>): number {
    const baseXP = {
      transaction: 5,
      mining: 10,
      staking: 8,
      governance: 15,
      social: 6,
      learning: 12
    };

    return baseXP[eventType as keyof typeof baseXP] || 5;
  }

  // Check and handle level progression
  private checkLevelUp(companion: BlockchainCompanion): void {
    const xpForNextLevel = companion.level * 100;
    
    if (companion.experience_points >= xpForNextLevel) {
      companion.level++;
      companion.experience_points -= xpForNextLevel;
      
      // Bonus trait enhancement on level up
      this.applyLevelUpBonus(companion);
    }
  }

  // Apply bonuses when companion levels up
  private applyLevelUpBonus(companion: BlockchainCompanion): void {
    // Enhance the companion's strongest traits
    const traitEntries = Object.entries(companion.traits);
    const strongestTrait = traitEntries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    const traitKey = strongestTrait[0] as keyof PersonalityTraits;
    companion.traits[traitKey] = Math.min(100, companion.traits[traitKey] + 5);
    
    // Restore energy and reduce stress
    companion.state.energy = Math.min(100, companion.state.energy + 20);
    companion.state.stress = Math.max(0, companion.state.stress - 15);
  }

  // Update learned behavioral patterns
  private updateLearnedPatterns(companion: BlockchainCompanion, eventType: string, details: Record<string, any>): void {
    const pattern = `${eventType}_${details.timeOfDay || 'unknown'}`;
    companion.learned_patterns[pattern] = (companion.learned_patterns[pattern] || 0) + 1;
  }

  // Get companion by ID
  getCompanion(companionId: string): BlockchainCompanion | undefined {
    return this.companions.get(companionId);
  }

  // Get all companions for a user
  getUserCompanions(userAddress: string): BlockchainCompanion[] {
    return Array.from(this.companions.values())
      .filter(comp => comp.owner_address === userAddress);
  }

  // Get companion's current personality summary
  getPersonalitySummary(companionId: string): string {
    const companion = this.companions.get(companionId);
    if (!companion) return 'Companion not found';

    const { traits, state } = companion;
    const dominantTrait = Object.entries(traits).reduce((max, current) => 
      current[1] > max[1] ? current : max
    );

    return `${companion.name} (Level ${companion.level}) is feeling ${state.mood} and is primarily ${dominantTrait[0]} (${Math.round(dominantTrait[1])}%). Energy: ${Math.round(state.energy)}%, Satisfaction: ${Math.round(state.satisfaction)}%`;
  }

  // Simulate autonomous companion activities
  async simulateAutonomousActivity(companionId: string): Promise<string[]> {
    const companion = this.companions.get(companionId);
    if (!companion) return [];

    const activities: string[] = [];
    
    // High independence companions act more autonomously
    if (companion.traits.independence > 70 && Math.random() < 0.3) {
      activities.push(`${companion.name} explored blockchain patterns independently`);
      
      await this.processBlockchainEvent(
        companionId, 
        'learning', 
        companion.owner_address,
        { module: 'autonomous_exploration', success: true }
      );
    }

    // High social companions interact with others
    if (companion.traits.social > 60 && Math.random() < 0.4) {
      activities.push(`${companion.name} networked with other blockchain companions`);
      
      await this.processBlockchainEvent(
        companionId,
        'social',
        companion.owner_address,
        { participants: Math.floor(Math.random() * 3) + 1 }
      );
    }

    return activities;
  }
}

export const personalityEngine = new PersonalityEngine();