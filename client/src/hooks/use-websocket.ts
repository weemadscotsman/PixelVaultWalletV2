import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface WebSocketMessage {
  type: 'new_block' | 'new_transaction' | 'mining_update' | 'wallet_update' | 'status_update' | 'governance_update' | 'drop_update';
  data: any;
  timestamp: string;
}

export function useWebSocket(walletAddress?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = window.location.port || (protocol === "wss:" ? "443" : "80");
      const wsUrl = `${protocol}//${host}:${port}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Subscribe to wallet-specific updates if wallet is connected
        if (walletAddress) {
          wsRef.current?.send(JSON.stringify({
            type: 'subscribe',
            walletAddress
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle different message types and invalidate relevant queries
          switch (message.type) {
            case 'new_block':
              queryClient.invalidateQueries({ queryKey: ['/api/blockchain/latest-block'] });
              queryClient.invalidateQueries({ queryKey: ['/api/blockchain/blocks'] });
              queryClient.invalidateQueries({ queryKey: ['/api/blockchain/status'] });
              break;
              
            case 'new_transaction':
              queryClient.invalidateQueries({ queryKey: ['/api/blockchain/transactions'] });
              queryClient.invalidateQueries({ queryKey: ['/api/utr/transactions'] });
              queryClient.invalidateQueries({ queryKey: ['/api/utr/realtime'] });
              if (walletAddress && (message.data.from === walletAddress || message.data.to === walletAddress)) {
                queryClient.invalidateQueries({ queryKey: ['/api/wallet', walletAddress] });
              }
              break;
              
            case 'mining_update':
              if (walletAddress && message.data.address === walletAddress) {
                queryClient.invalidateQueries({ queryKey: ['/api/blockchain/mining/stats', walletAddress] });
                queryClient.invalidateQueries({ queryKey: ['/api/wallet', walletAddress] });
              }
              break;
              
            case 'wallet_update':
              if (walletAddress && message.data.address === walletAddress) {
                queryClient.invalidateQueries({ queryKey: ['/api/wallet', walletAddress] });
                queryClient.invalidateQueries({ queryKey: ['/api/stake/user', walletAddress] });
              }
              break;
              
            case 'status_update':
              queryClient.invalidateQueries({ queryKey: ['/api/blockchain/status'] });
              queryClient.invalidateQueries({ queryKey: ['/api/blockchain/trends'] });
              break;
              
            case 'governance_update':
              queryClient.invalidateQueries({ queryKey: ['/api/governance/proposals'] });
              queryClient.invalidateQueries({ queryKey: ['/api/governance/stats'] });
              break;
              
            case 'drop_update':
              queryClient.invalidateQueries({ queryKey: ['/api/drops'] });
              queryClient.invalidateQueries({ queryKey: ['/api/drops/stats'] });
              if (walletAddress) {
                queryClient.invalidateQueries({ queryKey: ['/api/drops/eligibility', walletAddress] });
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // Subscribe to wallet updates when wallet address changes
  useEffect(() => {
    if (isConnected && walletAddress) {
      sendMessage({
        type: 'subscribe',
        walletAddress
      });
    }
  }, [isConnected, walletAddress]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
  };
}