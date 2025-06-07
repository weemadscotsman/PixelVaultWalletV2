import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLocation, useRoute } from "wouter";

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
  const [, navigate] = useLocation();
  
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
      
      // Blue text for Matrix effect
      ctx.fillStyle = '#0099ff';
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

  const navItems = [
    { path: "/", icon: "fa-home", label: "Dashboard" },
    { path: "/wallet", icon: "fa-wallet", label: "Wallet" },
    { path: "/blockchain", icon: "fa-hammer", label: "Blockchain" },
    { path: "/staking", icon: "fa-layer-group", label: "Staking" },
    { path: "/governance", icon: "fa-landmark", label: "Governance" },
    { path: "/thringlets", icon: "fa-image", label: "Thringlets" },
    { path: "/learning", icon: "fa-graduation-cap", label: "Learning" },
    { path: "/terminal", icon: "fa-terminal", label: "Terminal" },
    { path: "/drops", icon: "fa-gift", label: "Drops" },
  ];

  return (
    <>
      {/* Mobile Header (visible on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-black bg-opacity-78 border-b border-blue-800 relative shadow-md shadow-blue-900/30">
        {/* Matrix effect canvas for mobile header */}
        <canvas 
          className="absolute inset-0 z-0 pointer-events-none opacity-30"
          ref={sidebarCanvasRef}
        />
        <div className="flex items-center z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-800 shadow-md shadow-blue-900/50">
            <i className="ri-shield-keyhole-fill text-white text-xl"></i>
          </div>
          <h1 className="ml-3 text-xl font-bold text-blue-400 text-shadow-neon">PixelVault</h1>
        </div>
        <div className="flex items-center space-x-3 z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-blue-400 focus:outline-none hover:text-blue-300 text-shadow-neon"
          >
            <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
    
      {/* Sidebar - Responsive */}
      <aside 
        className={cn(
          "z-20 flex-shrink-0 bg-black bg-opacity-78 relative border-r border-blue-800",
          "transition-all duration-300 md:relative flex flex-col overflow-y-auto",
          "w-64 md:flex shadow-lg shadow-blue-900/30",
          sidebarOpen ? "block fixed inset-0 md:relative" : "hidden"
        )}
      >
        {/* Matrix effect canvas for sidebar */}
        <canvas 
          ref={sidebarCanvasRef}
          className="absolute inset-0 z-0 pointer-events-none opacity-30"
        />
        {/* Sidebar Header (hidden on mobile) */}
        <div className="hidden md:flex items-center p-4 border-b border-blue-800 relative z-10 bg-black bg-opacity-78">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-800 shadow-md shadow-blue-900/50">
              <i className="ri-shield-keyhole-fill text-white text-xl"></i>
            </div>
            <h1 className="ml-3 text-xl font-bold text-blue-400 text-shadow-neon">PixelVault</h1>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <div className="md:hidden flex justify-end p-2 bg-black bg-opacity-78">
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="text-blue-400 focus:outline-none p-2 hover:text-blue-300 text-shadow-neon"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="py-4 flex-grow relative z-10 bg-black bg-opacity-78">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path} className="py-1">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer",
                    window.location.pathname === item.path
                      ? "bg-blue-800 bg-opacity-90 text-white border border-blue-600 shadow-md shadow-blue-900/50" 
                      : "text-blue-400 hover:bg-blue-900 hover:bg-opacity-30 hover:text-blue-300 hover:border hover:border-blue-700/50 text-shadow-neon"
                  )}
                  onClick={() => {
                    // Use wouter's navigate for routing
                    navigate(item.path);
                    
                    // Close sidebar on mobile
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <i className={`fas ${item.icon} w-5 text-center`}></i>
                  <span className="ml-3 font-medium">{item.label}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 px-4 relative z-10">
            <div className="flex items-center justify-between mb-3 pl-2">
              <h3 className="text-xs uppercase text-blue-400 font-semibold text-shadow-neon">
                Network Status
              </h3>
              {networkStats.blockHeight === 0 && networkStats.blockTime === "Loading..." && (
                <div className="text-xs text-blue-300 flex items-center">
                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-pulse mr-1"></span>
                  Syncing...
                </div>
              )}
            </div>
            <div className="bg-black bg-opacity-78 border border-blue-800 p-4 rounded-md text-sm space-y-3 text-blue-400 shadow-md shadow-blue-900/30">
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Block Height:</span>
                <span className="font-mono font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">
                  {networkStats.blockHeight ? networkStats.blockHeight.toLocaleString() : (
                    <span className="animate-pulse">Syncing...</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Block Time:</span>
                <span className="font-mono font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">
                  {networkStats.blockTime === "Loading..." ? (
                    <span className="animate-pulse">Syncing...</span>
                  ) : networkStats.blockTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Peers:</span>
                <span className="font-mono font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">
                  {networkStats.peers || (
                    <span className="animate-pulse">Syncing...</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Hash Rate:</span>
                <span className="font-mono font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">
                  {networkStats.hashRate === "Loading..." ? (
                    <span className="animate-pulse">Syncing...</span>
                  ) : networkStats.hashRate}
                </span>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-blue-800 text-sm text-blue-400 text-shadow-neon relative z-10 bg-black bg-opacity-78">
          <div className="bg-black bg-opacity-78 border border-blue-900/50 rounded-md p-3 shadow-inner shadow-blue-900/20">
            <p className="font-medium">PixelVault v1.0.0</p>
            <p className="mt-1">PVX Zero-Knowledge Wallet</p>
          </div>
        </div>
      </aside>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-78 z-10 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}
