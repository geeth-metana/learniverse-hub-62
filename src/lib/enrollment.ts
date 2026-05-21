import { useEffect, useState, useCallback } from "react";

export type EnrollStatus = "none" | "pending" | "active";

export type Enrollment = {
  status: EnrollStatus;
  plan?: "plan-01" | "plan-02";
  email?: string;
  purchasedAt?: number;
  approvedAt?: number;
};

const KEY = "metana_enrollments_v1";
const EVT = "metana:enrollments";

function read(): Record<string, Enrollment> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(data: Record<string, Enrollment>) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(EVT));
}

export function useEnrollments() {
  const [data, setData] = useState<Record<string, Enrollment>>({});
  useEffect(() => {
    setData(read());
    const onChange = () => setData(read());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const get = useCallback((id: string): Enrollment => data[id] ?? { status: "none" }, [data]);

  const set = useCallback((id: string, e: Enrollment) => {
    const all = read();
    all[id] = e;
    write(all);
  }, []);

  return { get, set, all: data };
}
