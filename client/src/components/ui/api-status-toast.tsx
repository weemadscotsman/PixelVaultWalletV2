import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

type ApiStatusProps = {
  isError: boolean;
  errorMessage?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
  successMessage?: string;
  retryCount?: number;
  showToast?: boolean;
};

/**
 * Component to display API status notifications as toasts
 * Used to provide user feedback for temporary server issues
 */
export const ApiStatusToast: React.FC<ApiStatusProps> = ({
  isError,
  errorMessage,
  isLoading,
  isSuccess,
  successMessage,
  retryCount = 0,
  showToast = true,
}) => {
  const { toast } = useToast();
  
  useEffect(() => {
    if (!showToast) return;
    
    if (isError) {
      const isConnectionError = 
        errorMessage?.includes('502') || 
        errorMessage?.includes('503') || 
        errorMessage?.includes('network') ||
        errorMessage?.includes('connection');
      
      toast({
        title: isConnectionError ? 'Blockchain Connection Issue' : 'Operation Failed',
        description: isConnectionError 
          ? `Temporary server connection issue. ${retryCount > 0 ? `Retrying (${retryCount})...` : 'Please try again later.'}`
          : errorMessage || 'An unexpected error occurred',
        variant: 'destructive',
        duration: 5000,
        action: isConnectionError ? (
          <div className="flex gap-1 items-center">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <span className="text-xs">Temporary</span>
          </div>
        ) : undefined
      });
    } else if (isSuccess && successMessage) {
      toast({
        title: 'Success',
        description: successMessage,
        action: (
          <div className="flex gap-1 items-center">
            <ShieldCheck className="h-4 w-4 text-green-400" />
          </div>
        )
      });
    }
  }, [isError, isSuccess, errorMessage, successMessage, retryCount, toast, showToast]);
  
  // Pure notification component - doesn't render anything
  return null;
};

/**
 * Hook to monitor API connection status across the app
 * Displays a global toast when blockchain connectivity issues occur
 */
export function useApiConnectionStatus() {
  const [status, setStatus] = React.useState({
    hasIssue: false,
    retryCount: 0,
    lastErrorTime: 0,
  });
  
  const { toast } = useToast();
  
  // Report a connection issue
  const reportConnectionIssue = React.useCallback((errorMessage?: string) => {
    const now = Date.now();
    setStatus(prev => {
      // Only increment retry count if within 10 seconds of last error
      const isRecent = now - prev.lastErrorTime < 10000;
      
      return {
        hasIssue: true,
        retryCount: isRecent ? prev.retryCount + 1 : 1,
        lastErrorTime: now
      };
    });
    
    if (errorMessage) {
      console.error("API Connection Issue:", errorMessage);
    }
  }, []);
  
  // Clear connection issues
  const clearConnectionIssue = React.useCallback(() => {
    setStatus({
      hasIssue: false,
      retryCount: 0,
      lastErrorTime: 0
    });
  }, []);
  
  // Show a blockchain status toast
  useEffect(() => {
    if (status.hasIssue && status.retryCount === 1) {
      toast({
        title: "Blockchain Connection Status",
        description: "Experiencing temporary connection issues with the blockchain network. Some actions may be delayed.",
        variant: "default",
        className: "bg-yellow-950/80 border-yellow-800 text-yellow-100",
        duration: 5000,
        action: (
          <div className="flex gap-1 items-center">
            <Shield className="h-4 w-4 text-yellow-400" />
            <span className="text-xs">Monitoring</span>
          </div>
        )
      });
    }
    
    // If we reach 3+ retries, show a more concerning message
    if (status.hasIssue && status.retryCount === 3) {
      toast({
        title: "Blockchain Connection Degraded",
        description: "Multiple connection failures detected. The system will retry automatically. Some features may be unavailable.",
        variant: "destructive",
        duration: 8000,
      });
    }
  }, [status.hasIssue, status.retryCount, toast]);
  
  return {
    hasConnectionIssue: status.hasIssue,
    retryCount: status.retryCount,
    reportConnectionIssue,
    clearConnectionIssue
  };
}