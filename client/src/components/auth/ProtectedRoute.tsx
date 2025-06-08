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

  // Prevent immediate redirects by ensuring auth has been properly checked
  React.useEffect(() => {
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

        // Check for stored authentication before redirecting
        const savedWallet = localStorage.getItem('activeWallet');
        const savedToken = localStorage.getItem('sessionToken');
        
        if (!isAuthenticated && (!savedWallet || !savedToken)) {
          return <Redirect to="/auth" />;
        }

        return <Component />;
      }}
    </Route>
  );
}