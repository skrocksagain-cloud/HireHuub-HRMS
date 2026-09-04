import React from 'react';
import { LogOut, Building2, ShieldCheck } from 'lucide-react';
import { useGuestAuth } from '../../../context/GuestAuthContext';
import { useNavigate } from 'react-router-dom';
import { OneIcon } from '../../../components/OneIcon';

interface GuestPortalLayoutProps {
  children: React.ReactNode;
}

export default function GuestPortalLayout({ children }: GuestPortalLayoutProps) {
  const { guestSession, logoutGuest } = useGuestAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const token = guestSession?.token || '';
    logoutGuest();
    navigate(`/guest/login/${token}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 font-black shadow-xs tracking-wider border-2 border-emerald-500">
              <OneIcon className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">ONE</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 uppercase tracking-wider">
                  Guest Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Associate Partner Gateway</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Building2 size={15} className="text-emerald-400" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">
                  {guestSession?.partnerName || 'Associate Partner'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-medium">
                  {guestSession?.contactNumber ? `Contact: ******${guestSession.contactNumber.slice(-4)}` : 'Secure Access'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition"
              title="Sign Out of Portal"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>ONE Restricted Guest Access Layer</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Single Source of Truth Security Control • Read-Only External Projection
          </div>
        </div>
      </footer>
    </div>
  );
}
