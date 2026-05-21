import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Calendar,
  BookOpen,
  Megaphone,
  Settings,
  Hammer,
  Package,
  UserCog,
  FileText,
  SlidersHorizontal,
  GitBranch,
  Headphones,
  MoreVertical,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import metanaLogo from "@/assets/metana-logo-black.png";
import metanaLogoDark from "@/assets/metana-logo-white.png";

const SIDEBAR_TOGGLE_EVENT = "metana:toggle-sidebar";

const platform = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/bootcamps/new", label: "Create Bootcamp", icon: Hammer },
  { to: "/products", label: "Products", icon: Package },
  { to: "/announcement", label: "Announcement", icon: Megaphone },
  { to: "/settings", label: "Settings", icon: Settings },
];

const internal = [
  { to: "/users", label: "User Management", icon: UserCog },
  { to: "/certificates", label: "Certificates", icon: FileText },
  { to: "/platform-settings", label: "Platform Settings", icon: SlidersHorizontal },
];

const external = [
  { to: "/repository", label: "Repository Creator", icon: GitBranch },
  { to: "/discord", label: "Discord", icon: Headphones },
];

function Section({ title, items, collapsed }: { title: string; items: typeof platform; collapsed: boolean }) {
  return (
    <div className="mb-6">
      <p className={`px-3 mb-2 text-smaller font-medium tracking-widest text-muted-foreground transition-opacity duration-300 ${collapsed ? "opacity-0" : "opacity-100"}`}>
        {title}
      </p>
      <nav className="space-y-1">
        {items.map(({ to, label, icon: Icon }: any) => {
          const item = (
            <Link
              key={label}
              to={to as string}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-body transition-all duration-300 text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground ${collapsed ? "justify-center" : ""}`}
              activeOptions={{ exact: to === "/" }}
              activeProps={{
                className: `bg-muted text-foreground shadow-[var(--shadow-soft)] font-semibold ${collapsed ? "justify-center" : ""}`,
              }}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>{label}</span>
            </Link>
          );

          return collapsed ? (
            <Tooltip key={label}>
              <TooltipTrigger asChild>{item}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : item;
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onToggle = () => setCollapsed((v) => !v);
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(SIDEBAR_TOGGLE_EVENT, onToggle);
  }, []);

  return (
    <aside className={`shrink-0 h-screen sticky top-0 bg-sidebar flex flex-col overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${collapsed ? "w-0 border-r-0" : "w-[260px] border-r border-sidebar-border"}`}>
      <div className="px-5 pt-6 pb-8 flex justify-start">
        <h2 className="text-main-header font-semibold text-foreground">Metana Platform</h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3">
        <Section title="PLATFORM" items={platform} collapsed={false} />
        <Section title="INTERNAL" items={internal} collapsed={false} />
        <Section title="EXTERNAL" items={external} collapsed={false} />
      </div>
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-brand text-brand-foreground font-semibold text-body hover:opacity-90 transition-opacity">
          <Headphones className="h-4 w-4" />
          <span>Support</span>
        </button>
        <div className="flex items-center gap-3 px-1">
          <img src={metanaLogo} alt="Metana" className="h-8 w-8 rounded-full object-cover shrink-0 block dark:hidden" />
          <img src={metanaLogoDark} alt="Metana" className="h-8 w-8 rounded-full object-contain shrink-0 hidden dark:block" />
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-foreground truncate">LMS ADMIN</p>
            <p className="text-small text-muted-foreground truncate">admin@lms.com</p>
          </div>
          <button className="p-1 rounded-full hover:bg-sidebar-accent transition-colors" aria-label="More">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}
