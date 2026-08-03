import { create } from 'zustand';
import { Task, TaskPriority, TaskStatus, TeamName } from '@/types';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isCreateModalOpen: boolean;
  isDetailModalOpen: boolean;
  
  // Filters
  searchQuery: string;
  selectedTeam: TeamName | 'All';
  selectedStatus: TaskStatus | 'All';
  selectedPriority: TaskPriority | 'All';
  selectedAssignee: string | 'All';

  // Actions
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setDetailModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTeam: (team: TeamName | 'All') => void;
  setSelectedStatus: (status: TaskStatus | 'All') => void;
  setSelectedPriority: (priority: TaskPriority | 'All') => void;
  setSelectedAssignee: (assignee: string | 'All') => void;
  resetFilters: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  selectedTask: null,
  isCreateModalOpen: false,
  isDetailModalOpen: false,

  searchQuery: '',
  selectedTeam: 'All',
  selectedStatus: 'All',
  selectedPriority: 'All',
  selectedAssignee: 'All',

  setTasks: (tasks) => set({ tasks }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setDetailModalOpen: (open) => set({ isDetailModalOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTeam: (team) => set({ selectedTeam: team }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSelectedPriority: (priority) => set({ selectedPriority: priority }),
  setSelectedAssignee: (assignee) => set({ selectedAssignee: assignee }),
  resetFilters: () =>
    set({
      searchQuery: '',
      selectedTeam: 'All',
      selectedStatus: 'All',
      selectedPriority: 'All',
      selectedAssignee: 'All',
    }),
}));
