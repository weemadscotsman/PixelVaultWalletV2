import React, { useEffect, useRef } from 'react';

interface UnifiedMatrixRainProps {
  opacity?: number;
  speed?: number;
  density?: number;
  zIndex?: number;
}

export function UnifiedMatrixRain({
  opacity = 0.6, 
  speed = 0.7,
  density = 1.8,
  zIndex = -10
}: UnifiedMatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match viewport and handle resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Matrix characters
    const chars = "01ΦΨΣΩμλ私ドラゴンビットコイン仮想通貨マイニング暗号化技術サトシナカモト分散型台帳スマートコントラクトノード秘密鍵公開鍵";
    
    // Setup matrix columns with improved density
    const columns = Math.floor(canvas.width / 12 * density);
    const drops: number[] = [];
    
    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -100); // Start above canvas
    }

    // Draw function
    const draw = () => {
      // Semi-transparent black background for fade effect
      ctx.fillStyle = `rgba(0, 0, 0, ${0.025 * speed})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Matrix character drawing loop
      for (let i = 0; i < drops.length; i++) {
        // Random character from our set
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Position
        const x = i * 12;
        const y = drops[i] * 14;
        
        // Text styling based on position for visual appeal
        if (Math.random() > 0.7) {
          // Create glowing characters for some (30%)
          ctx.shadowColor = "rgba(0, 255, 70, 0.8)";
          ctx.shadowBlur = 10;
          ctx.fillStyle = `rgba(0, 255, 70, ${opacity + 0.3})`;
        } else if (y > 0 && drops[i] < 5) {
          // Brighter characters at the top of streams
          ctx.fillStyle = `rgba(180, 255, 180, ${opacity + 0.2})`;
          ctx.shadowBlur = 0;
        } else {
          // Standard matrix green for most characters
          ctx.fillStyle = `rgba(0, 255, 70, ${opacity})`;
          ctx.shadowBlur = 0;
        }
        
        // Draw the character
        ctx.font = "14px monospace";
        ctx.fillText(text, x, y);
        
        // Reset when reaching bottom or randomly for varied column lengths
        if (y > canvas.height || Math.random() > 0.99) {
          drops[i] = 0;
        }
        
        // Move drop down based on speed
        drops[i] += 1 + (Math.random() * speed);
      }
    };
    
    // Animation loop with better frame timing
    const interval = setInterval(draw, 40);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [opacity, speed, density]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex,
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        mixBlendMode: 'screen'
      }}
    />
  );
}