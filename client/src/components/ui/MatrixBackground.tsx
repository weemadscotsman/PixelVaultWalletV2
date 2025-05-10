import { useEffect, useRef, useState } from 'react';

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intensity, setIntensity] = useState(80); // Higher default intensity
  
  // Get matrix intensity from CSS variable or localStorage
  useEffect(() => {
    const getMatrixIntensity = () => {
      // Check localStorage first
      const savedSettings = localStorage.getItem('pvx_user_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.matrixIntensity !== undefined) {
            return settings.matrixIntensity;
          }
        } catch (e) {
          console.error("Error parsing saved settings:", e);
        }
      }
      
      // Fallback to a higher default
      return 80;
    };
    
    setIntensity(getMatrixIntensity());
    
    // Listen for settings changes
    const handleStorageChange = () => {
      setIntensity(getMatrixIntensity());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Matrix characters (binary, crypto symbols, and Japanese-like characters)
    const chars = "01ΦΨΣΩμλBTC ETH PVX 私ドラゴンビットコイン仮想通貨マイニング暗号化技術サトシナカモト分散型台帳スマートコントラクトノード秘密鍵公開鍵ウォレット革新技術未来世界仮想空間分散処理匿名性システム永続性取引証明ブロック連鎖マイナー手数料数学的問題計算能力プロトコル合意形成自律組織";
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
      // Reduce the fade effect to make characters stay visible longer
      const fadeOpacity = 0.02 + ((100 - intensity) / 1400); // Lower values = slower fade = more visible
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Make sure drops appear across all panels
      const maxColumns = Math.min(columns, 300); // Limit max columns to prevent performance issues
      const columnsToUse = Math.max(drops.length, maxColumns);
      
      for (let i = 0; i < columnsToUse; i++) {
        // Add missing drops if needed
        if (drops[i] === undefined) {
          drops[i] = Math.random() * -100;
          charIndices[i] = Math.floor(Math.random() * chars.length);
          speeds[i] = 0.5 + Math.random() * 1.5;
        }
        
        // Determine if we should change the character (occasionally)
        if (Math.random() > 0.965) {
          charIndices[i] = Math.floor(Math.random() * chars.length);
        }
        
        // Get the character for this column
        const char = chars[charIndices[i]];
        
        // Special highlight for the first character in each column
        if (drops[i] > 0 && drops[i] < 1) {
          // Bright neon green for the leading character
          ctx.fillStyle = 'rgba(0, 255, 70, 1)';
          ctx.shadowColor = 'rgba(0, 255, 120, 0.9)';
          ctx.shadowBlur = 15;
        } else {
          // Increase brightness for more visibility
          const brightness = Math.random() * 50 + 150; // 150-200 range, much brighter
          
          // Significantly higher minimum opacity for better visibility
          const alpha = Math.max(0.90, (intensity / 100)); // Very high minimum opacity
          ctx.fillStyle = `rgba(0, ${brightness + 180}, 50, ${alpha})`;
          ctx.shadowColor = 'rgba(0, 255, 50, 0.5)';
          ctx.shadowBlur = 8; // Increased blur for more glow
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
  }, [intensity]); // Re-initialize when intensity changes
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none" 
      style={{ 
        opacity: Math.max(0.9, intensity / 100), // Much higher opacity
        mixBlendMode: "screen", // Better blend mode for neon green
        backdropFilter: 'none', // Remove blur for clearer text
        WebkitBackdropFilter: 'none',
      }} 
    />
  );
}