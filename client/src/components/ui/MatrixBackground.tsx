import { useEffect, useRef, useState } from 'react';

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intensity, setIntensity] = useState(40); // Default intensity
  
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
      
      // Fallback to default
      return 40;
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
      // Adjust fade effect based on intensity but ensure it's not too transparent
      const fadeOpacity = 0.03 + ((100 - intensity) / 1200); // More transparent at lower intensity
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
          // Bright neon cyan for the leading character
          ctx.fillStyle = 'rgba(34, 211, 238, 1)';
          ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
          ctx.shadowBlur = 15;
        } else {
          // Randomize brightness for more realistic effect
          const brightness = Math.random() * 50 + 160; // 160-210
          
          // Default to a consistent neon cyan color with higher minimum opacity
          const alpha = Math.max(0.75, (intensity / 100)) * 0.95; // Higher minimum opacity
          ctx.fillStyle = `rgba(34, ${brightness}, 238, ${alpha})`;
          ctx.shadowColor = 'rgba(34, 211, 238, 0.3)';
          ctx.shadowBlur = 4;
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
        opacity: Math.max(0.6, intensity / 100), // Ensure minimum visibility
        mixBlendMode: "luminosity",
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }} 
    />
  );
}