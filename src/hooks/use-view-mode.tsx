import { useEffect, useState } from "react";

export type ViewMode = "admin" | "instructor" | "student" | "sales" | "our-student";

const VIEW_MODE_KEY = "metana:view-mode";
export const VIEW_MODE_CHANGE_EVENT = "metana:view-mode-change";

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  admin: "Admin",
  instructor: "Instructor",
  student: "Student",
  sales: "Sales",
  "our-student": "Our Student",
};

export function setViewMode(mode: ViewMode) {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    // ignore (SSR / storage unavailable)
  }
  window.dispatchEvent(new CustomEvent(VIEW_MODE_CHANGE_EVENT, { detail: mode }));
}

export function useViewMode(): ViewMode {
  const [mode, setMode] = useState<ViewMode>("admin");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" &&
      localStorage.getItem(VIEW_MODE_KEY)) as ViewMode | null;
    if (
      stored === "admin" ||
      stored === "instructor" ||
      stored === "student" ||
      stored === "sales" ||
      stored === "our-student"
    ) {
      setMode(stored);
    }
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<ViewMode>).detail;
      if (next) setMode(next);
    };
    window.addEventListener(VIEW_MODE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(VIEW_MODE_CHANGE_EVENT, onChange);
  }, []);

  return mode;
}
