import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, Loader2, FileWarning, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TransactionStatus = 'pending' | 'processing' | 'encrypting' | 'broadcasting' | 'success' | 'failed' | 'validated';

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
  const [currentStatus, setCurrentStatus] = useState<TransactionStatus>(status);
  const [pixels, setPixels] = useState<Array<{ x: number; y: number; duration: number }>>([]);
  const [matrixColumns, setMatrixColumns] = useState<Array<{
    x: number; 
    chars: string[]; 
    speed: number;
    startDelay: number;
  }>>([]);
  
  // Status transition flow
  useEffect(() => {
    setCurrentStatus(status);
    if (status === 'success' && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);
  
  // Generate initial pixels for animation
  useEffect(() => {
    const newPixels = [];
    for (let i = 0; i < 100; i++) {
      newPixels.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 2 + 0.5
      });
    }
    setPixels(newPixels);
    
    // Generate matrix columns
    const newColumns = [];
    const matrixChars = '01αβγδεζηθικλμνξοπρςστυφχψω¥¢$€₹£₽៛₩฿₫₴₸₼АБВГҐДЂЃЕЁЄЖЗЅИІЇЙЈКЛЉМНЊОПРСТЋЌУЎФХЦЧЏШЩЪЫЬЭЮЯ';
    for (let i = 0; i < 20; i++) {
      const chars = [];
      for (let j = 0; j < 20; j++) {
        chars.push(matrixChars.charAt(Math.floor(Math.random() * matrixChars.length)));
      }
      newColumns.push({
        x: i * 5,
        chars,
        speed: Math.random() * 0.5 + 0.1,
        startDelay: Math.random() * 2
      });
    }
    setMatrixColumns(newColumns);
    
  }, []);
  
  // Message based on status
  const statusMessages = {
    pending: 'Initializing Transaction...',
    processing: 'Processing Transaction Details...',
    encrypting: 'Encrypting with zkSNARK Protocol...',
    broadcasting: 'Broadcasting to PVX Network Nodes...',
    success: 'Transaction Completed Successfully',
    failed: 'Transaction Failed',
    validated: 'Block Validated & Confirmed'
  };
  
  // Animation for different states
  const getStatusAnimation = () => {
    switch (currentStatus) {
      case 'pending':
        return (
          <div className="relative h-20 w-20 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="absolute inset-0 border-2 border-primary/50 rounded-full animate-ping" />
          </div>
        );
      case 'processing':
        return (
          <div className="relative h-20 w-20">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {pixels.map((pixel, i) => (
                <rect
                  key={i}
                  x={pixel.x}
                  y={pixel.y}
                  width="3"
                  height="3"
                  fill="#3b82f6"
                  className="animate-pulse"
                  style={{ animationDuration: `${pixel.duration}s` }}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 border-2 border-primary/80 rounded-full animate-spin border-t-transparent" />
            </div>
          </div>
        );
      case 'encrypting':
        return (
          <div className="relative h-20 w-20 flex items-center justify-center">
            <Lock className="h-12 w-12 text-green-400 animate-pulse" />
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {matrixColumns.map((column, i) => (
                  <g key={i} style={{ animation: `fallDown ${column.speed}s infinite`, animationDelay: `${column.startDelay}s` }}>
                    {column.chars.map((char, j) => (
                      <text
                        key={j}
                        x={column.x}
                        y={j * 5}
                        className="text-xs fill-green-500 opacity-70"
                        style={{ 
                          animation: `fadeOut ${column.speed * 2}s infinite`,
                          animationDelay: `${column.startDelay + j * 0.1}s`
                        }}
                      >
                        {char}
                      </text>
                    ))}
                  </g>
                ))}
              </svg>
            </div>
          </div>
        );
      case 'broadcasting':
        return (
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20" />
            <div className="absolute inset-2 rounded-full border-4 border-primary animate-ping opacity-40" style={{ animationDelay: '0.3s' }} />
            <div className="absolute inset-4 rounded-full border-4 border-primary animate-ping opacity-60" style={{ animationDelay: '0.6s' }} />
            <div className="absolute inset-6 rounded-full border-4 border-primary animate-ping opacity-80" style={{ animationDelay: '0.9s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-primary/60 rounded-full animate-pulse" />
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="relative h-20 w-20 flex items-center justify-center bg-green-900/20 rounded-full">
            <Check className="h-12 w-12 text-green-400" />
            <div className="absolute inset-0 border-2 border-green-400 rounded-full animate-success-pulse" />
          </div>
        );
      case 'failed':
        return (
          <div className="relative h-20 w-20 flex items-center justify-center bg-red-900/20 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div className="absolute inset-0 border-2 border-red-400 rounded-full animate-error-pulse" />
          </div>
        );
      case 'validated':
        return (
          <div className="relative h-20 w-20 flex items-center justify-center">
            <Unlock className="h-12 w-12 text-green-400" />
            <div className="absolute inset-0 border-2 border-green-400 rounded-full animate-success-pulse" />
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {pixels.map((pixel, i) => (
                  <rect
                    key={i}
                    x={pixel.x}
                    y={pixel.y}
                    width="2"
                    height="2"
                    fill="#10b981"
                    className="animate-pulse"
                    style={{ animationDuration: `${pixel.duration}s` }}
                  />
                ))}
              </svg>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Truncate address for display
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className={cn(
      "bg-black/80 backdrop-blur-md border border-blue-800/60 rounded-lg p-6 shadow-lg shadow-blue-900/30 flex flex-col items-center justify-center space-y-4",
      className
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStatus}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center space-y-6"
        >
          {getStatusAnimation()}
          
          <div className="text-center space-y-2">
            <h3 className={cn(
              "text-xl font-bold tracking-tight text-white text-shadow-neon",
              currentStatus === 'failed' && "text-red-400",
              currentStatus === 'success' && "text-green-400"
            )}>
              {statusMessages[currentStatus]}
            </h3>
            
            {errorMessage && currentStatus === 'failed' && (
              <p className="text-red-400 text-sm max-w-xs">
                {errorMessage}
              </p>
            )}
            
            {amount !== undefined && (
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className="font-mono text-xl font-semibold text-primary-light">
                  {amount.toLocaleString()} μPVX
                </span>
              </div>
            )}
            
            {(fromAddress || toAddress) && (
              <div className="bg-black/80 border border-blue-900/40 rounded-md p-3 mt-3 max-w-md font-mono text-xs">
                {fromAddress && (
                  <div className="flex items-center justify-between space-x-4 mb-2">
                    <span className="text-primary-light/70">FROM:</span>
                    <span className="text-blue-300">{truncateAddress(fromAddress)}</span>
                  </div>
                )}
                {toAddress && (
                  <div className="flex items-center justify-between space-x-4">
                    <span className="text-primary-light/70">TO:</span>
                    <span className="text-blue-300">{truncateAddress(toAddress)}</span>
                  </div>
                )}
              </div>
            )}
            
            {transactionHash && (currentStatus === 'success' || currentStatus === 'validated') && (
              <div className="mt-3 text-xs font-mono text-blue-400/80">
                <span>TX Hash: {truncateAddress(transactionHash)}</span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}