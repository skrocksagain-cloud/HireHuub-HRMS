import { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Briefcase, Users, Building2 } from 'lucide-react';
import CrmWorkspacePage from './crm/pages/CrmWorkspacePage';
import CrmOpeningsView from './crm/views/CrmOpeningsView';
import CrmClientView from './crm/views/CrmClientView';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function StaffingHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL query, default to 'crm'
  const activeTab = searchParams.get('tab') || 'crm';

  const handleTabChange = (tab: string) => {
    // Ensure we are on the CRM path
    if (!location.pathname.includes('/workbench/crm')) {
      navigate(`/workbench/crm?tab=${tab}`);
    } else {
      setSearchParams({ tab });
    }
  };

  // If someone lands on the root /workbench/staffing-hub, push them to /workbench/crm
  useEffect(() => {
    if (location.pathname === '/workbench/staffing-hub' || location.pathname === '/workbench/staffing-hub/') {
      navigate('/workbench/crm?tab=crm', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Sub Navigation Bar for CRM */}
        <div className="bg-white px-6 pt-3 pb-0 border-b border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="flex space-x-6 whitespace-nowrap overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange('crm')}
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'crm'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={16} /> CRM Workspace
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('openings')}
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'openings'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase size={16} /> Openings
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('client')}
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'client'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 size={16} /> Client
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'crm' && <CrmWorkspacePage embedLayout={false} />}
          {activeTab === 'openings' && <CrmOpeningsView />}
          {activeTab === 'client' && <CrmClientView />}
        </div>
      </div>
    </DashboardLayout>
  );
}

