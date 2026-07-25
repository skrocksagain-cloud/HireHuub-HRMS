import Badge from '../../../../ui/Badge';
import {
  COMPLIANCE_STATUS_LABEL,
  COMPLIANCE_STATUS_VARIANT,
} from '../constants/financeConstants';
import type { ComplianceCardData } from '../types/finance';

interface ComplianceCardProps {
  data: ComplianceCardData;
}

export function ComplianceCard({ data }: ComplianceCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {data.label}
        </p>

        <Badge variant={COMPLIANCE_STATUS_VARIANT[data.status]}>
          {COMPLIANCE_STATUS_LABEL[data.status]}
        </Badge>
      </div>

      <p className="mt-3 text-sm font-medium text-slate-700">
        Due: {data.dueDate}
      </p>
    </div>
  );
}
