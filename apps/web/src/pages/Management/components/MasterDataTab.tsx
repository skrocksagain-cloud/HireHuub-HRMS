import { useState } from 'react';
import { Database, Save, CheckCircle2 } from 'lucide-react';
import { useAdminMasterData } from '../../../hooks/admin/useAdmin';
import type { MasterDataConfig } from '../../../types/Admin';

export default function MasterDataTab() {
  const { masterData, isLoading, updateMasterData } = useAdminMasterData();
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<MasterDataConfig>(
    masterData || {
      employeePrefix: 'HH',
      invoicePrefix: 'HH2026-',
      documentPrefix: 'DOC-',
      offerPrefix: 'OFF-',
      leaveTypes: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Loss of Pay'],
      employmentTypes: ['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Probation'],
      bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      genderOptions: ['Male', 'Female', 'Non-Binary', 'Prefer not to say'],
      states: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana', 'Gujarat'],
      cities: ['Pune', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'],
      countries: ['India', 'United States', 'United Kingdom', 'Singapore', 'UAE'],
      currencies: ['INR', 'USD', 'EUR', 'GBP', 'AED'],
      taxRates: [0, 5, 12, 18, 28],
      financialYears: ['2024-2025', '2025-2026', '2026-2027'],
    }
  );

  if (masterData && form.employeePrefix !== masterData.employeePrefix && !isSaving) {
    setForm(masterData);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateMasterData(form);
      setStatusMsg('Central Master Data updated successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch {
      setStatusMsg('Failed to update Master Data.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Master Data…</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Database size={18} className="text-emerald-600" />
            Central Master Data Configuration
          </h3>
          <p className="text-slate-500">
            System prefixes, leave types, employment classifications, tax rates, and lookup values. No module hardcodes master values.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
        >
          <Save size={16} /> Save Master Data
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {/* System Numbering Prefixes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b pb-2">
          System Prefixes
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold mb-1">Employee ID Prefix</label>
            <input
              type="text"
              value={form.employeePrefix}
              onChange={(e) => setForm({ ...form, employeePrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Invoice Prefix</label>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Document Prefix</label>
            <input
              type="text"
              value={form.documentPrefix}
              onChange={(e) => setForm({ ...form, documentPrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Offer Letter Prefix</label>
            <input
              type="text"
              value={form.offerPrefix}
              onChange={(e) => setForm({ ...form, offerPrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Global Lookup Collections */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b pb-2">
          Global Lookup Master Collections (Comma-separated)
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Leave Types</label>
            <input
              type="text"
              value={form.leaveTypes.join(', ')}
              onChange={(e) =>
                setForm({ ...form, leaveTypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Employment Types</label>
            <input
              type="text"
              value={form.employmentTypes.join(', ')}
              onChange={(e) =>
                setForm({ ...form, employmentTypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Supported Currencies</label>
            <input
              type="text"
              value={form.currencies.join(', ')}
              onChange={(e) =>
                setForm({ ...form, currencies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Financial Years</label>
            <input
              type="text"
              value={form.financialYears.join(', ')}
              onChange={(e) =>
                setForm({ ...form, financialYears: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
