import {
  LayoutDashboard,
  Server,
  Settings as SettingsIcon,
  Users,
  Wrench,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Assets", icon: Server, active: true },
  { label: "Maintenance", icon: Wrench },
  { label: "Users", icon: Users },
];

const settingsItem: NavItem = { label: "Settings", icon: SettingsIcon };

const getItemClassName = (active?: boolean) => {
  if (active) {
    return "border-l-4 border-[#E3001B] bg-red-50 text-[#E3001B]";
  }

  return "border-l-4 border-transparent text-slate-700";
};

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="px-6 py-7">
        <p className="text-2xl font-bold tracking-tight text-[#E3001B]">ITAM</p>
      </div>

      <nav className="flex flex-1 flex-col pb-5">
        <ul className="space-y-1 px-0">
          {primaryNav.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <div
                  aria-current={item.active ? "page" : undefined}
                  className={`flex items-center gap-3 py-3 pl-5 pr-6 text-sm font-medium transition-colors ${getItemClassName(item.active)}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <ul className="mt-auto px-0">
          <li>
            <div
              className={`flex items-center gap-3 py-3 pl-5 pr-6 text-sm font-medium transition-colors ${getItemClassName(
                settingsItem.active,
              )}`}
            >
              <settingsItem.icon className="h-4 w-4" />
              <span>{settingsItem.label}</span>
            </div>
          </li>
        </ul>
      </nav>
    </aside>
  );
}