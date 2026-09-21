import { create } from 'zustand';
import { CompanyBranch } from '@/types';

interface CompanyState {
  selectedCompany: CompanyBranch;
  setSelectedCompany: (company: CompanyBranch) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  selectedCompany: 'Ambizcon - Australia',
  setSelectedCompany: (company: CompanyBranch) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ambizcon_selected_company', company);
      } catch (e) {}
    }
    set({ selectedCompany: company });
  },
}));
