import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import LearningPage from "@/pages/learning-page";
import WalletPage from "@/pages/WalletPage";
import BlockchainPage from "@/pages/BlockchainPage";
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
import { ThemeProvider } from "next-themes";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { AuthProvider } from "@/hooks/use-auth";

// Basic Router Component (simplified to ensure functionality)
function Router() {
  return (
    <div className="w-full">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/learning" component={LearningPage} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/blockchain" component={BlockchainPage} />
        <Route path="/staking" component={StakingPage} />
        <Route path="/governance" component={GovernancePage} />
        <Route path="/thringlets" component={ThringletsPage} />
        <Route path="/drops" component={DropsPage} />
        <Route path="/badges" component={BadgesPage} />
        <Route path="/utr" component={UTRDashboardPage} />
        <Route path="/dex" component={DEXPage} />
        <Route path="/terminal" component={TerminalPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

// Simplified App Component - removed animations and complex styling temporarily
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider>
          <TooltipProvider>
            {/* Simple background color instead of matrix animation */}
            <div className="bg-black min-h-screen text-white">
              <Router />
            </div>
            <Toaster />
            <FeedbackButton />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
