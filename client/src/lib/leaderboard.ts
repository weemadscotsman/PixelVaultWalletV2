import { apiRequest } from './queryClient';

interface GameScore {
  user_id: number;
  wallet_address: string;
  username: string;
  game_type: string;
  score: number;
  difficulty: number;
  time_spent: number;
  blocks_mined?: number;
  gas_saved?: number;
  staking_rewards?: number;
}

/**
 * Registers a game score with the leaderboard system
 * @param score The score details to register
 * @returns Promise resolving to the created leaderboard entry
 */
export async function registerGameScore(score: GameScore): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/leaderboards/score', score);
    return response.json();
  } catch (error) {
    console.error('Error registering game score:', error);
    throw error;
  }
}

/**
 * Get top scores for a specific game type
 * @param gameType The type of game (hashlord, gasescape, stakingwars)
 * @param limit Maximum number of scores to return
 * @returns Promise resolving to an array of leaderboard entries
 */
export async function getTopScores(gameType: string, limit: number = 10): Promise<any[]> {
  try {
    const response = await apiRequest('GET', `/api/leaderboards/top/${gameType}?limit=${limit}`);
    return response.json();
  } catch (error) {
    console.error(`Error fetching top scores for ${gameType}:`, error);
    return [];
  }
}

/**
 * Get user's ranking for a specific game
 * @param userId The user's ID
 * @param gameType The type of game
 * @returns Promise resolving to the user's rank (1-based, where 1 is the highest rank)
 */
export async function getUserRank(userId: number, gameType: string): Promise<number> {
  try {
    const response = await apiRequest('GET', `/api/leaderboards/rank/${userId}/${gameType}`);
    const data = await response.json();
    return data.rank;
  } catch (error) {
    console.error(`Error fetching user rank for ${gameType}:`, error);
    return 0;
  }
}

/**
 * Get game statistics for a specific game type
 * @param gameType The type of game
 * @returns Promise resolving to game statistics
 */
export async function getGameStats(gameType: string): Promise<any> {
  try {
    const response = await apiRequest('GET', `/api/leaderboards/stats/${gameType}`);
    return response.json();
  } catch (error) {
    console.error(`Error fetching game stats for ${gameType}:`, error);
    return {
      totalPlayers: 0,
      highestScore: 0,
      averageScore: 0,
      totalGamesPlayed: 0
    };
  }
}