import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  autoConnect?: boolean;
}

interface UseWebSocketResult {
  status: WebSocketStatus;
  sendMessage: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
  error: Error | null;
}

/**
 * React hook for WebSocket communication
 * Supports auto-reconnect, status tracking, and error handling
 */
export function useWebSocket(
  options: UseWebSocketOptions = {}
): UseWebSocketResult {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectCountRef = useRef<number>(0);

  // Create WebSocket connection URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (protocol === "wss:" ? "443" : "80");
    return `${protocol}//${host}:${port}/ws`;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      // Don't reconnect if already connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      setStatus('connecting');
      console.log('Connecting to WebSocket:', getWebSocketUrl());
      
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = (event: Event) => {
        console.log('WebSocket connected');
        setStatus('connected');
        setError(null);
        reconnectCountRef.current = 0;
        
        if (onOpen) {
          onOpen(event);
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        if (onMessage) {
          onMessage(event);
        }
      };

      ws.onclose = (event: CloseEvent) => {
        console.log('WebSocket disconnected');
        setStatus('disconnected');
        
        if (onClose) {
          onClose(event);
        }

        // Try to reconnect if not a clean close and within reconnect attempts
        if (!event.wasClean && reconnectCountRef.current < reconnectAttempts) {
          console.log(`Reconnecting (${reconnectCountRef.current + 1}/${reconnectAttempts})...`);
          
          // Clear previous timeout if exists
          if (reconnectTimeoutRef.current !== null) {
            window.clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Set new timeout
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event: Event) => {
        console.error('WebSocket error:', event);
        setStatus('error');
        setError(new Error('WebSocket connection error'));
        
        if (onError) {
          onError(event);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Unknown WebSocket error'));
      
      // Try to reconnect if within reconnect attempts
      if (reconnectCountRef.current < reconnectAttempts) {
        // Clear previous timeout if exists
        if (reconnectTimeoutRef.current !== null) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Set new timeout
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectCountRef.current++;
          connect();
        }, reconnectInterval);
      }
    }
  }, [
    getWebSocketUrl,
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectAttempts,
    reconnectInterval,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setStatus('disconnected');
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        wsRef.current.send(message);
        return true;
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
        return false;
      }
    } else {
      console.warn('WebSocket not connected, message not sent');
      return false;
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  return {
    status,
    sendMessage,
    connect,
    disconnect,
    error,
  };
}