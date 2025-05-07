import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useNavigate, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface ConnectionStatusProps {
  onRetry?: () => void;
  showBackButton?: boolean;
}

export function ConnectionStatus({ onRetry, showBackButton = true }: ConnectionStatusProps) {
  const [, navigate] = useNavigate();
  const [retrying, setRetrying] = useState(false);
  
  // Query blockchain connection status
  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/blockchain/status'],
    queryFn: async () => {
      const res = await fetch('/api/blockchain/status');
      if (!res.ok) {
        throw new Error('Failed to fetch blockchain status');
      }
      return res.json();
    },
  });
  
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await refetch();
      if (onRetry) onRetry();
    } finally {
      setRetrying(false);
    }
  };
  
  // Check if connection status is available and connected
  const isConnected = status?.connected === true;
  
  return (
    <Card className="border-red-600/50 bg-black/90 max-w-md mx-auto">
      <CardHeader className="pb-2 text-center border-b border-red-900/30 bg-red-950/20">
        <div className="flex justify-center items-center gap-2 text-red-500">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-xl font-bold text-red-400">
            {isConnected ? 'Connection Warning' : 'Connection Error'}
          </h2>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-4 text-center">
        <div className="flex justify-center mb-4">
          {isConnected ? (
            <Wifi className="h-16 w-16 text-yellow-500 opacity-80" />
          ) : (
            <WifiOff className="h-16 w-16 text-red-500 opacity-80" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold mb-2 text-red-300">
          {isConnected 
            ? 'Unstable Connection to PVX Blockchain'
            : 'Connection Failed to PVX Blockchain Node'
          }
        </h3>
        
        <p className="text-gray-400 mb-3">
          {isConnected
            ? 'Your connection to the blockchain is unstable. Some features may not work properly.'
            : 'The requested path does not exist in the network.'
          }
        </p>
        
        <div className="bg-red-950/30 border border-red-900/30 rounded-md p-3 text-left">
          <p className="text-sm font-medium text-gray-300 mb-1">Status:</p>
          <p className="text-sm font-mono text-red-400">
            {isConnected ? 'UNSTABLE' : 'DISCONNECTED'}
          </p>
          
          {error && (
            <p className="mt-2 text-xs text-gray-500 break-all">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-3 justify-center pt-2 pb-4">
        {showBackButton && (
          <Button
            variant="outline"
            className="border-blue-900/50 text-blue-400 hover:bg-blue-950/30"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        )}
        
        <Button
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleRetry}
          disabled={retrying}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Connecting...' : 'Retry Connection'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ConnectionErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900/60">
      <ConnectionStatus />
    </div>
  );
}