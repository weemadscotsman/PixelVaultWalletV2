import { useState, useEffect, useRef } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Matrix effect for sidebar
  useEffect(() => {
    if (!sidebarCanvasRef.current) return;
    
    const canvas = sidebarCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match sidebar
    const resizeCanvas = () => {
      const sidebar = canvas.parentElement;
      if (sidebar) {
        canvas.width = sidebar.offsetWidth;
        canvas.height = sidebar.offsetHeight;
      }
    };
    
    resizeCanvas();
    
    // Matrix rain effect with traditional Japanese and Chinese characters
    const characters = 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃ日本語社会木水火土金天海空雲電車語';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }
    
    const matrix = () => {
      // Semi-transparent black background to show trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Green text
      ctx.fillStyle = '#0f0';
      ctx.font = fontSize + 'px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        // Get random character
        const text = characters[Math.floor(Math.random() * characters.length)];
        
        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        // Reset when drop reaches bottom or random chance
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        drops[i]++;
      }
    };
    
    const matrixInterval = setInterval(matrix, 40);
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      clearInterval(matrixInterval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  // Handle window resize for sidebar display
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
    return window.location.hash === hash;
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
      <div className="md:hidden flex items-center justify-between p-4 bg-black border-b border-green-900 relative">
        {/* Matrix effect canvas for mobile header */}
        <canvas 
          className="absolute inset-0 z-0 pointer-events-none opacity-50"
          ref={sidebarCanvasRef}
        />
        <div className="flex items-center z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary">
            <i className="ri-shield-keyhole-fill text-white text-xl"></i>
          </div>
          <h1 className="ml-3 text-xl font-bold text-white">PixelVault</h1>
        </div>
        <div className="flex items-center space-x-3 z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-green-400 focus:outline-none"
          >
            <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
    
      {/* Sidebar - Responsive */}
      <aside 
        className={cn(
          "z-20 flex-shrink-0 bg-black relative border-r border-light-border dark:border-dark-border",
          "transition-all duration-300 md:relative flex flex-col overflow-y-auto",
          "w-64 md:flex",
          sidebarOpen ? "block fixed inset-0 md:relative" : "hidden"
        )}
      >
        {/* Matrix effect canvas for sidebar */}
        <canvas 
          ref={sidebarCanvasRef}
          className="absolute inset-0 z-0 pointer-events-none opacity-50"
        />
        {/* Sidebar Header (hidden on mobile) */}
        <div className="hidden md:flex items-center p-4 border-b border-green-900 relative z-10">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary">
              <i className="ri-shield-keyhole-fill text-white text-xl"></i>
            </div>
            <h1 className="ml-3 text-xl font-bold text-white">PixelVault</h1>
          </div>
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
        <nav className="py-4 flex-grow relative z-10">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id} className="px-2 py-1">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer",
                    isActive(item.id)
                      ? "bg-primary bg-opacity-90 text-white" 
                      : "text-green-400 hover:bg-black hover:bg-opacity-50 hover:text-green-300"
                  )}
                  onClick={() => {
                    // Set hash for navigation
                    window.location.hash = item.id;
                    
                    // Close sidebar on mobile
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <i className={`fas ${item.icon} w-5 text-center`}></i>
                  <span className="ml-3">{item.label}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 px-4 relative z-10">
            <h3 className="text-xs uppercase text-green-500 font-medium mb-2">
              Network Status
            </h3>
            <div className="bg-black bg-opacity-70 border border-green-900 p-3 rounded-md text-sm space-y-2 text-green-400">
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
        <div className="p-4 border-t border-green-900 text-sm text-green-500 relative z-10">
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
