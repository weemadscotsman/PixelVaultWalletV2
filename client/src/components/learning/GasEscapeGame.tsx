import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  SkipForward, 
  Gauge, 
  Zap, 
  Clock, 
  AlertTriangle, 
  Check, 
  X, 
  AlertCircle, 
  BarChart,
  TrendingUp,
  Timer,
  Award,
  DollarSign
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Transaction = {
  id: string;
  maxFeePerGas: number;
  maxPriorityFee: number;
  size: number;
  sender: string;
  nonce: number;
  status: 'pending' | 'included' | 'rejected' | 'replaced';
  timestamp: Date;
  latency: number;
};

type Block = {
  number: number;
  baseFee: number;
  gasLimit: number;
  gasUsed: number;
  transactions: Transaction[];
  miner: string;
  timestamp: Date;
};

type GameStats = {
  totalTxs: number;
  successfulTxs: number;
  rejectedTxs: number;
  totalGasPaid: number;
  averageGasPrice: number;
  totalOverpayment: number;
  score: number;
};

type GameLevel = 1 | 2 | 3 | 4;

export function GasEscapeGame() {
  const [level, setLevel] = useState<GameLevel>(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [blockHeight, setBlockHeight] = useState(15000000);
  const [currentBaseFee, setCurrentBaseFee] = useState(20); // in gwei
  const [userMaxFeePerGas, setUserMaxFeePerGas] = useState(25); // in gwei
  const [userMaxPriorityFee, setUserMaxPriorityFee] = useState(2); // in gwei
  const [mempool, setMempool] = useState<Transaction[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [userTxs, setUserTxs] = useState<Transaction[]>([]);
  const [networkCongestion, setNetworkCongestion] = useState<'low' | 'medium' | 'high'>('low');
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(12);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalTxs: 0,
    successfulTxs: 0,
    rejectedTxs: 0,
    totalGasPaid: 0,
    averageGasPrice: 0,
    totalOverpayment: 0,
    score: 0
  });
  const [tutorialStep, setTutorialStep] = useState(1);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [hintVisible, setHintVisible] = useState(false);
  
  const { toast } = useToast();
  const blockTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_TX_PER_LEVEL = {
    1: 5,
    2: 8, 
    3: 10,
    4: 12
  };
  
  // Initialize the game
  useEffect(() => {
    if (gameStarted && !gameOver) {
      initializeGame();
      startBlockTimer();
      
      return () => {
        if (blockTimerRef.current) {
          clearInterval(blockTimerRef.current);
        }
      };
    }
  }, [gameStarted, gameOver]);
  
  const initializeGame = () => {
    // Reset states
    setBlockHeight(15000000);
    setCurrentBaseFee(20);
    setUserMaxFeePerGas(25);
    setUserMaxPriorityFee(2);
    setMempool([]);
    setBlocks([]);
    setUserTxs([]);
    setNetworkCongestion('low');
    setBlockTimeRemaining(12);
    generateInitialMempool();
    
    setGameStats({
      totalTxs: 0,
      successfulTxs: 0,
      rejectedTxs: 0,
      totalGasPaid: 0,
      averageGasPrice: 0,
      totalOverpayment: 0,
      score: 0
    });
  };
  
  const startBlockTimer = () => {
    if (blockTimerRef.current) {
      clearInterval(blockTimerRef.current);
    }
    
    blockTimerRef.current = setInterval(() => {
      setBlockTimeRemaining(prev => {
        if (prev <= 1) {
          mineBlock();
          return 12; // Reset timer for next block
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const generateInitialMempool = () => {
    const botTransactions: Transaction[] = Array.from({ length: 8 }, (_, i) => {
      const baseFeeMultiplier = Math.random() * 1.5 + 0.8; // 0.8x to 2.3x the base fee
      const priorityFee = Math.random() * 3 + 0.5; // 0.5 to 3.5 gwei
      
      return {
        id: `bot-tx-${i}`,
        maxFeePerGas: Math.round(currentBaseFee * baseFeeMultiplier * 10) / 10,
        maxPriorityFee: Math.round(priorityFee * 10) / 10,
        size: Math.floor(Math.random() * 100000) + 21000, // 21000 to 121000 gas units
        sender: generateRandomAddress(),
        nonce: Math.floor(Math.random() * 100),
        status: 'pending',
        timestamp: new Date(),
        latency: Math.floor(Math.random() * 500) // 0-500ms latency
      };
    });
    
    setMempool(botTransactions);
  };
  
  const generateRandomAddress = () => {
    return '0x' + Array.from({ length: 40 }, () => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');
  };
  
  const submitTransaction = () => {
    // Create user transaction
    const userTx: Transaction = {
      id: `user-tx-${userTxs.length + 1}`,
      maxFeePerGas: userMaxFeePerGas,
      maxPriorityFee: userMaxPriorityFee,
      size: 21000, // Basic ETH transfer
      sender: '0x' + 'user'.padEnd(40, '0'),
      nonce: userTxs.length,
      status: 'pending',
      timestamp: new Date(),
      latency: 100 // Fixed latency for user transactions for now
    };
    
    // Add to mempool and user tx history
    setMempool(prev => [...prev, userTx]);
    setUserTxs(prev => [...prev, userTx]);
    
    // Update game stats
    setGameStats(prev => ({
      ...prev,
      totalTxs: prev.totalTxs + 1
    }));
    
    toast({
      title: "Transaction Submitted",
      description: `Your transaction with max fee of ${userMaxFeePerGas} gwei has been submitted to the mempool.`,
      variant: "default"
    });
    
    if (level === 1 && !tutorialCompleted && tutorialStep === 1) {
      setTutorialStep(2);
    }
  };
  
  const mineBlock = () => {
    // Sort mempool by max priority fee (what miners see) - highest first
    const sortedMempool = [...mempool].sort((a, b) => {
      // Effective priority fee is the min of maxPriorityFee and (maxFeePerGas - baseFee)
      const aEffectivePriorityFee = Math.min(
        a.maxPriorityFee, 
        Math.max(0, a.maxFeePerGas - currentBaseFee)
      );
      const bEffectivePriorityFee = Math.min(
        b.maxPriorityFee, 
        Math.max(0, b.maxFeePerGas - currentBaseFee)
      );
      
      // Sort by effective priority fee, descending
      return bEffectivePriorityFee - aEffectivePriorityFee;
    });
    
    // Filter out transactions that don't meet base fee requirements
    const validTxs = sortedMempool.filter(tx => tx.maxFeePerGas >= currentBaseFee);
    
    // Calculate block gas limit based on network congestion
    const gasLimit = networkCongestion === 'low' ? 15000000 : 
                     networkCongestion === 'medium' ? 30000000 : 
                     45000000;
    
    // Fill the block with transactions up to gas limit
    let gasUsed = 0;
    const includedTxs: Transaction[] = [];
    const rejectedTxs: Transaction[] = [];
    
    for (const tx of validTxs) {
      if (gasUsed + tx.size <= gasLimit) {
        includedTxs.push({...tx, status: 'included'});
        gasUsed += tx.size;
        
        // Update user tx status if applicable
        if (tx.sender.startsWith('0xuser')) {
          setUserTxs(prev => {
            return prev.map(userTx => {
              if (userTx.id === tx.id) {
                
                // Calculate actual gas paid
                const actualGasPayment = tx.size * (currentBaseFee + Math.min(
                  tx.maxPriorityFee, 
                  Math.max(0, tx.maxFeePerGas - currentBaseFee)
                )) / 1e9; // convert to ETH
                
                // Calculate overpayment
                const minimumRequired = tx.size * (currentBaseFee + 0.1) / 1e9; // 0.1 gwei priority fee would have been enough
                const overpayment = Math.max(0, actualGasPayment - minimumRequired);
                
                // Update game stats
                setGameStats(prev => ({
                  ...prev,
                  successfulTxs: prev.successfulTxs + 1,
                  totalGasPaid: prev.totalGasPaid + actualGasPayment,
                  totalOverpayment: prev.totalOverpayment + overpayment,
                  averageGasPrice: prev.totalGasPaid / prev.successfulTxs,
                  score: prev.score + 100 - (overpayment * 1000) // Lose points for overpaying
                }));
                
                toast({
                  title: "Transaction Included in Block!",
                  description: `Your transaction was mined successfully in block #${blockHeight + 1}.`,
                  variant: "default"
                });
                
                if (level === 1 && !tutorialCompleted && tutorialStep === 2) {
                  setTutorialStep(3);
                }
              }
              return userTx.id === tx.id ? {...userTx, status: 'included'} : userTx;
            });
          });
        }
      } else {
        rejectedTxs.push({...tx, status: 'rejected'});
        
        // Update user tx status if applicable
        if (tx.sender.startsWith('0xuser')) {
          setUserTxs(prev => {
            return prev.map(userTx => {
              if (userTx.id === tx.id) {
                setGameStats(prev => ({
                  ...prev,
                  rejectedTxs: prev.rejectedTxs + 1
                }));
                
                toast({
                  title: "Transaction Rejected",
                  description: "Your transaction didn't make it into this block. Try increasing your gas fees or wait for less congestion.",
                  variant: "destructive"
                });
              }
              return userTx.id === tx.id ? {...userTx, status: 'rejected'} : userTx;
            });
          });
        }
      }
    }
    
    // Create the new block
    const newBlock: Block = {
      number: blockHeight + 1,
      baseFee: currentBaseFee,
      gasLimit,
      gasUsed,
      transactions: includedTxs,
      miner: generateRandomAddress(),
      timestamp: new Date()
    };
    
    // Update blocks
    setBlocks(prev => [...prev, newBlock]);
    setBlockHeight(prev => prev + 1);
    
    // Update mempool by removing included transactions
    const updatedMempool = [...mempool];
    for (const tx of includedTxs) {
      const index = updatedMempool.findIndex(mempoolTx => mempoolTx.id === tx.id);
      if (index !== -1) {
        updatedMempool.splice(index, 1);
      }
    }
    
    // Generate new transactions to replace the ones included in the block
    const newTransactions: Transaction[] = Array.from(
      { length: Math.floor(Math.random() * 5) + 3 }, 
      (_, i) => {
        const baseFeeMultiplier = Math.random() * 1.5 + 0.8;
        const priorityFee = Math.random() * 3 + 0.5;
        
        return {
          id: `bot-tx-${Date.now()}-${i}`,
          maxFeePerGas: Math.round(currentBaseFee * baseFeeMultiplier * 10) / 10,
          maxPriorityFee: Math.round(priorityFee * 10) / 10,
          size: Math.floor(Math.random() * 100000) + 21000,
          sender: generateRandomAddress(),
          nonce: Math.floor(Math.random() * 100),
          status: 'pending',
          timestamp: new Date(),
          latency: Math.floor(Math.random() * 500)
        };
      }
    );
    
    // Update mempool with new transactions
    setMempool([...updatedMempool, ...newTransactions]);
    
    // Adjust base fee based on block fullness
    const blockFullness = gasUsed / gasLimit;
    let baseFeeChange = 0;
    
    if (blockFullness > 0.9) {
      // Block very full, increase base fee substantially
      baseFeeChange = currentBaseFee * 0.25; // +25%
      if (networkCongestion !== 'high') setNetworkCongestion('high');
    } else if (blockFullness > 0.5) {
      // Block moderately full, increase base fee slightly
      baseFeeChange = currentBaseFee * 0.0625; // +6.25%
      if (networkCongestion !== 'medium') setNetworkCongestion('medium');
    } else if (blockFullness < 0.3) {
      // Block mostly empty, decrease base fee
      baseFeeChange = -currentBaseFee * 0.0625; // -6.25%
      if (networkCongestion !== 'low') setNetworkCongestion('low');
    }
    
    const newBaseFee = Math.max(1, Math.round((currentBaseFee + baseFeeChange) * 10) / 10);
    setCurrentBaseFee(newBaseFee);
    
    // Check if game is over
    if (
      userTxs.length >= MAX_TX_PER_LEVEL[level] && 
      userTxs.every(tx => tx.status !== 'pending')
    ) {
      endGame();
    }
  };
  
  const endGame = () => {
    setGameOver(true);
    if (blockTimerRef.current) {
      clearInterval(blockTimerRef.current);
    }
    
    toast({
      title: "Level Complete!",
      description: `You've completed Level ${level} with a score of ${gameStats.score}!`,
      variant: "default"
    });
    
    // For level 1, mark tutorial as completed if not already
    if (level === 1 && !tutorialCompleted) {
      setTutorialCompleted(true);
      setTutorialStep(4);
    }
  };
  
  const restartGame = () => {
    setGameStarted(false);
    setGameOver(false);
    initializeGame();
  };
  
  const startNextLevel = () => {
    if (level < 4) {
      setLevel(prev => (prev + 1) as GameLevel);
      setGameOver(false);
      setGameStarted(true);
      initializeGame();
    }
  };
  
  const renderTutorial = () => {
    if (!showTutorial || tutorialCompleted) return null;
    
    const tutorialContent: Record<number, { title: string; content: string; action: string }> = {
      1: {
        title: "Welcome to Gas Escape!",
        content: "In this game, you'll learn how transactions get processed on the blockchain. Your goal is to submit transactions with efficient gas fees to get them included in blocks.",
        action: "Submit your first transaction to continue."
      },
      2: {
        title: "Understanding the Mempool",
        content: "Your transaction is now in the mempool waiting to be included in a block. Miners will prioritize transactions with higher priority fees.",
        action: "Wait for the next block to be mined."
      },
      3: {
        title: "Transaction Outcome",
        content: "If your transaction was included, congratulations! If not, you may need to increase your gas fees. The base fee fluctuates based on network congestion.",
        action: "Submit more transactions to complete level 1."
      },
      4: {
        title: "Level 1 Complete!",
        content: "You've learned the basics of gas fees and how transactions get included in blocks. You can now move on to Level 2 where gas prices will be more volatile during an NFT mint.",
        action: "Click 'Next Level' to continue your journey."
      }
    };
    
    return (
      <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 rounded-lg border border-blue-500 max-w-md">
          <h3 className="text-xl font-bold text-blue-400 mb-2">{tutorialContent[tutorialStep].title}</h3>
          <p className="text-gray-300 mb-4">{tutorialContent[tutorialStep].content}</p>
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowTutorial(false)}
            >
              Skip Tutorial
            </Button>
            {tutorialStep === 4 && (
              <Button onClick={startNextLevel}>Next Level</Button>
            )}
            {tutorialStep < 3 && (
              <p className="text-sm text-blue-300 mt-2">
                {tutorialContent[tutorialStep].action}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderGameContent = () => {
    if (!gameStarted) {
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-white">
            GasEscape: Master the Art of Blockchain Transactions
          </h2>
          <div className="space-y-4 text-gray-300">
            <p>
              You're a transaction trying to get included in blocks with the lowest possible gas fees.
              Navigate the volatile mempool, avoid overpaying, and learn how gas fees really work.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <Gauge className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="font-bold text-white">Gas Mechanics</h3>
                <p className="text-sm text-gray-400">Learn EIP-1559 fee structure with base fees and priority fees</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                <h3 className="font-bold text-white">Mempool Simulation</h3>
                <p className="text-sm text-gray-400">Compete with other transactions for block inclusion</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
                <h3 className="font-bold text-white">Network Congestion</h3>
                <p className="text-sm text-gray-400">Adapt to changing network conditions and gas price surges</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <Award className="w-8 h-8 text-purple-500 mb-2" />
                <h3 className="font-bold text-white">Fee Optimization</h3>
                <p className="text-sm text-gray-400">Minimize costs while ensuring transaction success</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
              onClick={() => setGameStarted(true)}
            >
              <Play className="mr-2 h-4 w-4" /> Start Game
            </Button>
          </div>
        </div>
      );
    }
    
    if (gameOver) {
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-gradient-blue">Level {level} Complete!</h2>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader className="py-3">
                <CardTitle className="text-center text-blue-400">Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-3xl font-bold">
                {Math.round(gameStats.score)}
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader className="py-3">
                <CardTitle className="text-center text-green-400">Success Rate</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-3xl font-bold">
                {gameStats.totalTxs > 0 
                  ? Math.round((gameStats.successfulTxs / gameStats.totalTxs) * 100)
                  : 0}%
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader className="py-3">
                <CardTitle className="text-center text-yellow-400">Gas Paid</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold">{gameStats.totalGasPaid.toFixed(6)}</div>
                <div className="text-xs text-gray-400">ETH</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader className="py-3">
                <CardTitle className="text-center text-red-400">Overpayment</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold">{gameStats.totalOverpayment.toFixed(6)}</div>
                <div className="text-xs text-gray-400">ETH</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" onClick={restartGame}>
              Replay Level
            </Button>
            
            {level < 4 && (
              <Button onClick={startNextLevel} className="bg-gradient-to-r from-blue-600 to-blue-400">
                Next Level <SkipForward className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {/* Status Panel */}
        <Card className="bg-gray-900/80 border-gray-800 md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Network Status</CardTitle>
            <CardDescription>Current blockchain state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Block Height</span>
              <span className="font-mono">{blockHeight.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Next Block</span>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-blue-400" />
                <span className="font-mono">{blockTimeRemaining}s</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Base Fee</span>
              <Badge 
                className={cn(
                  "font-mono",
                  networkCongestion === 'low' ? "bg-green-900/50 text-green-400 hover:bg-green-900/50" :
                  networkCongestion === 'medium' ? "bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/50" :
                  "bg-red-900/50 text-red-400 hover:bg-red-900/50"
                )}
              >
                {currentBaseFee} gwei
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Congestion</span>
              <Badge 
                variant="outline" 
                className={cn(
                  networkCongestion === 'low' ? "border-green-500 text-green-400" :
                  networkCongestion === 'medium' ? "border-yellow-500 text-yellow-400" :
                  "border-red-500 text-red-400"
                )}
              >
                {networkCongestion.toUpperCase()}
              </Badge>
            </div>
            
            <div className="pt-2">
              <Progress 
                value={
                  networkCongestion === 'low' ? 30 :
                  networkCongestion === 'medium' ? 60 : 
                  90
                } 
                className={cn(
                  "h-2",
                  networkCongestion === 'low' ? "bg-green-900/20" :
                  networkCongestion === 'medium' ? "bg-yellow-900/20" :
                  "bg-red-900/20",
                  "[&>div]:bg-green-500", // Default indicator color
                  networkCongestion === 'medium' && "[&>div]:bg-yellow-500",
                  networkCongestion === 'high' && "[&>div]:bg-red-500"
                )}
              />
            </div>
            
            <div className="pt-2">
              <p className="text-sm text-gray-400">
                Level {level} - {MAX_TX_PER_LEVEL[level] - userTxs.length} transactions remaining
              </p>
              <Progress 
                value={(userTxs.length / MAX_TX_PER_LEVEL[level]) * 100} 
                className="h-2 mt-1 bg-blue-900/20"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Main Game Panel */}
        <Card className="bg-gray-900/80 border-gray-800 md:col-span-2">
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Submit Transaction</CardTitle>
                <CardDescription>Set your gas fees carefully</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setHintVisible(!hintVisible)}>
                {hintVisible ? 'Hide' : 'Show'} Hint
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {hintVisible && (
              <div className="bg-blue-950/30 border border-blue-800 rounded-md p-3 text-sm text-blue-300">
                <p className="flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    Set your max fee above the current base fee and your priority fee high enough to incentivize miners. 
                    Remember, you only pay the actual base fee plus priority fee, up to your max fee limit.
                  </span>
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-gray-400">
                    Max Fee (gwei)
                  </label>
                  <span className="text-sm text-blue-400">
                    Current Base Fee: {currentBaseFee} gwei
                  </span>
                </div>
                <div className="flex gap-2">
                  <Slider
                    value={[userMaxFeePerGas]}
                    max={100}
                    min={1}
                    step={0.1}
                    onValueChange={(value) => setUserMaxFeePerGas(value[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={userMaxFeePerGas}
                    onChange={(e) => setUserMaxFeePerGas(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-gray-800"
                  />
                </div>
                {userMaxFeePerGas < currentBaseFee && (
                  <p className="text-xs text-red-400 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Max fee is below current base fee
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Max Priority Fee (gwei)
                </label>
                <div className="flex gap-2">
                  <Slider
                    value={[userMaxPriorityFee]}
                    max={10}
                    min={0.1}
                    step={0.1}
                    onValueChange={(value) => setUserMaxPriorityFee(value[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={userMaxPriorityFee}
                    onChange={(e) => setUserMaxPriorityFee(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-gray-800"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  className="w-full" 
                  onClick={submitTransaction}
                  disabled={userTxs.length >= MAX_TX_PER_LEVEL[level]}
                >
                  Submit Transaction
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium text-gray-300">Fee Summary</h3>
              <div className="bg-gray-800 rounded-md p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Fee</span>
                  <span>{currentBaseFee} gwei</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Priority Fee</span>
                  <span>{userMaxPriorityFee} gwei</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Effective Max Fee</span>
                  <span>{userMaxFeePerGas} gwei</span>
                </div>
                <div className="border-t border-gray-700 my-1 pt-1 flex justify-between font-medium">
                  <span>Max Cost (21k gas)</span>
                  <span>{((userMaxFeePerGas * 21000) / 1e9).toFixed(6)} ETH</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Mempool Panel */}
        <Card className="bg-gray-900/80 border-gray-800 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Mempool Status</CardTitle>
            <CardDescription>Pending transactions awaiting confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mempool.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No transactions in mempool
                </div>
              ) : (
                <div className="grid gap-2">
                  {mempool.slice(0, 5).map((tx) => (
                    <div 
                      key={tx.id} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md",
                        tx.sender.startsWith('0xuser') 
                          ? "bg-blue-950/30 border border-blue-800"
                          : "bg-gray-800/50 border border-gray-700",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 truncate w-28">
                          {tx.sender.slice(0, 8)}...{tx.sender.slice(-6)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {(tx.size / 1000).toFixed(0)}k gas
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-medium">
                            Max Fee: <span className="text-blue-400">{tx.maxFeePerGas}</span>
                          </div>
                          <div className="text-xs">
                            Priority: <span className="text-green-400">{tx.maxPriorityFee}</span>
                          </div>
                        </div>
                        
                        {tx.maxFeePerGas >= currentBaseFee ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {mempool.length > 5 && (
                    <div className="text-center text-sm text-gray-500 pt-1">
                      + {mempool.length - 5} more transactions
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Transaction History */}
        <Card className="bg-gray-900/80 border-gray-800 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Your Transaction History</CardTitle>
            <CardDescription>See how your transactions have performed</CardDescription>
          </CardHeader>
          <CardContent>
            {userTxs.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No transactions submitted yet
              </div>
            ) : (
              <div className="space-y-3">
                {userTxs.map((tx) => (
                  <div 
                    key={tx.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md border",
                      tx.status === 'pending' ? "bg-yellow-950/20 border-yellow-800" :
                      tx.status === 'included' ? "bg-green-950/20 border-green-800" :
                      "bg-red-950/20 border-red-800"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={cn(
                            tx.status === 'pending' ? "bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/50" :
                            tx.status === 'included' ? "bg-green-900/50 text-green-400 hover:bg-green-900/50" :
                            "bg-red-900/50 text-red-400 hover:bg-red-900/50"
                          )}
                        >
                          {tx.status === 'pending' ? 'Pending' :
                          tx.status === 'included' ? 'Confirmed' : 
                          'Failed'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {tx.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        Gas settings: <span className="text-blue-400">{tx.maxFeePerGas}</span> max, <span className="text-green-400">{tx.maxPriorityFee}</span> priority
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {tx.status === 'included' && (
                        <div className="text-sm text-green-400">
                          <DollarSign className="w-4 h-4 inline-block" /> Paid: {((tx.size * (currentBaseFee + Math.min(tx.maxPriorityFee, Math.max(0, tx.maxFeePerGas - currentBaseFee)))) / 1e9).toFixed(6)} ETH
                        </div>
                      )}
                      
                      {tx.status === 'rejected' && (
                        <div className="text-sm text-red-400">
                          Failed to include in block
                        </div>
                      )}
                      
                      {tx.status === 'pending' && (
                        <div className="text-sm text-yellow-400 flex items-center">
                          <Timer className="w-4 h-4 mr-1" /> Waiting for next block
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  return (
    <div className="relative min-h-[600px]">
      {renderTutorial()}
      {renderGameContent()}
    </div>
  );
}