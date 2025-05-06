import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import { ThemeProvider } from "next-themes";
import { MatrixBackground } from "@/components/ui/MatrixBackground";

// Hash-based router component
function Router() {
  const [currentHash, setCurrentHash] = useState<string>(window.location.hash || '#dashboard');
  
  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#dashboard');
    };
    
    // Set initial hash if none exists
    if (!window.location.hash) {
      window.location.hash = 'dashboard';
    }
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Simple hash-based routing
  const renderContent = () => {
    const route = currentHash.replace('#', '');
    
    // Add all routes here
    switch (route) {
      case 'dashboard':
      case 'wallet':
      case 'mining':
      case 'staking':
      case 'governance':
      case 'nft':
      case 'learning':
      case 'drops':
      case 'settings':
        return <Dashboard activeTab={route} />;
      default:
        return <NotFound />;
    }
  };
  
  return renderContent();
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
      >
        <TooltipProvider>
          <MatrixBackground />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
