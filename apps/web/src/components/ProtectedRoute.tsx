import React from 'react';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Loader2 } from 'lucide-react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  moduleKey?: string;
  pageKey?: string;
  path?: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({ moduleKey, pageKey, path, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { activeRole, canAccessModule, canAccessPage, canAccessRoute, landingModule } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600 mb-4" size={32} />
        <span className="text-slate-500 font-medium tracking-tight">Authenticating ONE Identity...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  const roleNameLower = (activeRole?.name || '').toLowerCase();
  if (roleNameLower === 'associate partner guest' || roleNameLower === 'associate_partner_guest') {
    return <Navigate to="/guest/associate-partner" replace />;
  }

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
