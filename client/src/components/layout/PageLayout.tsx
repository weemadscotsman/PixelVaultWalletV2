import { ReactNode, useEffect, useState, useRef } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { Footer } from "./Footer";
import { getNetworkStats } from "@/lib/blockchain";

interface PageLayoutProps {
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
  
  // Matrix rain effect
  useEffect(() => {
    if (!matrixCanvasRef.current) return;
    
    const canvas = matrixCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const fontSize = 10;
    const columns = Math.floor(canvas.width / fontSize);
    
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }
    
    const matrix = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#0f0';
      ctx.font = fontSize + 'px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(Math.floor(Math.random() * 128));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        drops[i]++;
      }
    };
    
    const matrixInterval = setInterval(matrix, 35);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
    <div className="min-h-screen flex flex-col bg-black text-foreground transition-colors duration-200">
      {/* Remove the canvas for matrix since we're using the standalone MatrixBackground component now */}
      <Header isConnected={isConnected} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar networkStats={networkStats} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-900 bg-opacity-78 fade-in">
          <div className="container mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
