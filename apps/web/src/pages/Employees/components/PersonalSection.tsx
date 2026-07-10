import Input from "../../../ui/Input";
import type { Employee } from "../../../types/Employee";

interface PersonalSectionProps {
  employee: Employee;
  updateField: (
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) => void;
}

export default function PersonalSection({
  employee,
  updateField,
}: PersonalSectionProps) {
  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Personal Information
      </h2>

      {/* Employee ID & Photo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="md:col-span-3">

          <label className="block text-sm font-medium mb-2">
            Employee ID
          </label>

         <Input
  value={employee.employeeId || "Will be generated automatically"}
  readOnly
  className="bg-slate-100 cursor-not-allowed"
/>

        </div>

        <div className="flex flex-col items-center justify-center">

          <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">

            <span className="text-xs text-gray-500 text-center px-2">
              Employee Photo
            </span>

          </div>

          <button
            type="button"
            className="mt-3 text-sm text-green-700 hover:underline"
          >
            Upload Photo
          </button>

        </div>

      </div>

      {/* Name */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Input
          placeholder="First Name *"
          value={employee.firstName}
          onChange={(e) =>
            updateField("firstName", e.target.value)
          }
        />

        <Input
          placeholder="Middle Name"
          value={employee.middleName}
          onChange={(e) =>
            updateField("middleName", e.target.value)
          }
        />

        <Input
          placeholder="Last Name *"
          value={employee.lastName}
          onChange={(e) =>
            updateField("lastName", e.target.value)
          }
        />

      </div>

      {/* Personal Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div>

          <label className="block text-sm mb-2">
            Gender
          </label>

          <select
            value={employee.gender}
            onChange={(e) =>
              updateField("gender", e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

        </div>

        <div>

          <label className="block text-sm mb-2">
            Date of Birth
          </label>

          <Input
            type="date"
            value={employee.dateOfBirth}
            onChange={(e) =>
              updateField("dateOfBirth", e.target.value)
            }
          />

        </div>

        <div>

          <label className="block text-sm mb-2">
            Blood Group
          </label>

          <select
            value={employee.bloodGroup}
            onChange={(e) =>
              updateField("bloodGroup", e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>AB+</option>
            <option>AB-</option>
            <option>O+</option>
            <option>O-</option>
          </select>

        </div>

        <div>

          <label className="block text-sm mb-2">
            Marital Status
          </label>

          <select
            value={employee.maritalStatus}
            onChange={(e) =>
              updateField(
                "maritalStatus",
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select</option>
            <option>Single</option>
            <option>Married</option>
            <option>Divorced</option>
            <option>Widowed</option>
          </select>

        </div>

      </div>

    </div>
  );
}