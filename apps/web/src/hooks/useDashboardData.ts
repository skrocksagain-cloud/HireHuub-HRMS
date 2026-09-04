import { useState, useEffect } from 'react';
import type { DashboardDataState, ActivityItem } from '../types/Dashboard';
import { dashboardRepository } from '../services/dashboard/repositories/dashboardRepository';

export function useDashboardData(): DashboardDataState {
  const [now, setNow] = useState<Date>(new Date());
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const auditLogs = await dashboardRepository.getRecentAuditLogs(10);
        if (isMounted) {
          const mapped: ActivityItem[] = auditLogs.map((log) => ({
            id: log.id,
            title: log.title,
            description: log.description,
            timestamp: log.timestamp,
            category: (['Client', 'Employee', 'Finance', 'Network', 'Management'].includes(log.category)
              ? log.category
              : 'Management') as ActivityItem['category'],
          }));
          setActivities(mapped);
        }
      } catch {
        if (isMounted) setActivities([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const hours = now.getHours();
  let currentGreeting = 'Good Morning';
  if (hours >= 12 && hours < 17) {
    currentGreeting = 'Good Afternoon';
  } else if (hours >= 17) {
    currentGreeting = 'Good Evening';
  }

  const currentSystemDate = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    currentSystemDate,
    currentGreeting,
    isLoading,
    kpis: [],
    activities,
    bigDays: [],
    approvals: [],
    followUps: [],
  };
}
