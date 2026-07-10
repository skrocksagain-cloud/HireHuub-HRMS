import type { Employee } from "../../../types/Employee";
import Input from "../../../ui/Input";

interface GovernmentSectionProps {
  employee: Employee;
  updateField: (
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) => void;
}

export default function GovernmentSection({
  employee,
  updateField,
}: GovernmentSectionProps) {
  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Government & Compliance
      </h2>

      {/* Identity */}

      <div className="space-y-4">

        <h3 className="text-lg font-medium">
          Identity Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <Input
            placeholder="Aadhaar Number"
            value={employee.aadhaarNumber}
            onChange={(e) =>
              updateField("aadhaarNumber", e.target.value)
            }
          />

          <Input
            placeholder="PAN Number"
            value={employee.panNumber}
            onChange={(e) =>
              updateField("panNumber", e.target.value)
            }
          />

          <Input
            placeholder="Passport Number"
            value={employee.passportNumber}
            onChange={(e) =>
              updateField("passportNumber", e.target.value)
            }
          />

          <Input
            placeholder="Driving Licence Number"
            value={employee.drivingLicenceNumber}
            onChange={(e) =>
              updateField(
                "drivingLicenceNumber",
                e.target.value
              )
            }
          />

          <Input
            placeholder="Voter ID"
            value={employee.voterId}
            onChange={(e) =>
              updateField("voterId", e.target.value)
            }
          />

        </div>

      </div>

      {/* PF & ESI */}

      <div className="space-y-4 border-t pt-6">

        <h3 className="text-lg font-medium">
          PF / ESI Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <Input
            placeholder="UAN Number"
            value={employee.uanNumber}
            onChange={(e) =>
              updateField("uanNumber", e.target.value)
            }
          />

          <Input
            placeholder="PF Number"
            value={employee.pfNumber}
            onChange={(e) =>
              updateField("pfNumber", e.target.value)
            }
          />

          <Input
            placeholder="ESIC Number"
            value={employee.esicNumber}
            onChange={(e) =>
              updateField("esicNumber", e.target.value)
            }
          />

        </div>

      </div>

      {/* Tax */}

      <div className="space-y-4 border-t pt-6">

        <h3 className="text-lg font-medium">
          Tax Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-sm font-medium mb-2">
              Income Tax Regime
            </label>

            <select
              value={employee.taxRegime}
              onChange={(e) =>
                updateField("taxRegime", e.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="">
                Select Tax Regime
              </option>

              <option value="Old">
                Old Regime
              </option>

              <option value="New">
                New Regime
              </option>

            </select>

          </div>

          <Input
            placeholder="Professional Tax Number"
            value={employee.professionalTaxNumber}
            onChange={(e) =>
              updateField(
                "professionalTaxNumber",
                e.target.value
              )
            }
          />

        </div>

      </div>

    </div>
  );
}