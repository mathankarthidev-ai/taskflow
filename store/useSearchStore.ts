import { create } from 'zustand';

interface SearchState {
  isOpen: boolean;
  query: string;
  setIsOpen: (isOpen: boolean) => void;
  setQuery: (query: string) => void;
  toggleSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: '',
  setIsOpen: (isOpen) => set({ isOpen }),
  setQuery: (query) => set({ query }),
  toggleSearch: () => set((state) => ({ isOpen: !state.isOpen })),
}));
