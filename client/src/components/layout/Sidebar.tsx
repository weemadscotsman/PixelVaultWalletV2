import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NetworkStatsType {
  blockHeight: number;
  blockTime: string;
  peers: number;
  hashRate: string;
}

interface SidebarProps {
  networkStats: NetworkStatsType;
}

export function Sidebar({ networkStats }: SidebarProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isActive = (hash: string) => {
    return location === "/" && window.location.hash === hash;
  };

  const navItems = [
    { id: "#wallet", icon: "fa-wallet", label: "Wallet" },
    { id: "#mining", icon: "fa-hammer", label: "Mining" },
    { id: "#staking", icon: "fa-layer-group", label: "Staking" },
    { id: "#governance", icon: "fa-landmark", label: "Governance" },
    { id: "#nft", icon: "fa-image", label: "NFT Minting" },
    { id: "#learn", icon: "fa-graduation-cap", label: "Learning Center" },
    { id: "#games", icon: "fa-gamepad", label: "Game Center" },
    { id: "#drops", icon: "fa-gift", label: "Exclusive Drops" },
    { id: "#market", icon: "fa-chart-line", label: "Market Stats" },
  ];

  return (
    <>
      {/* Mobile Header (visible on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-dark-card border-b border-light-border dark:border-dark-border">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary">
            <i className="ri-shield-keyhole-fill text-white text-xl"></i>
          </div>
          <h1 className="ml-3 text-xl font-bold text-gray-800 dark:text-white">PixelVault</h1>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="text-gray-500 dark:text-gray-300 focus:outline-none"
        >
          <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
    
      {/* Sidebar - Responsive */}
      <aside 
        className={cn(
          "z-20 flex-shrink-0 bg-white dark:bg-dark-card border-r border-light-border dark:border-dark-border",
          "transition-all duration-300 md:relative flex flex-col overflow-y-auto",
          "w-64 md:flex",
          sidebarOpen ? "block fixed inset-0 md:relative" : "hidden"
        )}
      >
        {/* Sidebar Header (hidden on mobile) */}
        <div className="hidden md:flex items-center p-4 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary">
            <i className="ri-shield-keyhole-fill text-white text-xl"></i>
          </div>
          <h1 className="ml-3 text-xl font-bold text-gray-800 dark:text-white">PixelVault</h1>
        </div>
        
        {/* Close button for mobile */}
        <div className="md:hidden flex justify-end p-2">
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="text-gray-500 dark:text-gray-300 focus:outline-none p-2"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="py-4 flex-grow">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id} className="px-2 py-1">
                <Link href={`/${item.id}`}>
                  <a
                    href={item.id}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg transition-colors duration-200",
                      isActive(item.id)
                        ? "bg-primary text-white" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                    onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                  >
                    <i className={`fas ${item.icon} w-5 text-center`}></i>
                    <span className="ml-3">{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 px-4">
            <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-2">
              Network Status
            </h3>
            <div className="bg-gray-100 dark:bg-dark-bg p-3 rounded-md text-sm space-y-2 text-gray-800 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Block Height:</span>
                <span className="font-mono font-medium">
                  {networkStats.blockHeight.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Block Time:</span>
                <span className="font-mono font-medium">{networkStats.blockTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Peers:</span>
                <span className="font-mono font-medium">{networkStats.peers}</span>
              </div>
              <div className="flex justify-between">
                <span>Hash Rate:</span>
                <span className="font-mono font-medium">{networkStats.hashRate}</span>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-light-border dark:border-dark-border text-sm text-gray-500 dark:text-gray-400">
          <p>PixelVault v1.0.0</p>
          <p className="mt-1">PVX Zero-Knowledge Wallet</p>
        </div>
      </aside>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}
