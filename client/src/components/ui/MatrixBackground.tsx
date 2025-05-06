import { useEffect, useRef } from 'react';

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Matrix characters (binary plus some crypto symbols)
    const chars = "01ΦΨΣΩμλBTC ETH PVX";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track the y position of each column
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Random starting position above the canvas
    }
    
    // Drawing function
    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Green text with varying brightness
      for (let i = 0; i < drops.length; i++) {
        // Randomize brightness for more realistic effect
        const brightness = Math.random() * 50 + 50; // 50-100%
        ctx.fillStyle = `rgba(0, ${brightness + 100}, 0, 0.9)`;
        ctx.font = `${fontSize}px monospace`;
        
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Draw the character
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        // Move the drop down
        drops[i]++;
        
        // Reset when reaching the bottom or randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
    };
    
    // Set up animation with improved frame rate
    const interval = setInterval(draw, 35);
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reset drops array for new width
      const newColumns = Math.floor(canvas.width / fontSize);
      drops.length = 0;
      
      for (let i = 0; i < newColumns; i++) {
        drops[i] = Math.random() * -100;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 opacity-15" />;
}