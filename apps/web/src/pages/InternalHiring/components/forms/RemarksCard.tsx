import type { Offer } from "../../../../types/Offer";

import Card from "../../../../ui/Card";

interface RemarksCardProps {
  form: Offer;

  onChange: <K extends keyof Offer>(
    field: K,
    value: Offer[K]
  ) => void;
}

export default function RemarksCard({
  form,
  onChange,
}: RemarksCardProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-6">
        Remarks
      </h2>

      <textarea
        rows={6}
        value={form.remarks}
        onChange={(e) =>
          onChange("remarks", e.target.value)
        }
        placeholder="Enter HR remarks..."
        className="w-full rounded-xl border border-slate-300 p-4 focus:border-green-600 focus:outline-none"
      />

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">

        <h3 className="font-semibold text-blue-700">
          Internal Notes
        </h3>

        <p className="mt-2 text-sm text-slate-700">
          Remarks are visible only to HR users and
          are not printed in Offer Letters unless
          explicitly configured.
        </p>

      </div>
    </Card>
  );
}