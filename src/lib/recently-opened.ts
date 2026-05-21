import { useEffect, useState } from "react";

export type RecentlyOpened =
  | { kind: "course"; id: string }
  | { kind: "product"; id: string };

const KEY = "metana:recently-opened";
const EVT = "metana:recently-opened-change";

export function markRecentlyOpened(item: RecentlyOpened) {
  try {
    localStorage.setItem(KEY, JSON.stringify(item));
    window.dispatchEvent(new Event(EVT));
  } catch {}
}

function read(): RecentlyOpened | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentlyOpened) : null;
  } catch {
    return null;
  }
}

export function useRecentlyOpened(): RecentlyOpened | null {
  const [val, setVal] = useState<RecentlyOpened | null>(() => read());
  useEffect(() => {
    const sync = () => setVal(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return val;
}
