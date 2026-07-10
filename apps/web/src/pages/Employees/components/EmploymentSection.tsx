import type { Employee } from "../../../types/Employee";
import type { Department } from "../../../types/Department";
import type { Designation } from "../../../types/Designation";
import type { Role } from "../../../types/Role";

import Input from "../../../ui/Input";

interface EmploymentSectionProps {
  employee: Employee;

  departments: Department[];
  designations: Designation[];
  roles: Role[];

  updateField: (
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) => void;
}

export default function EmploymentSection({
  employee,
  departments,
  designations,
  roles,
  updateField,
}: EmploymentSectionProps) {
  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Employment Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Department */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Department *
          </label>

          <select
            value={employee.departmentId}
            onChange={(e) =>
              updateField("departmentId", e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select Department</option>

            {departments.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Designation */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Designation *
          </label>

          <select
            value={employee.designationId}
            onChange={(e) =>
              updateField(
                "designationId",
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select Designation</option>

            {designations.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Role *
          </label>

          <select
            value={employee.roleId}
            onChange={(e) =>
              updateField("roleId", e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select Role</option>

            {roles.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date of Joining */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Date of Joining
          </label>

          <Input
            type="date"
            value={employee.dateOfJoining}
            onChange={(e) =>
              updateField(
                "dateOfJoining",
                e.target.value
              )
            }
          />
        </div>

        {/* Employment Type */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Employment Type
          </label>

          <select
            value={employee.employmentType}
            onChange={(e) =>
              updateField(
                "employmentType",
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select</option>
            <option value="Permanent">
              Permanent
            </option>
            <option value="Contract">
              Contract
            </option>
            <option value="Probation">
              Probation
            </option>
            <option value="Intern">
              Intern
            </option>
            <option value="Consultant">
              Consultant
            </option>
          </select>
        </div>

        {/* Reporting Manager */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Reporting Manager
          </label>

          <Input
            placeholder="Reporting Manager"
            value={employee.reportingManager}
            onChange={(e) =>
              updateField(
                "reportingManager",
                e.target.value
              )
            }
          />
        </div>

        {/* Work Location */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Work Location
          </label>

          <Input
            placeholder="Work Location"
            value={employee.workLocation}
            onChange={(e) =>
              updateField(
                "workLocation",
                e.target.value
              )
            }
          />
        </div>

        {/* Shift */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Shift
          </label>

          <select
            value={employee.shift}
            onChange={(e) =>
              updateField("shift", e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select Shift</option>
            <option value="General">
              General
            </option>
            <option value="Morning">
              Morning
            </option>
            <option value="Evening">
              Evening
            </option>
            <option value="Night">
              Night
            </option>
          </select>
        </div>

        {/* Employee Status */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Employee Status
          </label>

          <select
            value={employee.status}
            onChange={(e) =>
              updateField("status", e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

            <option value="Resigned">
              Resigned
            </option>

            <option value="Terminated">
              Terminated
            </option>
          </select>
        </div>

      </div>

    </div>
  );
}