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
  const [companyAccounts, setCompanyAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    clientRepository.getClients().then((c: Client[]) => {
      setClients(c.filter(client => client.id !== 'all'));
    });

    // Fetch company accounts
    import('../../../../services/admin/adminService').then(({ adminService }) => {
      adminService.getCompanySettings().then((settings: any) => {
        if (settings?.bankAccountsV2) {
          setCompanyAccounts(settings.bankAccountsV2.filter((acc: any) => acc.isActive));
        }
      });
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
      const selectedClientName = client?.name?.trim().toLowerCase();

      const { workforceRepository } = await import('../../../Workbench/workforce/repositories/workforceRepository');
      const allImports = await workforceRepository.getPayoutImports();

      console.debug('[PayrollPayout] Total imports:', allImports.length);
      console.debug('[PayrollPayout] Selected client:', { selectedClient, selectedClientName });

      const applicableImports = allImports.filter(imp => {
        const importClientName = imp.clientName?.trim().toLowerCase();
        const matchesClient = imp.clientId === selectedClient || (selectedClientName && importClientName === selectedClientName);
        return matchesClient && imp.isApproved === true;
      });

      console.debug('[PayrollPayout] Matching approved imports:', applicableImports.length);
      console.debug('[PayrollPayout] Selected period:', { fromDate, toDate });

      const { db } = await import('../../../../firebase/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      const [placementsSnap, candidatesSnap] = await Promise.all([
        getDocs(collection(db, 'placements')),
        getDocs(collection(db, 'crm_candidates'))
      ]);

      const candidatesMap = new Map<string, any>();
      candidatesSnap.docs.forEach(d => {
        candidatesMap.set(d.id, { ...d.data(), id: d.id });
      });

      const placementsByEmployeeId = new Map<string, any[]>();
      const placementsByCandidateId = new Map<string, any[]>();
      placementsSnap.docs.forEach(d => {
        const data = d.data();
        const placementData = { ...data, placementId: d.id };
        if (data.candidateId) {
          if (!placementsByCandidateId.has(data.candidateId)) {
            placementsByCandidateId.set(data.candidateId, []);
          }
          placementsByCandidateId.get(data.candidateId)!.push(placementData);
        }
        if (data.payrollEmployeeId) {
          if (!placementsByEmployeeId.has(data.payrollEmployeeId)) {
            placementsByEmployeeId.set(data.payrollEmployeeId, []);
          }
          placementsByEmployeeId.get(data.payrollEmployeeId)!.push(placementData);
        }
      });

      const aggregatedImports = new Map<string, any>();
      const fromMs = new Date(fromDate).getTime();
      const toMs = new Date(toDate).getTime();
      const selectedStartMonth = fromDate.slice(0, 7);
      const selectedEndMonth = toDate.slice(0, 7);

      let totalRowsScanned = 0;
      let rowsWithActivity = 0;
      let rowsPassingPeriod = 0;

      for (const imp of applicableImports) {
        for (const processedRow of imp.rows) {
          totalRowsScanned++;

          const amount = Number(processedRow.earnings) || 0;
          const orders = Number(processedRow.orders) || 0;

          if (amount <= 0 && orders <= 0) continue;
          rowsWithActivity++;

          let rowDateStr = processedRow.date;
          let normalizedRowDate = '';

          if (rowDateStr) {
             if (rowDateStr.includes('-') && rowDateStr.split('-')[0].length === 2) {
                const [d, m, y] = rowDateStr.split('-');
                normalizedRowDate = `${y}-${m}-${d}`;
             } else {
                normalizedRowDate = rowDateStr.slice(0, 10);
             }
          }

          let passesPeriod = false;

          if (normalizedRowDate) {
              const rowMs = new Date(normalizedRowDate).getTime();
              if (rowMs >= fromMs && rowMs <= toMs) {
                  passesPeriod = true;
              }
          } else {
              // Month fallback for imports with missing row date
              if (imp.month === selectedStartMonth || imp.month === selectedEndMonth) {
                  passesPeriod = true;
                  normalizedRowDate = imp.importedAt.slice(0, 10);
              }
          }

          if (!passesPeriod) continue;
          rowsPassingPeriod++;

          const empId = processedRow.employeeId || 'UNKNOWN';
          if (!aggregatedImports.has(empId)) {
             aggregatedImports.set(empId, {
               employeeId: empId,
               candidateName: processedRow.candidateName,
               amount: 0,
               orders: 0,
               lastRowDateStr: normalizedRowDate,
               monthStr: imp.month || new Date(imp.importedAt).toLocaleString('default', { month: 'short' }).toUpperCase(),
               year: new Date(imp.importedAt).getFullYear().toString(),
             });
          }
          const agg = aggregatedImports.get(empId)!;
          agg.amount += amount;
          agg.orders += orders;
          if (new Date(normalizedRowDate).getTime() > new Date(agg.lastRowDateStr).getTime()) {
            agg.lastRowDateStr = normalizedRowDate;
          }
        }
      }

      const weekNumber = 'W' + Math.ceil(new Date(toDate).getDate() / 7);
      const newRows: PayoutPayrollRow[] = [];

      for (const agg of aggregatedImports.values()) {
         let matchPlacement = null;
         let matchCandidate = null;

         const emPlacements = placementsByEmployeeId.get(agg.employeeId);
         if (emPlacements && emPlacements.length > 0) {
             matchPlacement = emPlacements.find(p => p.clientId === selectedClient) || emPlacements[0];
             matchCandidate = candidatesMap.get(matchPlacement.candidateId);
         }

         if (!matchCandidate && agg.candidateName) {
             const cand = Array.from(candidatesMap.values()).find(c => c.name?.toLowerCase().trim() === agg.candidateName.toLowerCase().trim());
             if (cand) {
                 matchCandidate = cand;
                 const cPlacements = placementsByCandidateId.get(cand.id);
                 if (cPlacements && cPlacements.length > 0) {
                     matchPlacement = cPlacements.find(p => p.clientId === selectedClient) || cPlacements[0];
                 }
             }
         }

         if (matchCandidate || matchPlacement) {
             const bankAccount = matchPlacement?.operationalData?.bankAccountNumber || matchCandidate?.bankAccountNumber || '';
             const ifsc = matchPlacement?.operationalData?.ifscCode || matchCandidate?.ifscCode || '';

             const exceptions: string[] = [];
             if (!bankAccount) exceptions.push('Missing Bank Account');
             if (!ifsc) exceptions.push('Missing IFSC');

             const workingStatus = agg.orders > 0 ? 'Working' : 'Not Working';

             newRows.push({
                candidateId: matchCandidate?.id || '',
                clientId: selectedClient,
                clientName,
                employeeId: agg.employeeId,
                candidateName: matchCandidate?.name || agg.candidateName,
                candidateSource: matchCandidate?.source || 'Unknown',
                placementId: matchPlacement?.placementId || '',
                recruitmentTeamLead: matchPlacement?.recruiterName || matchCandidate?.recruiterName || 'N/A',
                activationDate: matchPlacement?.activeDate ? matchPlacement.activeDate.slice(0, 10).split('-').reverse().join('/') : '',
                ordersCount: agg.orders,
                amount: agg.amount,
                bankAccount: bankAccount,
                ifsc: ifsc,
                month: agg.monthStr,
                year: agg.year,
                weekNumber,
                transactionDate: agg.lastRowDateStr,
                customerReferenceNumber: `${clientName.replace(/\s+/g, '').toUpperCase()}${agg.employeeId}${agg.lastRowDateStr.replace(/-/g, '')}`,
                isValid: exceptions.length === 0,
                exceptions,
                workingStatus
             } as any);
         } else {
             newRows.push({
                candidateId: '',
                clientId: selectedClient,
                clientName,
                employeeId: agg.employeeId,
                candidateName: agg.candidateName || 'Unmatched',
                candidateSource: 'Unknown',
                placementId: '',
                recruitmentTeamLead: 'N/A',
                activationDate: '',
                ordersCount: agg.orders,
                amount: agg.amount,
                bankAccount: '',
                ifsc: '',
                month: agg.monthStr,
                year: agg.year,
                weekNumber,
                transactionDate: agg.lastRowDateStr,
                customerReferenceNumber: `UNMATCHED_${Math.random().toString(36).substring(7)}`,
                isValid: false,
                exceptions: ['Candidate not matched to CRM'],
                workingStatus: agg.orders > 0 ? 'Working' : 'Not Working'
             } as any);
         }
      }

      console.debug('[PayrollPayout] Final payout rows:', newRows.length);
      setRows(newRows);
    } catch (err: any) {
      setError(err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedAccount) {
      setError('Please select a company debit account first.');
      return;
    }

    try {
      const accountInfo = companyAccounts.find(a => a.id === selectedAccount);
      await payoutService.exportToBlinkitFormat(rows, accountInfo?.accountNumber || selectedAccount);
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
          <label className="block text-xs font-bold text-slate-700 mb-1">Debit Account</label>
          <select
            className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
          >
            <option value="">Select Account</option>
            {companyAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</option>)}
          </select>
        </div>
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
