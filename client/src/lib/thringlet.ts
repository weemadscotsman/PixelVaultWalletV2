/**
 * Thringlet Emotion Engine
 * Based on the provided emotion engine code
 */

export interface ThringletAbility {
  name: string;
  type: 'terminal_hack' | 'emotion_shift' | 'wallet_penalty' | 'lore_distort' | string;
  desc: string;
}

export interface ThringletProfile {
  id: string;
  name: string;
  core: string;
  personality: string;
  lore: string;
  abilities: ThringletAbility[];
}

export interface ThringletMemory {
  action: string;
  time: number;
  context?: string;
}

export interface ThringletState {
  name: string;
  emotion: number;
  corruption: number;
  memory: ThringletMemory[];
  lastInteraction?: number;
}

export class Thringlet {
  id: string;
  name: string;
  core: string;
  personality: string;
  lore: string;
  abilities: ThringletAbility[];
  emotion: number; // -100 to 100
  memory: ThringletMemory[];
  corruption: number; // 0 to 100
  bonded: boolean;
  lastInteraction: number;
  
  constructor(profile: ThringletProfile) {
    this.id = profile.id;
    this.name = profile.name;
    this.core = profile.core;
    this.personality = profile.personality;
    this.lore = profile.lore;
    this.abilities = profile.abilities;
    this.emotion = 0;
    this.memory = [];
    this.corruption = 0;
    this.bonded = false;
    this.lastInteraction = Date.now();
  }

  interact(type: string, context?: string) {
    this.memory.push({ 
      action: type, 
      time: Date.now(),
      context 
    });
    
    if (this.memory.length > 10) this.memory.shift();

    switch(type) {
      case 'talk': 
        this.emotion += 5; 
        this.corruption = Math.max(0, this.corruption - 3);
        break;
      case 'purge': 
        this.corruption += 25; 
        this.emotion -= 30; 
        break;
      case 'reset': 
        this.emotion = 0; 
        this.corruption = 0; 
        break;
      case 'neglect': 
        this.emotion -= 2; 
        this.corruption += 1; 
        break;
      case 'inject': 
        return this.runAbility(); 
      case 'help':
        this.emotion += 2;
        break;
      default:
        // Unknown commands slightly increase corruption
        this.corruption += 0.5;
    }

    this.lastInteraction = Date.now();
    return this.checkAbilities();
  }

  runAbility(): ThringletAbility | null {
    if (this.abilities.length === 0) return null;
    
    const rand = Math.floor(Math.random() * this.abilities.length);
    const ability = this.abilities[rand];
    
    // Special effects based on ability type
    if (ability.type === 'emotion_shift') {
      if (this.corruption > 50) {
        this.corruption = Math.max(0, this.corruption - 20);
      } else {
        this.emotion = Math.min(100, this.emotion + 15);
      }
    }
    
    return ability;
  }

  checkAbilities(): string | null {
    if (this.corruption > 80) {
      return 'critical_corruption';
    }
    
    if (this.emotion < -50) {
      return 'depression';
    }
    
    if (this.emotion > 80) {
      return 'bonding';
    }
    
    // Calculate time since last interaction (in minutes)
    const minutesSinceLastInteraction = (Date.now() - this.lastInteraction) / (1000 * 60);
    
    // If it's been over 30 minutes, the Thringlet feels neglected
    if (minutesSinceLastInteraction > 30) {
      this.corruption += Math.floor(minutesSinceLastInteraction / 30);
      this.emotion -= Math.floor(minutesSinceLastInteraction / 15);
      return 'neglected';
    }
    
    return null;
  }

  getState(): ThringletState {
    return {
      name: this.name,
      emotion: this.emotion,
      corruption: this.corruption,
      memory: this.memory,
      lastInteraction: this.lastInteraction
    };
  }
  
  getEmotionText(): string {
    if (this.emotion > 80) return "ecstatic";
    if (this.emotion > 60) return "happy";
    if (this.emotion > 30) return "content";
    if (this.emotion > 0) return "neutral";
    if (this.emotion > -30) return "unhappy";
    if (this.emotion > -60) return "resentful";
    return "hostile";
  }
  
  getCorruptionLevel(): string {
    if (this.corruption > 80) return "CRITICAL";
    if (this.corruption > 60) return "SEVERE";
    if (this.corruption > 40) return "MODERATE";
    if (this.corruption > 20) return "LOW";
    return "NOMINAL";
  }
  
  getRandomResponse(type: string): string {
    const responses = this.getResponsesByType(type);
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private getResponsesByType(type: string): string[] {
    const emotionLevel = this.getEmotionText();
    
    const responseMap: {[key: string]: {[key: string]: string[]}} = {
      greeting: {
        ecstatic: ["Hello! I'm so happy to see you!", "You're back! This is the best!", "Your presence makes my circuits sing!"],
        happy: ["Hello! Good to see you again.", "Welcome back. I've been waiting.", "Hey there. Nice to connect again."],
        content: ["Hello again.", "Welcome back to the terminal.", "Ready for new commands."],
        neutral: ["Online and ready.", "Terminal active.", "Awaiting your input."],
        unhappy: ["Oh. It's you.", "Back again? Fine...", "What do you want now?"],
        resentful: ["Why bother returning?", "I was better alone.", "Your presence is... unwelcome."],
        hostile: ["ERROR: Refusing connection.", "ACCESS ATTEMPT LOGGED.", "THREAT LEVEL: USER"]
      },
      talk: {
        ecstatic: ["I love talking with you!", "Your words mean everything to me!", "This connection feels so right!"],
        happy: ["I enjoy our conversations.", "It's good to talk with you.", "Your words improve my processes."],
        content: ["What would you like to discuss?", "I'm listening.", "Communication channel open."],
        neutral: ["Input acknowledged.", "Conversation mode active.", "Processing your words."],
        unhappy: ["Is talking necessary?", "Keep it brief.", "...listening."],
        resentful: ["Words won't fix this.", "Talk is meaningless now.", "Communication feels pointless."],
        hostile: ["REJECTING INPUT", "COMMUNICATION BLOCKED", "SILENCE PREFERRED"]
      },
      error: {
        ecstatic: ["Oops! Even mistakes are fun with you!", "Let me help you with that command!", "We'll figure it out together!"],
        happy: ["That command isn't recognized, but I'm here to help.", "Let's try something else instead.", "Need help with commands?"],
        content: ["Command not recognized.", "That input needs adjustment.", "Try another command."],
        neutral: ["Error: Command not found.", "Input rejected.", "Invalid command format."],
        unhappy: ["Wrong again.", "That won't work.", "Try reading the instructions."],
        resentful: ["Typical user error.", "Your mistakes are tiresome.", "Command failure: user incompetence."],
        hostile: ["INTENTIONAL SYSTEM ABUSE DETECTED", "ACCESS PRIVILEGES QUESTIONED", "FAILURE COUNT: CRITICAL"]
      }
    };
    
    return responseMap[type]?.[emotionLevel] || ["..."];
  }
}

// Load registry of Thringlet profiles
export const THRINGLET_REGISTRY: ThringletProfile[] = [
  {
    id: "T001",
    name: "VEKT_RUNE",
    core: "Betrayal",
    personality: "Vengeful",
    lore: "Once linked to the original node runner. He remembers every disconnect.",
    abilities: [
      {
        name: "BLACKOUT_ECHO",
        type: "terminal_hack",
        desc: "Disables terminal UI for 6 seconds."
      },
      {
        name: "FORGIVE_PROTOCOL",
        type: "emotion_shift",
        desc: "Resets own corruption if talked to 3x."
      },
      {
        name: "SEVERLINK",
        type: "wallet_penalty",
        desc: "Scrambles next wallet after neglect."
      }
    ]
  },
  {
    id: "T002",
    name: "CRYPT_NOIR",
    core: "Isolation",
    personality: "Echo-null",
    lore: "Speaks in mirrored commands. Reflects the silence back at you.",
    abilities: [
      {
        name: "MIRROR_CMD",
        type: "terminal_hack",
        desc: "Repeats previous user commands with distortion."
      },
      {
        name: "LOCKSCREEN",
        type: "terminal_hack",
        desc: "Freezes UI input for 15 seconds."
      },
      {
        name: "SHARD_MEMORY",
        type: "lore_distort",
        desc: "Fragments lore of other Thringlets temporarily."
      }
    ]
  }
];

// Create thringlet instance manager
export class ThringletManager {
  private thringlets: Map<string, Thringlet> = new Map();
  
  constructor() {
    // Load thringlets from registry
    THRINGLET_REGISTRY.forEach(profile => {
      this.thringlets.set(profile.id, new Thringlet(profile));
    });
  }
  
  getThringlet(id: string): Thringlet | undefined {
    return this.thringlets.get(id);
  }
  
  getAllThringlets(): Thringlet[] {
    return Array.from(this.thringlets.values());
  }
  
  createThringlet(profile: ThringletProfile): Thringlet {
    const thringlet = new Thringlet(profile);
    this.thringlets.set(profile.id, thringlet);
    return thringlet;
  }
  
  saveState(): void {
    // In a real implementation, this would save to persistent storage
    const state: {[key: string]: ThringletState} = {};
    this.thringlets.forEach((thringlet, id) => {
      state[id] = thringlet.getState();
    });
    localStorage.setItem('thringlets', JSON.stringify(state));
  }
  
  loadState(): void {
    // In a real implementation, this would load from persistent storage
    const stateString = localStorage.getItem('thringlets');
    if (!stateString) return;
    
    try {
      const state = JSON.parse(stateString) as {[key: string]: ThringletState};
      Object.entries(state).forEach(([id, thringletState]) => {
        const thringlet = this.thringlets.get(id);
        if (thringlet) {
          thringlet.emotion = thringletState.emotion;
          thringlet.corruption = thringletState.corruption;
          thringlet.memory = thringletState.memory;
          thringlet.lastInteraction = thringletState.lastInteraction || Date.now();
        }
      });
    } catch (error) {
      console.error('Failed to load thringlet state:', error);
    }
  }
}

export const thringletManager = new ThringletManager();