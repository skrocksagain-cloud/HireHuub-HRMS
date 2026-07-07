import DashboardLayout from "../../layouts/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold">
        Welcome to HireHuub HRMS
      </h1>

      <p className="text-gray-500 mt-2">
        Dashboard is ready.
      </p>
    </DashboardLayout>
  );
}