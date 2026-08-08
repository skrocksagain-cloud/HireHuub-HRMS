import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Users } from 'lucide-react';
import OpeningsPage from './openings/pages/OpeningsPage';
import CrmWorkspacePage from './crm/pages/CrmWorkspacePage';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function StaffingHubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'openings' | 'crm'>('openings');

  // If sub-path requests CRM
  const isCrmPath = location.pathname.includes('/crm');

  if (isCrmPath || activeTab === 'crm') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Sub Navigation Bar for Staffing Hub: Openings & CRM */}
          <div className="bg-white px-6 pt-3 pb-0 border-b border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
            <div className="flex space-x-6 whitespace-nowrap">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('openings');
                  navigate('/workbench/staffing-hub/openings');
                }}
                className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  !isCrmPath && activeTab === 'openings'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Briefcase size={16} /> Openings
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('crm');
                  navigate('/workbench/staffing-hub/crm');
                }}
                className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  isCrmPath || activeTab === 'crm'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users size={16} /> CRM Workspace
              </button>
            </div>
          </div>

          <CrmWorkspacePage embedLayout={false} />
        </div>
      </DashboardLayout>
    );
  }

  return <OpeningsPage />;
}

