import { create } from 'zustand';
import { CompanyBranch } from '@/types';

interface CompanyState {
  selectedCompany: CompanyBranch;
  setSelectedCompany: (company: CompanyBranch) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  selectedCompany:
    typeof window !== 'undefined' && localStorage.getItem('ambizcon_selected_company') === 'Ambizcon - Australia'
      ? 'Ambizcon - Australia'
      : 'Ambizcon Health - India',
  setSelectedCompany: (company: CompanyBranch) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambizcon_selected_company', company);
    }
    set({ selectedCompany: company });
  },
}));
