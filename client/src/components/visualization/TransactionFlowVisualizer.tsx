import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Transaction } from "@shared/types";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightCircle, CircleDollarSign, Database, Shield, Gem } from "lucide-react";

interface TransactionFlowVisualizerProps {
  transactions: Transaction[];
  maxDisplay?: number;
  animationSpeed?: number;
}

interface TransactionNode {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface TransactionConnection {
  start: TransactionNode;
  end: TransactionNode;
  width: number;
  color: string;
  progress: number;
  speed: number;
  completed: boolean;
  transaction: Transaction;
}

const transactionTypeIcons = {
  'transfer': CircleDollarSign,
  'mining_reward': Database, 
  'staking_reward': Gem,
  'nft_mint': Gem,
  'nft_transfer': Gem,
  'stake': Gem,
  'unstake': Gem,
  'governance_proposal': Shield,
  'governance_vote': Shield,
  'dex_swap': ArrowRightCircle,
  'dex_add_liquidity': ArrowRightCircle,
  'dex_remove_liquidity': ArrowRightCircle
};

export const TransactionFlowVisualizer: React.FC<TransactionFlowVisualizerProps> = ({ 
  transactions, 
  maxDisplay = 5,
  animationSpeed = 1 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<TransactionConnection[]>([]);
  const [visibleTransactions, setVisibleTransactions] = useState<Transaction[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationFrameRef = useRef<number>(0);
  const nodesRef = useRef<Record<string, TransactionNode>>({});
  
  // Initialize canvas dimensions based on container
  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          setDimensions({
            width: clientWidth,
            height: clientHeight
          });
        }
      };
      
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      
      return () => {
        window.removeEventListener('resize', updateDimensions);
      };
    }
  }, []);

  // Update visible transactions
  useEffect(() => {
    // Take the most recent transactions up to maxDisplay
    const recent = [...transactions]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxDisplay);
    
    setVisibleTransactions(recent);
  }, [transactions, maxDisplay]);

  // Create node and connection network
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    
    // Create nodes for unique addresses
    const nodes: Record<string, TransactionNode> = {};
    const allAddresses = new Set<string>();
    
    visibleTransactions.forEach(tx => {
      allAddresses.add(tx.fromAddress);
      allAddresses.add(tx.toAddress);
    });
    
    // Position nodes around the perimeter of a circle
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    const addresses = Array.from(allAddresses);
    addresses.forEach((address, index) => {
      const angle = (index / addresses.length) * Math.PI * 2;
      nodes[address] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        radius: 8,
        color: getAddressColor(address)
      };
    });
    
    // Create connections for transactions
    const newConnections: TransactionConnection[] = visibleTransactions.map(tx => {
      const start = nodes[tx.fromAddress];
      const end = nodes[tx.toAddress];
      
      return {
        start,
        end,
        width: getTransactionWidth(tx.amount),
        color: getTransactionColor(tx.type),
        progress: 0,
        speed: 0.5 + Math.random() * 0.5, // Random speed variation
        completed: false,
        transaction: tx
      };
    });
    
    nodesRef.current = nodes;
    setConnections(newConnections);
  }, [visibleTransactions, dimensions]);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || connections.length === 0) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      if (!canvasRef.current) return;
      
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw connections (lines with animated flow)
      let allCompleted = true;
      setConnections(prev => prev.map(conn => {
        if (conn.progress < 1) {
          const newProgress = conn.progress + 0.005 * conn.speed * animationSpeed;
          if (newProgress < 1) {
            allCompleted = false;
            return { ...conn, progress: newProgress };
          } else {
            return { ...conn, progress: 1, completed: true };
          }
        }
        return conn;
      }));
      
      // Draw the connections
      connections.forEach(conn => {
        drawConnection(ctx, conn);
      });
      
      // Draw nodes
      Object.values(nodesRef.current).forEach(node => {
        drawNode(ctx, node);
      });
      
      // Continue animation if not all connections are completed
      if (!allCompleted) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Reset progress after a delay to loop the animation
        setTimeout(() => {
          setConnections(prev => 
            prev.map(conn => ({ ...conn, progress: 0, completed: false }))
          );
          animationFrameRef.current = requestAnimationFrame(animate);
        }, 2000);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [connections, dimensions, animationSpeed]);

  // Utility functions for visual styling
  const getAddressColor = (address: string) => {
    if (address.startsWith('zk_PVX:')) {
      return '#00ffcc';
    }
    
    // Hash the address to get a consistent color
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a saturated neon color in rgb
    const r = 30 + (Math.abs(Math.sin(hash * 0.1)) * 225);
    const g = 30 + (Math.abs(Math.sin(hash * 0.2)) * 225);
    const b = 30 + (Math.abs(Math.sin(hash * 0.3)) * 225);
    
    return `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})`;
  };
  
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'transfer': return '#39ff14'; // neon green
      case 'mining_reward': return '#ff9c00'; // orange
      case 'staking_reward': return '#ff00ff'; // magenta
      case 'nft_mint': return '#00e5ff'; // cyan
      case 'nft_transfer': return '#00e5ff'; // cyan
      case 'stake': return '#ff00ff'; // magenta
      case 'unstake': return '#ff00ff'; // magenta
      case 'governance_proposal': return '#ffff00'; // yellow
      case 'governance_vote': return '#ffff00'; // yellow
      case 'dex_swap': return '#ff1493'; // deep pink
      case 'dex_add_liquidity': return '#ff1493'; // deep pink
      case 'dex_remove_liquidity': return '#ff1493'; // deep pink
      default: return '#ffffff'; // white
    }
  };
  
  const getTransactionWidth = (amount: number) => {
    // Scale line width based on transaction amount, with minimum and maximum
    return Math.max(1, Math.min(8, 1 + Math.log10(amount) * 0.5));
  };
  
  // Canvas drawing functions
  const drawNode = (ctx: CanvasRenderingContext2D, node: TransactionNode) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    // Draw glow effect
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
      node.x, node.y, node.radius,
      node.x, node.y, node.radius + 8
    );
    gradient.addColorStop(0, `${node.color}70`); // semi-transparent
    gradient.addColorStop(1, `${node.color}00`); // transparent
    ctx.fillStyle = gradient;
    ctx.fill();
  };
  
  const drawConnection = (ctx: CanvasRenderingContext2D, connection: TransactionConnection) => {
    const { start, end, width, color, progress } = connection;
    
    // Draw base line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = `${color}30`; // semi-transparent base line
    ctx.lineWidth = width;
    ctx.stroke();
    
    // Calculate current position of the pulse
    const currentX = start.x + (end.x - start.x) * progress;
    const currentY = start.y + (end.y - start.y) * progress;
    
    // Draw animated pulse
    const pulseSize = 10 + width * 2;
    const gradient = ctx.createRadialGradient(
      currentX, currentY, 0,
      currentX, currentY, pulseSize
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, `${color}00`); // transparent
    
    ctx.beginPath();
    ctx.arc(currentX, currentY, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw the completed part of the path
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    
    // Add glow effect
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = `${color}50`; // semi-transparent
    ctx.lineWidth = width + 2;
    ctx.stroke();
  };

  // Render transaction details
  const renderTransactionDetails = () => {
    return (
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 max-h-[40%] overflow-y-auto pr-2">
        <AnimatePresence>
          {visibleTransactions.map((tx, index) => {
            const connection = connections.find(c => c.transaction.id === tx.id);
            const progress = connection?.progress || 0;
            
            // Find the matching icon component for the transaction type
            const IconComponent = transactionTypeIcons[tx.type as keyof typeof transactionTypeIcons] || CircleDollarSign;
            
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: progress > 0.2 ? 1 : 0, 
                  x: progress > 0.2 ? 0 : -20 
                }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="text-shadow-neon bg-black/30 rounded-md backdrop-blur-sm p-3 border border-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full" style={{ 
                    backgroundColor: getTransactionColor(tx.type) + '20',
                    border: `1px solid ${getTransactionColor(tx.type)}` 
                  }}>
                    <IconComponent className="h-4 w-4" style={{ color: getTransactionColor(tx.type) }} />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{formatTransactionType(tx.type)}</span>
                      <span className="text-gray-400 text-[10px]">
                        {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-300 truncate max-w-[300px]">
                      {tx.note || `${shortenAddress(tx.fromAddress)} → ${shortenAddress(tx.toAddress)}`}
                    </div>
                    <div className="mt-1 text-[10px] font-mono flex justify-between">
                      <span className="text-emerald-400">{tx.amount.toFixed(6)} μPVX</span>
                      <span className="text-blue-400">Tx: {shortenAddress(tx.hash)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  // Helper function to format transaction types for display
  const formatTransactionType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Helper function to shorten addresses for display
  const shortenAddress = (address: string): string => {
    if (address.startsWith('zk_PVX:')) {
      return address;
    }
    if (address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="w-full h-full relative overflow-hidden bg-black/30 border-cyan-600/30">
      <div ref={containerRef} className="w-full h-full relative">
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="absolute inset-0"
        />
        {renderTransactionDetails()}
      </div>
    </Card>
  );
};