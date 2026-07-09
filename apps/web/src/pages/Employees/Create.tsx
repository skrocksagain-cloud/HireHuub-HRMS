import { useState } from "react";
import PageHeader from "../../../ui/PageHeader";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";

export default function CreateEmployee() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    personalEmail: "",
    department: "",
    designation: "",
    role: "",
    joiningDate: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Create Employee"
        subtitle="Add a new employee to HireHuub"
      />

      <Card>
        <div className="grid grid-cols-2 gap-5">

          <Input
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
          />

          <Input
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
          />

          <Input
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={handleChange}
          />

          <Input
            name="personalEmail"
            placeholder="Personal Email"
            value={form.personalEmail}
            onChange={handleChange}
          />

          <Input
            name="joiningDate"
            type="date"
            value={form.joiningDate}
            onChange={handleChange}
          />

          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="border rounded-xl px-4 py-3"
          >
            <option value="">Select Department</option>
            <option>Management</option>
            <option>Recruitment</option>
            <option>Finance</option>
            <option>HR</option>
            <option>Administration</option>
          </select>

          <select
            name="designation"
            value={form.designation}
            onChange={handleChange}
            className="border rounded-xl px-4 py-3"
          >
            <option value="">Select Designation</option>
            <option>CEO</option>
            <option>Director</option>
            <option>CFO</option>
            <option>Recruitment Manager</option>
            <option>Recruitment Executive</option>
          </select>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="border rounded-xl px-4 py-3"
          >
            <option value="">Select Role</option>
            <option>SUPER_ADMIN</option>
            <option>ADMIN</option>
            <option>HR</option>
            <option>FINANCE</option>
            <option>RECRUITMENT_MANAGER</option>
            <option>RECRUITMENT_EXECUTIVE</option>
          </select>

        </div>

        <div className="mt-8 flex justify-end">
          <Button>Create Employee</Button>
        </div>
      </Card>
    </div>
  );
}