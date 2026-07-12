import type { Offer } from "../../../../types/Offer";

interface SalaryCardProps {
  offer: Offer;
}

export default function SalaryCard({
  offer,
}: SalaryCardProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-6">
        Salary Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoField
          label="Monthly Gross Salary"
          value={formatCurrency(offer.monthlyGrossSalary)}
        />

        <InfoField
          label="Annual CTC"
          value={formatCurrency(offer.annualCTC)}
        />

        <InfoField
          label="Basic Salary"
          value={formatCurrency(offer.basicSalary)}
        />

        <InfoField
          label="HRA"
          value={formatCurrency(offer.hra)}
        />

        <InfoField
          label="Conveyance Allowance"
          value={formatCurrency(offer.conveyanceAllowance)}
        />

        <InfoField
          label="Mobile Allowance"
          value={formatCurrency(offer.mobileAllowance)}
        />

        <InfoField
          label="Special Allowance"
          value={formatCurrency(offer.specialAllowance)}
        />

        <InfoField
          label="Professional Tax"
          value={formatCurrency(offer.professionalTax)}
        />

        <InfoField
          label="Net Take Home"
          value={formatCurrency(offer.netTakeHome)}
        />
      </div>

      {/* Future Salary Engine */}

      <div className="mt-8 border-t pt-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">
          Salary Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BooleanField
            label="PF Applicable"
            value={offer.pfApplicable}
          />

          <BooleanField
            label="ESI Applicable"
            value={offer.esiApplicable}
          />

          <BooleanField
            label="Professional Tax"
            value={offer.professionalTax > 0}
          />
        </div>
      </div>
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
}

function InfoField({
  label,
  value,
}: InfoFieldProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 min-h-[48px] flex items-center">
        <span className="font-medium text-slate-800">
          {value}
        </span>
      </div>
    </div>
  );
}

interface BooleanFieldProps {
  label: string;
  value: boolean;
}

function BooleanField({
  label,
  value,
}: BooleanFieldProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </p>

      <div
        className={`rounded-xl px-4 py-3 font-medium text-center ${
          value
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {value ? "Yes" : "No"}
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}