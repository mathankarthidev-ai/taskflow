import { KanbanBoard } from '@/features/kanban/KanbanBoard';

export const metadata = {
  title: 'Kanban Board | TaskFlow SaaS',
  description: 'Interactive Drag & Drop Kanban board with status columns and filters.',
};

export default function KanbanPage() {
  return <KanbanBoard />;
}
