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
    
    // Matrix characters - using a mix of katakana characters and matrix-like symbols
    const matrixChars = "ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01234567890:・.\"=*+-<>¦｜╌";
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track the y position of each column
    const drops: number[] = [];
    
    // Initial position for each column
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize) * -1;
    }
    
    // The matrix animation function
    const matrix = () => {
      // Semi-transparent black to create trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < drops.length; i++) {
        // Random character from matrixChars
        const charIndex = Math.floor(Math.random() * matrixChars.length);
        const text = matrixChars[charIndex];
        
        // Varying green shades for more depth
        const greenIntensity = Math.random() * 50 + 150; // 150-200 range
        
        // First character in each column is brightest (white-green)
        if (drops[i] * fontSize < fontSize) {
          ctx.fillStyle = `rgba(180, 255, 180, 1)`;
        } else {
          // The rest gradually fade as they fall
          const opacity = Math.max(0.2, 1 - (drops[i] * fontSize) / (canvas.height * 0.6));
          ctx.fillStyle = `rgba(0, ${greenIntensity}, 0, ${opacity})`;
        }
        
        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        // Reset when off screen with random chance 
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        
        // Move character down
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
      {/* Matrix rain effect with lowered opacity that covers the entire viewport */}
      <canvas 
        ref={matrixCanvasRef}
        className="fixed top-0 left-0 w-full h-full opacity-20 pointer-events-none z-10"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh'
        }}
      />
      
      {/* Main content with z-index to appear above the matrix effect */}
      <div className="flex flex-col min-h-screen relative z-20">
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
