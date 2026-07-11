import { useState } from "react";

import PageHeader from "../../ui/PageHeader";
import Card from "../../ui/Card";

import Company from "./components/Company";
import DepartmentPage from "./Department";
import Designations from "./components/Designations";
import Roles from "./components/Roles";

const menus = [
  "Company",
  "Departments",
  "Designations",
  "Roles",
];

export default function Organization() {
  const [selected, setSelected] = useState("Company");

  function renderContent() {
    switch (selected) {
      case "Company":
        return <Company />;

      case "Departments":
        return <DepartmentPage />;

      case "Designations":
        return <Designations />;

      case "Roles":
        return <Roles />;

      default:
        return <Company />;
    }
  }

  return (
    <div className="p-6">

      <PageHeader
        title="Organization"
        description="Manage organization settings"
      />

      <div className="grid grid-cols-12 gap-6">

        <Card className="col-span-3 p-0">

          {menus.map((menu) => (

            <button
              key={menu}
              onClick={() => setSelected(menu)}
              className={`w-full text-left px-5 py-4 border-b transition ${
                selected === menu
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "hover:bg-gray-50"
              }`}
            >
              {menu}
            </button>

          ))}

        </Card>

        <div className="col-span-9">

          {renderContent()}

        </div>

      </div>

    </div>
  );
}