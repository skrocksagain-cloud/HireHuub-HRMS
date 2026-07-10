import type { Employee } from "../../../types/Employee";
import Input from "../../../ui/Input";

interface BankSectionProps {
  employee: Employee;
  updateField: (
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) => void;
}

export default function BankSection({
  employee,
  updateField,
}: BankSectionProps) {
  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">
        Bank Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Account Holder */}

        <Input
          placeholder="Account Holder Name"
          value={employee.accountHolderName}
          onChange={(e) =>
            updateField(
              "accountHolderName",
              e.target.value
            )
          }
        />

        {/* Bank Name */}

        <Input
          placeholder="Bank Name"
          value={employee.bankName}
          onChange={(e) =>
            updateField(
              "bankName",
              e.target.value
            )
          }
        />

        {/* Branch */}

        <Input
          placeholder="Branch Name"
          value={employee.branchName}
          onChange={(e) =>
            updateField(
              "branchName",
              e.target.value
            )
          }
        />

        {/* Account Number */}

        <Input
          placeholder="Account Number"
          value={employee.accountNumber}
          onChange={(e) =>
            updateField(
              "accountNumber",
              e.target.value
            )
          }
        />

        {/* IFSC */}

        <Input
          placeholder="IFSC Code"
          value={employee.ifscCode}
          onChange={(e) =>
            updateField(
              "ifscCode",
              e.target.value
            )
          }
        />

        {/* Account Type */}

        <div>

          <label className="block text-sm font-medium mb-2">
            Account Type
          </label>

          <select
            value={employee.accountType}
            onChange={(e) =>
              updateField(
                "accountType",
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              Select Account Type
            </option>

            <option value="Savings">
              Savings
            </option>

            <option value="Current">
              Current
            </option>

            <option value="Salary">
              Salary
            </option>

          </select>

        </div>

      </div>

      {/* Payment Information */}

      <div className="border-t pt-6">

        <h3 className="text-lg font-medium mb-4">
          Salary Payment
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <div>

            <label className="block text-sm font-medium mb-2">
              Payment Mode
            </label>

            <select
              value={employee.paymentMode}
              onChange={(e) =>
                updateField(
                  "paymentMode",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="">
                Select Payment Mode
              </option>

              <option value="Bank Transfer">
                Bank Transfer
              </option>

              <option value="Cheque">
                Cheque
              </option>

              <option value="Cash">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

            </select>

          </div>

          <Input
            placeholder="UPI ID (Optional)"
            value={employee.upiId}
            onChange={(e) =>
              updateField(
                "upiId",
                e.target.value
              )
            }
          />

        </div>

      </div>

    </div>
  );
}