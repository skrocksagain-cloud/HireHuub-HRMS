import { Link } from 'react-router-dom';
import { Users, Briefcase, DollarSign, Calendar, Clock, FileText, Star } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';

export default function FavoritesBar() {
  const { canAccessModule } = usePermissions();

  const favoriteLinks = [
    { title: 'Employees', path: '/workbench/workforce', module: 'employees', icon: <Users size={16} /> },
    { title: 'Recruitment', path: '/staffing-hub', module: 'recruitment', icon: <Briefcase size={16} /> },
    { title: 'Finance', path: '/finance/transactions', module: 'finance', icon: <DollarSign size={16} /> },
    { title: 'Document Library', path: '/documents', module: 'documents', icon: <FileText size={16} /> },
    { title: 'Attendance', path: '/attendance', module: 'employees', icon: <Clock size={16} /> },
    { title: 'Calendar', path: '/dashboard', module: 'dashboard', icon: <Calendar size={16} /> },
  ].filter((link) => canAccessModule(link.module));

  return (
    <div className="bg-white p-3 px-5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
        <Star size={16} className="text-amber-500 fill-amber-400" />
        <span>Quick Access Favorites:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {favoriteLinks.map((fav) => (
          <Link
            key={fav.path}
            to={fav.path}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            <span className="text-emerald-600">{fav.icon}</span>
            <span>{fav.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
