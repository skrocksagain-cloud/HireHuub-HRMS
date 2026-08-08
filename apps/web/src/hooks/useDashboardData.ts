import { useState, useEffect } from 'react';
import type { DashboardDataState } from '../types/Dashboard';

export function useDashboardData(): DashboardDataState {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
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
    isLoading: false,
    kpis: [
      {
        id: 'total-employees',
        title: 'Total Employees',
        value: 142,
        subtext: '+4 joined this month',
        change: '+2.9%',
        trend: 'up',
        category: 'people',
      },
      {
        id: 'active-workforce',
        title: 'Active Workforce',
        value: 128,
        subtext: '90.1% deployment rate',
        change: 'Stable',
        trend: 'neutral',
        category: 'workforce',
      },
      {
        id: 'todays-attendance',
        title: "Today's Attendance",
        value: '118 / 128',
        subtext: '92% present today',
        change: '+1.2%',
        trend: 'up',
        category: 'attendance',
      },
      {
        id: 'open-vacancies',
        title: 'Open Vacancies',
        value: 12,
        subtext: '4 urgent requisitions',
        change: 'Active',
        trend: 'action',
        category: 'vacancies',
      },
      {
        id: 'interviews-today',
        title: 'Interviews Today',
        value: 8,
        subtext: '3 completed, 5 pending',
        change: 'Scheduled',
        trend: 'neutral',
        category: 'interviews',
      },
      {
        id: 'candidates-joined',
        title: 'Candidates Joined',
        value: 6,
        subtext: 'Joined this week',
        change: '+3 vs last week',
        trend: 'up',
        category: 'candidates',
      },
      {
        id: 'pending-invoices',
        title: 'Pending Invoices',
        value: 14,
        subtext: '₹18.4L total value',
        change: 'Action Required',
        trend: 'action',
        category: 'invoices',
      },
      {
        id: 'outstanding-amount',
        title: 'Outstanding Amount',
        value: '₹4.2L',
        subtext: 'Overdue > 30 days',
        change: 'Attention',
        trend: 'down',
        category: 'finance',
      },
    ],
    activities: [
      {
        id: 'act-1',
        title: 'New Client Onboarded',
        description: 'Acme Tech Solutions registered in Workbench Network',
        timestamp: '25 mins ago',
        category: 'Client',
      },
      {
        id: 'act-2',
        title: 'Invoice #HH2026-0004 Generated',
        description: 'Monthly staffing bill generated for Apex Systems (₹3.4L)',
        timestamp: '1 hour ago',
        category: 'Finance',
      },
      {
        id: 'act-3',
        title: 'Offer Letter Released',
        description: 'Offer sent to Senior Frontend Engineer candidate',
        timestamp: '3 hours ago',
        category: 'Employee',
      },
      {
        id: 'act-[#4]',
        title: 'Associate Partner Agreement Signed',
        description: 'Global Talent Partners added to Associate Partner Network',
        timestamp: '5 hours ago',
        category: 'Network',
      },
    ],
    bigDays: [
      {
        id: 'bd-1',
        personName: 'Vikram Sharma',
        eventType: 'Birthday',
        subtitle: 'Lead Software Architect',
        dateLabel: 'Today',
      },
      {
        id: 'bd-2',
        personName: 'Ananya Roy',
        eventType: 'Work Anniversary',
        subtitle: '3-Year Milestone • Senior Talent Partner',
        dateLabel: 'Tomorrow',
      },
      {
        id: 'bd-3',
        personName: 'Acme Tech Solutions',
        eventType: 'Client Anniversary',
        subtitle: '2 Years Partnership Milestone',
        dateLabel: 'Aug 5',
      },
      {
        id: 'bd-4',
        personName: 'Nexus Associate Network',
        eventType: 'Associate Partner Anniversary',
        subtitle: '1 Year Successful Collaboration',
        dateLabel: 'Aug 8',
      },
    ],
    approvals: [
      {
        id: 'app-1',
        title: 'Casual Leave Request',
        requester: 'Amit Kumar (Software Engineer)',
        details: '2 Days (Aug 3 - Aug 4)',
        type: 'Leave',
      },
      {
        id: 'app-2',
        title: 'Travel Expense Claim',
        requester: 'Neha Gupta (Client Lead)',
        details: '₹12,450 — Client Visit Reimbursement',
        type: 'Expense',
      },
    ],
    followUps: [
      {
        id: 'fol-1',
        title: 'Quarterly Business Review with Enterprise Client',
        scheduledTime: 'Today, 4:00 PM',
        ownerRole: 'Account Manager',
      },
      {
        id: 'fol-2',
        title: 'Candidate Final Technical Interview',
        scheduledTime: 'Tomorrow, 11:30 AM',
        ownerRole: 'Engineering Lead',
      },
    ],
  };
}
