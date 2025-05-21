import { useEffect } from 'react';

// This is a completely new implementation with direct DOM manipulation
// to ensure the matrix rain effect is visible everywhere
export function MatrixRainNew() {
  useEffect(() => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    
    // Set critical styling directly to force visibility
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '10'; // Higher z-index to show above content
    canvas.style.pointerEvents = 'none'; // Don't capture clicks
    canvas.style.opacity = '0.8'; // Increased opacity for more visibility
    canvas.style.mixBlendMode = 'overlay';
    canvas.className = 'matrix-rain-forced'; // Add class for additional styling options
    
    // Add it directly to the document body to ensure it's not nested in any container
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set initial dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Matrix character set - mix of katakana and PVX branding
    const characters = 'アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロヲンPVX0123456789';
    
    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize * 1.5); // Reduced density for better visibility
    
    // Initialize drops
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize) * -1;
    }
    
    // Animation function
    const draw = () => {
      // Semi-transparent black for fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Neon green matrix style text with glow effect
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00ff00';
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = characters.charAt(Math.floor(Math.random() * characters.length));
        
        // Position
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Draw character
        ctx.fillText(char, x, y);
        
        // Reset drop or advance it
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        } else {
          drops[i] += 0.5; // Even slower speed for better visibility
        }
      }
      
      requestAnimationFrame(draw);
    };
    
    // Start animation with requestAnimationFrame for better performance
    const animationId = requestAnimationFrame(draw);
    
    // Handle window resizing
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const newColumns = Math.ceil(canvas.width / fontSize * 2);
      
      while (drops.length < newColumns) {
        drops.push(Math.floor(Math.random() * canvas.height / fontSize) * -1);
      }
      
      drops.length = newColumns;
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up on unmount
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      document.body.removeChild(canvas);
    };
  }, []); // Empty dependency array ensures this runs once
  
  // Return null because we're adding the canvas directly to the body
  return null;
}