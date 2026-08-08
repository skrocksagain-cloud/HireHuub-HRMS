import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  CalendarOff,
  TrendingUp,
  FileText,
  FileX2,
  ArrowLeftRight,
  Briefcase,
  Network,
  Building2,
  Handshake,
  UserPlus,
  UsersRound,
  Megaphone,
  Banknote,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import hLogo from "../../assets/logo/h-logo.png";

// ── Types ────────────────────────────────────────────────────────────────────

interface FlatItem {
  kind: "flat";
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface LeafChild {
  name: string;
  path: string;
  icon?: React.ReactNode;
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
  icon: React.ReactNode;
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

// ── Hire Huub Approved Navigation Structure ──────────────────────────────────

const navigationItems: SidebarItem[] = [
  {
    kind: "flat",
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    kind: "group",
    name: "People",
    icon: <Users size={18} />,
    basePath: "/people",
    children: [
      { kind: "leaf", name: "Employees", path: "/employees", icon: <UserCheck size={16} /> },
      { kind: "leaf", name: "Attendance", path: "/attendance", icon: <CalendarCheck size={16} /> },
      { kind: "leaf", name: "Leave", path: "/leave", icon: <CalendarOff size={16} /> },
      { kind: "leaf", name: "Performance", path: "/performance", icon: <TrendingUp size={16} /> },
      { kind: "leaf", name: "Documents", path: "/documents", icon: <FileText size={16} /> },
    ],
  },
  {
    kind: "group",
    name: "Workbench",
    icon: <Briefcase size={18} />,
    basePath: "/workbench",
    children: [
      {
        kind: "sub-group",
        name: "Network",
        icon: <Network size={16} />,
        children: [
          { name: "Clients", path: "/workbench/network/clients", icon: <Building2 size={14} /> },
          { name: "Associate Partners", path: "/workbench/network/associate-partners", icon: <Handshake size={14} /> },
        ],
      },
      {
        kind: "sub-group",
        name: "Staffing Hub",
        icon: <UserPlus size={16} />,
        children: [
          { name: "Openings", path: "/workbench/staffing-hub/openings", icon: <Briefcase size={14} /> },
          { name: "CRM", path: "/workbench/staffing-hub/crm", icon: <Users size={14} /> },
        ],
      },
      { kind: "leaf", name: "Workforce", path: "/workbench/workforce", icon: <UsersRound size={16} /> },
      { kind: "leaf", name: "Campaign Hub", path: "/workbench/campaign-hub", icon: <Megaphone size={16} /> },
    ],
  },
  {
    kind: "group",
    name: "Finance",
    icon: <Banknote size={18} />,
    basePath: "/finance",
    children: [
      {
        kind: "sub-group",
        name: "Billing",
        icon: <FileText size={16} />,
        children: [
          { name: "Invoices", path: "/finance/billing/invoices", icon: <FileText size={14} /> },
          { name: "Credit Notes", path: "/finance/billing/credit-notes", icon: <FileX2 size={14} /> },
        ],
      },
      { kind: "leaf", name: "Transactions", path: "/finance/transactions", icon: <ArrowLeftRight size={16} /> },
    ],
  },
  {
    kind: "flat",
    name: "Management",
    path: "/management",
    icon: <ShieldCheck size={18} />,
  },
];

// ── Helper Components ────────────────────────────────────────────────────────

function SubGroupSection({
  group,
  currentPath,
  isCollapsed,
}: {
  group: SubGroup;
  currentPath: string;
  isCollapsed: boolean;
}) {
  const isAnyChildActive = group.children.some((c) => currentPath.startsWith(c.path));
  const [open, setOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) setOpen(true);
  }, [isAnyChildActive]);

  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {group.children.map((child) => (
          <NavLink
            key={child.path}
            to={child.path}
            title={`${group.name} - ${child.name}`}
            className={({ isActive }) =>
              `flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ${
                isActive ? "bg-emerald-500/10 text-emerald-400 font-semibold" : ""
              }`
            }
          >
            {child.icon || <span className="text-xs font-semibold">{child.name[0]}</span>}
          </NavLink>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center gap-2.5 rounded-lg py-2 px-3 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition ${
          isAnyChildActive ? "text-emerald-400 font-semibold" : ""
        }`}
      >
        {group.icon}
        <span className="flex-1 text-left">{group.name}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="ml-5 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
          {group.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              className={({ isActive }) =>
                `flex w-full items-center gap-2 rounded-md py-1.5 px-2.5 text-xs text-slate-400 hover:bg-slate-800/80 hover:text-white transition ${
                  isActive ? "bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-400 pl-2" : ""
                }`
              }
            >
              {child.icon}
              <span>{child.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupSection({
  group,
  currentPath,
  isCollapsed,
}: {
  group: GroupItem;
  currentPath: string;
  isCollapsed: boolean;
}) {
  const isGroupActive =
    currentPath.startsWith(group.basePath) ||
    group.children.some((c) =>
      c.kind === "leaf"
        ? currentPath.startsWith(c.path)
        : c.children.some((sub) => currentPath.startsWith(sub.path))
    );
  const [open, setOpen] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  if (isCollapsed) {
    return (
      <div className="space-y-1 py-1">
        {group.children.map((child) => {
          if (child.kind === "leaf") {
            return (
              <NavLink
                key={child.path}
                to={child.path}
                title={child.name}
                className={({ isActive }) =>
                  `flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ${
                    isActive ? "bg-emerald-500/10 text-emerald-400" : ""
                  }`
                }
              >
                {child.icon}
              </NavLink>
            );
          }
          return (
            <SubGroupSection
              key={child.name}
              group={child}
              currentPath={currentPath}
              isCollapsed={true}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition ${
          isGroupActive ? "text-emerald-400" : ""
        }`}
      >
        <span className="text-slate-400">{group.icon}</span>
        <span className="flex-1 text-left">{group.name}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="ml-2 space-y-1 border-l border-slate-800/80 pl-2">
          {group.children.map((child) => {
            if (child.kind === "leaf") {
              return (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-2.5 rounded-lg py-2 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition ${
                      isActive ? "bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-400" : ""
                    }`
                  }
                >
                  {child.icon}
                  <span>{child.name}</span>
                </NavLink>
              );
            }

            return (
              <SubGroupSection
                key={child.name}
                group={child}
                currentPath={currentPath}
                isCollapsed={false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar Main Component ───────────────────────────────────────────────────

export default function Sidebar() {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-all duration-300 shadow-xl ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Top Sidebar Branding */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src={hLogo}
            alt="Hire Huub Logo"
            className="h-8 w-auto shrink-0 object-contain"
          />
          {!isCollapsed && (
            <span className="font-bold text-sm tracking-tight text-white leading-none whitespace-nowrap">
              Hire Huub One
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar">
        {navigationItems.map((item) => {
          if (item.kind === "flat") {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg py-2.5 px-3 text-xs font-semibold tracking-wide transition ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  } ${isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : ""}`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          }

          return (
            <GroupSection
              key={item.basePath}
              group={item}
              currentPath={pathname}
              isCollapsed={isCollapsed}
            />
          );
        })}
      </nav>

      {/* Bottom Sidebar - Tagline Only (No Logo, No Product/Company Name) */}
      {!isCollapsed ? (
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 text-center">
          <p className="text-[11px] text-emerald-400/90 font-medium tracking-tight truncate">
            The Right People. The Right Job.
          </p>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-800 text-center">
          <span className="text-[10px] font-bold text-emerald-400/80 block">HH</span>
        </div>
      )}
    </aside>
  );
}
