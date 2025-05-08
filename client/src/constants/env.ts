/**
 * PVX Environment Variables and Constants
 * Centralizes all environment-specific configuration
 */

// Default port if not provided
const DEFAULT_PORT = '5000';

// Determine protocol based on current connection
const isSecure = window.location.protocol === 'https:';
const wsProtocol = isSecure ? 'wss' : 'ws';

// For Replit environments, we don't need to specify the port in the WebSocket URL
// as it should use the same URL origin as the main application
export const WS_URL = import.meta.env.VITE_WS_URL || 
  `${wsProtocol}://${window.location.host}`;

// API base URL
export const API_URL = import.meta.env.VITE_API_URL || '';

// Server timeout in milliseconds
export const API_TIMEOUT = 30000;

// Blockchain-related constants
export const BLOCK_CONFIRMATION_COUNT = 6;
export const DEFAULT_TX_FEE = '0.000001';
export const MIN_STAKE_AMOUNT = '0.1';