import GreetingHeroCard from '../common/GreetingHeroCard';
import LiveStatusStrip from '../common/LiveStatusStrip';
import FavoritesBar from '../common/FavoritesBar';
import AttendanceWidget from '../widgets/AttendanceWidget';
import LeaveBalanceWidget from '../widgets/LeaveBalanceWidget';
import EnterpriseKpiSnapshotWidget from '../widgets/EnterpriseKpiSnapshotWidget';
import UpcomingTasksWidget from '../widgets/UpcomingTasksWidget';
import EventsWidget from '../widgets/EventsWidget';
import AnnouncementsWidget from '../widgets/AnnouncementsWidget';
import MiniCalendarWidget from '../widgets/MiniCalendarWidget';
import RecentActivityTimeline from '../widgets/RecentActivityTimeline';
import QuickActionsWidget from '../widgets/QuickActionsWidget';
import type { useDashboard } from '../../../hooks/useDashboard';
import { usePermissions } from '../../../hooks/usePermissions';

interface WorkspaceDashboardProps {
  dashboard: ReturnType<typeof useDashboard>;
}

export default function FinanceDashboard({ dashboard }: WorkspaceDashboardProps) {
  const { canView } = usePermissions();
  return (
    <div className="space-y-6">
      <LiveStatusStrip metrics={dashboard.statusMetrics} />
      <GreetingHeroCard serverTime={dashboard.serverTime} departmentName="Finance & Corporate Accounts" designation="Finance Lead" />
      <FavoritesBar />

      <EnterpriseKpiSnapshotWidget kpis={dashboard.kpis} ranking={dashboard.ranking} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <QuickActionsWidget />
          <UpcomingTasksWidget />
          {canView('management') && <RecentActivityTimeline activities={dashboard.recentActivities} />}
          {canView('announcement') && <AnnouncementsWidget announcements={dashboard.announcements} />}
        </div>

        <div className="space-y-6">
          {canView('attendance') && (
            <AttendanceWidget
              attendance={dashboard.attendance}
              isSignedIn={dashboard.isSignedIn}
              isSignedOut={dashboard.isSignedOut}
              isSuperAdmin={dashboard.isSuperAdmin}
              workingDurationFormatted={dashboard.workingDurationFormatted}
              expectedLogoutTime={dashboard.expectedLogoutTime}
              onSignIn={dashboard.signIn}
              onSignOut={dashboard.signOut}
            />
          )}
          {canView('leave') && <LeaveBalanceWidget leaveBalance={dashboard.leaveBalance} />}
          {canView('calendar and Events') && <EventsWidget />}
          {canView('calendar and Events') && <MiniCalendarWidget events={dashboard.calendarEvents} />}
        </div>
      </div>
    </div>
  );
}
