import type { Offer } from "../../types/Offer";

import OfferInformation from "./components/forms/OfferInformation";
import CandidateInformation from "./components/forms/CandidateInformation";
import EmploymentInformation from "./components/forms/EmploymentInformation";
import SalaryInformation from "./components/forms/SalaryInformation";
import RemarksCard from "./components/forms/RemarksCard";
import OfferActions from "./components/forms/OfferActions";

import useOffer from "./useOffer";

interface OfferFormProps {
  offer?: Offer;
  onSuccess?: () => void;
}

export default function OfferForm({
  offer,
  onSuccess,
}: OfferFormProps) {
  const {
    loading,
    saving,
    form,
    departments,
    designations,
    managers,
    updateField,
    saveOffer,
  } = useOffer(
    offer,
    onSuccess
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-600">
            Loading Offer Form...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <OfferInformation
        form={form}
        onChange={updateField}
      />

      <CandidateInformation
        form={form}
        onChange={updateField}
      />

      <EmploymentInformation
        form={form}
        departments={departments}
        designations={designations}
        managers={managers}
        onChange={updateField}
      />

      <SalaryInformation
        form={form}
        onChange={updateField}
      />

      <RemarksCard
        form={form}
        onChange={updateField}
      />

      <OfferActions
        loading={saving}
        onSave={saveOffer}
        onCancel={() => onSuccess?.()}
        onPreview={() => {
          console.log("Preview PDF");
        }}
        onGenerate={() => {
          console.log("Generate Offer");
        }}
      />

    </div>
  );
}