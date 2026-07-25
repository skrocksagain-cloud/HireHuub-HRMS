import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Banknote,
  ChevronDown,
  ChevronRight,
  FileText,
  ArrowLeftRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FlatItem {
  kind: "flat";
  name: string;
  path: string;
}

interface LeafChild {
  name: string;
  path: string;
}

interface SubGroup {
  kind: "sub-group";
  name: string;
  icon: React.ReactNode;
  children: LeafChild[];
}

interface DirectLeaf {
  kind: "leaf";
  name: string;
  path: string;
}

type GroupChild = DirectLeaf | SubGroup;

interface GroupItem {
  kind: "group";
  name: string;
  icon: React.ReactNode;
  basePath: string;
  children: GroupChild[];
}

type SidebarItem = FlatItem | GroupItem;

// ── Menu definition ──────────────────────────────────────────────────────────

const flatItems: FlatItem[] = [
  { kind: "flat", name: "Dashboard", path: "/dashboard" },
  { kind: "flat", name: "Offer Management", path: "/internal-hiring" },
  { kind: "flat", name: "Employees", path: "/employees" },
  { kind: "flat", name: "Attendance", path: "/attendance" },
  { kind: "flat", name: "Leave", path: "/leave" },
  { kind: "flat", name: "Payroll", path: "/payroll" },
  { kind: "flat", name: "Recruitment", path: "/recruitment" },
  { kind: "flat", name: "Reports", path: "/reports" },
  { kind: "flat", name: "Organization", path: "/organization" },
  { kind: "flat", name: "Settings", path: "/settings" },
];

const financeGroup: GroupItem = {
  kind: "group",
  name: "Finance",
  icon: <Banknote size={18} />,
  basePath: "/finance",
  children: [
    { kind: "leaf", name: "Dashboard", path: "/finance/dashboard" },
    {
      kind: "sub-group",
      name: "Billing",
      icon: <FileText size={16} />,
      children: [
        { name: "New Invoice", path: "/finance/billing/new-invoice" },
        { name: "Invoice Details", path: "/finance/billing/invoice-details" },
        { name: "Credit Notes", path: "/finance/billing/credit-notes" },
      ],
    },
    {
      kind: "sub-group",
      name: "Transactions",
      icon: <ArrowLeftRight size={16} />,
      children: [
        { name: "Transactions", path: "/finance/transactions" },
        { name: "Bank Payment Batch", path: "/finance/transactions/bank-payment-batch" },
        { name: "Payment History", path: "/finance/transactions/payment-history" },
      ],
    },
  ],
};

const menuItems: SidebarItem[] = [...flatItems, financeGroup];

// ── Shared style helpers ─────────────────────────────────────────────────────

const activeCls = "bg-white text-green-700 font-semibold";
const idleCls = "hover:bg-green-600";
const baseCls = "flex w-full items-center gap-2 rounded-lg p-3 text-left transition";

// ── Sub-components ───────────────────────────────────────────────────────────

function FlatLink({ name, path }: FlatItem) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `${baseCls} ${isActive ? activeCls : idleCls}`
      }
    >
      {name}
    </NavLink>
  );
}

interface SubGroupSectionProps {
  group: SubGroup;
  currentPath: string;
}

function SubGroupSection({ group, currentPath }: SubGroupSectionProps) {
  const isAnyChildActive = group.children.some((c) => currentPath === c.path);
  const [open, setOpen] = useState(isAnyChildActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${baseCls} pl-6 ${isAnyChildActive ? activeCls : idleCls}`}
      >
        {group.icon}
        <span className="flex-1">{group.name}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="ml-6 mt-1 space-y-1">
          {group.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              className={({ isActive }) =>
                `${baseCls} pl-4 text-sm ${isActive ? activeCls : idleCls}`
              }
            >
              {child.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

interface GroupSectionProps {
  group: GroupItem;
  currentPath: string;
}

function GroupSection({ group, currentPath }: GroupSectionProps) {
  const isGroupActive = currentPath.startsWith(group.basePath);
  const [open, setOpen] = useState(isGroupActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${baseCls} ${isGroupActive ? activeCls : idleCls}`}
      >
        {group.icon}
        <span className="flex-1">{group.name}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {open && (
        <div className="ml-4 mt-1 space-y-1">
          {group.children.map((child) => {
            if (child.kind === "leaf") {
              return (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    `${baseCls} pl-4 text-sm ${isActive ? activeCls : idleCls}`
                  }
                >
                  {child.name}
                </NavLink>
              );
            }

            return (
              <SubGroupSection
                key={child.name}
                group={child}
                currentPath={currentPath}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 h-screen bg-green-700 text-white p-5 overflow-y-auto">

      <h1 className="text-2xl font-bold mb-8">
        HireHuub HRMS
      </h1>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          if (item.kind === "flat") {
            return <FlatLink key={item.path} {...item} />;
          }

          return (
            <GroupSection
              key={item.basePath}
              group={item}
              currentPath={pathname}
            />
          );
        })}
      </nav>

    </aside>
  );
}
