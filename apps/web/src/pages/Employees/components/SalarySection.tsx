import type { Employee } from "../../../types/Employee";
import Input from "../../../ui/Input";

interface SalarySectionProps {
  employee: Employee;
  updateField: (
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) => void;
}

export default function SalarySection({
  employee,
  updateField,
}: SalarySectionProps) {
  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Salary Information
      </h2>

      {/* Salary Structure */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <Input
          type="number"
          placeholder="Monthly Gross Salary"
          value={employee.monthlyGrossSalary}
          onChange={(e) =>
            updateField(
              "monthlyGrossSalary",
              e.target.value
            )
          }
        />

        <Input
          type="number"
          placeholder="Annual CTC"
          value={employee.annualCTC}
          onChange={(e) =>
            updateField(
              "annualCTC",
              e.target.value
            )
          }
        />

        <Input
          type="number"
          placeholder="Basic Salary"
          value={employee.basicSalary}
          onChange={(e) =>
            updateField(
              "basicSalary",
              e.target.value
            )
          }
        />

        <Input
          type="number"
          placeholder="HRA"
          value={employee.hra}
          onChange={(e) =>
            updateField(
              "hra",
              e.target.value
            )
          }
        />

        <Input
          type="number"
          placeholder="Special Allowance"
          value={employee.specialAllowance}
          onChange={(e) =>
            updateField(
              "specialAllowance",
              e.target.value
            )
          }
        />

        <Input
          type="number"
          placeholder="Conveyance Allowance"
          value={employee.conveyanceAllowance}
          onChange={(e) =>
            updateField(
              "conveyanceAllowance",
              e.target.value
            )
          }
        />

        <Input
          type="number"
          placeholder="Medical Allowance"
          value={employee.medicalAllowance}
          onChange={(e) =>
            updateField(
              "medicalAllowance",
              e.target.value
            )
          }
        />

        <Input
          type="number"
          placeholder="Bonus"
          value={employee.bonus}
          onChange={(e) =>
            updateField(
              "bonus",
              e.target.value
            )
          }
        />

        <Input
          type="number"
          placeholder="Variable Pay"
          value={employee.variablePay}
          onChange={(e) =>
            updateField(
              "variablePay",
              e.target.value
            )
          }
        />

      </div>

      {/* Payroll Settings */}

      <div className="border-t pt-6">

        <h3 className="text-lg font-medium mb-4">
          Payroll Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <div>

            <label className="block text-sm font-medium mb-2">
              PF Applicable
            </label>

            <select
              value={employee.pfApplicable}
              onChange={(e) =>
                updateField(
                  "pfApplicable",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

          </div>

          <div>

            <label className="block text-sm font-medium mb-2">
              ESI Applicable
            </label>

            <select
              value={employee.esiApplicable}
              onChange={(e) =>
                updateField(
                  "esiApplicable",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

          </div>

          <div>

            <label className="block text-sm font-medium mb-2">
              Professional Tax
            </label>

            <select
              value={employee.professionalTaxApplicable}
              onChange={(e) =>
                updateField(
                  "professionalTaxApplicable",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

          </div>

          <div>

            <label className="block text-sm font-medium mb-2">
              Salary Effective Date
            </label>

            <Input
              type="date"
              value={employee.salaryEffectiveDate}
              onChange={(e) =>
                updateField(
                  "salaryEffectiveDate",
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