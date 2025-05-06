import React, { useState, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GameCanvas } from './GameCanvas';
import { createGame, GameType, GameResult } from '@/lib/game-engine';
import { Cpu, Award, Hash, Clock, BarChart2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function HashlordGame() {
  const [difficulty, setDifficulty] = useState(2);
  const [nonceValue, setNonceValue] = useState('');
  const [gameActive, setGameActive] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const { toast } = useToast();
  
  // Create a new game instance
  const game = useCallback(() => createGame(GameType.HASHLORD, difficulty), [difficulty]);
  
  // Start a new game
  const startGame = () => {
    setGameResult(null);
    setGameActive(true);
  };
  
  // Reset the game
  const resetGame = () => {
    setGameActive(false);
    setNonceValue('');
    setGameResult(null);
  };
  
  // Handle nonce submission
  const submitNonce = () => {
    const nonce = parseInt(nonceValue);
    if (isNaN(nonce)) {
      toast({
        title: "Invalid Nonce",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }
    
    // Send the nonce to the game
    const currentGame = game();
    currentGame.handleInput(nonce);
    
    // Check if the game is completed after input
    if (currentGame.isCompleted()) {
      const result = currentGame.getResult();
      setGameResult(result);
      
      if (result.success) {
        toast({
          title: "Block Mined Successfully!",
          description: `You earned ${result.reward} μPVX for finding nonce ${nonce}`,
        });
      } else {
        toast({
          title: "Mining Failed",
          description: "This nonce did not produce a valid hash. Try again!",
          variant: "destructive",
        });
      }
    }
  };
  
  // Handle game completion
  const handleGameCompleted = (result: GameResult) => {
    setGameResult(result);
  };
  
  return (
    <Card className="border-gray-800 bg-background/70 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-800 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-shadow-neon flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              <span>HASHLORD</span>
            </CardTitle>
            <CardDescription>POW Mining Simulation · Learn how blockchain mining works</CardDescription>
          </div>
          
          {!gameActive && (
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="difficulty" className="text-xs text-muted-foreground">Difficulty</Label>
                <select
                  id="difficulty"
                  className="bg-background border border-gray-800 rounded-md px-2 py-1 text-sm"
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value))}
                >
                  <option value="1">Easy (1)</option>
                  <option value="2">Medium (2)</option>
                  <option value="3">Hard (3)</option>
                  <option value="4">Expert (4)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {!gameActive && !gameResult && (
          <div className="text-center py-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white mb-2">Learn How Mining Works</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Find the correct nonce value to produce a hash that meets the target difficulty.
                Understand how Proof-of-Work secures blockchains.
              </p>
            </div>
            
            <Button 
              onClick={startGame}
              className="bg-primary/80 hover:bg-primary border border-primary/30 text-white gap-2"
            >
              <Cpu className="h-4 w-4" />
              <span>Start Mining Simulation</span>
            </Button>
          </div>
        )}
        
        {gameActive && !gameResult && (
          <div className="space-y-4">
            <div className="h-[400px]">
              <GameCanvas game={game()} onGameCompleted={handleGameCompleted} />
            </div>
            
            <div className="flex items-center space-x-3">
              <Label htmlFor="nonce" className="text-primary-light font-mono text-xs">{">>"} NONCE</Label>
              <Input
                id="nonce"
                type="number"
                placeholder="Enter a nonce value to try..."
                value={nonceValue}
                onChange={(e) => setNonceValue(e.target.value)}
                className="bg-background/60 border-gray-700 font-mono"
              />
              <Button 
                onClick={submitNonce}
                className="bg-primary/80 hover:bg-primary border border-primary/30 text-white text-shadow-neon"
              >
                Mine
              </Button>
            </div>
          </div>
        )}
        
        {gameResult && (
          <div className="py-4 space-y-6">
            <Alert className={gameResult.success ? "border-green-500/30 bg-green-950/20" : "border-red-500/30 bg-red-950/20"}>
              <div className="flex items-start gap-3">
                {gameResult.success ? (
                  <Award className="h-5 w-5 text-green-400 mt-0.5" />
                ) : (
                  <Zap className="h-5 w-5 text-red-400 mt-0.5" />
                )}
                <div>
                  <AlertTitle className={gameResult.success ? "text-green-400" : "text-red-400"}>
                    {gameResult.success ? "Block Successfully Mined!" : "Mining Failed"}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {gameResult.message}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
            
            {gameResult.success && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/60 p-3 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-primary/70" />
                    <span className="text-xs text-muted-foreground">Score</span>
                  </div>
                  <div className="text-xl font-semibold text-white">{gameResult.stats.score}</div>
                </div>
                
                <div className="bg-background/60 p-3 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary/70" />
                    <span className="text-xs text-muted-foreground">Reward</span>
                  </div>
                  <div className="text-xl font-semibold text-white">{gameResult.reward} μPVX</div>
                </div>
                
                <div className="bg-background/60 p-3 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary/70" />
                    <span className="text-xs text-muted-foreground">Attempts</span>
                  </div>
                  <div className="text-xl font-semibold text-white">{gameResult.stats.attempts}</div>
                </div>
                
                <div className="bg-background/60 p-3 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary/70" />
                    <span className="text-xs text-muted-foreground">Time</span>
                  </div>
                  <div className="text-xl font-semibold text-white">{gameResult.stats.completionTime.toFixed(1)}s</div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-800">
              <div className="text-xs text-muted-foreground">
                <span>Difficulty: {difficulty}</span>
              </div>
              
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  className="border-gray-700 hover:bg-background/80"
                  onClick={resetGame}
                >
                  Reset
                </Button>
                <Button 
                  className="bg-primary/80 hover:bg-primary border border-primary/30 text-white"
                  onClick={() => {
                    setDifficulty(prev => Math.min(prev + 1, 5));
                    resetGame();
                    startGame();
                  }}
                >
                  Next Level
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t border-gray-800 pt-4 text-xs text-muted-foreground">
        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <span>Learning Progress:</span>
            <span>33%</span>
          </div>
          <Progress value={33} className="h-1" />
          
          <p className="mt-2 italic">
            Each solved mining challenge teaches you how Proof-of-Work secures the blockchain.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}