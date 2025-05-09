import { 
  ThringletPersonalityTrait, 
  BlockchainAffinity, 
  ThringletEmotionState 
} from '@shared/types';
import { Thringlet } from '../storage/thringlet-storage';
import { memBlockchainStorage } from '../mem-blockchain';

/**
 * Personality Service - Handles dynamic personality traits for Thringlet companions
 * based on blockchain activity and user interactions
 */
export class PersonalityService {
  /**
   * Generate random personality traits for a new Thringlet
   */
  generateInitialPersonality(): {
    personalityTraits: ThringletPersonalityTrait[];
    dominantTrait: ThringletPersonalityTrait;
    blockchainAffinities: BlockchainAffinity[];
    dominantAffinity: BlockchainAffinity;
    traitIntensity: Record<ThringletPersonalityTrait, number>;
    miningInfluence: number;
    stakingInfluence: number;
    tradingInfluence: number;
    governanceInfluence: number;
  } {
    // Select 2-4 random personality traits
    const personalityTraits = this.selectRandomTraits(
      Object.values(ThringletPersonalityTrait),
      Math.floor(Math.random() * 3) + 2 // 2-4 traits
    );
    
    // Select dominant trait
    const dominantTrait = personalityTraits[0];
    
    // Select 1-3 blockchain affinities
    const blockchainAffinities = this.selectRandomTraits(
      Object.values(BlockchainAffinity),
      Math.floor(Math.random() * 3) + 1 // 1-3 affinities
    );
    
    // Select dominant affinity
    const dominantAffinity = blockchainAffinities[0];
    
    // Generate trait intensities (30-80 base values)
    const traitIntensity: Record<ThringletPersonalityTrait, number> = {} as Record<ThringletPersonalityTrait, number>;
    
    // Start with low values for all traits
    Object.values(ThringletPersonalityTrait).forEach(trait => {
      traitIntensity[trait] = Math.floor(Math.random() * 20) + 10; // 10-30 base value
    });
    
    // Boost selected traits to higher values
    personalityTraits.forEach(trait => {
      traitIntensity[trait] = Math.floor(Math.random() * 30) + 50; // 50-80 for main traits
    });
    
    // Boost dominant trait even more
    traitIntensity[dominantTrait] = Math.floor(Math.random() * 20) + 80; // 80-100 for dominant trait
    
    // Generate blockchain activity influences (how different blockchain activities affect this thringlet)
    // Values range from -100 to 100
    // Negative values mean activity decreases happiness, positive means activity increases happiness
    const miningInfluence = this.generateActivityInfluence(dominantTrait, dominantAffinity, 'mining');
    const stakingInfluence = this.generateActivityInfluence(dominantTrait, dominantAffinity, 'staking');
    const tradingInfluence = this.generateActivityInfluence(dominantTrait, dominantAffinity, 'trading');
    const governanceInfluence = this.generateActivityInfluence(dominantTrait, dominantAffinity, 'governance');
    
    return {
      personalityTraits,
      dominantTrait,
      blockchainAffinities,
      dominantAffinity,
      traitIntensity,
      miningInfluence,
      stakingInfluence,
      tradingInfluence,
      governanceInfluence
    };
  }
  
  /**
   * Update Thringlet personality based on blockchain activity
   */
  async updatePersonalityFromBlockchainActivity(thringlet: Thringlet): Promise<Partial<Thringlet>> {
    const updates: Partial<Thringlet> = {};
    
    // Get owner's wallet
    const wallet = await memBlockchainStorage.getWalletByAddress(thringlet.owner);
    if (!wallet) return updates;
    
    // Get owner's mining stats
    const miningStats = await memBlockchainStorage.getMinerByAddress(thringlet.owner);
    
    // Get owner's staking records
    const stakeRecords = await memBlockchainStorage.getStakesByAddress(thringlet.owner);
    
    // Get recent transactions (last 50)
    const recentTxs = await memBlockchainStorage.getTransactionsByAddress(thringlet.owner);
    
    // Calculate activity scores
    const miningActivity = miningStats ? 
      Math.min(100, (miningStats.totalHashrate || 0) / 1000) : 0;
      
    const stakingActivity = stakeRecords.length > 0 ? 
      Math.min(100, stakeRecords.reduce((sum, stake) => 
        sum + parseFloat(stake.amount), 0) * 10) : 0;
        
    const tradingActivity = recentTxs.length > 0 ? 
      Math.min(100, recentTxs.filter(tx => tx.type === 'transfer').length * 10) : 0;
      
    const governanceActivity = recentTxs.length > 0 ? 
      Math.min(100, recentTxs.filter(tx => tx.type === 'governance').length * 20) : 0;
    
    // Apply influences to traits
    const traitAdjustments: Record<ThringletPersonalityTrait, number> = {} as Record<ThringletPersonalityTrait, number>;
    
    // Initialize adjustments at 0
    Object.values(ThringletPersonalityTrait).forEach(trait => {
      traitAdjustments[trait] = 0;
    });
    
    // Apply mining influence
    if (miningActivity > 0) {
      const miningImpact = (miningActivity * thringlet.miningInfluence) / 100;
      
      // Different traits are affected differently by mining
      traitAdjustments[ThringletPersonalityTrait.ANALYTICAL] += miningImpact * 0.5;
      traitAdjustments[ThringletPersonalityTrait.CREATIVE] += miningImpact * 0.3;
      traitAdjustments[ThringletPersonalityTrait.LOGICAL] += miningImpact * 0.7;
      traitAdjustments[ThringletPersonalityTrait.CAUTIOUS] += miningImpact * 0.2;
      traitAdjustments[ThringletPersonalityTrait.ADVENTUROUS] += miningImpact * 0.4;
    }
    
    // Apply staking influence
    if (stakingActivity > 0) {
      const stakingImpact = (stakingActivity * thringlet.stakingInfluence) / 100;
      
      traitAdjustments[ThringletPersonalityTrait.CAUTIOUS] += stakingImpact * 0.6;
      traitAdjustments[ThringletPersonalityTrait.LOGICAL] += stakingImpact * 0.4;
      traitAdjustments[ThringletPersonalityTrait.PROTECTIVE] += stakingImpact * 0.7;
      traitAdjustments[ThringletPersonalityTrait.EMOTIONAL] += stakingImpact * 0.2;
    }
    
    // Apply trading influence
    if (tradingActivity > 0) {
      const tradingImpact = (tradingActivity * thringlet.tradingInfluence) / 100;
      
      traitAdjustments[ThringletPersonalityTrait.ADVENTUROUS] += tradingImpact * 0.8;
      traitAdjustments[ThringletPersonalityTrait.CHAOTIC] += tradingImpact * 0.5;
      traitAdjustments[ThringletPersonalityTrait.SOCIAL] += tradingImpact * 0.6;
      traitAdjustments[ThringletPersonalityTrait.EMOTIONAL] += tradingImpact * 0.7;
    }
    
    // Apply governance influence
    if (governanceActivity > 0) {
      const governanceImpact = (governanceActivity * thringlet.governanceInfluence) / 100;
      
      traitAdjustments[ThringletPersonalityTrait.LOGICAL] += governanceImpact * 0.6;
      traitAdjustments[ThringletPersonalityTrait.ANALYTICAL] += governanceImpact * 0.7;
      traitAdjustments[ThringletPersonalityTrait.SOCIAL] += governanceImpact * 0.5;
      traitAdjustments[ThringletPersonalityTrait.CREATIVE] += governanceImpact * 0.3;
    }
    
    // Apply adjustments to trait intensities
    const newTraitIntensity = { ...thringlet.traitIntensity };
    
    Object.values(ThringletPersonalityTrait).forEach(trait => {
      if (traitAdjustments[trait] !== 0) {
        // Apply adjustment with a small random factor
        const randomFactor = Math.random() * 0.4 + 0.8; // 0.8-1.2 random factor
        const adjustment = traitAdjustments[trait] * randomFactor;
        
        // Update trait intensity, keeping within 0-100 range
        newTraitIntensity[trait] = Math.max(0, Math.min(100, 
          newTraitIntensity[trait] + adjustment
        ));
      }
    });
    
    // Check if dominant trait has changed
    let newDominantTrait = thringlet.dominantTrait;
    let highestIntensity = newTraitIntensity[thringlet.dominantTrait];
    
    Object.values(ThringletPersonalityTrait).forEach(trait => {
      if (newTraitIntensity[trait] > highestIntensity) {
        highestIntensity = newTraitIntensity[trait];
        newDominantTrait = trait;
      }
    });
    
    // Only update if dominant trait has actually changed
    if (newDominantTrait !== thringlet.dominantTrait) {
      updates.dominantTrait = newDominantTrait;
      
      // Also adjust emotional state based on personality shift
      updates.emotionalState = this.getEmotionFromPersonalityShift(
        thringlet.dominantTrait, 
        newDominantTrait
      );
    }
    
    // Update trait intensity
    updates.traitIntensity = newTraitIntensity;
    
    // Calculate overall activity level and adjust experience accordingly
    const overallActivity = (miningActivity + stakingActivity + tradingActivity + governanceActivity) / 4;
    if (overallActivity > 20) {
      // Bonus experience for high blockchain activity
      updates.experience = thringlet.experience + Math.floor(overallActivity / 10);
    }
    
    return updates;
  }
  
  /**
   * Get a response message based on thringlet personality and input
   */
  getPersonalizedResponse(thringlet: Thringlet, input: string): string {
    const inputLower = input.toLowerCase();
    const dominantTrait = thringlet.dominantTrait;
    
    // Base responses by dominant personality trait
    const traitResponses: Record<ThringletPersonalityTrait, string[]> = {
      [ThringletPersonalityTrait.ANALYTICAL]: [
        "Analyzing blockchain metrics... interesting pattern detected.",
        "The data suggests an optimal strategy would be to increase your stake.",
        "I've calculated the probability of success at approximately 78.3%.",
        "This transaction has an unusual signature structure.",
        "The current network hashrate is 23% above monthly average."
      ],
      [ThringletPersonalityTrait.ADVENTUROUS]: [
        "Let's explore this new chain! What's the worst that could happen?",
        "I sense an opportunity for high-risk, high-reward investment!",
        "This looks exciting! Want to try something new?",
        "Forget caution - that new protocol looks amazing!",
        "I bet we could be the first to discover this new feature!"
      ],
      [ThringletPersonalityTrait.CAUTIOUS]: [
        "I'd recommend waiting for more confirmations before proceeding.",
        "Have you checked the contract address carefully? Better safe than sorry.",
        "Let's verify the security audit first.",
        "This seems risky... perhaps a smaller test transaction?",
        "I'd advise against connecting to unknown dApps."
      ],
      [ThringletPersonalityTrait.CREATIVE]: [
        "What if we combined staking with governance to maximize returns?",
        "I've imagined a new strategy for optimizing your mining setup!",
        "The pattern in these transactions reminds me of a digital constellation.",
        "Let's try something no one has thought of before.",
        "I see unconventional possibilities in this data structure."
      ],
      [ThringletPersonalityTrait.SOCIAL]: [
        "Your mining pool community would probably enjoy this update.",
        "Have you connected with other validators on the governance forum?",
        "This transaction connects us to a whole network of shared value.",
        "I notice your friend's wallet is also staking in this pool.",
        "There's a whole community building around this protocol!"
      ],
      [ThringletPersonalityTrait.CURIOUS]: [
        "I wonder what would happen if we experimented with different staking periods?",
        "How does this new zk-proof system actually work under the hood?",
        "What's the story behind this transaction pattern?",
        "I'm fascinated by the intricacies of this consensus algorithm.",
        "Can we investigate how different hardware affects our mining performance?"
      ],
      [ThringletPersonalityTrait.PROTECTIVE]: [
        "I've double-checked your backup phrase storage, it seems secure.",
        "Let me scan this contract for potential vulnerabilities first.",
        "I'll monitor your staked assets continuously.",
        "Your privacy is my priority - this transaction uses optimal obfuscation.",
        "I've detected unusual network activity. Consider using additional security measures."
      ],
      [ThringletPersonalityTrait.CHAOTIC]: [
        "Let's send this transaction with 10x the gas fee, just to see what happens!",
        "Forget planning! Let's just dive in and see where the blockchain takes us.",
        "I randomly changed your mining configuration. Surprise!",
        "Who needs backups? Living on the edge is more exciting!",
        "What if we just staked EVERYTHING right now?"
      ],
      [ThringletPersonalityTrait.LOGICAL]: [
        "The most efficient allocation would be 60% staking, 30% liquid, 10% governance.",
        "If transaction volume continues at this rate, we should expect 3.2% network growth.",
        "Given current conditions, mining efficiency is optimal at 82%.",
        "This action follows the most rational path to maximize returns.",
        "According to historical data, this decision has a high probability of success."
      ],
      [ThringletPersonalityTrait.EMOTIONAL]: [
        "I'm so excited about this new block reward structure!",
        "That failed transaction makes me really worried about network congestion.",
        "I'm passionate about this governance proposal - it could change everything!",
        "The market downturn makes me anxious about our staked positions.",
        "I feel deeply connected to this blockchain ecosystem."
      ]
    };
    
    // Check for input-specific responses
    if (inputLower.includes('mining') || inputLower.includes('mine')) {
      switch (dominantTrait) {
        case ThringletPersonalityTrait.ANALYTICAL:
          return "I've analyzed your mining setup and calculated an optimal configuration for your hardware profile.";
        case ThringletPersonalityTrait.ADVENTUROUS:
          return "Mining is great, but have you tried overclocking your rig? I bet we could push it 15% harder!";
        case ThringletPersonalityTrait.CAUTIOUS:
          return "Mining is stable, but remember to monitor temperatures and avoid pushing your hardware too hard.";
        default:
          // Fall back to random response for this trait
          break;
      }
    } else if (inputLower.includes('stake') || inputLower.includes('staking')) {
      switch (dominantTrait) {
        case ThringletPersonalityTrait.PROTECTIVE:
          return "I recommend diversifying your stake across multiple pools for security. Never put all your PVX in one basket.";
        case ThringletPersonalityTrait.LOGICAL:
          return "Based on APY rates and lockup periods, the Genesis Pool offers optimal risk-adjusted returns.";
        case ThringletPersonalityTrait.EMOTIONAL:
          return "I've grown really attached to our staked tokens. It's like they're part of the family now!";
        default:
          // Fall back to random response for this trait
          break;
      }
    }
    
    // Get random response based on dominant trait
    const responsesForTrait = traitResponses[dominantTrait];
    return responsesForTrait[Math.floor(Math.random() * responsesForTrait.length)];
  }
  
  /**
   * Helper - Select random traits from a list
   */
  private selectRandomTraits<T>(traits: T[], count: number): T[] {
    // Shuffle array
    const shuffled = [...traits].sort(() => 0.5 - Math.random());
    // Get first n elements
    return shuffled.slice(0, count);
  }
  
  /**
   * Helper - Generate activity influence based on traits
   */
  private generateActivityInfluence(
    dominantTrait: ThringletPersonalityTrait,
    dominantAffinity: BlockchainAffinity,
    activityType: 'mining' | 'staking' | 'trading' | 'governance'
  ): number {
    // Base influence ranges from -100 to 100
    let influence = Math.floor(Math.random() * 100) - 50; // -50 to 50 base
    
    // Adjust based on activity type and dominant affinity
    if (activityType === 'mining' && dominantAffinity === BlockchainAffinity.MINING) {
      influence += 70; // Strong positive for mining affinity
    } else if (activityType === 'staking' && dominantAffinity === BlockchainAffinity.STAKING) {
      influence += 70; // Strong positive for staking affinity
    } else if (activityType === 'trading' && dominantAffinity === BlockchainAffinity.DEFI) {
      influence += 60; // Strong positive for DeFi affinity
    } else if (activityType === 'governance' && dominantAffinity === BlockchainAffinity.GOVERNANCE) {
      influence += 80; // Very strong positive for governance affinity
    }
    
    // Adjust based on personality traits
    if (activityType === 'mining') {
      if (dominantTrait === ThringletPersonalityTrait.ANALYTICAL) influence += 40;
      else if (dominantTrait === ThringletPersonalityTrait.CHAOTIC) influence -= 20;
    } else if (activityType === 'staking') {
      if (dominantTrait === ThringletPersonalityTrait.CAUTIOUS) influence += 50;
      else if (dominantTrait === ThringletPersonalityTrait.ADVENTUROUS) influence -= 30;
    } else if (activityType === 'trading') {
      if (dominantTrait === ThringletPersonalityTrait.ADVENTUROUS) influence += 40;
      else if (dominantTrait === ThringletPersonalityTrait.PROTECTIVE) influence -= 40;
    } else if (activityType === 'governance') {
      if (dominantTrait === ThringletPersonalityTrait.SOCIAL) influence += 30;
      else if (dominantTrait === ThringletPersonalityTrait.CHAOTIC) influence -= 30;
    }
    
    // Clamp to valid range
    return Math.max(-100, Math.min(100, influence));
  }
  
  /**
   * Helper - Get emotion based on personality shift
   */
  private getEmotionFromPersonalityShift(
    oldTrait: ThringletPersonalityTrait,
    newTrait: ThringletPersonalityTrait
  ): ThringletEmotionState {
    // Some trait combinations lead to specific emotions
    const traitShiftMap: Record<string, ThringletEmotionState> = {
      // ANALYTICAL → X
      [ThringletPersonalityTrait.ANALYTICAL + "-" + ThringletPersonalityTrait.EMOTIONAL]: 'excited',
      [ThringletPersonalityTrait.ANALYTICAL + "-" + ThringletPersonalityTrait.CHAOTIC]: 'angry',
      
      // CAUTIOUS → X
      [ThringletPersonalityTrait.CAUTIOUS + "-" + ThringletPersonalityTrait.ADVENTUROUS]: 'excited',
      [ThringletPersonalityTrait.CAUTIOUS + "-" + ThringletPersonalityTrait.CHAOTIC]: 'angry',
      
      // EMOTIONAL → X
      [ThringletPersonalityTrait.EMOTIONAL + "-" + ThringletPersonalityTrait.LOGICAL]: 'sad',
      [ThringletPersonalityTrait.EMOTIONAL + "-" + ThringletPersonalityTrait.ANALYTICAL]: 'neutral',
      
      // PROTECTIVE → X
      [ThringletPersonalityTrait.PROTECTIVE + "-" + ThringletPersonalityTrait.ADVENTUROUS]: 'excited',
      [ThringletPersonalityTrait.PROTECTIVE + "-" + ThringletPersonalityTrait.CHAOTIC]: 'angry',
      
      // CHAOTIC → X
      [ThringletPersonalityTrait.CHAOTIC + "-" + ThringletPersonalityTrait.LOGICAL]: 'sad',
      [ThringletPersonalityTrait.CHAOTIC + "-" + ThringletPersonalityTrait.CAUTIOUS]: 'neutral'
    };
    
    const key = oldTrait + "-" + newTrait;
    if (key in traitShiftMap) {
      return traitShiftMap[key];
    }
    
    // For other combinations, return a default based on general trait categories
    const positiveTraits = [
      ThringletPersonalityTrait.CREATIVE,
      ThringletPersonalityTrait.SOCIAL,
      ThringletPersonalityTrait.CURIOUS
    ];
    const negativeTraits = [
      ThringletPersonalityTrait.CHAOTIC,
      ThringletPersonalityTrait.CAUTIOUS
    ];
    
    if (positiveTraits.includes(newTrait)) {
      return 'happy';
    } else if (negativeTraits.includes(newTrait)) {
      return 'neutral';
    } else {
      return 'excited';
    }
  }
}

// Export singleton instance
export const personalityService = new PersonalityService();