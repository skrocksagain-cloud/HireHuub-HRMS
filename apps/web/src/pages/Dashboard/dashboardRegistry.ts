import React from 'react';
import SuperAdminDashboard from './superAdmin/SuperAdminDashboard';
import StaffingDashboard from './staffing/StaffingDashboard';
import FinanceDashboard from './finance/FinanceDashboard';
import MarketingDashboard from './marketing/MarketingDashboard';
import HRDashboard from './hr/HRDashboard';
import AdminDashboard from './admin/AdminDashboard';
import type { useDashboard } from '../../hooks/useDashboard';



export type DashboardComponentType = React.ComponentType<{ dashboard: ReturnType<typeof useDashboard> }>;

class DashboardRegistry {
  private registry: Map<string, DashboardComponentType> = new Map();
  private defaultDashboard: DashboardComponentType = StaffingDashboard;

  constructor() {
    this.register('super_admin', SuperAdminDashboard);
    this.register('admin', AdminDashboard);
    this.register('staffing', StaffingDashboard);
    this.register('recruitment', StaffingDashboard);
    this.register('finance', FinanceDashboard);
    this.register('marketing', MarketingDashboard);
    this.register('hr', HRDashboard);
  }

  register(key: string, component: DashboardComponentType): void {
    this.registry.set(key.toLowerCase(), component);
  }

  resolve(_role?: any | string): DashboardComponentType {
    // Authorization is in bypass mode (AUTHORIZATION_ENABLED = false)
    // Return default dashboard. When authorization is enabled, use role to resolve dashboard.
    return this.defaultDashboard;
  }

  renderDashboard(role?: any | string, dashboard?: ReturnType<typeof useDashboard>): React.ReactNode {
    const Component = this.resolve(role);
    return dashboard ? React.createElement(Component, { dashboard }) : null;
  }
}

export const dashboardRegistry = new DashboardRegistry();
