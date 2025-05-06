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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`bg-sidebar border-b border-gray-700 sticky top-0 z-50 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <i className="ri-shield-keyhole-fill text-white text-lg"></i>
          </div>
          <h1 className="text-white font-semibold text-xl">PixelVault</h1>
          <span className="text-xs px-2 py-1 bg-primary text-white rounded-full">PVX</span>
        </div>
        <div className="flex items-center space-x-4">
          {isConnected && (
            <div className="hidden md:flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-400 text-sm">Connected</span>
            </div>
          )}
          <Button variant="default" size="sm" className="bg-primary hover:bg-primary-light text-white">
            <i className="ri-settings-4-line mr-1"></i>
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
}
