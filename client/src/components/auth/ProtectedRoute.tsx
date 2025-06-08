import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = React.useState(false);
  const [authBypass, setAuthBypass] = React.useState(false);

  // Check for valid session tokens on mount
  React.useEffect(() => {
    const savedWallet = localStorage.getItem('activeWallet');
    const savedToken = localStorage.getItem('sessionToken');
    
    if (savedWallet && savedToken) {
      setAuthBypass(true);
    }
    
    if (!isLoading) {
      setHasCheckedAuth(true);
    }
  }, [isLoading]);

  return (
    <Route path={path}>
      {() => {
        // Show loading while authentication is being determined
        if (isLoading || !hasCheckedAuth) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          );
        }

        // Allow access if authenticated OR has valid session tokens
        if (isAuthenticated || authBypass) {
          return <Component />;
        }

        // Only redirect if no authentication and no valid session
        return <Redirect to="/auth" />;
      }}
    </Route>
  );
}