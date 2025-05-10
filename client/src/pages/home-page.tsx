import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function HomePage() {
  return (
    <PageLayout isConnected={true}>
      <Dashboard />
    </PageLayout>
  );
}