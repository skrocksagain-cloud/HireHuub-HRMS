import type { Employee } from "../../../types/Employee";
import Input from "../../../ui/Input";

interface EmergencySectionProps {
  employee: Employee;
  updateField: (
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) => void;
}

export default function EmergencySection({
  employee,
  updateField,
}: EmergencySectionProps) {
  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Emergency Contact
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Contact Name */}

        <Input
          placeholder="Emergency Contact Name"
          value={employee.emergencyContactName}
          onChange={(e) =>
            updateField(
              "emergencyContactName",
              e.target.value
            )
          }
        />

        {/* Relationship */}

        <Input
          placeholder="Relationship"
          value={employee.emergencyRelationship}
          onChange={(e) =>
            updateField(
              "emergencyRelationship",
              e.target.value
            )
          }
        />

        {/* Primary Mobile */}

        <Input
          placeholder="Primary Mobile"
          value={employee.emergencyPrimaryMobile}
          onChange={(e) =>
            updateField(
              "emergencyPrimaryMobile",
              e.target.value
            )
          }
        />

        {/* Alternate Mobile */}

        <Input
          placeholder="Alternate Mobile"
          value={employee.emergencyAlternateMobile}
          onChange={(e) =>
            updateField(
              "emergencyAlternateMobile",
              e.target.value
            )
          }
        />

        {/* Email */}

        <Input
          type="email"
          placeholder="Emergency Email"
          value={employee.emergencyEmail}
          onChange={(e) =>
            updateField(
              "emergencyEmail",
              e.target.value
            )
          }
        />

      </div>

      {/* Address */}

      <div className="border-t pt-6">

        <h3 className="text-lg font-medium mb-4">
          Emergency Contact Address
        </h3>

        <div className="space-y-4">

          <Input
            placeholder="Address"
            value={employee.emergencyAddress}
            onChange={(e) =>
              updateField(
                "emergencyAddress",
                e.target.value
              )
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Input
              placeholder="City"
              value={employee.emergencyCity}
              onChange={(e) =>
                updateField(
                  "emergencyCity",
                  e.target.value
                )
              }
            />

            <Input
              placeholder="State"
              value={employee.emergencyState}
              onChange={(e) =>
                updateField(
                  "emergencyState",
                  e.target.value
                )
              }
            />

            <Input
              placeholder="PIN Code"
              value={employee.emergencyPinCode}
              onChange={(e) =>
                updateField(
                  "emergencyPinCode",
                  e.target.value
                )
              }
            />

          </div>

        </div>

      </div>

    </div>
  );
}