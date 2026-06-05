import { useEffect, useState } from "react";

// Metana Prime — premium subscription area.
// Persisted in localStorage following the canonical store pattern (see products-store.ts).

export type PrimeCategory = "AI" | "Engineering" | "Web3" | "Security" | "Data" | "Career";

export type PrimeLevel = "Beginner" | "Intermediate" | "All levels";

export type PrimeCourse = {
  id: string;
  title: string;
  description: string;
  category: PrimeCategory;
  gradient: string;
  hours: number;
  lessons: number;
  level: PrimeLevel;
  progress: number; // 0–100; 0 = not started
  inPrime: boolean; // true = part of Metana Prime; false = available to add
};

export const PRIME_CATEGORIES: PrimeCategory[] = [
  "AI",
  "Engineering",
  "Web3",
  "Security",
  "Data",
  "Career",
];

export const PRIME_LEVELS: PrimeLevel[] = ["Beginner", "Intermediate", "All levels"];

export type PrimePlan = {
  id: string;
  name: string;
  description: string;
  popular?: boolean; // shown as the "Recommended plan"
  monthly: number;
  yearly: number;
  features: string[];
};

// Prime permission flags — who can view/manage Prime content.
export type PrimeAccess = {
  adminsManage: boolean; // admins can create, edit and archive Prime courses
  instructorsView: boolean; // instructors can see subscription status (not pricing)
  studentsAccess: boolean; // students unlock Prime-only content after subscribing
  supportView: boolean; // support can review a learner's access without changes
};

export type PrimeState = {
  courses: PrimeCourse[];
  plans: PrimePlan[];
  access: PrimeAccess;
};

const STORAGE_KEY = "metana:prime:v4";
const EVT = "metana:prime-changed";

export function slugifyPrime(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Gradients mirror the palette used in courses-data.ts.
export const PRIME_GRADIENTS: { label: string; value: string }[] = [
  { label: "Lime", value: "linear-gradient(160deg, oklch(0.9 0.18 130), oklch(0.86 0.16 148))" },
  { label: "Mint", value: "linear-gradient(160deg, oklch(0.93 0.07 165), oklch(0.91 0.06 188))" },
  { label: "Indigo", value: "linear-gradient(160deg, oklch(0.9 0.06 265), oklch(0.86 0.08 278))" },
  { label: "Pink", value: "linear-gradient(160deg, oklch(0.92 0.06 340), oklch(0.89 0.07 320))" },
  { label: "Orange", value: "linear-gradient(160deg, oklch(0.89 0.1 62), oklch(0.85 0.13 45))" },
  { label: "Sky", value: "linear-gradient(160deg, oklch(0.9 0.07 248), oklch(0.87 0.08 256))" },
  { label: "Green", value: "linear-gradient(160deg, oklch(0.93 0.12 138), oklch(0.9 0.1 152))" },
  { label: "Amber", value: "linear-gradient(160deg, oklch(0.92 0.1 86), oklch(0.89 0.13 70))" },
  { label: "Violet", value: "linear-gradient(160deg, oklch(0.9 0.08 300), oklch(0.87 0.09 312))" },
];

const G = Object.fromEntries(PRIME_GRADIENTS.map((g) => [g.label, g.value])) as Record<
  string,
  string
>;

// Courses that ship inside Metana Prime by default.
const PRIME_SEED: Omit<PrimeCourse, "inPrime">[] = [
  {
    id: "prime-ai-productivity",
    title: "AI Productivity Essentials",
    description: "Use AI tools to automate everyday knowledge work.",
    category: "AI",
    gradient: G.Lime,
    hours: 6,
    lessons: 28,
    level: "Beginner",
    progress: 0,
  },
  {
    id: "prime-prompt-engineering",
    title: "Prompt Engineering Fundamentals",
    description: "Design reliable prompts for production LLM apps.",
    category: "AI",
    gradient: G.Mint,
    hours: 8,
    lessons: 34,
    level: "Intermediate",
    progress: 22,
  },
  {
    id: "prime-full-stack-web",
    title: "Full Stack Web Development",
    description: "Ship modern full-stack apps end to end.",
    category: "Engineering",
    gradient: G.Indigo,
    hours: 72,
    lessons: 191,
    level: "Intermediate",
    progress: 64,
  },
  {
    id: "prime-web3-career-starter",
    title: "Web3 Career Starter",
    description: "Break into Web3 with the fundamentals employers want.",
    category: "Web3",
    gradient: G.Pink,
    hours: 12,
    lessons: 48,
    level: "Beginner",
    progress: 0,
  },
  {
    id: "prime-smart-contract-basics",
    title: "Smart Contract Basics",
    description: "Write, test and deploy your first Solidity contracts.",
    category: "Web3",
    gradient: G.Orange,
    hours: 16,
    lessons: 62,
    level: "Intermediate",
    progress: 41,
  },
  {
    id: "prime-cybersecurity-foundations",
    title: "Cybersecurity Foundations",
    description: "Core security concepts every engineer should know.",
    category: "Security",
    gradient: G.Sky,
    hours: 10,
    lessons: 44,
    level: "Beginner",
    progress: 0,
  },
  {
    id: "prime-data-analytics-ai",
    title: "Data Analytics with AI",
    description: "Analyze and visualize data with AI-assisted tooling.",
    category: "Data",
    gradient: G.Green,
    hours: 14,
    lessons: 56,
    level: "Intermediate",
    progress: 12,
  },
  {
    id: "prime-career-readiness",
    title: "Career Readiness Toolkit",
    description: "Resume, portfolio and interview prep that converts.",
    category: "Career",
    gradient: G.Amber,
    hours: 5,
    lessons: 24,
    level: "All levels",
    progress: 88,
  },
  {
    id: "prime-software-engineering-fundamentals",
    title: "Software Engineering Fundamentals",
    description: "Data structures, algorithms and clean code.",
    category: "Engineering",
    gradient: G.Green,
    hours: 40,
    lessons: 120,
    level: "Beginner",
    progress: 0,
  },
  {
    id: "prime-ai-for-business",
    title: "AI for Business Teams",
    description: "Bring AI workflows to non-technical teams safely.",
    category: "AI",
    gradient: G.Violet,
    hours: 7,
    lessons: 30,
    level: "Beginner",
    progress: 0,
  },
  {
    id: "prime-system-design",
    title: "System Design Masterclass",
    description: "Architect scalable systems with real-world case studies and live design reviews.",
    category: "Engineering",
    gradient: G.Indigo,
    hours: 24,
    lessons: 72,
    level: "Intermediate",
    progress: 0,
  },
  {
    id: "prime-zk-deep-dive",
    title: "Zero Knowledge Deep Dive",
    description: "Master modern proving systems and ship ZK circuits to production.",
    category: "Web3",
    gradient: G.Violet,
    hours: 20,
    lessons: 58,
    level: "Intermediate",
    progress: 0,
  },
];

// Courses available in the catalogue but not yet part of Prime — the pool admins drag from.
const AVAILABLE_SEED: Omit<PrimeCourse, "inPrime">[] = [
  {
    id: "course-intro-python",
    title: "Intro to Python",
    description: "Programming fundamentals with hands-on Python projects.",
    category: "Engineering",
    gradient: G.Sky,
    hours: 18,
    lessons: 64,
    level: "Beginner",
    progress: 0,
  },
  {
    id: "course-react-essentials",
    title: "React Essentials",
    description: "Build modern, component-driven user interfaces with React.",
    category: "Engineering",
    gradient: G.Indigo,
    hours: 22,
    lessons: 70,
    level: "Intermediate",
    progress: 0,
  },
  {
    id: "course-ux-foundations",
    title: "UX Design Foundations",
    description: "Research, wireframing and usability for product teams.",
    category: "Career",
    gradient: G.Pink,
    hours: 9,
    lessons: 38,
    level: "Beginner",
    progress: 0,
  },
  {
    id: "course-defi-primer",
    title: "DeFi Primer",
    description: "How decentralized finance protocols work end to end.",
    category: "Web3",
    gradient: G.Amber,
    hours: 11,
    lessons: 42,
    level: "Beginner",
    progress: 0,
  },
  {
    id: "course-cloud-fundamentals",
    title: "Cloud Fundamentals",
    description: "Core cloud concepts, deployment and scaling basics.",
    category: "Engineering",
    gradient: G.Green,
    hours: 15,
    lessons: 52,
    level: "Beginner",
    progress: 0,
  },
];

const seedState: PrimeState = {
  courses: [
    ...PRIME_SEED.map((c) => ({ ...c, inPrime: true })),
    ...AVAILABLE_SEED.map((c) => ({ ...c, inPrime: false })),
  ],
  plans: [
    {
      id: "prime-starter",
      name: "Prime Starter",
      description: "For self-directed learners getting started.",
      monthly: 49,
      yearly: 470,
      features: [
        "Access to selected Prime courses",
        "Course progress tracking",
        "Hands-on practice projects",
        "Downloadable resources",
        "Community access",
        "Completion certificates",
        "Standard email support",
      ],
    },
    {
      id: "prime-pro",
      name: "Prime Pro",
      description: "For learners who want everything and a faster path to a job.",
      popular: true,
      monthly: 99,
      yearly: 950,
      features: [
        "Access to all Prime courses",
        "Premium course bundles",
        "Hands-on projects & code reviews",
        "1:1 mentorship sessions",
        "Career support materials",
        "Interview & resume prep",
        "Exclusive workshops & events",
        "Priority support",
      ],
    },
  ],
  access: {
    adminsManage: true,
    instructorsView: true,
    studentsAccess: false,
    supportView: false,
  },
};

function read(): PrimeState {
  if (typeof window === "undefined") return seedState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState;
    const stored = JSON.parse(raw) as Partial<PrimeState>;
    return {
      // Default inPrime to true for any course persisted before the flag existed.
      courses: (stored.courses ?? seedState.courses).map((c) => ({
        ...c,
        inPrime: c.inPrime ?? true,
      })),
      plans: stored.plans ?? seedState.plans,
      access: { ...seedState.access, ...(stored.access ?? {}) },
    };
  } catch {
    return seedState;
  }
}

function write(state: PrimeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVT));
}

export function addPrimeCourse(course: Omit<PrimeCourse, "id" | "inPrime">): PrimeCourse {
  const state = read();
  const base = slugifyPrime(course.title) || "prime-course";
  let id = base;
  let n = 2;
  while (state.courses.some((c) => c.id === id)) id = `${base}-${n++}`;
  // Courses created via the "Create Prime Course" flow go straight into Prime.
  const created: PrimeCourse = { ...course, id, inPrime: true };
  write({ ...state, courses: [created, ...state.courses] });
  return created;
}

export function updateCourses(courses: PrimeCourse[]) {
  write({ ...read(), courses });
}

export function getPrimeCourseById(id: string): PrimeCourse | undefined {
  return read().courses.find((c) => c.id === id);
}

export function updatePlans(plans: PrimePlan[]) {
  write({ ...read(), plans });
}

export function updateAccess(access: PrimeAccess) {
  write({ ...read(), access });
}

export function usePrimeStore(): PrimeState {
  const [state, setState] = useState<PrimeState>(() => read());
  useEffect(() => {
    const sync = () => setState(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return state;
}
