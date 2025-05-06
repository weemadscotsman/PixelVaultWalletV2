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
    
    // Matrix characters (binary, crypto symbols, and Japanese-like characters)
    const chars = "01ΦΨΣΩμλBTC ETH PVX 私ドラゴンビットコイン仮想通貨マイニング暗号化技術サトシナカモト分散型台帳スマートコントラクトノード秘密鍵公開鍵ウォレット";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track the y position of each column
    const drops: number[] = [];
    // Array to track the character in each position
    const charIndices: number[] = [];
    // Array to track speeds of each column
    const speeds: number[] = [];
    
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Random starting position above the canvas
      charIndices[i] = Math.floor(Math.random() * chars.length);
      speeds[i] = 0.5 + Math.random() * 1.5; // Random speed between 0.5 and 2
    }
    
    // Drawing function
    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'; // Slightly more transparent for better trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < drops.length; i++) {
        // Determine if we should change the character (occasionally)
        if (Math.random() > 0.965) {
          charIndices[i] = Math.floor(Math.random() * chars.length);
        }
        
        // Get the character for this column
        const char = chars[charIndices[i]];
        
        // Special highlight for the first character in each column
        if (drops[i] > 0 && drops[i] < 1) {
          // Bright white for the leading character
          ctx.fillStyle = 'rgba(220, 255, 220, 1)';
        } else {
          // Randomize brightness for more realistic effect
          const brightness = Math.random() * 50 + 50; // 50-100%
          
          // Use CSS variable for color to support theme switching
          const computedStyle = getComputedStyle(document.documentElement);
          const themeColor = computedStyle.getPropertyValue('--primary-color') || '#4ade80';
          
          // Check if using cyberpunk mode and adjust color accordingly
          if (document.documentElement.classList.contains('cyberpunk-theme')) {
            const hue = (i * 3) % 360; // Cycle through colors based on column
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.9)`;
          } else {
            // Default matrix green with varying brightness
            ctx.fillStyle = `rgba(0, ${brightness + 100}, 0, 0.9)`;
          }
        }
        
        ctx.font = `${fontSize}px monospace`;
        
        // Draw the character
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        // Move the drop down at its specific speed
        drops[i] += speeds[i];
        
        // Reset when reaching the bottom or randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] = 0.5 + Math.random() * 1.5; // Randomize speed again on reset
        }
      }
    };
    
    // Set up animation with improved frame rate
    const interval = setInterval(draw, 30); // Slightly faster for smoother animation
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reset drops array for new width
      const newColumns = Math.floor(canvas.width / fontSize);
      
      // Resize all arrays
      drops.length = 0;
      charIndices.length = 0;
      speeds.length = 0;
      
      for (let i = 0; i < newColumns; i++) {
        drops[i] = Math.random() * -100;
        charIndices[i] = Math.floor(Math.random() * chars.length);
        speeds[i] = 0.5 + Math.random() * 1.5;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 opacity-40" />;
}