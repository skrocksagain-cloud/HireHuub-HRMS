import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

export default function OtsBillingTab() {
  const { user } = useAuth();
  const [workforce, setWorkforce] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'All' | 'Billed' | 'Unbilled'>('All');

  const fetchOts = async () => {
    setLoading(true);
    try {
      const { workforceService } = await import('../../../Workbench/workforce/v2/hooks/useWorkforceV2');
      const v2Records = await workforceService.getActiveWorkforce(
        { id: user?.employeeId || 'admin', name: user?.name || 'Admin', role: (user?.role as any) || 'Super Admin' },
        {}
      );
      
      const otsRecords = v2Records.filter(r => r.workforceType === 'OTS' && r.ots?.eligibility === 'Eligible').map(r => ({
        id: r.employeeId,
        placementId: r.placement.id,
        candidateName: r.candidate.name,
        clientName: r.client.name,
        recruiterName: r.placement.recruiterName,
        joiningDate: r.placement.joiningDate || r.placement.activeDate,
        lastWorkingDate: r.placement.lastWorkingDate,
        tenureDays: r.ots?.tenureDays || 0,
        tenureDisplay: `${r.ots?.tenureDays || 0} Days`,
        eligibility: r.ots?.eligibility,
        billingStatus: r.placement.billingStatus || 'Pending'
      }));
      setWorkforce(otsRecords);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOts();
  }, [user]);

  const eligibleOts = workforce;

  const billedCount = eligibleOts.filter(w => w.billingStatus === 'Billed').length;
  const unbilledCount = eligibleOts.filter(w => w.billingStatus === 'Pending').length;

  const displayRows = useMemo(() => {
    if (filterMode === 'Billed') return eligibleOts.filter(w => w.billingStatus === 'Billed');
    if (filterMode === 'Unbilled') return eligibleOts.filter(w => w.billingStatus === 'Pending');
    return eligibleOts;
  }, [eligibleOts, filterMode]);

  const handleMarkBilled = async (item: any) => {
    if (!confirm(`Mark ${item.candidateName} as billed?`)) return;
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../../../firebase/firebase');
      await updateDoc(doc(db, 'placements', item.placementId), { billingStatus: 'Billed' });
      await fetchOts();
    } catch (err) {
      alert('Failed to mark as billed.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading OTS candidates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex space-x-8">
          <div>
            <div className="text-xs text-slate-500 font-bold">Total Eligible</div>
            <div className="text-xl font-bold text-slate-800">{eligibleOts.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">Total Billed</div>
            <div className="text-xl font-bold text-slate-800">{billedCount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">Total Unbilled</div>
            <div className="text-xl font-bold text-rose-600">{unbilledCount}</div>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterMode('All')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md ${filterMode === 'All' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMode('Billed')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md ${filterMode === 'Billed' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Billed
          </button>
          <button
            onClick={() => setFilterMode('Unbilled')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md ${filterMode === 'Unbilled' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            Unbilled
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="p-3">Employee ID</th>
              <th className="p-3">Candidate</th>
              <th className="p-3">Client</th>
              <th className="p-3">Recruiter</th>
              <th className="p-3">Joining Date</th>
              <th className="p-3">LWD</th>
              <th className="p-3">Tenure</th>
              <th className="p-3">Eligibility</th>
              <th className="p-3">Billing Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayRows.map((item) => {
              const isBilled = item.billingStatus === 'Billed';
              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-600 font-mono text-xs">{item.id || 'N/A'}</td>
                  <td className="p-3 font-medium text-slate-900">{item.candidateName}</td>
                  <td className="p-3 font-bold text-emerald-700">{item.clientName}</td>
                  <td className="p-3 text-slate-700">{item.recruiterName || 'N/A'}</td>
                  <td className="p-3 text-slate-600">{item.joiningDate}</td>
                  <td className="p-3 text-slate-600">{item.lastWorkingDate || '-'}</td>
                  <td className="p-3 font-bold text-slate-700">{item.tenureDisplay || `${item.tenureDays} Days`}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.eligibility}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isBilled ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                      {isBilled ? 'Billed' : 'Unbilled'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {!isBilled && (
                      <button
                        onClick={() => handleMarkBilled(item)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition"
                      >
                        Mark as Billed
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
