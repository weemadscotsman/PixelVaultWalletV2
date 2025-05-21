import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useLocation } from "wouter";

interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { wallet, setActiveWalletAddress } = useWallet();
  const [, setLocation] = useLocation();

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

  const handleConnect = () => {
    // Navigate to the wallet page
    window.location.href = '/wallet';
  };

  const handleDisconnect = () => {
    // Disconnect by clearing active wallet
    setActiveWalletAddress(null);
    // Clear from storage - make sure we're using the correct key
    localStorage.removeItem('activeWallet');
    // Force page refresh to clear any cached wallet data
    window.location.href = '/';
  };

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
          {/* Connect/Disconnect Wallet Button */}
          {isConnected ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDisconnect}
              className="bg-red-800 hover:bg-red-700 text-white border border-red-700 shadow-md shadow-red-900/30 mr-2"
            >
              <span className="hidden sm:inline">Disconnect</span> Wallet
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleConnect}
              className="bg-blue-700 hover:bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-900/30 mr-2"
            >
              <span className="hidden sm:inline">Connect</span> Wallet
            </Button>
          )}
          
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
