import type { Offer } from "../../../../types/Offer";
import type { Department } from "../../../../types/Department";
import type { Designation } from "../../../../types/Designation";
import type { Employee } from "../../../../types/Employee";

import Card from "../../../../ui/Card";
import Input from "../../../../ui/Input";

interface EmploymentInformationProps {
  form: Offer;

  departments: Department[];

  designations: Designation[];

  managers: Employee[];

  onChange: <K extends keyof Offer>(
    field: K,
    value: Offer[K]
  ) => void;
}

export default function EmploymentInformation({
  form,
  departments,
  designations,
  managers,
  onChange,
}: EmploymentInformationProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-6">
        Employment Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Department */}

        <div>
          <label className="block mb-2 text-sm font-medium">
            Department
          </label>

          <select
            value={form.departmentId}
            onChange={(e) => {
              const department = departments.find(
                (item) => item.id === e.target.value
              );

              onChange("departmentId", e.target.value);

              onChange(
                "departmentName",
                department?.name ?? ""
              );
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-green-600 focus:outline-none"
          >
            <option value="">
              Select Department
            </option>

            {departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
              </option>
            ))}
          </select>
        </div>

        {/* Designation */}

        <div>
          <label className="block mb-2 text-sm font-medium">
            Designation
          </label>

          <select
            value={form.designationId}
            onChange={(e) => {
              const designation = designations.find(
                (item) => item.id === e.target.value
              );

              onChange("designationId", e.target.value);

              onChange(
                "designationName",
                designation?.name ?? ""
              );
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-green-600 focus:outline-none"
          >
            <option value="">
              Select Designation
            </option>

            {designations.map((designation) => (
              <option
                key={designation.id}
                value={designation.id}
              >
                {designation.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reporting Manager */}

        <div>
          <label className="block mb-2 text-sm font-medium">
            Reporting Manager
          </label>

          <select
            value={form.reportingManagerId}
            onChange={(e) => {
              const manager = managers.find(
                (item) => item.id === e.target.value
              );

              onChange(
                "reportingManagerId",
                e.target.value
              );

              const fullName = manager
                ? [
                    manager.firstName,
                    manager.middleName,
                    manager.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ")
                : "";

              onChange(
                "reportingManager",
                fullName
              );
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-green-600 focus:outline-none"
          >
            <option value="">
              Select Reporting Manager
            </option>

            {managers.map((manager) => (
              <option
                key={manager.id}
                value={manager.id}
              >
                {[
                  manager.firstName,
                  manager.middleName,
                  manager.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Type */}

        <div>
          <label className="block mb-2 text-sm font-medium">
            Employment Type
          </label>

          <select
            value={form.employmentType}
            onChange={(e) =>
              onChange(
                "employmentType",
                e.target.value as Offer["employmentType"]
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-green-600 focus:outline-none"
          >
            <option value="Permanent">
              Permanent
            </option>

            <option value="Contract">
              Contract
            </option>

            <option value="Intern">
              Intern
            </option>
          </select>
        </div>

        {/* Work Location */}

        <Input
          label="Work Location"
          value={form.workLocation}
          onChange={(e) =>
            onChange(
              "workLocation",
              e.target.value
            )
          }
        />

        {/* Joining Date */}

        <Input
          type="date"
          label="Joining Date"
          value={form.joiningDate}
          onChange={(e) =>
            onChange(
              "joiningDate",
              e.target.value
            )
          }
        />

        {/* Probation */}

        <Input
          type="number"
          label="Probation Period (Days)"
          value={String(form.probationPeriod)}
          onChange={(e) =>
            onChange(
              "probationPeriod",
              Number(e.target.value)
            )
          }
        />

      </div>
    </Card>
  );
}