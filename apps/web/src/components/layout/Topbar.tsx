import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronRight,
  User,
  Shield,
  Building,
  CheckCircle2,
  Clock,
  X,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";

export default function Topbar() {
  const { pathname } = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Generate dynamic breadcrumb segments from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return { label, url };
  });

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 transition-all shadow-xs">
      
      {/* Left Area: Breadcrumb Trail */}
      <div className="flex items-center gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to="/dashboard" className="hover:text-emerald-600 transition flex items-center gap-1">
            <Building size={14} className="text-slate-400" />
            <span>Home</span>
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.url} className="flex items-center gap-1.5">
              <ChevronRight size={12} className="text-slate-400 shrink-0" />
              {i === breadcrumbs.length - 1 ? (
                <span className="text-slate-900 font-semibold">{crumb.label}</span>
              ) : (
                <Link to={crumb.url} className="hover:text-emerald-600 transition">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Middle Area: Global Search Placeholder */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, clients, invoices, records..."
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-12 py-2 border border-slate-200/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 border border-slate-300/60 px-1.5 py-0.5 rounded-md">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Area: Status Badges, Notifications, Profile */}
      <div className="flex items-center gap-4">

        {/* Company Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Hire Huub One</span>
        </div>

        {/* Role Badge */}
        <div className="hidden sm:flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-full text-xs font-semibold">
          <Shield size={12} className="text-emerald-600" />
          <span>Super Admin</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">2 New</span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3 hover:bg-slate-50 transition cursor-pointer flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Invoice Draft Approved</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Client Acme Corp invoice #HH2026-0004 approved.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50 transition cursor-pointer flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">2 Leave Requests Pending</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Rahul Verma and Priya Sharma submitted leave requests.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 px-4 text-center">
                <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="h-8 w-8 rounded-full bg-slate-900 text-emerald-400 font-bold text-xs flex items-center justify-center border border-slate-700 shadow-xs">
              S
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800">Somnath</span>
              <span className="text-[10px] text-slate-500 font-medium">Administrator</span>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">Somnath</p>
                <p className="text-slate-500 text-[11px] truncate">somnath@hirehuub.com</p>
              </div>
              <div className="py-1">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition">
                  <User size={14} />
                  <span>My Profile</span>
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition">
                  <Settings size={14} />
                  <span>Preferences</span>
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition font-medium">
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}