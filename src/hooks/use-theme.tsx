import { useEffect, useState } from "react";

const THEME_KEY = "metana:theme";
export const THEME_TOGGLE_EVENT = "metana:toggle-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY)) as Theme | null;
    const initial: Theme = stored ?? "dark";
    setTheme(initial);
    applyTheme(initial);

    const onToggle = () => {
      setTheme((prev) => {
        const next: Theme = prev === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        return next;
      });
    };
    window.addEventListener(THEME_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(THEME_TOGGLE_EVENT, onToggle);
  }, []);

  return theme;
}
