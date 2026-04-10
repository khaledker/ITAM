import {
  BarChart2,
  BrainCircuit,
  LayoutDashboard,
  Menu,
  Server,
  Settings as SettingsIcon,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Assets", icon: Server, to: "/assets" },
  { label: "Maintenance", icon: Wrench, to: "/maintenance" },
  { label: "Predictions", icon: BrainCircuit, to: "/predictions" },
  { label: "Reports", icon: BarChart2, to: "/reports" },
  { label: "Users", icon: Users, to: "/users" },
];

const settingsItem: NavItem = { label: "Settings", icon: SettingsIcon, to: "/settings" };

const getItemClassName = (isActive: boolean) => {
  if (isActive) {
    return "border-l-4 border-[#E3001B] bg-red-50 text-[#E3001B] hover:bg-red-100";
  }

  return "border-l-4 border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900";
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`pb-3 pt-4 ${isCollapsed ? "px-2" : "px-4"}`}>
        <button
          type="button"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-center rounded-md py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col pb-5">
        <ul className="space-y-1 px-0">
          {primaryNav.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center py-3 text-sm font-medium transition-colors ${
                      isCollapsed ? "justify-center px-0" : "gap-3 pl-5 pr-6"
                    } ${getItemClassName(isActive)}`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <ul className="mt-auto px-0">
          <li>
            <NavLink
              to={settingsItem.to}
              className={({ isActive }) =>
                `flex items-center py-3 text-sm font-medium transition-colors ${
                  isCollapsed ? "justify-center px-0" : "gap-3 pl-5 pr-6"
                } ${getItemClassName(isActive)}`
              }
            >
              <settingsItem.icon className="h-4 w-4" />
              {!isCollapsed && <span>{settingsItem.label}</span>}
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}