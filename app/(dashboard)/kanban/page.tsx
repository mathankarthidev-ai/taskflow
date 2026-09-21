import { KanbanBoard } from '@/features/kanban/KanbanBoard';

export const metadata = {
  title: 'Bizzy Board | Ambizcon Health',
  description: 'Interactive Drag & Drop Bizzy board with status columns and filters.',
};

export default function KanbanPage() {
  return <KanbanBoard />;
}
