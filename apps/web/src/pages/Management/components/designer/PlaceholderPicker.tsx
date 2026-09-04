import { useState } from 'react';
import { Tag, User, Briefcase, Building2, Banknote, ShieldCheck } from 'lucide-react';

interface PlaceholderPickerProps {
  onSelectPlaceholder: (placeholderToken: string) => void;
}

interface PlaceholderGroup {
  category: 'EMPLOYEE' | 'OFFER' | 'BRAND' | 'SALARY' | 'SIGNATORY';
  label: string;
  icon: React.ReactNode;
  placeholders: Array<{ key: string; description: string }>;
}

const PLACEHOLDER_GROUPS: PlaceholderGroup[] = [
  {
    category: 'EMPLOYEE',
    label: 'Employee',
    icon: <User className="w-3.5 h-3.5 text-blue-400" />,
    placeholders: [
      { key: 'PERSON_NAME', description: 'Full candidate/employee name' },
      { key: 'PERSON_ADDRESS', description: 'Residential address' },
      { key: 'PERSON_EMAIL', description: 'Personal email address' },
      { key: 'PERSON_PHONE', description: 'Contact phone number' },
    ],
  },
  {
    category: 'OFFER',
    label: 'Offer',
    icon: <Briefcase className="w-3.5 h-3.5 text-emerald-400" />,
    placeholders: [
      { key: 'OFFER_REFERENCE', description: 'Unique offer ref number' },
      { key: 'OFFER_DATE', description: 'Date of offer issuance' },
      { key: 'JOINING_DATE', description: 'Expected date of joining' },
      { key: 'DESIGNATION', description: 'Job designation / title' },
      { key: 'DEPARTMENT', description: 'Department name' },
      { key: 'WORK_LOCATION', description: 'Office location / city' },
      { key: 'REPORTING_MANAGER', description: 'Reporting manager name' },
    ],
  },
  {
    category: 'BRAND',
    label: 'Brand',
    icon: <Building2 className="w-3.5 h-3.5 text-amber-400" />,
    placeholders: [
      { key: 'BRAND_NAME', description: 'Selected brand name' },
      { key: 'LEGAL_NAME', description: 'Registered legal company name' },
      { key: 'BRAND_ADDRESS', description: 'Brand office address' },
      { key: 'BRAND_PHONE', description: 'Brand contact phone' },
      { key: 'BRAND_EMAIL', description: 'Brand official email' },
      { key: 'BRAND_WEBSITE', description: 'Brand website URL' },
    ],
  },
  {
    category: 'SALARY',
    label: 'Salary',
    icon: <Banknote className="w-3.5 h-3.5 text-purple-400" />,
    placeholders: [
      { key: 'BASIC_MONTHLY', description: 'Monthly Basic Pay' },
      { key: 'BASIC_ANNUAL', description: 'Annual Basic Pay' },
      { key: 'HRA_MONTHLY', description: 'Monthly HRA' },
      { key: 'HRA_ANNUAL', description: 'Annual HRA' },
      { key: 'SPECIAL_ALLOWANCE_MONTHLY', description: 'Monthly Special Allowance' },
      { key: 'SPECIAL_ALLOWANCE_ANNUAL', description: 'Annual Special Allowance' },
      { key: 'PF_EMPLOYEE', description: 'Employee PF deduction' },
      { key: 'PF_EMPLOYER', description: 'Employer PF contribution' },
      { key: 'ESI_EMPLOYEE', description: 'Employee ESI deduction' },
      { key: 'ESI_EMPLOYER', description: 'Employer ESI contribution' },
      { key: 'PROFESSIONAL_TAX', description: 'Professional Tax deduction' },
      { key: 'GROSS_CTC', description: 'Monthly Gross CTC' },
      { key: 'ANNUAL_CTC', description: 'Annual Total CTC' },
      { key: 'NET_TAKE_HOME', description: 'Estimated monthly take home' },
    ],
  },
  {
    category: 'SIGNATORY',
    label: 'Signatory',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />,
    placeholders: [
      { key: 'SIGNATORY_NAME', description: 'Authorized signer full name' },
      { key: 'SIGNATORY_DESIGNATION', description: 'Authorized signer title' },
      { key: 'SIGNATURE', description: 'Digital signature image' },
      { key: 'STAMP', description: 'Official brand stamp image' },
    ],
  },
];

export default function PlaceholderPicker({ onSelectPlaceholder }: PlaceholderPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('EMPLOYEE');

  const selectedGroup = PLACEHOLDER_GROUPS.find((g) => g.category === activeCategory) || PLACEHOLDER_GROUPS[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
            Controlled ERP Placeholders
          </span>
        </div>
        <span className="text-[10px] text-slate-400">Click chip to insert into block</span>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/60 custom-scrollbar">
        {PLACEHOLDER_GROUPS.map((group) => {
          const isActive = activeCategory === group.category;
          return (
            <button
              key={group.category}
              type="button"
              onClick={() => setActiveCategory(group.category)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {group.icon}
              <span>{group.label}</span>
              <span className="text-[10px] font-mono text-slate-500">({group.placeholders.length})</span>
            </button>
          );
        })}
      </div>

      {/* Placeholder Chips Grid */}
      <div className="flex flex-wrap gap-2 pt-3">
        {selectedGroup.placeholders.map((item) => {
          const token = `{{${item.key}}}`;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectPlaceholder(token)}
              title={item.description}
              className="group flex items-center gap-1.5 bg-slate-950 hover:bg-sky-950 border border-slate-800 hover:border-sky-700 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-sky-300 transition cursor-pointer shadow-xs"
            >
              <span className="text-sky-400 font-bold group-hover:scale-105 transition-transform">+</span>
              <span className="font-semibold">{token}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
