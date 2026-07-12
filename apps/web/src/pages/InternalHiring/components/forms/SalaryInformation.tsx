import type { Offer } from "../../../../types/Offer";

import Card from "../../../../ui/Card";
import Input from "../../../../ui/Input";

interface SalaryInformationProps {
  form: Offer;

  onChange: <K extends keyof Offer>(
    field: K,
    value: Offer[K]
  ) => void;
}

export default function SalaryInformation({
  form,
  onChange,
}: SalaryInformationProps) {
  return (
    <Card>

      <h2 className="text-xl font-semibold mb-6">
        Salary Information
      </h2>

      {/* =======================================================
          Salary Components
      ======================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <Input
          type="number"
          label="Monthly Gross Salary"
          value={String(form.monthlyGrossSalary)}
          onChange={(e) =>
            onChange(
              "monthlyGrossSalary",
              Number(e.target.value)
            )
          }
        />

        <Input
          type="number"
          label="Annual CTC"
          value={String(form.annualCTC)}
          onChange={(e) =>
            onChange(
              "annualCTC",
              Number(e.target.value)
            )
          }
        />

        <Input
          type="number"
          label="Basic Salary"
          value={String(form.basicSalary)}
          onChange={(e) =>
            onChange(
              "basicSalary",
              Number(e.target.value)
            )
          }
        />

        <Input
          type="number"
          label="HRA"
          value={String(form.hra)}
          onChange={(e) =>
            onChange(
              "hra",
              Number(e.target.value)
            )
          }
        />

        <Input
          type="number"
          label="Conveyance Allowance"
          value={String(form.conveyanceAllowance)}
          onChange={(e) =>
            onChange(
              "conveyanceAllowance",
              Number(e.target.value)
            )
          }
        />

        <Input
          type="number"
          label="Mobile Allowance"
          value={String(form.mobileAllowance)}
          onChange={(e) =>
            onChange(
              "mobileAllowance",
              Number(e.target.value)
            )
          }
        />

        <Input
          type="number"
          label="Special Allowance"
          value={String(form.specialAllowance)}
          onChange={(e) =>
            onChange(
              "specialAllowance",
              Number(e.target.value)
            )
          }
        />

        <Input
          type="number"
          label="Professional Tax"
          value={String(form.professionalTax)}
          onChange={(e) =>
            onChange(
              "professionalTax",
              Number(e.target.value)
            )
          }
        />

        <Input
          type="number"
          label="Net Take Home"
          value={String(form.netTakeHome)}
          onChange={(e) =>
            onChange(
              "netTakeHome",
              Number(e.target.value)
            )
          }
        />

      </div>

      {/* =======================================================
          Statutory Compliance
      ======================================================= */}

      <div className="mt-8 border-t pt-6">

        <h3 className="text-lg font-semibold mb-4">
          Statutory Compliance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PF */}

          <label className="flex items-center gap-3 rounded-xl border border-slate-300 p-4 cursor-pointer">

            <input
              type="checkbox"
              checked={form.pfApplicable}
              onChange={(e) =>
                onChange(
                  "pfApplicable",
                  e.target.checked
                )
              }
            />

            <span className="font-medium">
              PF Applicable
            </span>

          </label>

          {/* ESI */}

          <label className="flex items-center gap-3 rounded-xl border border-slate-300 p-4 cursor-pointer">

            <input
              type="checkbox"
              checked={form.esiApplicable}
              onChange={(e) =>
                onChange(
                  "esiApplicable",
                  e.target.checked
                )
              }
            />

            <span className="font-medium">
              ESI Applicable
            </span>

          </label>

        </div>

      </div>

      {/* =======================================================
          Salary Engine Preview
      ======================================================= */}

      <div className="mt-8 rounded-xl border border-dashed border-green-300 bg-green-50 p-6">

        <h3 className="text-lg font-semibold text-green-700">
          Salary Engine
        </h3>

        <p className="text-sm text-slate-600 mt-2">

          In the next sprint this section will automatically calculate:

        </p>

        <ul className="mt-4 space-y-2 text-sm text-slate-700">

          <li>• Monthly Salary Breakup</li>

          <li>• Employer PF Contribution</li>

          <li>• Employee PF Deduction</li>

          <li>• ESI Contribution</li>

          <li>• Professional Tax</li>

          <li>• Net Take Home</li>

          <li>• Annual CTC</li>

          <li>• Payslip Integration</li>

          <li>• Increment Letter Integration</li>

        </ul>

      </div>

    </Card>
  );
}