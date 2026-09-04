import ExcelJS from 'exceljs';
import { workforceRepository } from '../../../Workbench/workforce/repositories/workforceRepository';
import { clientRepository } from '../../../Workbench/Network/clients/repositories/clientRepository';
import type { PayoutPayrollRow } from '../types';

export class PayoutService {
  async generatePayrollPreview(
    clientId: string,
    fromDate: string,
    toDate: string
  ): Promise<PayoutPayrollRow[]> {
    const clients = await clientRepository.getClients();
    const client = clients.find(c => c.id === clientId);
    if (!client) throw new Error('Client not found.');

    const clientName = client.name;

    // 1. Get Workforce Payroll imports for this client within dates
    const imports = await workforceRepository.getPayoutImports();
    const applicableImports = imports.filter(imp => {
      if (imp.clientId !== clientId) return false;
      const d = imp.importedAt.slice(0, 10);
      return d >= fromDate && d <= toDate;
    });

    if (applicableImports.length === 0) {
      return [];
    }

    // 2. Fetch Workforce Items (which merges CRM + AP + History)
    const workforceItems = await workforceRepository.getWorkforceItems();
    const activeCandidates = workforceItems.filter(c => c.clientId === clientId && c.workforceType === 'Payroll');

    const { db } = await import('../../../../firebase/firebase');
    const { collection, getDocs } = await import('firebase/firestore');
    
    // Pre-fetch all placements and candidates to enrich the row
    const [placementsSnap, candidatesSnap] = await Promise.all([
      getDocs(collection(db, 'placements')),
      getDocs(collection(db, 'crm_candidates'))
    ]);
    
    const placementsMap = new Map<string, any>();
    placementsSnap.docs.forEach(d => {
      const data = d.data();
      if (data.candidateId && data.status === 'Active') {
        placementsMap.set(data.candidateId, data);
      }
    });

    const candidatesMap = new Map<string, any>();
    candidatesSnap.docs.forEach(d => {
      candidatesMap.set(d.id, d.data());
    });

    const rows: PayoutPayrollRow[] = [];
    for (const imp of applicableImports) {
      const importDate = new Date(imp.importedAt);
      const monthStr = imp.month || importDate.toLocaleString('default', { month: 'short' }).toUpperCase();
      const year = importDate.getFullYear().toString();
      
      // Calculate week number from toDate to be deterministic for the period
      const weekNumber = 'W' + Math.ceil(new Date(toDate).getDate() / 7);

      for (const processedRow of imp.rows) {
        let match = activeCandidates.find(c => c.payrollEmployeeId && (c.payrollEmployeeId === processedRow.employeeId));
        
        if (!match) {
          match = activeCandidates.find(c => c.candidateName.toLowerCase().trim() === processedRow.candidateName.toLowerCase().trim());
        }

        if (match) {
          const exceptions: string[] = [];
          if (!match.bankAccountNumber) exceptions.push('Missing Bank Account');
          if (!match.ifscCode) exceptions.push('Missing IFSC');
          
          const amount = processedRow.earnings || 0;

          if (amount > 0 || exceptions.length > 0) {
            const placementData = placementsMap.get(match.candidateId);
            const candidateData = candidatesMap.get(match.candidateId);
            const pId = placementData?.placementId || '';
            const activationDt = placementData?.activeDate ? placementData.activeDate.slice(0, 10).split('-').reverse().join('/') : '';
            const recTeamLead = placementData?.clientType === 'OTS' ? placementData?.associatePartnerName || match.teamLeadName : match.teamLeadName || placementData?.recruiterName;

            rows.push({
              candidateId: match.candidateId,
              clientId,
              clientName,
              employeeId: match.payrollEmployeeId || processedRow.employeeId || 'UNKNOWN',
              candidateName: candidateData?.name || match.candidateName,
              candidateSource: candidateData?.source || 'Unknown',
              placementId: pId,
              recruitmentTeamLead: recTeamLead || 'N/A',
              activationDate: activationDt,
              ordersCount: processedRow.orders || 0,
              amount,
              bankAccount: match.bankAccountNumber || '',
              ifsc: match.ifscCode || '',
              month: monthStr,
              year,
              weekNumber,
              transactionDate: toDate, 
              customerReferenceNumber: `${clientName.replace(/\s+/g, '').toUpperCase()}${match.payrollEmployeeId || 'UNEMP'}${monthStr}${year}${weekNumber}`,
              isValid: exceptions.length === 0,
              exceptions,
            });
          }
        } else {
          // Unmatched row exception
          rows.push({
            candidateId: '',
            clientId,
            clientName,
            employeeId: processedRow.employeeId || 'UNKNOWN',
            candidateName: processedRow.candidateName || 'Unmatched',
            amount: processedRow.earnings || 0,
            bankAccount: '',
            ifsc: '',
            month: monthStr,
            year,
            weekNumber,
            transactionDate: toDate,
            customerReferenceNumber: `UNMATCHED_${Math.random().toString(36).substring(7)}`,
            isValid: false,
            exceptions: ['Candidate not matched to CRM'],
          });
        }
      }
    }

    const uniqueMap = new Map<string, PayoutPayrollRow>();
    for (const r of rows) {
      if (!uniqueMap.has(r.customerReferenceNumber)) {
        uniqueMap.set(r.customerReferenceNumber, r);
      }
    }

    return Array.from(uniqueMap.values());
  }

  async exportToBlinkitFormat(rows: PayoutPayrollRow[]): Promise<void> {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      throw new Error('No valid rows to export.');
    }

    let debitAccountNumber = '000000000000';
    try {
      const { adminService } = await import('../../../../services/admin/adminService');
      const adminCompany = await adminService.getCompanySettings();
      if (adminCompany?.bankAccountsV2 && adminCompany.bankAccountsV2.length > 0) {
        const activeBanks = adminCompany.bankAccountsV2.filter((b) => b.isActive);
        if (activeBanks.length > 0) debitAccountNumber = activeBanks[0].accountNumber;
      } else if (adminCompany?.bankDetails?.accountNumber) {
        debitAccountNumber = adminCompany.bankDetails.accountNumber;
      }
    } catch (e) {
      console.error('Failed to fetch company debit account', e);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payout');

    sheet.columns = [
      { header: 'Debit Account Number', key: 'debitAccount', width: 20 },
      { header: 'Transaction Amount', key: 'amount', width: 15 },
      { header: 'Transaction Currency', key: 'currency', width: 10 },
      { header: 'Beneficiary Name', key: 'benName', width: 25 },
      { header: 'Beneficiary Account Number', key: 'benAccount', width: 25 },
      { header: 'Beneficiary IFSC Code', key: 'ifsc', width: 15 },
      { header: 'Transaction Date', key: 'txnDate', width: 15 },
      { header: 'Payment Mode', key: 'mode', width: 15 },
      { header: 'Customer Reference Number', key: 'crn', width: 30 },
      { header: 'Beneficiary Nickname/Code', key: 'nickname', width: 20 },
    ];

    validRows.forEach(row => {
      sheet.addRow({
        debitAccount: debitAccountNumber, 
        amount: row.amount,
        currency: 'INR',
        benName: row.candidateName,
        benAccount: row.bankAccount,
        ifsc: row.ifsc,
        txnDate: row.transactionDate,
        mode: 'IMPS',
        crn: row.customerReferenceNumber,
        nickname: row.employeeId,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payout_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const payoutService = new PayoutService();
