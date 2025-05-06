import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ShieldAlert, 
  Lock, 
  Radio, 
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type TransactionStatus = 
  'pending' | 
  'processing' | 
  'encrypting' | 
  'broadcasting' | 
  'success' | 
  'failed' | 
  'validated';

export interface TransactionFlowProps {
  status: TransactionStatus;
  amount?: number;
  fromAddress?: string;
  toAddress?: string;
  transactionHash?: string;
  errorMessage?: string;
  onComplete?: () => void;
  className?: string;
}

export function TransactionFlow({
  status,
  amount,
  fromAddress,
  toAddress,
  transactionHash,
  errorMessage,
  onComplete,
  className
}: TransactionFlowProps) {
  const [particleCount, setParticleCount] = useState<number>(0);
  const [matrixChars, setMatrixChars] = useState<string[]>([]);
  
  // Generate particles for visualizing transaction flow
  useEffect(() => {
    if (status === 'processing' || status === 'encrypting' || status === 'broadcasting') {
      const count = status === 'broadcasting' ? 100 : 40;
      setParticleCount(count);
    } else {
      setParticleCount(0);
    }
  }, [status]);
  
  // Generate Matrix-style characters for encryption visualization
  useEffect(() => {
    if (status === 'encrypting') {
      const chars: string[] = [];
      const possibleChars = '01アイウエオカキクケコサシスセソタチツテト';
      const count = 50;
      
      for (let i = 0; i < count; i++) {
        const char = possibleChars[Math.floor(Math.random() * possibleChars.length)];
        chars.push(char);
      }
      
      setMatrixChars(chars);
      
      // Refresh characters every 500ms
      const interval = setInterval(() => {
        const newChars: string[] = [];
        for (let i = 0; i < count; i++) {
          const char = possibleChars[Math.floor(Math.random() * possibleChars.length)];
          newChars.push(char);
        }
        setMatrixChars(newChars);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  // Call onComplete when transaction reaches a terminal state
  useEffect(() => {
    const terminalStates: TransactionStatus[] = ['success', 'failed', 'validated'];
    if (terminalStates.includes(status) && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);
  
  // Format μPVX amount
  const formatAmount = (amount?: number): string => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat().format(amount) + ' μPVX';
  };
  
  // Shorten an address for display
  const shortenAddress = (address?: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Get status description based on current status
  const getStatusDescription = (): string => {
    switch (status) {
      case 'pending':
        return 'Transaction is queued for processing';
      case 'processing':
        return 'Processing transaction data';
      case 'encrypting':
        return 'Generating zkSNARK proof';
      case 'broadcasting':
        return 'Broadcasting to PVX network';
      case 'success':
        return 'Transaction completed successfully';
      case 'failed':
        return errorMessage || 'Transaction failed';
      case 'validated':
        return 'Transaction confirmed and validated';
      default:
        return 'Processing transaction';
    }
  };
  
  // Get icon based on status
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />;
      case 'processing':
        return <Radio className="h-8 w-8 text-blue-400 animate-pulse" />;
      case 'encrypting':
        return <Lock className="h-8 w-8 text-green-400 animate-pulse" />;
      case 'broadcasting':
        return <Zap className="h-8 w-8 text-yellow-400 animate-pulse" />;
      case 'success':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'validated':
        return <ShieldAlert className="h-8 w-8 text-green-500" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-yellow-400" />;
    }
  };
  
  return (
    <div className={cn("relative z-50", className)}>
      <Card className="bg-black/90 border-blue-900/50 p-6 max-w-md w-full relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 bg-blue-950/20 z-0"></div>
        
        {/* Processing particles */}
        <AnimatePresence>
          {particleCount > 0 && (
            <>
              {Array.from({ length: particleCount }).map((_, i) => {
                const size = Math.random() * 3 + 1;
                const duration = Math.random() * 3 + 1;
                const initialX = Math.random() * 100;
                const initialY = -10;
                const finalY = status === 'broadcasting' ? 
                  Math.random() * 120 : // For broadcasting, particles go in all directions
                  110; // For other states, particles fall down
                const finalX = status === 'broadcasting' ?
                  initialX + (Math.random() * 60 - 30) : // Spread for broadcasting
                  initialX;
                  
                const opacity = Math.random() * 0.7 + 0.3;
                const delay = Math.random() * 2;
                
                // Determine color based on status
                let color;
                if (status === 'processing') color = '#60A5FA'; // blue
                else if (status === 'encrypting') color = '#10B981'; // green
                else if (status === 'broadcasting') color = '#FBBF24'; // yellow
                
                return (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ 
                      x: `${initialX}%`, 
                      y: `${initialY}%`, 
                      opacity
                    }}
                    animate={{ 
                      x: `${finalX}%`, 
                      y: `${finalY}%`, 
                      opacity: 0 
                    }}
                    transition={{ 
                      duration, 
                      delay,
                      ease: 'linear',
                      repeat: Infinity,
                      repeatDelay: Math.random() * 1
                    }}
                    className="absolute rounded-full"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color
                    }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>
        
        {/* Matrix-style characters for encryption */}
        <AnimatePresence>
          {status === 'encrypting' && (
            <div className="absolute inset-0 overflow-hidden z-0">
              {matrixChars.map((char, i) => {
                const posX = Math.random() * 100;
                const posY = Math.random() * 100;
                const opacity = Math.random() * 0.7 + 0.3;
                const size = Math.random() * 16 + 10;
                
                return (
                  <motion.div
                    key={`matrix-${i}`}
                    initial={{ 
                      x: `${posX}%`, 
                      y: `${posY}%`, 
                      opacity, 
                      scale: 0.8 
                    }}
                    animate={{ 
                      opacity: opacity * 0.5, 
                      scale: 1.2 
                    }}
                    transition={{ 
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                    className="absolute font-mono text-green-500 select-none pointer-events-none"
                    style={{ fontSize: `${size}px` }}
                  >
                    {char}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
        
        {/* Success/fail effects */}
        <AnimatePresence>
          {status === 'success' && (
            <div 
              className="absolute inset-0 z-0 animate-success-pulse"
              style={{ 
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
              }}
            />
          )}
          
          {status === 'failed' && (
            <div 
              className="absolute inset-0 z-0 animate-error-pulse"
              style={{ 
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
              }}
            />
          )}
          
          {status === 'validated' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-0"
              style={{ 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <div className="text-center mb-6">
            <h3 className={cn(
              "text-lg font-semibold mb-1",
              status === 'success' && "text-green-400",
              status === 'failed' && "text-red-400",
              status === 'validated' && "text-green-400",
              status !== 'success' && status !== 'failed' && status !== 'validated' && "text-blue-400"
            )}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </h3>
            <p className="text-gray-400 text-sm">{getStatusDescription()}</p>
          </div>
          
          <div className="space-y-3">
            {amount !== undefined && (
              <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-800">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className="text-white font-mono">{formatAmount(amount)}</span>
              </div>
            )}
            
            {fromAddress && (
              <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-800">
                <span className="text-gray-400 text-sm">From</span>
                <span className="text-white font-mono">{shortenAddress(fromAddress)}</span>
              </div>
            )}
            
            {toAddress && (
              <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-800">
                <span className="text-gray-400 text-sm">To</span>
                <span className="text-white font-mono">{shortenAddress(toAddress)}</span>
              </div>
            )}
            
            {transactionHash && (
              <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-800">
                <span className="text-gray-400 text-sm">Hash</span>
                <span className="text-white font-mono text-xs truncate max-w-[200px]">
                  {transactionHash}
                </span>
              </div>
            )}
            
            {/* Progress bar for active states */}
            {(status === 'processing' || status === 'encrypting' || status === 'broadcasting') && (
              <div className="h-1 w-full bg-gray-800 rounded overflow-hidden mt-4">
                <motion.div
                  className={cn(
                    "h-full",
                    status === 'processing' && "bg-blue-500",
                    status === 'encrypting' && "bg-green-500",
                    status === 'broadcasting' && "bg-yellow-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ 
                    duration: status === 'encrypting' ? 5 : 3,
                    ease: "easeInOut"
                  }}
                />
              </div>
            )}
            
            {/* Error message for failed state */}
            {status === 'failed' && errorMessage && (
              <div className="bg-red-900/20 border border-red-800 p-3 rounded-md mt-4">
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}