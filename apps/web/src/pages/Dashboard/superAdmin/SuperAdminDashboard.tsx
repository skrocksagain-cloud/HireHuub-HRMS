import GreetingHeroCard from '../common/GreetingHeroCard';
import LiveStatusStrip from '../common/LiveStatusStrip';
import FavoritesBar from '../common/FavoritesBar';
import LeaveBalanceWidget from '../widgets/LeaveBalanceWidget';
import EnterpriseKpiSnapshotWidget from '../widgets/EnterpriseKpiSnapshotWidget';
import OrganizationHealthWidget from '../widgets/OrganizationHealthWidget';
import UpcomingTasksWidget from '../widgets/UpcomingTasksWidget';
import EventsWidget from '../widgets/EventsWidget';
import AnnouncementsWidget from '../widgets/AnnouncementsWidget';
import MiniCalendarWidget from '../widgets/MiniCalendarWidget';
import RecentActivityTimeline from '../widgets/RecentActivityTimeline';
import QuickActionsWidget from '../widgets/QuickActionsWidget';
import type { useDashboard } from '../../../hooks/useDashboard';

interface WorkspaceDashboardProps {
  dashboard: ReturnType<typeof useDashboard>;
}

export default function SuperAdminDashboard({ dashboard }: WorkspaceDashboardProps) {
  return (
    <div className="space-y-6">
      <LiveStatusStrip metrics={dashboard.statusMetrics} />
      <GreetingHeroCard serverTime={dashboard.serverTime} departmentName="Executive Management & Governance" designation="Super Admin" />
      <FavoritesBar />

      <OrganizationHealthWidget />
      <EnterpriseKpiSnapshotWidget kpis={dashboard.kpis} ranking={dashboard.ranking} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <QuickActionsWidget />
          <UpcomingTasksWidget />
          <RecentActivityTimeline activities={dashboard.recentActivities} />
          <AnnouncementsWidget announcements={dashboard.announcements} />
        </div>

        <div className="space-y-6">
          {/* Note: Super Admin explicitly does NOT see AttendanceWidget */}
          <LeaveBalanceWidget leaveBalance={dashboard.leaveBalance} />
          <EventsWidget />
          <MiniCalendarWidget events={dashboard.calendarEvents} />
        </div>
      </div>
    </div>
  );
}
