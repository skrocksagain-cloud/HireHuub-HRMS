import { useState, useMemo } from 'react';
import { useClients } from '../../Network/clients/hooks/useClients';
import { Building2, Award } from 'lucide-react';

export default function CrmClientView() {
  const { clients, loading, error } = useClients();
  const [search, setSearch] = useState('');

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const s = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(s));
  }, [clients, search]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading Clients...</div>;
  }

  if (error) {
    return <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={20} /> Client Directory
          </h2>
          <p className="text-xs text-slate-500">Read-only view of active clients and highlights.</p>
        </div>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <Building2 className="mx-auto text-slate-400 mb-3" size={32} />
          <h3 className="font-bold text-slate-700 text-sm">No Clients Found</h3>
          <p className="text-xs text-slate-500 mt-1">There are currently no clients matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-900 text-base">{client.name}</h3>
                {client.points !== undefined && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold">
                    <Award size={12} />
                    {client.points} Points
                  </div>
                )}
              </div>

              <div className="flex-1">
                {client.highlights && client.highlights.length > 0 ? (
                  <ul className="space-y-1.5">
                    {client.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400 italic">No highlights available</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
