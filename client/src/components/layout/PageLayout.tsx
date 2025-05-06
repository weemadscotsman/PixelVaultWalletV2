import { ReactNode, useEffect, useState } from "react";
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header isConnected={isConnected} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar networkStats={networkStats} />
        
        <main className="flex-1 overflow-auto bg-background p-4">
          <div className="container mx-auto space-y-6">
            <MobileNavigation />
            {children}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
