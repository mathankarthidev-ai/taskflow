import { DashboardOverview } from '@/features/dashboard/DashboardOverview';

export const metadata = {
  title: 'Dashboard | Bizy Hub',
  description: 'Internal workspace task management dashboard overview.',
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
