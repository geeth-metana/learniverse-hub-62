import fullstackCover from "@/assets/courses/fullstack.svg";
import rustCover from "@/assets/courses/rust.svg";

export type Course = {
  id: string;
  title: string;
  description: string;
  meta: string;
  gradient: string;
  cover?: string;
  icon: "stack" | "rust" | "solidity" | "ai" | "zk" | "data";
  category: "my" | "all";
  longDescription: string;
};

export const myCourses: Course[] = [
  {
    id: "fullstack",
    title: "Full Stack Software Engineering Bootcamp",
    description:
      "Learn to Code Advanced Full Stack Web3 applications from scratch with zero coding",
    meta: "22H/ Week · 4 Months · Part Time",
    gradient: "linear-gradient(180deg, oklch(0.97 0.09 122), oklch(0.94 0.08 200))",
    cover: fullstackCover,
    icon: "stack",
    category: "my",
    longDescription:
      "Master modern full stack engineering with hands-on projects, weekly mentorship and a job guarantee.",
  },
  {
    id: "rust",
    title: "Rust Bootcamp",
    description:
      "Learn to Code Advanced Full Stack Web3 applications from scratch with zero coding",
    meta: "22H/ Week · 4 Months · Part Time",
    gradient: "linear-gradient(180deg, oklch(0.95 0.1 60), oklch(0.92 0.14 30))",
    cover: rustCover,
    icon: "rust",
    category: "my",
    longDescription:
      "Become a confident Rust engineer ready to ship production-grade systems and Web3 protocols.",
  },
];

export const allCourses: Course[] = [
  {
    id: "solidity",
    title: "Solidity Smart Contracts Bootcamp",
    description: "Build, test and deploy production-grade Solidity contracts on EVM chains.",
    meta: "18H/ Week · 3 Months · Part Time",
    gradient: "linear-gradient(180deg, oklch(0.94 0.04 245), oklch(0.89 0.07 260))",
    icon: "solidity",
    category: "all",
    longDescription:
      "Become a Solidity engineer with deep knowledge of EVM, security and audit patterns.",
  },
  {
    id: "ai-engineering",
    title: "AI Engineering Bootcamp",
    description: "Ship LLM apps, RAG pipelines and agentic systems used in production.",
    meta: "20H/ Week · 4 Months · Part Time",
    gradient: "linear-gradient(180deg, oklch(0.95 0.1 150), oklch(0.92 0.12 180))",
    icon: "ai",
    category: "all",
    longDescription:
      "From prompt engineering to evaluations and deployment — build real AI products end-to-end.",
  },
  {
    id: "zk",
    title: "Zero Knowledge Bootcamp",
    description: "Master ZK circuits, Circom, Noir and modern proving systems.",
    meta: "16H/ Week · 3 Months · Part Time",
    gradient: "linear-gradient(180deg, oklch(0.95 0.08 320), oklch(0.92 0.1 350))",
    icon: "zk",
    category: "all",
    longDescription:
      "Understand the math and engineering behind ZK and ship proofs to production.",
  },
  {
    id: "data",
    title: "Data Engineering Bootcamp",
    description: "Pipelines, warehouses and analytics with modern data tooling.",
    meta: "20H/ Week · 4 Months · Part Time",
    gradient: "linear-gradient(180deg, oklch(0.95 0.08 100), oklch(0.92 0.12 130))",
    icon: "data",
    category: "all",
    longDescription:
      "Design and operate scalable data platforms with dbt, Airflow, Snowflake and more.",
  },
];

export const allCoursesCombined = [...myCourses, ...allCourses];

export function getCourse(id: string): Course | undefined {
  return allCoursesCombined.find((c) => c.id === id);
}

export const plans = [
  {
    id: "plan-01" as const,
    name: "Plan 01",
    popular: true,
    price: 9896,
    original: 12370,
    upfront: true,
    monthlyEnrollment: 2000,
    monthly: 1272,
    monthlyOriginal: 1590,
    months: 7,
    features: [
      "Job Guarantee",
      "Expert Curriculum (up-to-date, lifetime access)",
      "Daily 1-on-1 Stand-ups (Beginner modules)",
      "On-Demand Mentor Support",
      "Weekly 1-on-1 Code Review",
      "Weekly Office Hours",
      "Specialist Workshops",
      "Jobcamp & Career Coaching (1-year)",
      "Advisor Matching",
    ],
  },
  {
    id: "plan-02" as const,
    name: "Plan 02",
    popular: false,
    price: 14400,
    original: null,
    upfront: true,
    monthlyEnrollment: 3500,
    monthly: 1720,
    monthlyOriginal: null,
    months: 7,
    features: [
      "Everything in Plan 01",
      "2 Weekly 1-on-1 Code Review Sessions",
      "3-Year Career Support",
      "Enhanced Advisor Matching",
      "Enhanced Perks Package",
    ],
  },
];

export type PlanId = (typeof plans)[number]["id"];
