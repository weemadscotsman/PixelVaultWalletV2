import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  opacity?: number;  // Controls the opacity of the effect (0-1)
  speed?: number;    // Controls the speed of the falling characters
  density?: number;  // Controls the density of columns
  zIndex?: number;   // Controls the z-index of the canvas
}

export function MatrixRain({
  opacity = 0.95,  // MAXIMUM opacity
  speed = 1,
  density = 2.0,  // High density
  zIndex = 0      // At same level as content
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
      // Very light fade rate for extreme character persistence
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < columns; i++) {
        // Update character occasionally
        if (Math.random() > 0.92) {
          chars2Use[i] = chars[Math.floor(Math.random() * chars.length)];
        }
        
        // Calculate position
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // SUPER BOLD MATRIX EFFECTS
        if (Math.random() > 0.85) { // Many bright characters
          ctx.shadowColor = 'rgba(0, 255, 70, 1.0)';
          ctx.shadowBlur = 15;
          ctx.fillStyle = 'rgba(180, 255, 180, 1.0)'; // Full brightness
          ctx.font = `bold ${fontSize + 2}px monospace`; // Bold and larger
        } else if (drops[i] % 3 === 0) { // Many leading characters
          ctx.shadowColor = 'rgba(0, 255, 70, 0.9)';
          ctx.shadowBlur = 10;
          ctx.fillStyle = 'rgba(100, 255, 100, 0.9)';
          ctx.font = `bold ${fontSize + 1}px monospace`;
        } else { // Normal characters very visible
          ctx.shadowColor = 'rgba(0, 200, 0, 0.7)';
          ctx.shadowBlur = 5;
          ctx.fillStyle = `rgba(0, 255, 0, 0.8)`;
          ctx.font = `bold ${fontSize}px monospace`; // Bold everything
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