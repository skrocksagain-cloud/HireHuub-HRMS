import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Employees", path: "/employees" },
    { name: "Recruitment", path: "/recruitment" },
    { name: "Attendance", path: "/attendance" },
    { name: "Payroll", path: "/payroll" },
    { name: "Reports", path: "/reports" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div className="w-64 h-screen bg-green-700 text-white p-5">
      <h1 className="text-2xl font-bold mb-8">HireHuub</h1>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block p-3 rounded-lg transition ${
                isActive
                  ? "bg-white text-green-700 font-semibold"
                  : "hover:bg-green-600"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}