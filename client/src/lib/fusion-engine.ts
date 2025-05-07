/**
 * Thringlet Fusion Engine - Direct implementation of fusion_engine.js blueprint
 * 
 * This system allows two compatible Thringlets to be fused together,
 * creating a new hybrid Thringlet with combined traits.
 */

import { ThringletProfile, ThringletAbility } from './thringlet';
import { DetailedThringletProfile } from '../data/thringlet-registry';

/**
 * Attempt to fuse two Thringlets together
 * Direct implementation from the blueprint
 */
export function attemptFusion(
  thrA: DetailedThringletProfile, 
  thrB: DetailedThringletProfile
): { 
  success: boolean, 
  result?: ThringletProfile, 
  corruption?: boolean, 
  message?: string 
} {
  const compatibilityScore = calculateCompatibility(thrA, thrB);
  
  // Check if fusion is possible based on compatibility
  if (compatibilityScore > 0.75) {
    return {
      success: true,
      result: spawnNewThringlet(thrA, thrB)
    };
  } else {
    return {
      success: false,
      corruption: true,
      message: "Fusion failed: Thringlets destabilized system state."
    };
  }
}

/**
 * Calculate the compatibility between two Thringlets
 * Direct implementation from the blueprint
 */
function calculateCompatibility(thrA: DetailedThringletProfile, thrB: DetailedThringletProfile): number {
  // Calculate emotional alignment overlap
  const overlap = thrA.emotional_alignment.filter(e => 
    thrB.emotional_alignment.includes(e)
  );
  
  // Determine compatibility score based on emotional alignment overlap
  return overlap.length / Math.max(thrA.emotional_alignment.length, 1);
}

/**
 * Create a new Thringlet from the fusion of two parent Thringlets
 * Direct implementation from the blueprint
 */
function spawnNewThringlet(thrA: DetailedThringletProfile, thrB: DetailedThringletProfile): ThringletProfile {
  // Generate a unique ID for the new Thringlet
  const uniqueId = `THRX${Date.now().toString().slice(-6)}`;
  
  // Combine abilities from both parents (up to 3)
  const combinedAbilities: ThringletAbility[] = [
    ...thrA.abilities,
    ...thrB.abilities
  ]
  // Remove duplicates and limit to 3 abilities
  .filter((ability, index, self) => 
    index === self.findIndex(a => a.name === ability.name)
  )
  .slice(0, 3);
  
  // Determine rarity based on parent Thringlets (potentially higher rarity)
  const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary'];
  const highestRarityIndex = Math.max(
    rarityOrder.indexOf(thrA.rarity), 
    rarityOrder.indexOf(thrB.rarity)
  );
  // 25% chance to increase rarity (if not already Legendary)
  const rarityIndex = highestRarityIndex < 3 && Math.random() < 0.25 
    ? highestRarityIndex + 1 
    : highestRarityIndex;
  
  const rarity = rarityOrder[rarityIndex] as 'Common' | 'Rare' | 'Epic' | 'Legendary';
  
  // Create the new fused Thringlet
  return {
    id: uniqueId,
    name: `Fused_${thrA.name.slice(0, 3)}${thrB.name.slice(0, 3)}`,
    core: Math.random() > 0.5 ? thrA.core : thrB.core,
    personality: Math.random() > 0.5 ? thrA.personality : thrB.personality,
    lore: `Hybrid of ${thrA.name} and ${thrB.name}, born from bonded terminal logic.`,
    abilities: combinedAbilities,
    rarity: rarity,
    ownerAddress: thrA.ownerAddress || thrB.ownerAddress
  };
}