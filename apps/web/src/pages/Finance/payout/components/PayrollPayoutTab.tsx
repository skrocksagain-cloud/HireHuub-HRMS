import { useState, useEffect } from 'react';
import { payoutService } from '../services/payoutService';
import { clientRepository } from '../../../Workbench/Network/clients/repositories/clientRepository';

import type { PayoutPayrollRow } from '../types';
import PayoutExceptionsTable from './PayoutExceptionsTable';
import type { Client } from '../../../../types/Client';

export default function PayrollPayoutTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rows, setRows] = useState<PayoutPayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    clientRepository.getClients().then((c: Client[]) => {
      setClients(c.filter(client => client.id !== 'all'));
    });
  }, []);

  const handleGenerate = async () => {
    if (!selectedClient || !fromDate || !toDate) {
      setError('Please select client and date range.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const client = clients.find(c => c.id === selectedClient);
      const clientName = client?.name || '';
      
      const { workforceRepository } = await import('../../../Workbench/workforce/repositories/workforceRepository');
      const allImports = await workforceRepository.getPayoutImports();
      const applicableImports = allImports.filter(imp => imp.clientId === selectedClient);

      const { db } = await import('../../../../firebase/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      const [placementsSnap, candidatesSnap] = await Promise.all([
        getDocs(collection(db, 'placements')),
        getDocs(collection(db, 'crm_candidates'))
      ]);

      const activeCandidates: any[] = [];
      const placementsMap = new Map<string, any>();
      let duplicateConflicts = 0;

      // Group by Candidate ID to detect duplicates
      const placementsByCandidate = new Map<string, any[]>();
      placementsSnap.docs.forEach(d => {
        const data = d.data();
        if (data.candidateId && data.status === 'Active') {
          if (!placementsByCandidate.has(data.candidateId)) {
            placementsByCandidate.set(data.candidateId, []);
          }
          placementsByCandidate.get(data.candidateId)!.push({ ...data, placementId: d.id });
        }
      });

      // Filter out invalid candidates with > 1 active placement
      for (const [candidateId, placements] of placementsByCandidate.entries()) {
        if (placements.length > 1) {
          console.error(`Data Integrity Conflict: Candidate ${candidateId} has ${placements.length} active placements. Only one is permitted. Skipped from payout result.`);
          duplicateConflicts++;
          continue;
        }

        const data = placements[0];
        placementsMap.set(candidateId, data);
        if (data.clientId === selectedClient && data.clientType === 'Payroll') {
          activeCandidates.push(data);
        }
      }

      if (duplicateConflicts > 0) {
        setError(`${duplicateConflicts} candidates skipped due to duplicate Active Placement integrity conflicts.`);
      }
      
      const candidatesMap = new Map<string, any>();
      candidatesSnap.docs.forEach(d => {
        candidatesMap.set(d.id, d.data());
      });

      const newRows: PayoutPayrollRow[] = [];
      for (const imp of applicableImports) {
        if (!imp.isApproved) continue; // Only approved imports
        const importDate = new Date(imp.importedAt);
        const monthStr = imp.month || importDate.toLocaleString('default', { month: 'short' }).toUpperCase();
        const year = importDate.getFullYear().toString();
        const weekNumber = 'W' + Math.ceil(new Date(toDate).getDate() / 7);

        for (const processedRow of imp.rows) {
          // Check if the row's date falls within the selected range
          const rowDate = processedRow.date || imp.importedAt.slice(0, 10);
          if (rowDate < fromDate || rowDate > toDate) continue;

          let match = activeCandidates.find(c => c.payrollEmployeeId && (c.payrollEmployeeId === processedRow.employeeId));
          if (!match) {
            // Find by name if employeeId match fails
            const matchingCandidate = Array.from(candidatesMap.values()).find(cand => 
               cand.name?.toLowerCase().trim() === processedRow.candidateName?.toLowerCase().trim()
            );
            if (matchingCandidate) {
               match = activeCandidates.find(c => c.candidateId === matchingCandidate.id);
            }
          }

          if (match) {
            const placementData = placementsMap.get(match.candidateId);
            const candidateData = candidatesMap.get(match.candidateId);

            const bankAccount = placementData?.operationalData?.bankAccountNumber || candidateData?.bankAccountNumber || '';
            const ifsc = placementData?.operationalData?.ifscCode || candidateData?.ifscCode || '';

            const exceptions: string[] = [];
            if (!bankAccount) exceptions.push('Missing Bank Account');
            if (!ifsc) exceptions.push('Missing IFSC');
            
            const amount = processedRow.earnings || 0;
            const orders = processedRow.orders || 0;

            if (amount > 0 || exceptions.length > 0) {
              const pId = placementData?.placementId || '';
              const activationDt = placementData?.activeDate ? placementData.activeDate.slice(0, 10).split('-').reverse().join('/') : '';
              const recTeamLead = match.recruiterName || 'N/A';
              
              // Working Status: Working if Orders > 0
              const workingStatus = orders > 0 ? 'Working' : 'Not Working';

              newRows.push({
                candidateId: match.candidateId,
                clientId: selectedClient,
                clientName,
                employeeId: match.payrollEmployeeId || processedRow.employeeId || 'UNKNOWN',
                candidateName: candidateData?.name || match.candidateName,
                candidateSource: candidateData?.source || 'Unknown',
                placementId: pId,
                recruitmentTeamLead: recTeamLead,
                activationDate: activationDt,
                ordersCount: orders,
                amount,
                bankAccount: bankAccount,
                ifsc: ifsc,
                month: monthStr,
                year,
                weekNumber,
                transactionDate: rowDate, 
                customerReferenceNumber: `${clientName.replace(/\s+/g, '').toUpperCase()}${match.payrollEmployeeId || 'UNEMP'}${rowDate.replace(/-/g, '')}`,
                isValid: exceptions.length === 0,
                exceptions,
                workingStatus // Added for the UI
              } as any);
            }
          }
        }
      }

      const uniqueMap = new Map<string, PayoutPayrollRow>();
      for (const r of newRows) {
        if (!uniqueMap.has(r.customerReferenceNumber)) {
          uniqueMap.set(r.customerReferenceNumber, r);
        }
      }

      setRows(Array.from(uniqueMap.values()));
    } catch (err: any) {
      setError(err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await payoutService.exportToBlinkitFormat(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to export');
    }
  };

  const validRows = rows.filter(r => r.isValid);
  const exceptionRows = rows.filter(r => !r.isValid);

  const totalCandidates = validRows.length;
  const totalOrders = validRows.reduce((sum, r) => sum + (r.ordersCount || 0), 0);
  const totalEarnings = validRows.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Client</label>
          <select 
            className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
          >
            <option value="">Select Client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
          <input 
            type="date" 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
          <input 
            type="date" 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Preview Payout'}
        </button>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{error}</div>}

      {rows.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex space-x-8">
              <div>
                <div className="text-xs text-slate-500 font-bold">Total Candidates</div>
                <div className="text-xl font-bold text-slate-800">{totalCandidates}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold">Total Orders</div>
                <div className="text-xl font-bold text-slate-800">{totalOrders}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold">Total Earnings</div>
                <div className="text-xl font-bold text-emerald-600">₹{totalEarnings.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <button 
              onClick={handleExport}
              disabled={validRows.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              Export Bank Excel
            </button>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Valid Payout Records ({validRows.length})</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3">Employee ID</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Working Status</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validRows.map((r, i) => (
                  <tr key={i}>
                    <td className="p-3 text-slate-600 font-mono">{r.employeeId}</td>
                    <td className="p-3 font-medium">{r.candidateName}</td>
                    <td className="p-3 text-emerald-700 font-bold">{r.clientName}</td>
                    <td className="p-3 font-medium">{(r as any).workingStatus}</td>
                    <td className="p-3 text-slate-600 font-bold">{r.ordersCount}</td>
                    <td className="p-3 font-bold text-slate-800">₹{r.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {validRows.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-slate-500">No valid records</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {exceptionRows.length > 0 && (
            <PayoutExceptionsTable exceptions={exceptionRows} />
          )}
        </div>
      )}
    </div>
  );
}
