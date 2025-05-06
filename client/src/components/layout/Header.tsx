import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  // Add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    
    // Always set dark mode
    document.documentElement.classList.add('dark');
    
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={`bg-black border-b border-blue-900 shadow-sm sticky top-0 z-50 transition-colors duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary pulse-shadow">
            <i className="ri-shield-keyhole-fill text-white text-xl"></i>
          </div>
          <h1 className="text-blue-400 font-bold text-xl text-shadow-neon">PixelVault</h1>
          <span className="text-xs px-2 py-1 bg-blue-900 text-blue-400 rounded-full font-bold text-shadow-neon">PVX</span>
        </div>
        <div className="flex items-center space-x-3">
          {isConnected && (
            <div className="hidden md:flex items-center mr-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-blue-400 text-sm font-medium text-shadow-neon">Connected</span>
            </div>
          )}
          
          <button className="p-2 rounded-full text-blue-400 hover:bg-gray-800 focus:outline-none transition-colors duration-200 text-shadow-neon" aria-label="Notifications">
            <i className="fas fa-bell"></i>
          </button>
          
          <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-400 font-bold text-shadow-neon border border-blue-500">
            PVX
          </div>
        </div>
      </div>
    </header>
  );
}
