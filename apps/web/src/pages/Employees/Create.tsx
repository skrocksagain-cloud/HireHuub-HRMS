import { useNavigate } from "react-router-dom";

import EmployeeForm from "./EmployeeForm";

export default function CreateEmployee() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">

      <div className="border-b pb-4">

        <h1 className="text-3xl font-bold">
          Create Employee
        </h1>

        <p className="text-slate-500 mt-2">
          Add a new employee to HireHuub HRMS
        </p>

      </div>

      <EmployeeForm
        onSuccess={() => navigate("/employees")}
      />

    </div>
  );
}