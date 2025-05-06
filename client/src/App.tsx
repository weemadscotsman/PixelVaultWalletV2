import { Switch, Route } from "wouter";
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
import ThringletsPage from "@/pages/ThringletsPage";
import { ThemeProvider } from "next-themes";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";

// Router component
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/learning" component={LearningPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/blockchain" component={BlockchainPage} />
      <Route path="/staking" component={StakingPage} />
      <Route path="/governance" component={() => <HomePage />} />
      <Route path="/thringlets" component={ThringletsPage} />
      <Route path="/drops" component={() => <HomePage />} />
      <Route path="/terminal" component={() => <HomePage />} />
      <Route path="/profile" component={() => <HomePage />} />
      <Route path="/settings" component={() => <HomePage />} />
      <Route component={NotFound} />
    </Switch>
  );
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
          <Toaster />
          <FeedbackButton />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
