import type { Offer } from "../../../../types/Offer";

interface EmploymentCardProps {
  offer: Offer;
}

export default function EmploymentCard({
  offer,
}: EmploymentCardProps) {
  return (
    <div>

      <h2 className="text-lg font-semibold text-slate-800 mb-6">
        Employment Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <InfoField
          label="Department"
          value={offer.departmentName}
        />

        <InfoField
          label="Designation"
          value={offer.designationName}
        />

        <InfoField
          label="Reporting Manager"
          value={offer.reportingManager}
        />

        <InfoField
          label="Employment Type"
          value={offer.employmentType}
        />

        <InfoField
          label="Expected Joining Date"
          value={offer.joiningDate}
        />

        <InfoField
          label="Probation Period"
          value={`${offer.probationPeriod} Days`}
        />

        <InfoField
          label="Work Location"
          value={offer.workLocation}
          fullWidth
        />

      </div>

    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value?: string;
  fullWidth?: boolean;
}

function InfoField({
  label,
  value,
  fullWidth = false,
}: InfoFieldProps) {
  return (
    <div
      className={
        fullWidth
          ? "lg:col-span-3"
          : ""
      }
    >
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 min-h-[48px] flex items-center">
        <span className="text-slate-800">
          {value || "-"}
        </span>
      </div>
    </div>
  );
}