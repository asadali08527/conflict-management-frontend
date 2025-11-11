import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/panelist/dashboardService';
import { PaginationParams } from '@/services/panelist/api';

export const usePanelistDashboard = () => {
  // Get dashboard stats with optimized refetch strategy
  const statsQuery = useQuery({
    queryKey: ['panelist-dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 60000, // Increased to 60 seconds (was 30)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchIntervalInBackground: false, // Don't poll in background
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Get recent activity with optimized refetch strategy
  const activityQuery = useQuery({
    queryKey: ['panelist-recent-activity'],
    queryFn: () => dashboardService.getRecentActivity({ limit: 20 }),
    refetchInterval: 120000, // Increased to 2 minutes (was 60s)
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    staleTime: 60000,
  });

  // Get upcoming meetings with optimized refetch strategy
  const upcomingMeetingsQuery = useQuery({
    queryKey: ['panelist-upcoming-meetings'],
    queryFn: () => dashboardService.getUpcomingMeetings({ limit: 10 }),
    refetchInterval: 120000, // Increased to 2 minutes (was 60s)
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    staleTime: 60000,
  });

  return {
    stats: statsQuery.data?.data,
    isLoadingStats: statsQuery.isLoading,
    statsError: statsQuery.error,

    activities: activityQuery.data?.data?.activities || [],
    activityCount: activityQuery.data?.data?.count || 0,
    isLoadingActivity: activityQuery.isLoading,
    activityError: activityQuery.error,

    upcomingMeetings: upcomingMeetingsQuery.data?.data?.meetings || [],
    isLoadingMeetings: upcomingMeetingsQuery.isLoading,
    meetingsError: upcomingMeetingsQuery.error,

    refetchAll: () => {
      statsQuery.refetch();
      activityQuery.refetch();
      upcomingMeetingsQuery.refetch();
    },
  };
};
