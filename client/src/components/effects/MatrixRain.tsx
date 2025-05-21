import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  opacity?: number;  // Controls the opacity of the effect (0-1)
  speed?: number;    // Controls the speed of the falling characters
  density?: number;  // Controls the density of columns
  zIndex?: number;   // Controls the z-index of the canvas
}

export function MatrixRain({
  opacity = 0.3,  // Subtle opacity
  speed = 1,
  density = 1.0,  // Very light density
  zIndex = -10    // Far behind content
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Force canvas to be above everything
    canvas.style.zIndex = zIndex.toString();
    
    // Set canvas dimensions to match viewport
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Characters for the matrix rain
    const chars = '01PVX私ドラゴンビットコイン仮想通貨マイニング暗号化技術サトシ';
    
    // Calculate number of columns based on density
    const fontSize = 16; // Larger font for better visibility
    const columns = Math.floor(canvas.width / fontSize * density);
    
    // Arrays to track positions, speeds, and brightness
    const drops: number[] = [];
    const speeds: number[] = [];
    const brightness: number[] = [];
    const chars2Use: string[] = [];
    
    // Initialize arrays - spread drops more evenly across the screen
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * canvas.height / fontSize; // Distribute across screen
      speeds[i] = (Math.random() * 0.4 + 0.6) * speed; // Slightly more consistent speeds
      brightness[i] = Math.random() * 0.2 + 0.8; // Higher baseline brightness
      chars2Use[i] = chars[Math.floor(Math.random() * chars.length)];
    }

    // Draw function for animation
    const draw = () => {
      // Normal fade rate for better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < columns; i++) {
        // Update character occasionally
        if (Math.random() > 0.92) {
          chars2Use[i] = chars[Math.floor(Math.random() * chars.length)];
        }
        
        // Calculate position
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Very subtle matrix effects
        if (Math.random() > 0.98) { // Very rare bright characters
          ctx.shadowColor = 'rgba(0, 255, 100, 0.3)';
          ctx.shadowBlur = 2;
          ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
          ctx.font = `${fontSize}px monospace`;
        } else if (drops[i] % 20 < 1) { // Minimal leading characters
          ctx.shadowColor = 'rgba(50, 255, 150, 0.2)';
          ctx.shadowBlur = 1;
          ctx.fillStyle = 'rgba(0, 200, 0, 0.3)';
          ctx.font = `${fontSize}px monospace`;
        } else { // Normal characters extremely dim
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(0, 128, 0, 0.3)`;
          ctx.font = `${fontSize}px monospace`;
        }
        
        // Draw the character with exceptional brightness
        ctx.fillText(chars2Use[i], x, y);
        
        // TRIPLE-draw important characters for ULTRA-EXTREME visibility
        if (Math.random() > 0.85) {
          ctx.fillText(chars2Use[i], x, y); // Draw 2nd time
          ctx.fillText(chars2Use[i], x, y); // Draw 3rd time for emphasis
        }
        
        // Update position
        drops[i] += speeds[i];
        
        // Reset when reaching bottom
        if (y > canvas.height) {
          drops[i] = 0;
          speeds[i] = (Math.random() * 0.4 + 0.6) * speed;
          brightness[i] = Math.random() * 0.2 + 0.8;
        }
      }
    };

    // Animation loop with faster refresh rate
    const interval = setInterval(draw, 33); // 30fps for smoother animation
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [opacity, speed, density, zIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-screen pointer-events-none"
      style={{ 
        zIndex: zIndex, // Behind content
        mixBlendMode: 'overlay', // As specified in the guidelines
        opacity: opacity, // Use the passed opacity
        position: 'fixed', // Fixed position to be visible everywhere
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none' // Ensure clicks pass through
      }}
    />
  );
}