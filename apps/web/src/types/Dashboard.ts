export interface KpiMetric {
  id: string;
  title: string;
  value: string | number;
  subtext: string;
  change: string;
  trend: 'up' | 'down' | 'neutral' | 'action';
  category: 'people' | 'workforce' | 'attendance' | 'vacancies' | 'interviews' | 'candidates' | 'invoices' | 'finance';
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'Client' | 'Employee' | 'Finance' | 'Network' | 'Management';
}

export interface BigDayNotification {
  id: string;
  personName: string;
  eventType: 'Birthday' | 'Work Anniversary' | 'Client Anniversary' | 'Associate Partner Anniversary';
  subtitle: string;
  dateLabel: string;
}

export interface PendingApproval {
  id: string;
  title: string;
  requester: string;
  details: string;
  type: 'Leave' | 'Expense' | 'Offer' | 'Contract';
}

export interface FollowUpItem {
  id: string;
  title: string;
  scheduledTime: string;
  ownerRole: string;
}

export interface DashboardDataState {
  currentSystemDate: string;
  currentGreeting: string;
  kpis: KpiMetric[];
  activities: ActivityItem[];
  bigDays: BigDayNotification[];
  approvals: PendingApproval[];
  followUps: FollowUpItem[];
  isLoading: boolean;
}
