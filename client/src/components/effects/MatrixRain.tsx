import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  opacity?: number;  // Controls the opacity of the effect (0-1)
  speed?: number;    // Controls the speed of the falling characters
  density?: number;  // Controls the density of columns
  zIndex?: number;   // Controls the z-index of the canvas
}

export function MatrixRain({
  opacity = 0.7,
  speed = 1,
  density = 1.5,
  zIndex = -10
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize * density);
    
    // Arrays to track positions, speeds, and brightness
    const drops: number[] = [];
    const speeds: number[] = [];
    const brightness: number[] = [];
    
    // Initialize arrays
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -100); // Start above viewport
      speeds[i] = (Math.random() * 0.5 + 0.5) * speed; // Vary speed
      brightness[i] = Math.random() * 0.4 + 0.6; // Vary brightness
    }

    // Draw function for animation
    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < columns; i++) {
        // Get random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Calculate position
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Vary character appearance
        if (Math.random() > 0.98) { // Occasionally create very bright characters
          ctx.fillStyle = `rgba(180, 255, 180, ${opacity})`;
          ctx.shadowColor = 'rgba(0, 255, 100, 0.8)';
          ctx.shadowBlur = 10;
        } else if (drops[i] < 5 && drops[i] > 0) { // Leading characters are brighter
          ctx.fillStyle = `rgba(100, 255, 100, ${opacity})`;
          ctx.shadowBlur = 0;
        } else { // Normal characters
          ctx.fillStyle = `rgba(0, 255, 70, ${opacity * brightness[i]})`;
          ctx.shadowBlur = 0;
        }
        
        // Draw the character
        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, x, y);
        
        // Update position
        drops[i] += speeds[i];
        
        // Reset when reaching bottom or randomly
        if (y > canvas.height || Math.random() > 0.995) {
          drops[i] = 0;
          speeds[i] = (Math.random() * 0.5 + 0.5) * speed;
          brightness[i] = Math.random() * 0.4 + 0.6;
        }
      }
    };

    // Animation loop
    const interval = setInterval(draw, 40);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [opacity, speed, density]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex,
        mixBlendMode: 'screen'
      }}
    />
  );
}