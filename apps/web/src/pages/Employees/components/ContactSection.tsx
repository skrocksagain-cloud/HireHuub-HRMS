import type { Employee } from "../../../types/Employee";
import Input from "../../../ui/Input";

interface ContactSectionProps {
  employee: Employee;
  updateField: (
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) => void;
}

export default function ContactSection({
  employee,
  updateField,
}: ContactSectionProps) {
  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Contact Information
      </h2>

      {/* Contact Details */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <Input
          placeholder="Official Email"
          type="email"
          value={employee.officialEmail}
          onChange={(e) =>
            updateField("officialEmail", e.target.value)
          }
        />

        <Input
          placeholder="Personal Email"
          type="email"
          value={employee.personalEmail}
          onChange={(e) =>
            updateField("personalEmail", e.target.value)
          }
        />

        <Input
          placeholder="Mobile Number"
          value={employee.mobile}
          onChange={(e) =>
            updateField("mobile", e.target.value)
          }
        />

        <Input
          placeholder="Alternate Mobile"
          value={employee.alternateMobile}
          onChange={(e) =>
            updateField("alternateMobile", e.target.value)
          }
        />

       <Input
  label="Emergency Mobile"
  value={employee.emergencyPrimaryMobile}
  onChange={(e) =>
    updateField(
      "emergencyPrimaryMobile",
      e.target.value
    )
  }
/>

      </div>

      {/* Current Address */}

      <div className="space-y-4">

        <h3 className="font-semibold text-lg">
          Current Address
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Input
            placeholder="Current Address"
            value={employee.currentAddress}
            onChange={(e) =>
              updateField(
                "currentAddress",
                e.target.value
              )
            }
          />

          <Input
            placeholder="Current City"
            value={employee.currentCity}
            onChange={(e) =>
              updateField(
                "currentCity",
                e.target.value
              )
            }
          />

          <Input
            placeholder="Current State"
            value={employee.currentState}
            onChange={(e) =>
              updateField(
                "currentState",
                e.target.value
              )
            }
          />

          <Input
            placeholder="Current PIN Code"
            value={employee.currentPinCode}
            onChange={(e) =>
              updateField(
                "currentPinCode",
                e.target.value
              )
            }
          />

        </div>

      </div>

      {/* Permanent Address */}

      <div className="space-y-4">

        <h3 className="font-semibold text-lg">
          Permanent Address
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Input
            placeholder="Permanent Address"
            value={employee.permanentAddress}
            onChange={(e) =>
              updateField(
                "permanentAddress",
                e.target.value
              )
            }
          />

          <Input
            placeholder="Permanent City"
            value={employee.permanentCity}
            onChange={(e) =>
              updateField(
                "permanentCity",
                e.target.value
              )
            }
          />

          <Input
            placeholder="Permanent State"
            value={employee.permanentState}
            onChange={(e) =>
              updateField(
                "permanentState",
                e.target.value
              )
            }
          />

          <Input
            placeholder="Permanent PIN Code"
            value={employee.permanentPinCode}
            onChange={(e) =>
              updateField(
                "permanentPinCode",
                e.target.value
              )
            }
          />

        </div>

      </div>

    </div>
  );
}