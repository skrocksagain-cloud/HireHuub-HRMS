import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../ui/PageHeader';
import {
  Building2,
  Building,
  Briefcase,
  Shield,
  FileText,
  Sparkles,
  TrendingUp,
  Database,
  Bell,
  ShieldAlert,
  History,
} from 'lucide-react';

import CompanySettingsTab from './components/CompanySettingsTab';
import DepartmentManagementTab from './components/DepartmentManagementTab';
import DesignationMasterTab from './components/DesignationMasterTab';
import RolesAndAccessTab from './components/RolesAndAccessTab';
import DocumentTemplateTab from './components/DocumentTemplateTab';
import BigDayTab from './components/BigDayTab';
import IncentiveTab from './components/IncentiveTab';
import MasterDataTab from './components/MasterDataTab';
import NotificationSettingsTab from './components/NotificationSettingsTab';
import SecurityManagementTab from './components/SecurityManagementTab';
import AuditLogsTab from './components/AuditLogsTab';

const ADMIN_TABS = [
  { id: 'company', label: 'Company Settings', icon: <Building2 size={16} /> },
  { id: 'departments', label: 'Departments', icon: <Building size={16} /> },
  { id: 'designations', label: 'Designations', icon: <Briefcase size={16} /> },
  { id: 'roles_access', label: 'Roles & Access', icon: <Shield size={16} /> },
  { id: 'templates', label: 'Document Templates', icon: <FileText size={16} /> },
  { id: 'bigday', label: 'Big Day Rules', icon: <Sparkles size={16} /> },
  { id: 'incentive', label: 'Incentive Rules', icon: <TrendingUp size={16} /> },
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
      case 'roles_access':
        return <RolesAndAccessTab />;
      case 'templates':
        return <DocumentTemplateTab />;
      case 'bigday':
        return <BigDayTab />;
      case 'incentive':
        return <IncentiveTab />;
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
          title="Administration & Management Control"
          description="Single Source of Truth for Company, Master Data, Roles & Access, Templates, Big Day, Incentive Rules, Security, and Audit."
        />

        {/* Tab Selection Bar */}
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-1">
          {ADMIN_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Render Tab Content */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
