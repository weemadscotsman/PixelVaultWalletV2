import { ReactNode, useEffect, useState, useRef } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { Footer } from "./Footer";
import { getNetworkStats } from "@/lib/blockchain";

export interface PageLayoutProps {
  children: ReactNode;
  isConnected: boolean;
}

export function PageLayout({ children, isConnected }: PageLayoutProps) {
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 3421869,
    blockTime: "~15 sec",
    peers: 24,
    hashRate: "12.4 TH/s"
  });
  
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const secondaryEffectRef = useRef<HTMLCanvasElement>(null);
  
  // Matrix rain effect - enhanced version
  useEffect(() => {
    if (!matrixCanvasRef.current) return;
    
    const canvas = matrixCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Authentic Matrix characters - real Kanji and Katakana characters as seen in the film
    const matrixChars = "日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ九七二十四午三八六五円下北千百万子東南西北今明後前上下田円町村花見山川市入出本天空雨夜明月星火水木金土曜日年中半時分秒週春夏秋冬男女人家語文字右左解計";
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track the y position of each column
    const drops: number[] = [];
    
    // Initial position for each column
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize) * -1;
    }
    
    // The matrix animation function - highly visible authentic Matrix style
    const matrix = () => {
      // Semi-transparent black to create trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';  // More opacity for better visibility of trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < drops.length; i++) {
        // Ensure more characters are drawn
        if (Math.random() > 0.01) {
          // Random character from matrixChars
          const charIndex = Math.floor(Math.random() * matrixChars.length);
          const text = matrixChars[charIndex];
          
          // Strong neon green for authentic Matrix look - very bright
          const greenIntensity = Math.floor(Math.random() * 55) + 200; // 200-255 range
          
          // Leading characters - extremely bright neon
          if (drops[i] * fontSize < fontSize) {
            ctx.fillStyle = `rgba(180, 255, 180, 1.0)`;  // White-green glow
          } else {
            // Trailing characters with strong visibility
            const opacity = Math.max(0.7, 1 - (drops[i] * fontSize) / (canvas.height * 0.9));
            // Pure Matrix green with slight variation
            ctx.fillStyle = `rgba(0, ${greenIntensity}, 0, ${opacity})`;
          }
          
          // Larger font for better visibility
          ctx.font = `bold ${fontSize}px monospace`;
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        }
        
        // Reset when off screen with random chance
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        
        // Move characters at consistent speed for better effect
        drops[i]++;
      }
    };
    
    // Run the animation at 30fps
    const matrixInterval = setInterval(matrix, 33);
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Recalculate columns and reset drops
      const newColumns = Math.floor(canvas.width / fontSize);
      
      // Reset drops array with new size
      drops.length = 0;
      for (let i = 0; i < newColumns; i++) {
        drops[i] = Math.floor(Math.random() * canvas.height / fontSize) * -1;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(matrixInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Fetch real network stats when API is available
    const fetchNetworkStats = async () => {
      try {
        const stats = await getNetworkStats();
        setNetworkStats(stats);
      } catch (error) {
        console.error("Error fetching network stats:", error);
      }
    };

    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-foreground transition-colors duration-200 relative">
      {/* Matrix rain effect with proper visibility but not overwhelming */}
      <canvas 
        ref={matrixCanvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw', 
          height: '100vh',
          zIndex: 5,
          opacity: 0.35
        }}
      />
      
      {/* Main content with z-index to appear above the matrix effect */}
      <div className="flex flex-col min-h-screen relative" style={{ zIndex: 10 }}>
        <Header isConnected={isConnected} />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar networkStats={networkStats} />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-black bg-opacity-80 fade-in">
            <div className="container mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
