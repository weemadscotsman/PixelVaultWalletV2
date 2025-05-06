/**
 * This file provides cryptographic utility functions for the PIXELVAULT blockchain.
 */

/**
 * Calculate block reward based on block height (with halving logic)
 * @param blockHeight The current block height
 * @returns The block reward in PVX
 */
export function calculateBlockReward(blockHeight: number): number {
  const initialReward = 150; // 150 PVX initial block reward
  const halvingInterval = getHalvingInterval(); // 210,000 blocks (same as Bitcoin)
  
  const halvings = Math.floor(blockHeight / halvingInterval);
  const reward = initialReward / Math.pow(2, halvings);
  
  // Return reward with 6 decimal precision (minimum 0.000001 PVX)
  return Math.max(reward, 0.000001);
}

/**
 * Get the halving interval for the PIXELVAULT blockchain
 * @returns The number of blocks between reward halvings
 */
export function getHalvingInterval(): number {
  return 210000; // Same as Bitcoin per PVX specs
}

/**
 * Convert PVX to micro-PVX (μPVX)
 * @param pvx The amount in PVX
 * @returns The amount in micro-PVX (μPVX)
 */
export function pvxToMicroPVX(pvx: number): number {
  return Math.round(pvx * 1000000);
}

/**
 * Convert micro-PVX (μPVX) to PVX
 * @param microPVX The amount in micro-PVX (μPVX)
 * @returns The amount in PVX
 */
export function microPVXtoPVX(microPVX: number): number {
  return microPVX / 1000000;
}

/**
 * Calculate voting power based on staked amount and duration
 * @param amount The amount staked in PVX
 * @param duration The staking duration in days
 * @returns The calculated voting power
 */
export function calculateVotingPower(amount: number, durationDays: number): number {
  // Implementation based on the formula: voting power = amount * multiplier
  // where multiplier is determined by duration
  let multiplier = 1.0;
  
  if (durationDays >= 365) {
    multiplier = 3.0; // 3x for 1 year
  } else if (durationDays >= 180) {
    multiplier = 2.0; // 2x for 6 months
  } else if (durationDays >= 90) {
    multiplier = 1.5; // 1.5x for 3 months
  } else if (durationDays >= 30) {
    multiplier = 1.2; // 1.2x for 1 month
  }
  
  return amount * multiplier;
}

/**
 * Verify a signature for a message
 * @param message The message that was signed
 * @param signature The signature to verify
 * @param publicKey The public key to verify against
 * @returns True if the signature is valid, false otherwise
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  // In a real implementation, this would use a proper digital signature algorithm
  // For this mock implementation, we'll just return true
  return true;
}

/**
 * Generate a SHA3 variant hash for mining
 * @param data The data to hash
 * @returns The hash as a hexadecimal string
 */
export function sha3VariantHash(data: string): string {
  // In a real implementation, this would use a proper SHA3 variant
  // For this mock implementation, we'll just use a simple hash function
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hexadecimal string
  const hexHash = Math.abs(hash).toString(16).padStart(64, '0');
  return hexHash;
}
