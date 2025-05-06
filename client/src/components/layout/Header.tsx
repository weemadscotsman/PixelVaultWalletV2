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
    <header className={`bg-white dark:bg-dark-card border-b border-light-border dark:border-dark-border shadow-sm sticky top-0 z-50 transition-colors duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary pulse-shadow">
            <i className="ri-shield-keyhole-fill text-white text-xl"></i>
          </div>
          <h1 className="text-gray-800 dark:text-white font-bold text-xl">PixelVault</h1>
          <span className="text-xs px-2 py-1 bg-primary text-white rounded-full font-bold">PVX</span>
        </div>
        <div className="flex items-center space-x-3">
          {isConnected && (
            <div className="hidden md:flex items-center mr-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-500 dark:text-green-400 text-sm font-medium">Connected</span>
            </div>
          )}
          
          <button className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200" aria-label="Notifications">
            <i className="fas fa-bell"></i>
          </button>
          
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            PVX
          </div>
        </div>
      </div>
    </header>
  );
}
