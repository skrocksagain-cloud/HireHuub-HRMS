import type { Offer } from "../../../../types/Offer";

interface CandidateCardProps {
  offer: Offer;
}

export default function CandidateCard({
  offer,
}: CandidateCardProps) {
  return (
    <div>

      <h2 className="text-lg font-semibold text-slate-800 mb-6">
        Candidate Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <InfoField
          label="First Name"
          value={offer.firstName}
        />

        <InfoField
          label="Middle Name"
          value={offer.middleName}
        />

        <InfoField
          label="Last Name"
          value={offer.lastName}
        />

        <InfoField
          label="Gender"
          value={offer.gender}
        />

        <InfoField
          label="Mobile Number"
          value={offer.mobile}
        />

        <InfoField
          label="Personal Email"
          value={offer.personalEmail}
        />

      </div>

      <div className="mt-6">

        <InfoField
          label="Current Address"
          value={offer.currentAddress}
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
          ? "w-full"
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