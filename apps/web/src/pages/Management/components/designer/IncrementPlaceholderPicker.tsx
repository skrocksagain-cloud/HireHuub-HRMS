import { Tag } from 'lucide-react';

interface IncrementPlaceholderPickerProps {
  onInsert: (token: string) => void;
}

export const INCREMENT_PLACEHOLDER_CATEGORIES = [
  {
    category: 'EMPLOYEE',
    tokens: [
      { key: '{{PERSON_NAME}}', label: 'Employee Name' },
      { key: '{{EMPLOYEE_CODE}}', label: 'Employee Code' },
      { key: '{{DESIGNATION}}', label: 'Designation' },
      { key: '{{DEPARTMENT}}', label: 'Department' },
      { key: '{{WORK_LOCATION}}', label: 'Work Location' },
    ],
  },
  {
    category: 'APPRAISAL',
    tokens: [
      { key: '{{PREVIOUS_MONTHLY_GROSS}}', label: 'Previous Monthly Gross' },
      { key: '{{PREVIOUS_ANNUAL_CTC}}', label: 'Previous Annual CTC' },
      { key: '{{REVISED_MONTHLY_GROSS}}', label: 'Revised Monthly Gross' },
      { key: '{{REVISED_ANNUAL_CTC}}', label: 'Revised Annual CTC' },
      { key: '{{INCREMENT_TYPE}}', label: 'Increment Type' },
      { key: '{{INCREMENT_PERCENTAGE}}', label: 'Increment Percentage' },
      { key: '{{INCREMENT_AMOUNT}}', label: 'Increment Amount' },
      { key: '{{EFFECTIVE_DATE}}', label: 'Effective Date' },
    ],
  },
  {
    category: 'DOCUMENT',
    tokens: [
      { key: '{{INCREMENT_REF}}', label: 'Increment Reference' },
      { key: '{{ISSUANCE_DATE}}', label: 'Issuance Date' },
    ],
  },
  {
    category: 'BRAND',
    tokens: [
      { key: '{{LOGO}}', label: 'Brand Logo' },
      { key: '{{BRAND_NAME}}', label: 'Brand Name' },
      { key: '{{BRAND_ADDRESS}}', label: 'Brand Address' },
      { key: '{{BRAND_EMAIL}}', label: 'Brand Email' },
      { key: '{{BRAND_PHONE}}', label: 'Brand Phone' },
      { key: '{{BRAND_WEBSITE}}', label: 'Brand Website' },
    ],
  },
  {
    category: 'LEGAL',
    tokens: [
      { key: '{{LEGAL_NAME}}', label: 'Legal Entity Name' },
      { key: '{{CIN}}', label: 'CIN Number' },
      { key: '{{PAN}}', label: 'PAN Number' },
      { key: '{{GSTIN}}', label: 'GSTIN Number' },
    ],
  },
  {
    category: 'SIGNATORY',
    tokens: [
      { key: '{{SIGNATORY_NAME}}', label: 'Signatory Name' },
      { key: '{{SIGNATORY_DESIGNATION}}', label: 'Signatory Designation' },
    ],
  },
];

export default function IncrementPlaceholderPicker({ onInsert }: IncrementPlaceholderPickerProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
        <Tag className="w-4 h-4 text-emerald-400" />
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Insert Dynamic Placeholders
        </h4>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {INCREMENT_PLACEHOLDER_CATEGORIES.map((cat) => (
          <div key={cat.category} className="space-y-1.5">
            <span className="text-[10px] font-bold font-mono text-slate-400 block tracking-wider">
              {cat.category}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cat.tokens.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onInsert(t.key)}
                  className="px-2 py-1 bg-slate-950 hover:bg-emerald-950/80 border border-slate-800 hover:border-emerald-700/60 rounded text-[11px] font-mono text-slate-300 hover:text-emerald-400 transition flex items-center gap-1"
                  title={`Insert ${t.key}`}
                >
                  <span>{t.label}</span>
                  <span className="text-[9px] text-slate-500">{t.key}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
