import OfferForm from "./OfferForm";
import OfferTable from "./OfferTable";

export default function OfferPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Internal Hiring
        </h1>

        <p className="mt-2 text-slate-500">
          Create, manage and track internal offers.
        </p>
      </div>

      <OfferForm />

      <OfferTable />
    </div>
  );
}