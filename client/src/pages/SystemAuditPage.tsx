import { PageLayout } from "@/components/layout/PageLayout";
import { SystemConnectionAudit } from "@/components/audit/SystemConnectionAudit";
import { useAuth } from "@/hooks/use-auth";

export default function SystemAuditPage() {
  const { isAuthenticated } = useAuth();

  return (
    <PageLayout isConnected={isAuthenticated}>
      <SystemConnectionAudit />
    </PageLayout>
  );
}