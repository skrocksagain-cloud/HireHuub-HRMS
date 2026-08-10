import React from 'react';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import DashboardLayout from '../layouts/DashboardLayout';

interface ProtectedRouteProps {
  moduleKey?: string;
  pageKey?: string;
  path?: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({ moduleKey, pageKey, path, children }: ProtectedRouteProps) {
  const { activeRole, canAccessModule, canAccessPage, canAccessRoute, landingModule } = usePermissions();
  const navigate = useNavigate();

  let isAuthorized = true;

  if (moduleKey) {
    isAuthorized = canAccessModule(moduleKey);
  } else if (pageKey) {
    isAuthorized = canAccessPage(pageKey);
  } else if (path) {
    isAuthorized = canAccessRoute(path);
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-600 mb-6 shadow-sm">
            <ShieldAlert size={48} />
          </div>

          <div className="space-y-3 max-w-md">
            <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-mono font-bold rounded-full uppercase tracking-wider">
              403 Access Denied
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Enterprise Authorization Restriction
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your assigned role (<strong className="text-slate-900 font-semibold">{activeRole.name}</strong>) does not have sufficient data access permissions to view the requested route or module (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">{moduleKey || path || 'Restricted Module'}</code>).
            </p>
            <p className="text-xs text-slate-400 italic">
              Access attempts are logged into security audit logs under single source of truth ERP control.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <button
              type="button"
              onClick={() => navigate(landingModule)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs"
            >
              <LayoutDashboard size={16} /> Return to Authorized Workspace
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <>{children}</>;
}
