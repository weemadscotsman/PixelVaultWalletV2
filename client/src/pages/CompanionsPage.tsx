import { PageLayout } from "@/components/layout/PageLayout";
import { CompanionDashboard } from "@/components/companions/CompanionDashboard";
import { useAuth } from "@/hooks/use-auth";

export default function CompanionsPage() {
  const { isAuthenticated } = useAuth();

  return (
    <PageLayout isConnected={isAuthenticated}>
      <CompanionDashboard />
    </PageLayout>
  );
}