/**
 * WebSocket Configuration
 * Centralizes all WebSocket-related configuration settings
 */

// Determine protocol based on current connection
const isSecure = window.location.protocol === 'https:';
const wsProtocol = isSecure ? 'wss' : 'ws';

// For Replit environments, use the same hostname but don't rely on window.location.port
// as it might be undefined in some contexts
export const WS_URL = import.meta.env.VITE_WS_URL || 
  `${wsProtocol}://${window.location.hostname}/ws`;

// WebSocket reconnection settings
export const WS_RECONNECT_INTERVAL = 3000; // 3 seconds
export const WS_MAX_RECONNECT_ATTEMPTS = 5;

// WebSocket message types
export enum WsMessageType {
  BLOCK = 'block',
  TRANSACTION = 'transaction',
  STATUS_UPDATE = 'status_update',
  MINING_UPDATE = 'mining_update',
  STAKING_UPDATE = 'staking_update',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong'
}

/**
 * Create WebSocket connection with auto-reconnect capability
 * @returns WebSocket instance
 */
export const createWebSocketConnection = (): WebSocket => {
  let ws: WebSocket;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    try {
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        // Reset reconnect attempt counter on successful connection
        reconnectAttempts = 0;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };
      
      ws.onclose = (event) => {
        if (!event.wasClean && reconnectAttempts < WS_MAX_RECONNECT_ATTEMPTS) {
          console.log(`WebSocket connection closed. Attempting to reconnect (${reconnectAttempts + 1}/${WS_MAX_RECONNECT_ATTEMPTS})...`);
          reconnectTimer = setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, WS_RECONNECT_INTERVAL);
        } else if (reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
          console.error(`WebSocket reconnection failed after ${WS_MAX_RECONNECT_ATTEMPTS} attempts`);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (reconnectAttempts < WS_MAX_RECONNECT_ATTEMPTS) {
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, WS_RECONNECT_INTERVAL);
      }
    }
    
    return ws;
  };
  
  return connect();
};

/**
 * Parse WebSocket message
 * @param event WebSocket message event
 * @returns Parsed message data or null if parsing fails
 */
export const parseWsMessage = (event: MessageEvent): any | null => {
  try {
    return JSON.parse(event.data);
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
    return null;
  }
};

/**
 * Send message through WebSocket
 * @param ws WebSocket instance
 * @param type Message type
 * @param data Message data
 * @returns True if message was sent successfully, false otherwise
 */
export const sendWsMessage = (ws: WebSocket, type: WsMessageType, data: any): boolean => {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ type, data }));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }
  return false;
};

/**
 * Check if WebSocket is connected
 * @param ws WebSocket instance
 * @returns True if WebSocket is connected, false otherwise
 */
export const isWsConnected = (ws: WebSocket): boolean => {
  return ws.readyState === WebSocket.OPEN;
};