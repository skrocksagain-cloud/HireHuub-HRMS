import { useState } from 'react';
import { Tag, User, Briefcase, Building2, ShieldCheck, LogOut, FileText, Scale } from 'lucide-react';

interface RelievingPlaceholderPickerProps {
  onSelectPlaceholder: (placeholderToken: string) => void;
}

interface PlaceholderGroup {
  category: 'EMPLOYEE' | 'EMPLOYMENT' | 'EXIT' | 'DOCUMENT' | 'BRAND' | 'LEGAL' | 'SIGNATORY';
  label: string;
  icon: React.ReactNode;
  placeholders: Array<{ key: string; description: string }>;
}

const RELIEVING_PLACEHOLDER_GROUPS: PlaceholderGroup[] = [
  {
    category: 'EMPLOYEE',
    label: 'Employee',
    icon: <User className="w-3.5 h-3.5 text-sky-400" />,
    placeholders: [
      { key: 'PERSON_NAME', description: 'Full employee name' },
      { key: 'EMPLOYEE_CODE', description: 'Employee Code / ID' },
      { key: 'DESIGNATION', description: 'Job designation / title' },
      { key: 'DEPARTMENT', description: 'Department name' },
      { key: 'WORK_LOCATION', description: 'Work location / office' },
    ],
  },
  {
    category: 'EMPLOYMENT',
    label: 'Employment',
    icon: <Briefcase className="w-3.5 h-3.5 text-emerald-400" />,
    placeholders: [
      { key: 'JOINING_DATE', description: 'Date of joining' },
      { key: 'LAST_WORKING_DATE', description: 'Effective relieving / last working date' },
      { key: 'TENURE_DISPLAY', description: 'Calculated period of service' },
    ],
  },
  {
    category: 'EXIT',
    label: 'Exit',
    icon: <LogOut className="w-3.5 h-3.5 text-amber-400" />,
    placeholders: [
      { key: 'EXIT_TYPE', description: 'Exit category (Resignation/Termination)' },
      { key: 'EXIT_REASON', description: 'Reason for separation' },
    ],
  },
  {
    category: 'DOCUMENT',
    label: 'Document',
    icon: <FileText className="w-3.5 h-3.5 text-purple-400" />,
    placeholders: [
      { key: 'RELIEVING_REF', description: 'Global sequence (REL/2026/001)' },
      { key: 'ISSUANCE_DATE', description: 'Date of document issuance' },
    ],
  },
  {
    category: 'BRAND',
    label: 'Brand',
    icon: <Building2 className="w-3.5 h-3.5 text-blue-400" />,
    placeholders: [
      { key: 'BRAND_NAME', description: 'Selected brand name' },
      { key: 'BRAND_WEBSITE', description: 'Official brand website' },
      { key: 'BRAND_EMAIL', description: 'Brand contact email' },
      { key: 'BRAND_PHONE', description: 'Brand contact phone' },
    ],
  },
  {
    category: 'LEGAL',
    label: 'Legal Entity',
    icon: <Scale className="w-3.5 h-3.5 text-indigo-400" />,
    placeholders: [
      { key: 'LEGAL_NAME', description: 'Registered legal company name' },
      { key: 'REGISTERED_ADDRESS', description: 'Registered office address' },
      { key: 'CIN', description: 'Corporate Identity Number' },
      { key: 'PAN', description: 'Permanent Account Number' },
      { key: 'GSTIN', description: 'GST Identification Number' },
    ],
  },
  {
    category: 'SIGNATORY',
    label: 'Signatory',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />,
    placeholders: [
      { key: 'SIGNATORY_NAME', description: 'Authorized signatory full name' },
      { key: 'SIGNATORY_DESIGNATION', description: 'Signatory official designation' },
    ],
  },
];

export default function RelievingPlaceholderPicker({ onSelectPlaceholder }: RelievingPlaceholderPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('EMPLOYEE');

  const selectedGroup = RELIEVING_PLACEHOLDER_GROUPS.find((g) => g.category === activeCategory) || RELIEVING_PLACEHOLDER_GROUPS[0];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3 font-sans">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 border-b border-slate-800/80 pb-2">
        <Tag className="w-3.5 h-3.5 text-sky-400" />
        <span>Insert Dynamic Placeholders</span>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {RELIEVING_PLACEHOLDER_GROUPS.map((group) => {
          const isActive = group.category === activeCategory;
          return (
            <button
              key={group.category}
              type="button"
              onClick={() => setActiveCategory(group.category)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                isActive
                  ? 'bg-sky-950 text-sky-300 border border-sky-800 shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {group.icon}
              <span>{group.label}</span>
            </button>
          );
        })}
      </div>

      {/* Placeholder Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
        {selectedGroup.placeholders.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectPlaceholder(`{{${item.key}}}`)}
            className="text-left p-2 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-sky-700/80 hover:bg-sky-950/40 transition group"
          >
            <div className="text-[11px] font-mono font-bold text-sky-400 group-hover:text-sky-300 flex items-center justify-between">
              <span>{`{{${item.key}}}`}</span>
              <span className="text-[9px] text-slate-500 font-sans font-normal">Insert</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
