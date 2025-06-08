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
    console.log(`[PROTECTED_ROUTE] Checking auth for path: ${path}`);
    console.log(`[PROTECTED_ROUTE] isAuthenticated: ${isAuthenticated}, isLoading: ${isLoading}`);
    
    const savedWallet = localStorage.getItem('activeWallet');
    const savedToken = localStorage.getItem('sessionToken');
    
    console.log(`[PROTECTED_ROUTE] Saved wallet: ${savedWallet}, token exists: ${!!savedToken}`);
    
    if (savedWallet && savedToken) {
      console.log(`[PROTECTED_ROUTE] Setting auth bypass for valid session`);
      setAuthBypass(true);
    }
    
    if (!isLoading) {
      console.log(`[PROTECTED_ROUTE] Auth check complete`);
      setHasCheckedAuth(true);
    }
  }, [isLoading, isAuthenticated, path]);

  return (
    <Route path={path}>
      {() => {
        console.log(`[PROTECTED_ROUTE] Rendering route ${path} - isLoading: ${isLoading}, hasCheckedAuth: ${hasCheckedAuth}, isAuthenticated: ${isAuthenticated}, authBypass: ${authBypass}`);
        
        // Show loading while authentication is being determined
        if (isLoading || !hasCheckedAuth) {
          console.log(`[PROTECTED_ROUTE] Showing loading spinner`);
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          );
        }

        // Allow access if authenticated OR has valid session tokens
        if (isAuthenticated || authBypass) {
          console.log(`[PROTECTED_ROUTE] Allowing access to ${path}`);
          return <Component />;
        }

        // Only redirect if no authentication and no valid session
        console.log(`[PROTECTED_ROUTE] Redirecting to /auth from ${path}`);
        return <Redirect to="/auth" />;
      }}
    </Route>
  );
}