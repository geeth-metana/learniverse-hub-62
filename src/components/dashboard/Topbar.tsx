import { Bell, Search, Moon, Sun, PanelLeft } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import metanaLogo from "@/assets/metana-logo-black.png";
import metanaLogoDark from "@/assets/metana-logo-white.png";
import { useTheme, THEME_TOGGLE_EVENT } from "@/hooks/use-theme";

const SIDEBAR_TOGGLE_EVENT = "metana:toggle-sidebar";

function IconBtn({
  label,
  children,
  className = "",
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          onClick={onClick}
          className={`relative h-9 w-9 grid place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function Topbar() {
  const theme = useTheme();
  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-background">
      <IconBtn
        label="Toggle sidebar"
        className="hover:bg-sidebar-accent"
        onClick={() => window.dispatchEvent(new Event(SIDEBAR_TOGGLE_EVENT))}
      >
        <PanelLeft className="h-5 w-5" />
      </IconBtn>
      <div className="flex items-center gap-2">
        <img src={metanaLogo} alt="Metana" className="h-8 w-32 object-contain block dark:hidden" />
        <img
          src={metanaLogoDark}
          alt="Metana"
          className="h-8 w-32 object-contain hidden dark:block"
        />
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <IconBtn label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand" />
        </IconBtn>
        <IconBtn label="Search">
          <Search className="h-5 w-5" />
        </IconBtn>
        <IconBtn
          label="Toggle theme"
          onClick={() => window.dispatchEvent(new Event(THEME_TOGGLE_EVENT))}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </IconBtn>
      </div>
    </header>
  );
}
