import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menuItems = [
    // Dashboard
    {
      name: "Dashboard",
      path: "/dashboard",
    },

    // HR
    {
      name: "Offer Management",
      path: "/internal-hiring",
    },
    {
      name: "Employees",
      path: "/employees",
    },
    {
      name: "Attendance",
      path: "/attendance",
    },
    {
      name: "Payroll",
      path: "/payroll",
    },

    // Recruitment
    {
      name: "Recruitment",
      path: "/recruitment",
    },

    // Reports
    {
      name: "Reports",
      path: "/reports",
    },

    // Organization
    {
      name: "Organization",
      path: "/organization",
    },

    // Settings
    {
      name: "Settings",
      path: "/settings",
    },
  ];

  return (
    <aside className="w-64 h-screen bg-green-700 text-white p-5">

      <h1 className="text-2xl font-bold mb-8">
        HireHuub HRMS
      </h1>

      <nav className="space-y-2">

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-lg p-3 transition ${
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

    </aside>
  );
}