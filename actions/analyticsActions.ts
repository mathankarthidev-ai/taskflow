'use server';

import { getAnalyticsData } from '@/services/analyticsService';
import { TeamName } from '@/types';

export async function fetchAnalyticsAction(teamFilter?: TeamName, companyFilter?: string) {
  return await getAnalyticsData(teamFilter, companyFilter);
}
