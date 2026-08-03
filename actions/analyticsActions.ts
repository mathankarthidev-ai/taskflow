'use server';

import { getAnalyticsData } from '@/services/analyticsService';
import { TeamName } from '@/types';

export async function fetchAnalyticsAction(teamFilter?: TeamName) {
  return await getAnalyticsData(teamFilter);
}
