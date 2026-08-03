import { IncomingQueue } from '@/features/incoming/IncomingQueue';

export const metadata = {
  title: 'Incoming Queue | TaskFlow SaaS',
  description: 'Team lead queue for reviewing and assigning cross-team tasks.',
};

export default function IncomingPage() {
  return <IncomingQueue />;
}
