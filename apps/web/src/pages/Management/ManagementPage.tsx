import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../ui/PageHeader';
import {
  Building2,
  Building,
  Briefcase,
  Shield,
  ShieldCheck,
  GitFork,
  Network,
  FileText,
  Sparkles,
  Database,
  Bell,
  ShieldAlert,
  History,
} from 'lucide-react';

import CompanySettingsTab from './components/CompanySettingsTab';
import DepartmentManagementTab from './components/DepartmentManagementTab';
import DesignationMasterTab from './components/DesignationMasterTab';
import RoleManagementTab from './components/RoleManagementTab';
import PermissionMatrixTab from './components/PermissionMatrixTab';
import HierarchyManagementTab from './components/HierarchyManagementTab';
import WorkflowEngineTab from './components/WorkflowEngineTab';
import DocumentTemplateTab from './components/DocumentTemplateTab';
import BigDayTab from './components/BigDayTab';
import MasterDataTab from './components/MasterDataTab';
import NotificationSettingsTab from './components/NotificationSettingsTab';
import SecurityManagementTab from './components/SecurityManagementTab';
import AuditLogsTab from './components/AuditLogsTab';

const ADMIN_TABS = [
  { id: 'company', label: 'Company Settings', icon: <Building2 size={16} /> },
  { id: 'departments', label: 'Departments', icon: <Building size={16} /> },
  { id: 'designations', label: 'Designations', icon: <Briefcase size={16} /> },
  { id: 'roles', label: 'Roles Master', icon: <Shield size={16} /> },
  { id: 'permissions', label: 'Permission Matrix', icon: <ShieldCheck size={16} /> },
  { id: 'hierarchy', label: 'Hierarchy', icon: <GitFork size={16} /> },
  { id: 'workflows', label: 'Workflow Engine', icon: <Network size={16} /> },
  { id: 'templates', label: 'Document Templates', icon: <FileText size={16} /> },
  { id: 'bigday', label: 'Big Day Rules', icon: <Sparkles size={16} /> },
  { id: 'masterdata', label: 'Master Data', icon: <Database size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'security', label: 'Security & Resets', icon: <ShieldAlert size={16} /> },
  { id: 'audit', label: 'Audit Trail', icon: <History size={16} /> },
];

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<string>('company');

  function renderTabContent() {
    switch (activeTab) {
      case 'company':
        return <CompanySettingsTab />;
      case 'departments':
        return <DepartmentManagementTab />;
      case 'designations':
        return <DesignationMasterTab />;
      case 'roles':
        return <RoleManagementTab />;
      case 'permissions':
        return <PermissionMatrixTab />;
      case 'hierarchy':
        return <HierarchyManagementTab />;
      case 'workflows':
        return <WorkflowEngineTab />;
      case 'templates':
        return <DocumentTemplateTab />;
      case 'bigday':
        return <BigDayTab />;
      case 'masterdata':
        return <MasterDataTab />;
      case 'notifications':
        return <NotificationSettingsTab />;
      case 'security':
        return <SecurityManagementTab />;
      case 'audit':
        return <AuditLogsTab />;
      default:
        return <CompanySettingsTab />;
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Management & Admin Control Center"
          description="Single Source of Truth for Company, Master Data, Hierarchy, Permissions, Workflows, Templates, Big Day, Security, and Audit."
        />

        {/* Horizontal Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5 overflow-x-auto">
          {ADMIN_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content View */}
        <div>{renderTabContent()}</div>
      </div>
    </DashboardLayout>
  );
}
