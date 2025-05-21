import { ReactNode, useEffect, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";
import { Footer } from "./Footer";
import { getNetworkStats } from "@/lib/blockchain";
import { MatrixRain } from "@/components/ui/MatrixRain";

export interface PageLayoutProps {
  children: ReactNode;
  isConnected: boolean;
}

export function PageLayout({ children, isConnected }: PageLayoutProps) {
  // Initialize with loading state rather than mock values
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 0,
    blockTime: "Loading...",
    peers: 0,
    hashRate: "Loading..."
  });
  
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    // Fetch real network stats when API is available
    const fetchNetworkStats = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await getNetworkStats();
        
        // Only update if we have real data
        if (stats.blockHeight > 0 || stats.peers > 0) {
          setNetworkStats(stats);
        }
      } catch (error) {
        console.error("Error fetching network stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    // Immediate initial fetch
    fetchNetworkStats();
    
    // More frequent updates (every 10 seconds) for real-time data
    const interval = setInterval(fetchNetworkStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-foreground transition-colors duration-200 relative">
      {/* Matrix rain effect is now applied globally in App.tsx */}
      
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
