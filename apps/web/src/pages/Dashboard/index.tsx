import DashboardLayout from "../../layouts/DashboardLayout";
import { Link } from "react-router-dom";
import { useDashboardData } from "../../hooks/useDashboardData";
import {
  Users,
  UsersRound,
  CalendarCheck,
  Briefcase,
  Calendar,
  UserCheck,
  FileText,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Gift,
  Clock,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Building2,
  UserPlus,
} from "lucide-react";
import KpiCard from "../../ui/KpiCard";
import Timeline from "../../ui/Timeline";
import QuickActionCard from "../../ui/QuickActionCard";
import SectionHeader from "../../ui/SectionHeader";
import StatusBadge from "../../ui/StatusBadge";

export default function Dashboard() {
  const { currentGreeting, currentSystemDate, kpis, activities, bigDays, approvals, followUps } = useDashboardData();

  // Helper icon map for 8 KPI Cards
  const getKpiIcon = (id: string) => {
    switch (id) {
      case 'total-employees':
        return { icon: <Users size={20} className="text-emerald-600" />, badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'active-workforce':
        return { icon: <UsersRound size={20} className="text-teal-600" />, badgeBg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'todays-attendance':
        return { icon: <CalendarCheck size={20} className="text-indigo-600" />, badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'open-vacancies':
        return { icon: <Briefcase size={20} className="text-amber-600" />, badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'interviews-today':
        return { icon: <Calendar size={20} className="text-cyan-600" />, badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'candidates-joined':
        return { icon: <UserCheck size={20} className="text-blue-600" />, badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'pending-invoices':
        return { icon: <FileText size={20} className="text-purple-600" />, badgeBg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { icon: <AlertCircle size={20} className="text-rose-600" />, badgeBg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
  };

  return (
    <DashboardLayout>
      
      {/* Dynamic Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles size={14} />
              <span>Hire Huub One</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {currentGreeting}, Somnath
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-xl font-medium">
              System Date: <span className="text-slate-200 font-semibold">{currentSystemDate}</span> • Business Snapshot across People, Workbench Network, and Finance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/workbench/network/clients"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
            >
              <Plus size={16} />
              <span>Add Client</span>
            </Link>
            <Link
              to="/finance/billing/new-invoice"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
            >
              <span>New Invoice</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((metric) => {
          const { icon, badgeBg } = getKpiIcon(metric.id);
          return <KpiCard key={metric.id} metric={metric} icon={icon} badgeBg={badgeBg} />;
        })}
      </div>

      {/* 5 Main Dashboard Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2 Cols wide on desktop): Quick Actions + Recent Activity + Approvals */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <SectionHeader title="Quick Actions" icon={<TrendingUp size={16} />} subtitle="Fast shortcuts for common workflows" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickActionCard title="Add Client" to="/workbench/network/clients" icon={<Building2 size={20} />} colorScheme="emerald" />
              <QuickActionCard title="Add Partner" to="/workbench/network/associate-partners" icon={<UserPlus size={20} />} colorScheme="blue" />
              <QuickActionCard title="Add Employee" to="/employees" icon={<UserCheck size={20} />} colorScheme="purple" />
              <QuickActionCard title="Create Opening" to="/workbench/staffing-hub/openings" icon={<Briefcase size={20} />} colorScheme="amber" />
            </div>
          </div>

          {/* Section 2: Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <SectionHeader
              title="Recent Activity"
              icon={<Clock size={16} />}
              subtitle="Real-time log across Client, Employee, Finance, Network & Management"
              actionSlot={<span className="text-xs text-slate-400 font-medium">Live Feed</span>}
            />
            <Timeline items={activities} />
          </div>

          {/* Section 3: Pending Approvals */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <SectionHeader
              title="Pending Approvals"
              icon={<CheckCircle2 size={16} className="text-amber-600" />}
              actionSlot={<StatusBadge status={`${approvals.length} Action Required`} variant="urgent" />}
            />
            <div className="space-y-3">
              {approvals.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{app.title}</span>
                    <span className="text-xs text-slate-500 block mt-0.5">{app.requester}</span>
                    <span className="text-[11px] font-medium text-amber-600 mt-1 block">{app.details}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition">
                      Approve
                    </button>
                    <button className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1 Col wide on desktop): Big Day Notifications + Upcoming Follow-ups */}
        <div className="space-y-6">

          {/* Section 4: Signature Big Day Notifications */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <SectionHeader title="Big Day Notifications" icon={<Gift size={16} className="text-rose-600" />} subtitle="Signature milestone celebrations" />
            <div className="space-y-3">
              {bigDays.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-emerald-50/30 border border-rose-100/80"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{evt.personName}</span>
                    <StatusBadge status={evt.dateLabel} variant="urgent" />
                  </div>
                  <p className="text-xs font-semibold text-rose-700 mt-1">{evt.eventType} 🎉</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{evt.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Upcoming Follow-ups & Today's Interviews */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <SectionHeader title="Upcoming Follow-ups" icon={<Clock size={16} className="text-indigo-600" />} />
            <div className="space-y-3">
              {followUps.map((fol) => (
                <div
                  key={fol.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-100/60 transition"
                >
                  <p className="text-xs font-bold text-slate-800 leading-snug">{fol.title}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                    <span className="text-indigo-600 font-semibold">{fol.scheduledTime}</span>
                    <span className="text-slate-400 font-medium">{fol.ownerRole}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explore Workbench Module Promo */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-emerald-800/40">
            <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Workbench Module</h3>
            <p className="text-sm font-bold mt-1">Network & Associate Partners</p>
            <p className="text-xs text-slate-300 mt-1">Manage enterprise clients, multi-state GST records, and associate partner networks.</p>
            <Link
              to="/workbench/network/clients"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white transition"
            >
              <span>Explore Network</span>
              <ChevronRight size={14} />
            </Link>
          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}