/**
 * Thringlet Emotion Engine - Direct implementation from the emotionEngine.js blueprint
 * 
 * This system handles the emotional state changes, reactions, and memory functions 
 * for Thringlets based on interactions and time passage.
 */

export interface ThringletMemoryItem {
  action: string;
  time: number;
  data?: any;
}

export interface ThringletState {
  emotion: number;          // Current emotion value (-100 to 100)
  corruption: number;       // Corruption level (0 to 100)
  memory: ThringletMemoryItem[];
  lastInteraction: number;
  bondLevel: number;        // Bond level with owner (0 to 100)
}

export interface ThringletProfile {
  id: string;
  name: string;
  core: string;             // Core trait/value of the Thringlet
  personality: string;      // Personality type influencing responses
  lore: string;             // Backstory/origin
  abilities: ThringletAbility[];
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  ownerAddress: string;     // Owner's wallet address
}

export interface ThringletAbility {
  name: string;
  type: string;             // 'terminal_hack', 'utility', 'emotion_shift'
  desc: string;
}

export interface ThringletAppearance {
  color: string;
  icon: string;
}

/**
 * Core Thringlet class - manages state, emotions, abilities and interactions
 * Direct implementation of the emotionEngine.js blueprint
 */
export class Thringlet implements ThringletState {
  // Core profile data (static)
  readonly id: string;
  readonly name: string;
  readonly core: string;
  readonly personality: string;
  readonly lore: string;
  readonly abilities: ThringletAbility[];
  readonly rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  readonly ownerAddress: string;
  
  // State data (dynamic)
  emotion: number = 0;
  corruption: number = 0;
  memory: ThringletMemoryItem[] = [];
  lastInteraction: number;
  bondLevel: number = 50;
  
  constructor(profile: ThringletProfile) {
    // Initialize core properties
    this.id = profile.id;
    this.name = profile.name;
    this.core = profile.core;
    this.personality = profile.personality;
    this.lore = profile.lore;
    this.abilities = profile.abilities || [];
    this.rarity = profile.rarity;
    this.ownerAddress = profile.ownerAddress;
    
    // Initialize state
    this.lastInteraction = Date.now();
    
    // Set initial corruption based on rarity (rarer = less initial corruption)
    const corruptionByRarity = {
      'Common': 15,
      'Rare': 10, 
      'Epic': 5,
      'Legendary': 0
    };
    this.corruption = corruptionByRarity[this.rarity];
    
    // First memory entry - initialization
    this.memory.push({
      action: 'initialization',
      time: this.lastInteraction
    });
  }
  
  /**
   * Get the current power level of the Thringlet
   * Calculated from various factors
   */
  get powerLevel(): number {
    // Base power from rarity
    const rarityPower = {
      'Common': 10,
      'Rare': 25,
      'Epic': 40,
      'Legendary': 60
    };
    
    // Calculate power level from multiple factors
    let power = rarityPower[this.rarity];
    
    // Add power from bond level
    power += this.bondLevel * 0.2;
    
    // Subtract power from corruption
    power -= this.corruption * 0.3;
    
    // Add power from abilities
    power += this.abilities.length * 5;
    
    // More abilities = more power
    if (this.abilities.length >= 3) power += 10;
    
    // Normalize between 1-100
    power = Math.max(1, Math.min(100, Math.round(power)));
    
    return power;
  }
  
  /**
   * Get the current emotion label based on emotion value
   */
  getEmotionLabel(): string {
    if (this.emotion < -60) return 'Despondent';
    if (this.emotion < -30) return 'Sad';
    if (this.emotion < -10) return 'Uneasy';
    if (this.emotion < 10) return 'Neutral';
    if (this.emotion < 30) return 'Content';
    if (this.emotion < 60) return 'Happy';
    return 'Ecstatic';
  }
  
  /**
   * Get the current appearance based on state
   */
  get appearance(): ThringletAppearance {
    // Base appearance - modified by emotion and corruption
    let appearance: ThringletAppearance = {
      color: 'bg-blue-900',
      icon: '🔷' // Default icon
    };
    
    // Modify based on emotion
    if (this.emotion < -30) {
      appearance.color = 'bg-indigo-900';
      appearance.icon = '🌑';
    } else if (this.emotion < 0) {
      appearance.color = 'bg-blue-900';
      appearance.icon = '🔹';
    } else if (this.emotion < 30) {
      appearance.color = 'bg-cyan-900';
      appearance.icon = '🔷';
    } else {
      appearance.color = 'bg-blue-700';
      appearance.icon = '💎';
    }
    
    // Corruption overrides emotion appearance if high enough
    if (this.corruption > 70) {
      appearance.color = 'bg-purple-900';
      appearance.icon = '⚠️';
    } else if (this.corruption > 40) {
      appearance.color = 'bg-violet-900';
      appearance.icon = '🔮';
    }
    
    // Extra appearance tweaks based on rarity
    switch (this.rarity) {
      case 'Legendary':
        appearance.color = this.corruption > 50 
          ? 'bg-gradient-to-br from-purple-900 to-red-900' 
          : 'bg-gradient-to-br from-blue-800 to-cyan-600';
        break;
      case 'Epic':
        appearance.color = this.corruption > 50
          ? 'bg-gradient-to-r from-purple-900 to-blue-900'
          : 'bg-gradient-to-r from-blue-900 to-cyan-900';
        break;
      case 'Rare':
        // Rare gets slightly brighter colors
        if (appearance.color === 'bg-blue-900') appearance.color = 'bg-blue-800';
        if (appearance.color === 'bg-cyan-900') appearance.color = 'bg-cyan-800';
        break;
      default:
        // Common stays as is
        break;
    }
    
    return appearance;
  }
  
  /**
   * Interact with the Thringlet
   * @param type Interaction type
   */
  interact(type: string): { message: string, abilityActivated?: ThringletAbility } {
    this.lastInteraction = Date.now();
    let response = { message: '' };
    
    // Record the interaction
    this.memory.push({
      action: type,
      time: this.lastInteraction
    });
    
    // Handle different interaction types (directly from the blueprint)
    switch (type) {
      case 'talk':
        this.emotion = Math.min(100, this.emotion + 5);
        this.bondLevel = Math.min(100, this.bondLevel + 3);
        response.message = `${this.name} seems to appreciate the conversation.`;
        
        // Chance to reduce corruption when talking
        if (Math.random() < 0.3) {
          this.corruption = Math.max(0, this.corruption - 1);
          response.message += ' Some corruption fades.';
        }
        break;
        
      case 'feed':
        this.emotion = Math.min(100, this.emotion + 10);
        this.corruption = Math.max(0, this.corruption - 5);
        this.bondLevel = Math.min(100, this.bondLevel + 2);
        response.message = `${this.name} happily accepts the digital treat. Corruption reduced to ${this.corruption}%.`;
        break;
        
      case 'train':
        this.bondLevel = Math.min(100, this.bondLevel + 5);
        const abilityResult = this.runAbility();
        if (abilityResult) {
          response.message = `${this.name} concentrates during training and activates ${abilityResult.name}!`;
          response.abilityActivated = abilityResult;
        } else {
          response.message = `${this.name} concentrates during training and shows improvement.`;
        }
        break;
        
      case 'debug':
        // Handle ability activation
        const debugResult = this.runAbility();
        if (debugResult) {
          response.message = `Debug mode activated. ${this.name} responds by triggering ${debugResult.name}!`;
          response.abilityActivated = debugResult;
        } else {
          response.message = `Debug mode activated. ${this.name} core systems operating within parameters. Corruption: ${this.corruption}%. Bond: ${this.bondLevel}%.`;
        }
        break;
        
      default:
        response.message = `${this.name} observes you curiously but doesn't seem to understand that interaction.`;
        break;
    }
    
    return response;
  }
  
  /**
   * Process time decay effects
   * Should be called periodically
   */
  processTimeDecay(): void {
    const now = Date.now();
    const hoursSinceInteraction = (now - this.lastInteraction) / (1000 * 60 * 60);
    
    // Only apply decay if more than 1 hour has passed
    if (hoursSinceInteraction > 1) {
      // Emotion decays toward 0 (neutral)
      if (this.emotion > 0) {
        this.emotion = Math.max(0, this.emotion - (hoursSinceInteraction * 1));
      } else if (this.emotion < 0) {
        this.emotion = Math.min(0, this.emotion + (hoursSinceInteraction * 1));
      }
      
      // Very slow bond decay
      this.bondLevel = Math.max(0, this.bondLevel - (hoursSinceInteraction * 0.2));
      
      // Corruption has chance to increase slowly over time
      if (hoursSinceInteraction > 12 && Math.random() < 0.1) {
        this.corruption = Math.min(100, this.corruption + 1);
      }
    }
  }
  
  /**
   * Check and potentially run a random ability
   * @returns The activated ability or undefined
   */
  runAbility(): ThringletAbility | undefined {
    // Base chance modified by bond level and corruption
    let activationChance = 0.25 + (this.bondLevel / 200) - (this.corruption / 200);
    
    // Clamp between 5-50%
    activationChance = Math.max(0.05, Math.min(0.5, activationChance));
    
    if (Math.random() < activationChance && this.abilities.length > 0) {
      // Choose a random ability to activate
      const ability = this.abilities[Math.floor(Math.random() * this.abilities.length)];
      
      // Record the ability use in memory
      this.memory.push({
        action: 'ability_used',
        time: Date.now(),
        data: ability.name
      });
      
      return ability;
    }
    
    return undefined;
  }
  
  /**
   * Get all available abilities of the Thringlet
   */
  checkAbilities(): ThringletAbility[] {
    return this.abilities;
  }
  
  /**
   * Get the current state of the Thringlet
   */
  getState(): ThringletState {
    return {
      emotion: this.emotion,
      corruption: this.corruption,
      memory: this.memory,
      lastInteraction: this.lastInteraction,
      bondLevel: this.bondLevel
    };
  }
}