import { useState } from 'react';
import { Save } from 'lucide-react';
import type { WorkforceItem } from '../types/workforce';

interface EditableProfileFormProps {
  item: WorkforceItem;
  onSave: (updates: any) => Promise<void>;
}

export default function EditableProfileForm({ item, onSave }: EditableProfileFormProps) {
  const toIso = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
      const [d, m, y] = dateStr.split('-');
      // ensure padding
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const [formData, setFormData] = useState({
    activeDate: toIso(item.activeDate),
    dateOfBirth: toIso(item.dateOfBirth),
    joiningDate: toIso(item.joiningDate),
    lastWorkingDate: toIso(item.lastWorkingDate),
    aadhaarNumber: item.aadhaarNumber || '',
    panNumber: item.panNumber || '',
    bankAccountNumber: item.bankAccountNumber || '',
    ifscCode: item.ifscCode || '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mt-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700">
          Editable Operational Data
        </h4>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Common */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Active Date</label>
          <input
            type="date"
            name="activeDate"
            value={formData.activeDate}
            onChange={handleChange}
            className="w-full border-slate-200 rounded-lg text-xs"
          />
        </div>

        {item.workforceType === 'Payroll' && (
          <>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Aadhaar Number</label>
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">PAN Number</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Bank Account</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-lg text-xs"
              />
            </div>
          </>
        )}

        {item.workforceType === 'OTS' && (
          <>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Joining Date</label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Last Working Date</label>
              <input
                type="date"
                name="lastWorkingDate"
                value={formData.lastWorkingDate}
                onChange={handleChange}
                className="w-full border-slate-200 rounded-lg text-xs"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
