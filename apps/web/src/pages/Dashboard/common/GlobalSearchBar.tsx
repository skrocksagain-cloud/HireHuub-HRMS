import { useEffect, useState } from 'react';
import { Search, X, Users, Briefcase, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import { employeeRepository } from '../../Employee/repositories/employeeRepository';
import { announcementRepository } from '../../../services/announcement/repositories/announcementRepository';
import { calendarRepository } from '../../../services/calendar/repositories/calendarRepository';

interface SearchResultEntity {
  title: string;
  category: 'Employees' | 'Announcements' | 'Calendar' | 'Documents';
  module: string;
  path: string;
}

export default function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultEntity[]>([]);
  const { canAccessModule } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    let isMounted = true;
    const term = searchTerm.toLowerCase();

    Promise.all([
      employeeRepository.getEmployees(),
      announcementRepository.getAnnouncements(),
      calendarRepository.getEvents(),
    ]).then(([emps, anns, evts]) => {
      if (!isMounted) return;

      const list: SearchResultEntity[] = [];

      emps.forEach((e) => {
        const name = e.fullName || `${e.firstName} ${e.lastName}`;
        if (name.toLowerCase().includes(term) || (e.employeeId && e.employeeId.toLowerCase().includes(term))) {
          list.push({
            title: `${name} (${e.employeeId || 'Active Employee'})`,
            category: 'Employees',
            module: 'employees',
            path: `/people/employees/${e.employeeId || e.id}?fromSearch=true`,
          });
        }
      });

      anns.forEach((a) => {
        if (a.title.toLowerCase().includes(term) || a.summary.toLowerCase().includes(term)) {
          list.push({
            title: a.title,
            category: 'Announcements',
            module: 'management',
            path: '/administration/announcements',
          });
        }
      });

      evts.forEach((ev) => {
        if (ev.title.toLowerCase().includes(term)) {
          list.push({
            title: ev.title,
            category: 'Calendar',
            module: 'management',
            path: '/administration/calendar',
          });
        }
      });

      setResults(list.filter((item) => canAccessModule(item.module)));
    }).catch(() => {
      if (isMounted) setResults([]);
    });

    return () => {
      isMounted = false;
    };
  }, [searchTerm, canAccessModule]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Global ERP Search (Employees, Announcements, Calendar)…"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          onFocus={() => setIsOpen(searchTerm.trim().length > 0)}
          className="w-full pl-10 pr-9 py-2 bg-slate-100 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
            Permission-Filtered Search Results ({results.length})
          </div>
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">No matching authorized entities found.</div>
          ) : (
            <div className="p-1 space-y-1">
              {results.map((ent, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSearchTerm('');
                    navigate(ent.path);
                  }}
                  className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between text-left text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {ent.category === 'Employees' && <Users size={15} className="text-emerald-600" />}
                    {ent.category === 'Announcements' && <Briefcase size={15} className="text-purple-600" />}
                    {ent.category === 'Calendar' && <Calendar size={15} className="text-indigo-600" />}
                    {ent.category === 'Documents' && <FileText size={15} className="text-amber-600" />}
                    <span className="font-bold text-slate-800 dark:text-white">{ent.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {ent.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
