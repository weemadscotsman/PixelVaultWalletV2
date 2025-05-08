/**
 * Utility functions for WebSocket communication
 */

import { Transaction, Block } from '@shared/types';
import WebSocket from 'ws';

/**
 * Broadcast new transaction to all connected WebSocket clients
 */
export function broadcastTransaction(transaction: Transaction): void {
  const wss = (global as any).wss;
  
  if (!wss) {
    console.error('WebSocket server not initialized');
    return;
  }
  
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new_transaction',
        data: transaction,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

/**
 * Broadcast new block to all connected WebSocket clients
 */
export function broadcastBlock(block: Block): void {
  const wss = (global as any).wss;
  
  if (!wss) {
    console.error('WebSocket server not initialized');
    return;
  }
  
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new_block',
        data: block,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

/**
 * Broadcast blockchain status update to all connected WebSocket clients
 */
export function broadcastStatusUpdate(status: any): void {
  const wss = (global as any).wss;
  
  if (!wss) {
    console.error('WebSocket server not initialized');
    return;
  }
  
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'status_update',
        data: status,
        timestamp: new Date().toISOString()
      }));
    }
  });
}