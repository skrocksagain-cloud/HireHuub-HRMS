import type { Offer } from "../../../../types/Offer";

import Card from "../../../../ui/Card";
import Input from "../../../../ui/Input";

interface CandidateInformationProps {
  form: Offer;

  onChange: <K extends keyof Offer>(
    field: K,
    value: Offer[K]
  ) => void;
}

export default function CandidateInformation({
  form,
  onChange,
}: CandidateInformationProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-6">
        Candidate Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* First Name */}

        <Input
          label="First Name"
          value={form.firstName}
          onChange={(e) =>
            onChange("firstName", e.target.value)
          }
        />

        {/* Middle Name */}

        <Input
          label="Middle Name"
          value={form.middleName}
          onChange={(e) =>
            onChange("middleName", e.target.value)
          }
        />

        {/* Last Name */}

        <Input
          label="Last Name"
          value={form.lastName}
          onChange={(e) =>
            onChange("lastName", e.target.value)
          }
        />

        {/* Gender */}

        <div>
          <label className="block mb-2 text-sm font-medium">
            Gender
          </label>

          <select
            value={form.gender}
            onChange={(e) =>
              onChange(
                "gender",
                e.target.value as Offer["gender"]
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-green-600 focus:outline-none"
          >
            <option value="Male">
              Male
            </option>

            <option value="Female">
              Female
            </option>

            <option value="Other">
              Other
            </option>

          </select>
        </div>

        {/* Mobile */}

        <Input
          label="Mobile Number"
          value={form.mobile}
          onChange={(e) =>
            onChange("mobile", e.target.value)
          }
        />

        {/* Personal Email */}

        <Input
          type="email"
          label="Personal Email"
          value={form.personalEmail}
          onChange={(e) =>
            onChange("personalEmail", e.target.value)
          }
        />

      </div>

      {/* Current Address */}

      <div className="mt-6">

        <label className="block mb-2 text-sm font-medium">
          Current Address
        </label>

        <textarea
          rows={4}
          value={form.currentAddress}
          onChange={(e) =>
            onChange(
              "currentAddress",
              e.target.value
            )
          }
          className="w-full rounded-xl border border-slate-300 p-4 focus:border-green-600 focus:outline-none"
          placeholder="Enter current residential address"
        />

      </div>

    </Card>
  );
}