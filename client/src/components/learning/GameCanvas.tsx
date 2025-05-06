import React, { useRef, useEffect, useState } from 'react';
import { LearningGame, GameType, GameResult } from '@/lib/game-engine';

interface GameCanvasProps {
  game: LearningGame;
  onGameCompleted?: (result: GameResult) => void;
  width?: number;
  height?: number;
}

export function GameCanvas({ game, onGameCompleted, width = 600, height = 400 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  
  // Game loop setup
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let lastTime = performance.now();
    
    // Initialize the game
    game.init();
    
    // Game loop
    const render = (time: number) => {
      if (!isRunning) return;
      
      const deltaTime = time - lastTime;
      lastTime = time;
      
      // Update game state
      game.update(deltaTime);
      
      // Render game
      game.render(ctx);
      
      // Check if game is completed
      if (game.isCompleted()) {
        setIsRunning(false);
        onGameCompleted?.(game.getResult());
      } else {
        // Continue the loop
        animationFrameId = requestAnimationFrame(render);
      }
    };
    
    // Start the game loop
    animationFrameId = requestAnimationFrame(render);
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [game, onGameCompleted, isRunning]);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-800 bg-black rounded-md"
      />
    </div>
  );
}