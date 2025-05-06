import { sha3_256 as sha256 } from "js-sha3";

// Game Types
export enum GameType {
  HASHLORD = "hashlord",
  GAS_ESCAPE = "gas_escape",
  STAKING_WARS = "staking_wars",
  PACKET_PANIC = "packet_panic",
  RUG_GAME = "rug_game"
}

// Game Result interface
export interface GameResult {
  success: boolean;
  message: string;
  reward: number;
  stats: {
    score: number;
    attempts: number;
    completionTime: number; // in seconds
    difficulty: number;
    [key: string]: any; // Additional game-specific stats
  };
}

// Base Learning Game Interface
export interface LearningGame {
  init(): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  isCompleted(): boolean;
  getResult(): GameResult;
  handleInput(input: any): void;
}

// Hashlord Game Implementation
class HashlordGame implements LearningGame {
  private completed: boolean = false;
  private startTime: number = 0;
  private attempts: number = 0;
  private targetPrefix: string = "";
  private currentHash: string = "";
  private lastInput: number | null = null;
  private result: GameResult | null = null;
  private particles: Array<any> = [];
  private difficulty: number;
  private targetDifficulty: number;
  
  constructor(difficulty: number = 2) {
    this.difficulty = difficulty;
    this.targetDifficulty = difficulty;
    this.targetPrefix = "0".repeat(difficulty);
  }
  
  init(): void {
    this.completed = false;
    this.startTime = performance.now();
    this.attempts = 0;
    this.currentHash = "";
    this.lastInput = null;
    this.result = null;
    
    // Generate some initial particles for visual effect
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * 600,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: `rgba(0, ${Math.floor(Math.random() * 155) + 100}, ${Math.floor(Math.random() * 155) + 100}, ${Math.random() * 0.5 + 0.5})`
      });
    }
  }
  
  update(deltaTime: number): void {
    // Update particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      
      // Bounce off edges
      if (p.x < 0 || p.x > 600) p.vx *= -1;
      if (p.y < 0 || p.y > 400) p.vy *= -1;
    }
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 600, 400);
    
    // Draw particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw hash information
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px monospace";
    ctx.fillText(`Difficulty: ${this.difficulty} (${this.targetPrefix})`, 20, 30);
    
    if (this.lastInput !== null) {
      ctx.fillText(`Nonce: ${this.lastInput}`, 20, 60);
      ctx.fillText(`Hash: ${this.currentHash}`, 20, 90);
      
      // Highlight the prefix to show if it meets the target
      if (this.currentHash) {
        ctx.fillStyle = this.currentHash.startsWith(this.targetPrefix) ? "#00ff00" : "#ff0000";
        ctx.fillText(this.currentHash.substring(0, this.difficulty), 20 + 46, 90);
      }
    }
    
    // Draw attempts counter
    ctx.fillStyle = "#999999";
    ctx.font = "14px monospace";
    ctx.fillText(`Attempts: ${this.attempts}`, 20, 380);
    
    // Display elapsed time
    const elapsedTime = (performance.now() - this.startTime) / 1000;
    ctx.fillText(`Time: ${elapsedTime.toFixed(1)}s`, 150, 380);
  }
  
  isCompleted(): boolean {
    return this.completed;
  }
  
  getResult(): GameResult {
    if (!this.result) {
      // This should not happen in normal operation, but providing a default
      return {
        success: false,
        message: "Game not completed yet",
        reward: 0,
        stats: {
          score: 0,
          attempts: this.attempts,
          completionTime: (performance.now() - this.startTime) / 1000,
          difficulty: this.difficulty
        }
      };
    }
    return this.result;
  }
  
  handleInput(nonce: number): void {
    this.lastInput = nonce;
    this.attempts++;
    
    // Generate hash
    this.currentHash = sha256(`PVX_Block_${this.attempts}_Nonce_${nonce}`);
    
    // Check if it meets the target difficulty
    if (this.currentHash.startsWith(this.targetPrefix)) {
      this.completed = true;
      
      const elapsedTime = (performance.now() - this.startTime) / 1000;
      const score = Math.round(1000 / (this.attempts * 0.5) * this.difficulty * (60 / Math.max(10, elapsedTime)));
      
      // Calculate reward based on difficulty and attempts
      const baseReward = 50 * this.difficulty;
      const attemptPenalty = Math.min(0.8, (this.attempts / 50) * 0.5);
      const reward = Math.round(baseReward * (1 - attemptPenalty));
      
      this.result = {
        success: true,
        message: `You found a valid nonce (${nonce}) that produces a hash starting with ${this.targetPrefix}. This is how miners secure the blockchain through computation!`,
        reward,
        stats: {
          score,
          attempts: this.attempts,
          completionTime: elapsedTime,
          difficulty: this.difficulty,
          hashRate: Math.round(this.attempts / elapsedTime),
        }
      };
    }
  }
}

// Factory function to create games
export function createGame(type: GameType, difficulty: number = 2): LearningGame {
  switch (type) {
    case GameType.HASHLORD:
      return new HashlordGame(difficulty);
    // Other game types will be implemented later
    default:
      return new HashlordGame(difficulty); // Default to HashlordGame for now
  }
}