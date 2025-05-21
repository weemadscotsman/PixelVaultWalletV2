import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  opacity?: number;
  density?: number;
  speed?: number;
  zIndex?: number;
}

export function MatrixRain({
  opacity = 0.6,
  density = 1.5,
  speed = 1,
  zIndex = 0
}: MatrixRainProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Force-set critical styles directly to ensure they're always applied
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.opacity = opacity.toString();
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = zIndex.toString();

    // Matrix character set - mix of katakana, latin and binary
    const katakana = 'アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロヲン';
    const pvx = 'PVX0123456789';
    
    const alphabet = katakana + pvx;
    
    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize * density);
    
    // Initialize drops at various heights
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize) * -1;
    }

    // Drawing function
    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set main character style
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        // Pick a random character
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        
        // Leading characters are brighter
        if (drops[i] === 0 || Math.random() > 0.98) {
          ctx.fillStyle = '#FFFFFF'; // White for lead characters
          ctx.shadowColor = 'rgba(0, 255, 70, 0.8)';
          ctx.shadowBlur = 10;
        } else if (Math.random() > 0.9) {
          ctx.fillStyle = '#AAFFAA'; // Light green for some visibility
          ctx.shadowColor = 'rgba(0, 255, 70, 0.6)';
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = '#00FF41'; // Classic green for most characters
          ctx.shadowColor = 'rgba(0, 255, 70, 0.4)';
          ctx.shadowBlur = 3;
        }
        
        // Draw the character
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);
        
        // Random chance of resetting after reaching bottom
        if (y > canvas.height && Math.random() > 0.99) {
          drops[i] = 0;
        } else {
          // Move drop down with specified speed
          drops[i] += speed;
        }
      }
    };

    // Run animation at 30fps for smooth effect
    const interval = setInterval(draw, 33); 

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Recalculate columns and adjust drops array
      const newColumns = Math.ceil(canvas.width / fontSize);
      
      // Add new columns if window got wider
      while (drops.length < newColumns) {
        drops.push(0);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-rain-canvas"
      style={{
        opacity: opacity, // Keep opacity configurable
        zIndex: zIndex, // Keep zIndex configurable
      }}
    />
  );
}