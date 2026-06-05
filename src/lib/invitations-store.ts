import { useEffect, useState } from "react";

export type InvitationStatus =
  | "Pending"
  | "Invite Sent"
  | "Paid"
  | "Expired"
  | "Installment Pending Approval"
  | "Installment Approved"
  | "Installment Rejected"
  | "Bank Transfer Pending"
  | "Bank Transfer Confirmed"
  | "Loan Pending"
  | "Loan Approved";

export type PaymentMethod = "Upfront" | "Installment" | "Bank" | "Loan";
export type ExtendedPaymentMethod = PaymentMethod | "Subscription";

export type UpfrontDetails = {
  paymentType: "Upfront";
  planName: string;
  planAmount: number;
  discountPercent: number;
  checkoutAmount: number;
};
export type InstallmentDetails = {
  paymentType: "Installment";
  fullAmount: number;
  initialDownPayment: number;
  timePeriodMonths: number;
  monthlyPayment: number;
  totalAmount: number;
  // Optional discount details (added for the Plan 01 / 02 / Custom installment flow).
  selectedPlan?: "Plan 01" | "Plan 02" | "Custom Plan";
  discountPercent?: number;
  discountedFullAmount?: number;
};
export type BankDetails = {
  paymentType: "Bank";
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  referenceNote: string;
};
export type LoanDetails = {
  paymentType: "Loan";
  loanProviderName: string;
  loanApplicationLink: string;
  redirectRequired: true;
};
export type SubscriptionDetails = {
  paymentType: "Subscription";
  subscriptionAmount: number;
  monthlyPayment: number;
  billingCycle: "Monthly";
};
export type PaymentDetails =
  | UpfrontDetails
  | InstallmentDetails
  | BankDetails
  | LoanDetails
  | SubscriptionDetails;

export type Invitation = {
  id: string; // e.g. INV-10294
  studentName?: string;
  studentEmail: string;
  course: string; // course title
  courseId: string; // courses-data id
  cohortDate: string; // formatted, e.g. "Jun 12, 2026"
  // Back-compat (used by existing checkout pre-fill for Upfront/Installment plans)
  plan: "Plan 01" | "Plan 02";
  planId: "plan-01" | "plan-02";
  paymentType: PaymentMethod;
  planAmount: number;
  discountPercent: number;
  checkoutAmount: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  accessType: string;
  certificateIncluded: boolean;
  status: InvitationStatus;
  checkoutLink: string;
  createdAt: number;
};

const STORAGE_KEY = "metana:invitations";
const EVT = "metana:invitations-changed";
const TOMBSTONE_KEY = "metana:invitations-deleted";
const COHORT_KEY = "metana:custom-cohorts";
const COHORT_EVT = "metana:custom-cohorts-changed";

const seed: Invitation[] = [
  {
    id: "INV-10001",
    studentName: "Sarah Johnson",
    studentEmail: "sarah@example.com",
    course: "AI Builder Pack",
    courseId: "ai-engineering",
    cohortDate: "Jun 12, 2026",
    plan: "Plan 01",
    planId: "plan-01",
    paymentType: "Upfront",
    planAmount: 12370,
    discountPercent: 20,
    checkoutAmount: 9896,
    accessType: "Full Program Access",
    certificateIncluded: true,
    status: "Invite Sent",
    checkoutLink: "https://metana.io/checkout/prefilled?invite=INV-10001",
    createdAt: Date.now() - 86400000 * 4,
    paymentMethod: "Upfront",
    paymentDetails: {
      paymentType: "Upfront",
      planName: "Plan 01",
      planAmount: 12370,
      discountPercent: 20,
      checkoutAmount: 9896,
    },
  },
  {
    id: "INV-10002",
    studentName: "Michael Lee",
    studentEmail: "michael@example.com",
    course: "AI Engineering Bootcamp",
    courseId: "ai-engineering",
    cohortDate: "Jul 03, 2026",
    plan: "Plan 02",
    planId: "plan-02",
    paymentType: "Installment",
    planAmount: 14400,
    discountPercent: 20,
    checkoutAmount: 14000,
    accessType: "Full Program Access",
    certificateIncluded: true,
    status: "Pending",
    checkoutLink: "https://metana.io/checkout/prefilled?invite=INV-10002",
    createdAt: Date.now() - 86400000 * 2,
    paymentMethod: "Installment",
    paymentDetails: {
      paymentType: "Installment",
      fullAmount: 14000,
      initialDownPayment: 2000,
      timePeriodMonths: 6,
      monthlyPayment: 2000,
      totalAmount: 14000,
    },
  },
  {
    id: "INV-10003",
    studentName: "Amina Roberts",
    studentEmail: "amina@example.com",
    course: "Web3 Solidity Bootcamp",
    courseId: "solidity",
    cohortDate: "Aug 21, 2026",
    plan: "Plan 01",
    planId: "plan-01",
    paymentType: "Upfront",
    planAmount: 12370,
    discountPercent: 20,
    checkoutAmount: 9896,
    accessType: "Full Program Access",
    certificateIncluded: true,
    status: "Paid",
    checkoutLink: "https://metana.io/checkout/prefilled?invite=INV-10003",
    createdAt: Date.now() - 86400000 * 8,
    paymentMethod: "Upfront",
    paymentDetails: {
      paymentType: "Upfront",
      planName: "Plan 01",
      planAmount: 12370,
      discountPercent: 20,
      checkoutAmount: 9896,
    },
  },
];

function read(): Invitation[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as Invitation[]) : [];
    const ids = new Set(stored.map((i) => i.id));
    const tombRaw = window.localStorage.getItem(TOMBSTONE_KEY);
    const tomb = new Set<string>(tombRaw ? JSON.parse(tombRaw) : []);
    return [...stored, ...seed.filter((s) => !ids.has(s.id) && !tomb.has(s.id))].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  } catch {
    return seed;
  }
}

function write(list: Invitation[]) {
  if (typeof window === "undefined") return;
  const seedIds = new Set(seed.map((s) => s.id));
  const toStore = list.filter(
    (i) => !seedIds.has(i.id) || i.status !== seed.find((s) => s.id === i.id)?.status,
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  window.dispatchEvent(new Event(EVT));
}

export function addInvitation(
  i: Omit<Invitation, "id" | "createdAt" | "checkoutLink"> & { id?: string },
): Invitation {
  const id = i.id ?? `INV-${Math.floor(10000 + Math.random() * 89999)}`;
  const inv: Invitation = {
    ...i,
    id,
    createdAt: Date.now(),
    checkoutLink: `https://metana.io/checkout/prefilled?invite=${id}`,
  };
  write([inv, ...read()]);
  return inv;
}

export function updateInvitation(id: string, patch: Partial<Invitation>) {
  const list = read();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  write(list);
}

export function deleteInvitation(id: string) {
  const list = read().filter((i) => i.id !== id);
  write(list);
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(TOMBSTONE_KEY);
      const tomb: string[] = raw ? JSON.parse(raw) : [];
      if (!tomb.includes(id)) {
        tomb.push(id);
        window.localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tomb));
      }
    } catch {}
    window.dispatchEvent(new Event(EVT));
  }
}

export function getInvitation(id: string): Invitation | undefined {
  return read().find((i) => i.id === id);
}

export function useInvitations() {
  const [list, setList] = useState<Invitation[]>(() => read());
  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

// ----- Custom cohorts (created via the Add Student modal) -----
type CustomCohortMap = Record<string, { date: string; day: string; time: string; seats: number }[]>;

function readCohorts(): CustomCohortMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COHORT_KEY);
    return raw ? (JSON.parse(raw) as CustomCohortMap) : {};
  } catch {
    return {};
  }
}

export function addCustomCohort(
  courseTitle: string,
  cohort: { date: string; day: string; time: string; seats: number },
) {
  if (typeof window === "undefined") return;
  const all = readCohorts();
  all[courseTitle] = [cohort, ...(all[courseTitle] ?? [])];
  window.localStorage.setItem(COHORT_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(COHORT_EVT));
}

export function useCustomCohorts() {
  const [map, setMap] = useState<CustomCohortMap>(() => readCohorts());
  useEffect(() => {
    const sync = () => setMap(readCohorts());
    sync();
    window.addEventListener(COHORT_EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COHORT_EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return map;
}

// ----- Course catalogue used by the Add Student flow -----
export type SalesCourse = {
  id: string; // checkout courseId
  title: string;
  cohorts: { date: string; day: string; time: string; seats: number }[];
};

export const salesCourses: SalesCourse[] = [
  {
    id: "ai-engineering",
    title: "AI Builder Pack",
    cohorts: [
      { date: "Jun 12, 2026", day: "Friday", time: "6:00 PM", seats: 18 },
      { date: "Jul 03, 2026", day: "Friday", time: "6:00 PM", seats: 22 },
      { date: "Aug 21, 2026", day: "Friday", time: "6:00 PM", seats: 14 },
    ],
  },
  {
    id: "ai-engineering",
    title: "AI Engineering Bootcamp",
    cohorts: [
      { date: "Jun 19, 2026", day: "Friday", time: "5:30 PM", seats: 16 },
      { date: "Jul 10, 2026", day: "Friday", time: "5:30 PM", seats: 20 },
      { date: "Aug 28, 2026", day: "Friday", time: "5:30 PM", seats: 12 },
    ],
  },
  {
    id: "ai-engineering",
    title: "AI for Professionals",
    cohorts: [
      { date: "Jun 05, 2026", day: "Friday", time: "7:00 PM", seats: 24 },
      { date: "Jul 24, 2026", day: "Friday", time: "7:00 PM", seats: 18 },
      { date: "Sep 11, 2026", day: "Friday", time: "7:00 PM", seats: 20 },
    ],
  },
  {
    id: "ai-engineering",
    title: "AI for Developers",
    cohorts: [
      { date: "Jun 14, 2026", day: "Sunday", time: "4:00 PM", seats: 22 },
      { date: "Jul 26, 2026", day: "Sunday", time: "4:00 PM", seats: 18 },
      { date: "Sep 06, 2026", day: "Sunday", time: "4:00 PM", seats: 16 },
    ],
  },
  {
    id: "solidity",
    title: "Web3 Solidity Bootcamp",
    cohorts: [
      { date: "Jun 26, 2026", day: "Friday", time: "6:00 PM", seats: 20 },
      { date: "Jul 17, 2026", day: "Friday", time: "6:00 PM", seats: 14 },
      { date: "Sep 04, 2026", day: "Friday", time: "6:00 PM", seats: 18 },
    ],
  },
  {
    id: "rust",
    title: "Web3 Rust Bootcamp",
    cohorts: [
      { date: "Jun 20, 2026", day: "Saturday", time: "3:00 PM", seats: 16 },
      { date: "Jul 18, 2026", day: "Saturday", time: "3:00 PM", seats: 14 },
      { date: "Aug 29, 2026", day: "Saturday", time: "3:00 PM", seats: 12 },
    ],
  },
  {
    id: "zk",
    title: "Cybersecurity Bootcamp",
    cohorts: [
      { date: "Jun 13, 2026", day: "Saturday", time: "5:00 PM", seats: 18 },
      { date: "Jul 25, 2026", day: "Saturday", time: "5:00 PM", seats: 16 },
      { date: "Sep 12, 2026", day: "Saturday", time: "5:00 PM", seats: 14 },
    ],
  },
  {
    id: "fullstack",
    title: "Software Engineering Career Accelerator",
    cohorts: [
      { date: "Jun 21, 2026", day: "Sunday", time: "2:00 PM", seats: 24 },
      { date: "Jul 19, 2026", day: "Sunday", time: "2:00 PM", seats: 20 },
      { date: "Sep 13, 2026", day: "Sunday", time: "2:00 PM", seats: 18 },
    ],
  },
  {
    id: "metana-prime",
    title: "Metana Prime",
    cohorts: [],
  },
];

export const salesPlans = [
  {
    id: "plan-01" as const,
    name: "Plan 01" as const,
    paymentType: "Upfront" as const,
    popular: true,
    price: 9896,
    original: 12370,
    discountPercent: 20,
    note: "Upfront",
  },
  {
    id: "plan-02" as const,
    name: "Plan 02" as const,
    paymentType: "Installment" as const,
    popular: false,
    price: 14000,
    original: 17500,
    discountPercent: 20,
    note: "Payment split available",
  },
];
