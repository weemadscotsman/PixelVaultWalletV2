import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    
    // Initialize dark mode based on system preferences
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
    
    // Listen for changes in color scheme preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
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
          <button 
            onClick={toggleDarkMode}
            className="ml-4 p-2 bg-black border border-blue-500 rounded-full text-blue-400 hover:bg-gray-900 focus:outline-none transition-colors duration-200 text-shadow-neon"
            aria-label="Toggle Matrix theme"
          >
            <span className="text-xs mr-1">Theme</span>
            <i className={`fas ${isDarkMode ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
          </button>
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
