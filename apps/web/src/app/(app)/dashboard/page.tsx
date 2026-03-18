import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard — HardGraph',
  description: 'Create and manage your interactive skill trees',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
