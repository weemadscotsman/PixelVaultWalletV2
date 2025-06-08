/**
 * Utility functions for WebSocket communication
 * Enhanced for real-time data synchronization across all blockchain components
 */

import { Transaction, Block } from '@shared/types';
import WebSocket from 'ws';

/**
 * Helper function to send message to all connected clients
 */
function broadcast(type: string, data: any): void {
  const wss = (global as any).wss;
  
  if (!wss) {
    // Silently skip if WebSocket server not initialized yet - this is expected during startup
    return;
  }
  
  // Add logging to track real-time updates
  console.log(`Broadcasting ${type} event to ${wss.clients.size} connected clients`);
  
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

/**
 * Broadcast new transaction to all connected WebSocket clients
 */
export function broadcastTransaction(transaction: Transaction): void {
  broadcast('new_transaction', transaction);
  
  // Also send wallet_update for any address involved in the transaction
  // This ensures wallet balances update in real-time
  if (transaction.from && transaction.from !== 'SYSTEM') {
    broadcast('wallet_update', { address: transaction.from });
  }
  
  if (transaction.to) {
    broadcast('wallet_update', { address: transaction.to });
  }
  
  // For staking transactions, send staking updates
  if (transaction.type.includes('STAKE_')) {
    broadcast('staking_update', { 
      walletAddress: transaction.from,
      poolId: transaction.to.replace('STAKE_POOL_', '')
    });
  }
}

/**
 * Broadcast new block to all connected WebSocket clients
 */
export function broadcastBlock(block: Block): void {
  broadcast('new_block', block);
  
  // Also broadcast mining stats update
  broadcast('mining_update', { 
    minerAddress: block.miner,
    blockHeight: block.height
  });
}

/**
 * Broadcast blockchain status update to all connected WebSocket clients
 */
export function broadcastStatusUpdate(status: any): void {
  broadcast('status_update', status);
}

/**
 * Broadcast governance update (proposals, votes, veto actions)
 */
export function broadcastGovernanceUpdate(data: any): void {
  broadcast('governance_update', data);
}

/**
 * Broadcast staking updates (new stakes, rewards, etc.)
 */
export function broadcastStakingUpdate(data: any): void {
  broadcast('staking_update', data);
}

/**
 * Broadcast veto guardian update
 */
export function broadcastVetoGuardianUpdate(data: any): void {
  broadcast('veto_guardian_update', data);
  // Also send governance update for connected components
  broadcast('governance_update', { vetoGuardianChange: true });
}

/**
 * Broadcast wallet balance or state change
 */
export function broadcastWalletUpdate(data: any): void {
  broadcast('wallet_update', data);
}

/**
 * Broadcast Thringlet state change
 */
export function broadcastThringletUpdate(data: any): void {
  broadcast('thringlet_update', data);
}

/**
 * Broadcast learning module progress/completion
 */
export function broadcastLearningUpdate(data: any): void {
  broadcast('learning_update', data);
}