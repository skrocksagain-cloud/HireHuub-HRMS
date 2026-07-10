import type { Employee } from "../../../types/Employee";
import Input from "../../../ui/Input";

interface AddressSectionProps {
  employee: Employee;
  updateField: (
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) => void;
}

export default function AddressSection({
  employee,
  updateField,
}: AddressSectionProps) {
  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Address Information
      </h2>

      {/* Current Address */}

      <div className="space-y-4">

        <div className="flex items-center justify-between">

          <h3 className="text-lg font-medium">
            Current Address
          </h3>

        </div>

        <Input
          placeholder="Current Address"
          value={employee.currentAddress}
          onChange={(e) =>
            updateField("currentAddress", e.target.value)
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <Input
            placeholder="City"
            value={employee.currentCity}
            onChange={(e) =>
              updateField("currentCity", e.target.value)
            }
          />

          <Input
            placeholder="State"
            value={employee.currentState}
            onChange={(e) =>
              updateField("currentState", e.target.value)
            }
          />

          <Input
            placeholder="PIN Code"
            value={employee.currentPinCode}
            onChange={(e) =>
              updateField("currentPinCode", e.target.value)
            }
          />

          <Input
            placeholder="Country"
            value={employee.currentCountry}
            onChange={(e) =>
              updateField("currentCountry", e.target.value)
            }
          />

        </div>

      </div>

      {/* Permanent Address */}

      <div className="space-y-4 border-t pt-6">

        <div className="flex items-center justify-between">

          <h3 className="text-lg font-medium">
            Permanent Address
          </h3>

          <label className="flex items-center gap-2 text-sm">

            <input
              type="checkbox"
              checked={employee.sameAsCurrentAddress}
              onChange={(e) => {
                const checked = e.target.checked;

                updateField("sameAsCurrentAddress", checked);

                if (checked) {
                  updateField(
                    "permanentAddress",
                    employee.currentAddress
                  );

                  updateField(
                    "permanentCity",
                    employee.currentCity
                  );

                  updateField(
                    "permanentState",
                    employee.currentState
                  );

                  updateField(
                    "permanentPinCode",
                    employee.currentPinCode
                  );

                  updateField(
                    "permanentCountry",
                    employee.currentCountry
                  );
                }
              }}
            />

            Same as Current Address

          </label>

        </div>

        <Input
          placeholder="Permanent Address"
          value={employee.permanentAddress}
          onChange={(e) =>
            updateField("permanentAddress", e.target.value)
          }
          disabled={employee.sameAsCurrentAddress}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <Input
            placeholder="City"
            value={employee.permanentCity}
            onChange={(e) =>
              updateField("permanentCity", e.target.value)
            }
            disabled={employee.sameAsCurrentAddress}
          />

          <Input
            placeholder="State"
            value={employee.permanentState}
            onChange={(e) =>
              updateField("permanentState", e.target.value)
            }
            disabled={employee.sameAsCurrentAddress}
          />

          <Input
            placeholder="PIN Code"
            value={employee.permanentPinCode}
            onChange={(e) =>
              updateField("permanentPinCode", e.target.value)
            }
            disabled={employee.sameAsCurrentAddress}
          />

          <Input
            placeholder="Country"
            value={employee.permanentCountry}
            onChange={(e) =>
              updateField("permanentCountry", e.target.value)
            }
            disabled={employee.sameAsCurrentAddress}
          />

        </div>

      </div>

    </div>
  );
}