import React, { useRef, useEffect } from 'react';

interface GameCanvasProps {
  hashHistory: string[];
  mining: boolean;
  nonce: number;
  difficultyLevel: number;
  miningProgress: number;
  hashRate: number;
}

export function GameCanvas({ 
  hashHistory, 
  mining, 
  nonce, 
  difficultyLevel, 
  miningProgress,
  hashRate
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  
  // Particle system for hash visualization
  const particles = useRef<{
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    size: number;
    color: string;
    char: string;
    opacity: number;
    life: number;
  }[]>([]);
  
  // Initialize particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size and DPI
    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Apply DPI scaling
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);
  
  // Create particles from hash history
  useEffect(() => {
    if (hashHistory.length === 0 || !mining) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const latestHash = hashHistory[hashHistory.length - 1] || '';
    
    // Create new particles based on the latest hash
    for (let i = 0; i < 5; i++) {
      const charIndex = Math.floor(Math.random() * latestHash.length);
      const char = latestHash[charIndex] || '0';
      
      // Calculate positions in actual canvas coordinates
      const x = Math.random() * canvas.width / window.devicePixelRatio;
      const y = Math.random() * 30 + 10;
      
      // Random speed
      const speedX = (Math.random() - 0.5) * 0.5;
      const speedY = Math.random() * 2 + 1;
      
      // Color based on character value
      const hexVal = parseInt(char, 16);
      const colorHue = (hexVal * 25) % 360;
      
      // Size based on difficulty
      const size = 10 + difficultyLevel * 2;
      
      particles.current.push({
        x,
        y,
        speedX,
        speedY,
        size,
        color: `hsl(${colorHue}, 80%, 60%)`,
        char,
        opacity: 1,
        life: 100,
      });
    }
    
    // Limit particles to avoid performance issues
    if (particles.current.length > 100) {
      particles.current = particles.current.slice(-100);
    }
  }, [hashHistory, mining, difficultyLevel]);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      // Clear canvas with semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      
      // Mining rate indicator
      if (mining) {
        const rectHeight = 3;
        const rectWidth = 30;
        const x = (canvas.width / window.devicePixelRatio) - 50;
        const y = 20;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, rectWidth, rectHeight);
        
        // Pulse effect based on hash rate
        const pulseWidth = Math.min(rectWidth, (hashRate / 50) * rectWidth);
        ctx.fillStyle = difficultyLevel < 3 ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)';
        ctx.fillRect(x, y, pulseWidth, rectHeight);
      }
      
      // Draw mining progress bar
      if (mining && miningProgress > 0) {
        const barWidth = (canvas.width / window.devicePixelRatio) - 60;
        const barHeight = 6;
        const x = 30;
        const y = (canvas.height / window.devicePixelRatio) - 30;
        
        // Background
        ctx.fillStyle = 'rgba(30, 64, 100, 0.3)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress
        const progress = (miningProgress / 100) * barWidth;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.fillRect(x, y, progress, barHeight);
        
        // Difficulty indicator markers
        for (let i = 1; i <= 4; i++) {
          const markerX = x + (barWidth * (i * 25)) / 100;
          ctx.fillStyle = i <= difficultyLevel ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(markerX - 1, y - 3, 2, barHeight + 6);
        }
      }
      
      // Update and draw particles
      ctx.font = '700 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      particles.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Update life
        particle.life -= 1;
        particle.opacity = particle.life / 100;
        
        // Draw particle
        ctx.fillStyle = particle.color.replace(')', `, ${particle.opacity})`);
        ctx.fillText(particle.char, particle.x, particle.y);
        
        // Draw halo effect for valid hash characters
        if (index % 5 === 0) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = particle.color.replace(')', `, ${particle.opacity * 0.2})`);
          ctx.fill();
        }
        
        // Remove dead particles
        if (particle.life <= 0 || particle.y > canvas.height / window.devicePixelRatio) {
          particles.current.splice(index, 1);
        }
      });
      
      // Draw nonce indicator
      if (mining) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`NONCE: ${nonce}`, (canvas.width / window.devicePixelRatio) - 10, (canvas.height / window.devicePixelRatio) - 10);
      }
      
      animFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [mining, nonce, difficultyLevel, miningProgress, hashRate]);
  
  return (
    <div className="relative w-full h-56 overflow-hidden bg-black/30 rounded-md">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}