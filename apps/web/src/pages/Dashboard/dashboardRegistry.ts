import React from 'react';
import SuperAdminDashboard from './superAdmin/SuperAdminDashboard';
import StaffingDashboard from './staffing/StaffingDashboard';
import FinanceDashboard from './finance/FinanceDashboard';
import MarketingDashboard from './marketing/MarketingDashboard';
import HRDashboard from './hr/HRDashboard';
import AdminDashboard from './admin/AdminDashboard';
import type { useDashboard } from '../../hooks/useDashboard';
import type { RoleItem } from '../../types/Admin';
import { permissionService } from '../../core/permissions/permissionService';

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

  resolve(role?: RoleItem | string): DashboardComponentType {
    const active = permissionService.getEffectiveRole(role);

    if (permissionService.isSuperAdmin(active)) {
      return SuperAdminDashboard;
    }

    if (active.name.toLowerCase().includes('finance')) {
      return FinanceDashboard;
    }

    if (active.name.toLowerCase().includes('marketing')) {
      return MarketingDashboard;
    }

    if (active.name.toLowerCase().includes('hr') || active.name.toLowerCase().includes('people')) {
      return HRDashboard;
    }

    if (active.name.toLowerCase().includes('admin') || active.viewScope === 'Departments') {
      return AdminDashboard;
    }

    if (permissionService.canAccessModule(active, 'recruitment') || active.name.toLowerCase().includes('staffing')) {
      return StaffingDashboard;
    }

    return this.defaultDashboard;
  }

  renderDashboard(role?: RoleItem | string, dashboard?: ReturnType<typeof useDashboard>): React.ReactNode {
    const Component = this.resolve(role);
    return dashboard ? React.createElement(Component, { dashboard }) : null;
  }
}

export const dashboardRegistry = new DashboardRegistry();
