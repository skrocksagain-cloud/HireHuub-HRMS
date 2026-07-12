import type { Offer } from "../../../../types/Offer";

import Card from "../../../../ui/Card";
import Input from "../../../../ui/Input";

interface OfferInformationProps {
  form: Offer;

  onChange: <K extends keyof Offer>(
    field: K,
    value: Offer[K]
  ) => void;
}

export default function OfferInformation({
  form,
  onChange,
}: OfferInformationProps) {
  return (
    <Card>

      <h2 className="text-xl font-semibold mb-6">
        Offer Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Offer ID */}

        <Input
          label="Offer ID"
          value={form.offerId}
          readOnly
        />

        {/* Offer Date */}

        <Input
          type="date"
          label="Offer Date"
          value={form.offerDate}
          onChange={(e) =>
            onChange("offerDate", e.target.value)
          }
        />

        {/* Valid Till */}

        <Input
          type="date"
          label="Valid Till"
          value={form.validTill}
          onChange={(e) =>
            onChange("validTill", e.target.value)
          }
        />

        {/* Status */}

        <div>

          <label className="block mb-2 text-sm font-medium">
            Status
          </label>

          <select
            value={form.status}
            onChange={(e) =>
              onChange(
                "status",
                e.target.value as Offer["status"]
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-green-600 focus:outline-none"
          >
            <option value="Draft">
              Draft
            </option>

            <option value="Generated">
              Generated
            </option>

            <option value="Sent">
              Sent
            </option>

            <option value="Accepted">
              Accepted
            </option>

            <option value="Rejected">
              Rejected
            </option>

            <option value="Joined">
              Joined
            </option>

            <option value="Converted">
              Converted
            </option>

          </select>

        </div>

      </div>

    </Card>
  );
}