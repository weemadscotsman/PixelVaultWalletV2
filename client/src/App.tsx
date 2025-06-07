import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MatrixRainNew } from "@/components/effects/MatrixRainNew";
import { CacheManager } from "@/lib/cache-manager";
import "@/lib/force-cache-clear";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LearningPage from "@/pages/learning-page";
import WalletPage from "@/pages/WalletPage";
import BlockchainPage from "@/pages/BlockchainPage";
import AllBlocksPage from "@/pages/AllBlocksPage";
import MiningPage from "@/pages/MiningPage";
import StakingPage from "@/pages/StakingPage";
import GovernancePage from "@/pages/GovernancePage";
import ThringletsPage from "@/pages/ThringletsPage";
import DropsPage from "@/pages/DropsPage";
import BadgesPage from "@/pages/BadgesPage";
import UTRDashboardPage from "@/pages/UTRDashboardPage";
import DEXPage from "@/pages/DEXPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import TerminalPage from "@/pages/TerminalPage";
import NFTsPage from "@/pages/NFTsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import ActionsPage from "@/pages/ActionsPage";
import TransactionVisualizerPage from "@/pages/TransactionVisualizerPage";
import CompanionsPage from "@/pages/CompanionsPage";
import { ThemeProvider } from "next-themes";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { AuthProvider } from "@/hooks/use-auth";
import React from "react";
import { AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useApiConnectionStatus } from "@/components/ui/api-status-toast";

// Router component
function Router() {
  // Get the current location for AnimatePresence
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="sync" initial={false}>
      <div className="relative z-10" style={{ pointerEvents: 'auto' }}>
        <Switch key={location}>
          {/* Public routes */}
          <Route path="/auth" component={AuthPage} />
          <Route path="/learning" component={LearningPage} />
          
          {/* Protected routes */}
          <ProtectedRoute path="/" component={HomePage} />
          <ProtectedRoute path="/wallet" component={WalletPage} />
          <ProtectedRoute path="/wallet/overview" component={WalletPage} />
          <ProtectedRoute path="/wallet/send" component={WalletPage} />
          <ProtectedRoute path="/wallet/receive" component={WalletPage} />
          <ProtectedRoute path="/wallet/transactions" component={WalletPage} />
          <ProtectedRoute path="/wallet/staking" component={WalletPage} />
          <ProtectedRoute path="/wallet/security" component={WalletPage} />
          <ProtectedRoute path="/blockchain" component={BlockchainPage} />
          <ProtectedRoute path="/blockchain/blocks" component={AllBlocksPage} />
          <ProtectedRoute path="/mining" component={MiningPage} />
          <ProtectedRoute path="/staking" component={StakingPage} />
          <ProtectedRoute path="/governance" component={GovernancePage} />
          <ProtectedRoute path="/thringlets" component={ThringletsPage} />
          <ProtectedRoute path="/drops" component={DropsPage} />
          <ProtectedRoute path="/badges" component={BadgesPage} />
          <ProtectedRoute path="/utr" component={UTRDashboardPage} />
          <ProtectedRoute path="/dex" component={DEXPage} />
          <ProtectedRoute path="/terminal" component={TerminalPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/settings" component={SettingsPage} />
          <ProtectedRoute path="/nfts" component={NFTsPage} />
          <ProtectedRoute path="/transactions" component={TransactionsPage} />
          <ProtectedRoute path="/actions" component={ActionsPage} />
          <ProtectedRoute path="/visualizer" component={TransactionVisualizerPage} />
          <ProtectedRoute path="/companions" component={CompanionsPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </AnimatePresence>
  );
}

function App() {
  // Use global connection status monitoring to show toasts for API errors
  const apiStatus = useApiConnectionStatus();
  
  // Handle connection error monitoring in network requests
  // This will show appropriate toasts when 502 errors occur
  React.useEffect(() => {
    // Listen for fetch errors that might indicate API connectivity issues
    const handleFetchErrors = (event: any) => {
      if (event.reason && (
        event.reason.message?.includes('502') || 
        event.reason.message?.includes('503') ||
        event.reason.message?.includes('network error')
      )) {
        apiStatus.reportConnectionIssue(event.reason.message);
      }
    };
    
    // Set up global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', handleFetchErrors);
    
    // Clean up
    return () => {
      window.removeEventListener('unhandledrejection', handleFetchErrors);
    };
  }, [apiStatus]);
  
  // Clear corrupted cache immediately
  React.useEffect(() => {
    CacheManager.initializeCleanState();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
      >
        <AuthProvider>
          <TooltipProvider>
            {/* Global Matrix Rain with maximum visibility settings */}
            <MatrixRainNew />
            <Toaster />
            <FeedbackButton />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
