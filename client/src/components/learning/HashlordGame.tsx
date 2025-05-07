import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Server, 
  CpuIcon, 
  Check, 
  Clock, 
  HardDrive,
  Award,
  RefreshCw,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sha256 as hashFunction } from 'js-sha256';
import { GameCanvas } from './GameCanvas';
import { LearningTerminal } from './LearningTerminal';

interface HashlordGameProps {
  onComplete?: (score: number, difficulty: number) => void;
  walletAddress?: string;
}

type GameState = 'intro' | 'mining' | 'success' | 'complete';

export function HashlordGame({ onComplete, walletAddress }: HashlordGameProps) {
  // Alpine.js-like state
  const terminalData = useRef({
    command: '',
    history: [] as string[],
    output: '',
    isProcessing: false,
    isMining: false,
    miningStatus: '',
    onExecuteCommand: (cmd: string) => handleTerminalCommand(cmd)
  });
  
  const [gameState, setGameState] = useState<GameState>('intro');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [nonce, setNonce] = useState<number>(0);
  const [target, setTarget] = useState<string>('');
  const [blockData, setBlockData] = useState({
    height: 3421869,
    prevHash: '0x7f0cb934ee2b4851a7d0c10984c4adf61ae7b1bce911b4fa864e9a658d4c797a',
    transactions: 42,
    timestamp: Math.floor(Date.now() / 1000)
  });
  const [hash, setHash] = useState<string>('');
  const [hashRate, setHashRate] = useState<number>(0);
  const [mining, setMining] = useState<boolean>(false);
  const [miningProgress, setMiningProgress] = useState<number>(0);
  const [hashesComputed, setHashesComputed] = useState<number>(0);
  const [successNonce, setSuccessNonce] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(60);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [hashHistory, setHashHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('visual');
  
  // Calculate target hash (leading zeros based on difficulty)
  useEffect(() => {
    // For difficulty 2, target would be "00" at the start of hash
    const zeros = '0'.repeat(difficulty);
    setTarget(zeros);
  }, [difficulty]);
  
  // Format a hash for display (add 0x prefix and ellipsis)
  const formatHash = (hash: string): string => {
    if (!hash) return '';
    return `0x${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };
  
  // Compute hash with current blockData and nonce
  const computeHash = useCallback(() => {
    const data = JSON.stringify({
      ...blockData,
      nonce
    });
    return hashFunction(data);
  }, [blockData, nonce]);
  
  // Check if hash meets the target (starts with N zeros)
  const isValidHash = useCallback((hash: string): boolean => {
    return hash.startsWith(target);
  }, [target]);
  
  // Handle terminal commands
  const handleTerminalCommand = useCallback((cmd: string) => {
    // Add command to history
    terminalData.current.history = [...terminalData.current.history, cmd];
    terminalData.current.isProcessing = true;
    
    // Process command
    setTimeout(() => {
      let output = '';
      
      if (cmd === 'help') {
        output = 
`Available commands:
  help              - Show this help message
  mine <difficulty> - Start mining with specified difficulty (1-4)
  info              - Show current block information
  status            - Show mining status
  clear             - Clear terminal output
  reward            - Claim mining rewards (if successful)`;
      }
      else if (cmd === 'clear') {
        terminalData.current.history = [];
        output = 'Terminal cleared.';
      }
      else if (cmd.startsWith('mine')) {
        const parts = cmd.split(' ');
        let diff = 2;
        
        if (parts.length > 1) {
          const requestedDiff = parseInt(parts[1]);
          if (!isNaN(requestedDiff) && requestedDiff >= 1 && requestedDiff <= 4) {
            diff = requestedDiff;
          } else {
            output = 'Invalid difficulty. Please use a number between 1-4.';
            terminalData.current.isProcessing = false;
            terminalData.current.output = output;
            return;
          }
        }
        
        output = `Starting mining operation with difficulty ${diff}...
Target: ${diff} leading zeros (0x${'0'.repeat(diff)}...)
`;
        
        // Start mining through the UI
        setDifficulty(diff);
        startGame();
        
        // Set mining status in terminal
        terminalData.current.isMining = true;
        terminalData.current.miningStatus = 'Calculating hash...';
      }
      else if (cmd === 'info') {
        output = 
`Block Information:
  Height:      ${blockData.height}
  Previous:    ${blockData.prevHash}
  Transactions: ${blockData.transactions}
  Timestamp:   ${blockData.timestamp}
  Target:      0x${target}...`;
      }
      else if (cmd === 'status') {
        if (mining) {
          output = 
`Mining Status: ACTIVE
  Current nonce:   ${nonce}
  Hash rate:       ${hashRate.toLocaleString()} H/s
  Hashes computed: ${hashesComputed.toLocaleString()}
  Progress:        ${Math.round(miningProgress)}%
  Time remaining:  ${remainingTime}s`;
        } else if (gameState === 'success') {
          output = 
`Mining Status: SUCCESS
  Block mined successfully!
  Winning nonce:   ${successNonce}
  Hash found:      0x${hash}
  Score:           ${score}
  
Type 'reward' to claim your rewards.`;
        } else {
          output = 'Mining Status: INACTIVE';
        }
      }
      else if (cmd === 'reward' && gameState === 'success') {
        output = `Mining rewards claimed: ${score * 100} μPVX credited to ${walletAddress || 'your wallet'}`;
        completeGame();
      }
      else if (cmd === 'reward' && gameState !== 'success') {
        output = 'No mining rewards available. Complete mining operation first.';
      }
      else {
        output = `Unknown command: ${cmd}. Type 'help' for available commands.`;
      }
      
      terminalData.current.output = output;
      terminalData.current.isProcessing = false;
    }, 500);
  }, [blockData, target, nonce, mining, hashRate, hashesComputed, miningProgress, remainingTime, gameState, successNonce, hash, score, walletAddress]);
  
  // Update terminal state when mining status changes
  useEffect(() => {
    if (mining) {
      terminalData.current.isMining = true;
      terminalData.current.miningStatus = `Searching for nonce... (Current: ${nonce}, Hashes: ${hashesComputed.toLocaleString()})`;
    } else {
      terminalData.current.isMining = false;
    }
  }, [mining, nonce, hashesComputed]);
  
  // Mining logic
  const mine = useCallback(() => {
    if (!mining) return;
    
    // Batch process multiple hashes for performance
    const batchSize = 10;
    const startBatchTime = performance.now();
    
    for (let i = 0; i < batchSize; i++) {
      const currentNonce = nonce + i;
      const data = JSON.stringify({
        ...blockData,
        nonce: currentNonce
      });
      
      const newHash = hashFunction(data);
      setHashesComputed(prev => prev + 1);
      
      // Found a valid hash
      if (newHash.startsWith(target)) {
        setMining(false);
        setHash(newHash);
        setSuccessNonce(currentNonce);
        setNonce(currentNonce);
        
        // Calculate score based on difficulty and time
        const endTime = Date.now();
        const timeElapsed = startTime ? (endTime - startTime) / 1000 : 60;
        const timeBonus = Math.max(0, 60 - timeElapsed);
        const difficultyMultiplier = Math.pow(2, difficulty);
        const calculatedScore = Math.round((difficultyMultiplier * 10) + timeBonus);
        
        setScore(calculatedScore);
        setGameState('success');
        
        // Update terminal
        terminalData.current.output = 
`BLOCK MINED SUCCESSFULLY!
  Hash found: 0x${newHash}
  Nonce: ${currentNonce}
  Difficulty: ${difficulty}
  Score: ${calculatedScore}
  
Type 'reward' to claim your rewards.`;
        
        return;
      }
      
      // Add to hash history (but keep it limited)
      if (i % 5 === 0) {
        setHashHistory(prev => {
          const newHistory = [...prev, newHash];
          if (newHistory.length > 5) {
            return newHistory.slice(newHistory.length - 5);
          }
          return newHistory;
        });
      }
      
      // Update hash display
      if (i === batchSize - 1) {
        setHash(newHash);
        setNonce(currentNonce + 1);
      }
    }
    
    // Calculate hash rate
    const endBatchTime = performance.now();
    const batchTimeSeconds = (endBatchTime - startBatchTime) / 1000;
    const currentHashRate = batchSize / batchTimeSeconds;
    
    setHashRate(prevRate => {
      // Smooth the hash rate with a moving average
      const newRate = (prevRate * 0.7) + (currentHashRate * 0.3);
      return Math.round(newRate);
    });
    
    // Update progress based on probability
    const probabilityOfSuccess = 1 / Math.pow(16, difficulty);
    const expectedHashes = 1 / probabilityOfSuccess;
    const progress = Math.min(100, (hashesComputed / expectedHashes) * 100);
    setMiningProgress(progress);
    
    // Continue mining
    setTimeout(() => mine(), 0);
  }, [mining, nonce, blockData, target, hashesComputed, startTime, difficulty]);
  
  // Handle time countdown
  useEffect(() => {
    if (mining && remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (remainingTime === 0 && mining) {
      setMining(false);
      terminalData.current.output = 'Mining operation timed out. No valid hash found.';
      // Game over - ran out of time
    }
  }, [mining, remainingTime]);
  
  // Start mining effect
  useEffect(() => {
    if (mining) {
      mine();
    }
  }, [mining, mine]);
  
  // Start the game
  const startGame = () => {
    setGameState('mining');
    setMining(true);
    setStartTime(Date.now());
    setNonce(0);
    setHashesComputed(0);
    setMiningProgress(0);
    setHashHistory([]);
    setRemainingTime(60);
  };
  
  // Complete the game and report score
  const completeGame = () => {
    setGameState('complete');
    
    if (onComplete) {
      onComplete(score, difficulty);
    }
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto" x-data="hashlordGame">
      {/* Intro Screen */}
      {gameState === 'intro' && (
        <Card className="bg-black/90 border-blue-900/50 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-950/10 z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <CpuIcon className="h-16 w-16 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-center text-blue-300 mb-4">HASHLORD</h2>
            <p className="text-gray-300 mb-6 text-center">
              Learn the basics of mining and hash algorithms by competing to find a valid block hash.
            </p>
            
            <div className="space-y-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">How Mining Works</h3>
                <p className="text-sm text-gray-400">
                  Miners compete to find a special number (nonce) that, when combined with block data,
                  produces a hash that starts with a specific number of zeros. The more zeros required,
                  the harder it is to find a valid hash.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Your Challenge</h3>
                <p className="text-sm text-gray-400">
                  Find a valid hash by adjusting the nonce value before time runs out.
                  Higher difficulty levels earn more μPVX rewards!
                </p>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-md border border-blue-900/50">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Set Difficulty</h3>
                <div className="flex items-center mb-2">
                  <span className="text-gray-300 mr-4">Difficulty: {difficulty}</span>
                  <span className="text-xs text-gray-500">(Number of leading zeros)</span>
                </div>
                <Slider
                  value={[difficulty]}
                  min={1}
                  max={4}
                  step={1}
                  onValueChange={(value) => setDifficulty(value[0])}
                  className="my-4"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Easy</span>
                  <span>Medium</span>
                  <span>Hard</span>
                  <span>Extreme</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-md font-bold flex items-center gap-2"
                onClick={startGame}
              >
                START MINING <Zap className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline"
                className="border-blue-900/50 text-blue-400 hover:bg-blue-900/20"
                onClick={() => setActiveTab('terminal')}
              >
                <Terminal className="w-4 h-4 mr-2" />
                OPEN TERMINAL
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Mining Screen */}
      {gameState === 'mining' && (
        <Card className="bg-black/90 border-blue-900/50 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-950/10 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CpuIcon className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-300">HASHLORD MINER</h3>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="h-5 w-5" />
                <span className="font-mono">{remainingTime}s</span>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-4 bg-black/50">
                <TabsTrigger value="visual" className="data-[state=active]:bg-blue-900/30">
                  Visual Mining
                </TabsTrigger>
                <TabsTrigger value="terminal" className="data-[state=active]:bg-blue-900/30">
                  Terminal Mode
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual">
                <div className="mb-4">
                  <GameCanvas 
                    hashHistory={hashHistory}
                    mining={mining}
                    nonce={nonce}
                    difficultyLevel={difficulty}
                    miningProgress={miningProgress}
                    hashRate={hashRate}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-900/50 p-4 rounded-md border border-blue-900/50">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Block Data</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Height:</span>
                        <span className="text-blue-300 font-mono">{blockData.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prev Hash:</span>
                        <span className="text-blue-300 font-mono text-xs truncate max-w-[150px]">
                          {blockData.prevHash.substring(0, 10)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transactions:</span>
                        <span className="text-blue-300 font-mono">{blockData.transactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Timestamp:</span>
                        <span className="text-blue-300 font-mono">{blockData.timestamp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Current Nonce:</span>
                        <span className="text-yellow-300 font-mono">{nonce}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-md border border-blue-900/50">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Mining Stats</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Target:</span>
                        <span className="text-green-300 font-mono">0x{target}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Current Hash:</span>
                        <span className="text-blue-300 font-mono text-xs truncate max-w-[150px]">
                          0x{hash.substring(0, 10)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hash Rate:</span>
                        <span className="text-blue-300 font-mono">{hashRate.toLocaleString()} H/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hashes Computed:</span>
                        <span className="text-blue-300 font-mono">{hashesComputed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Difficulty:</span>
                        <span className="text-yellow-300 font-mono">{difficulty}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Mining Progress</span>
                    <span>{Math.round(miningProgress)}%</span>
                  </div>
                  <Progress value={miningProgress} className="h-2" />
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="destructive"
                    onClick={() => setMining(false)}
                  >
                    STOP MINING
                  </Button>
                  
                  <div className="animate-pulse">
                    <Zap className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="terminal" className="min-h-[400px]">
                <LearningTerminal x={terminalData.current} />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      )}
      
      {/* Success Screen */}
      {gameState === 'success' && (
        <Card className="bg-black/90 border-green-900/50 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-green-950/10 z-0"></div>
          
          {/* Success particles */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-0"
            style={{ 
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
            }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Award className="h-16 w-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-center text-green-300 mb-4">BLOCK MINED!</h2>
            <p className="text-gray-300 mb-6 text-center">
              Congratulations! You successfully mined a block with difficulty {difficulty}.
            </p>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-4 bg-black/50">
                <TabsTrigger value="visual" className="data-[state=active]:bg-green-900/30">
                  Success Details
                </TabsTrigger>
                <TabsTrigger value="terminal" className="data-[state=active]:bg-green-900/30">
                  Terminal Mode
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual">
                <div className="bg-gray-900/50 p-4 rounded-md border border-green-900/50 mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Mining Results</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Winning Nonce:</span>
                      <span className="text-green-300 font-mono">{successNonce}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Hash Found:</span>
                      <div className="mt-1 p-2 bg-black/50 rounded font-mono text-green-300 text-xs break-all">
                        0x{hash}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hash Meets Target:</span>
                      <div className="flex items-center">
                        <span className="text-green-400 font-mono mr-2">0x{target}...</span>
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hashes Calculated:</span>
                      <span className="text-blue-300 font-mono">{hashesComputed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Your Score:</span>
                      <span className="text-yellow-300 font-mono text-lg">{score}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-md border border-green-900/50 mb-6">
                  <h4 className="text-sm font-medium text-green-400 mb-2">What You Learned</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                      <span>Mining involves finding a nonce value that produces a hash meeting specific criteria</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                      <span>Higher difficulty (more leading zeros) makes finding a valid hash exponentially harder</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                      <span>Mining is probabilistic - sometimes you get lucky, sometimes it takes longer</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDifficulty(prev => Math.min(4, prev + 1));
                      setGameState('intro');
                    }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </Button>
                  
                  <Button 
                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded-md font-bold flex items-center gap-2"
                    onClick={completeGame}
                  >
                    CLAIM REWARD <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="terminal" className="min-h-[400px]">
                <LearningTerminal x={terminalData.current} />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      )}
      
      {/* Complete Screen */}
      {gameState === 'complete' && (
        <Card className="bg-black/90 border-blue-900/50 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-950/10 z-0"></div>
          <div className="relative z-10 text-center">
            <HardDrive className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-300 mb-2">LEARNING COMPLETE</h2>
            <p className="text-gray-300 mb-8">
              Your mining rewards have been credited to your wallet.
            </p>
            
            <div className="bg-gray-900/50 p-4 rounded-md border border-blue-900/50 mb-8 inline-block mx-auto">
              <div className="flex items-center justify-center gap-3">
                <span className="text-blue-300">Score:</span>
                <span className="text-yellow-300 font-mono text-xl">{score}</span>
              </div>
            </div>
            
            {walletAddress && (
              <div className="text-gray-400 text-sm">
                <p>Rewards sent to:</p>
                <p className="font-mono mt-1">{walletAddress}</p>
              </div>
            )}
            
            <div className="mt-6">
              <p className="text-green-400 mb-2">Rewards earned:</p>
              <div className="text-2xl font-bold text-shadow-neon">
                {score * 100} μPVX
              </div>
            </div>
            
            <Button 
              className="mt-8 bg-blue-600 hover:bg-blue-500 text-white"
              onClick={() => {
                setDifficulty(1);
                setGameState('intro');
              }}
            >
              Start New Game
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}