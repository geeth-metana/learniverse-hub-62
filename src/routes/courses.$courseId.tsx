import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { getCourse } from "@/lib/courses-data";
import { useEnrollments } from "@/lib/enrollment";
import { PricingDialog } from "@/components/courses/PricingDialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Sparkles,
  Check,
  CalendarDays,
  Briefcase,
  Star,
  Book,
  BookOpen,
  Rocket,
  MessageSquare,
} from "@/components/icons";
import whatWeOfferImg from "@/assets/what-we-offer.jpg";
import jobLocationsMap from "@/assets/job-locations-map.png";
import careerHandshakeImg from "@/assets/career-handshake.png";
import guaranteeBadgeImg from "@/assets/guarantee-badge.png";
import logoEiger from "@/assets/logo-eiger.png";
import logoDoor3 from "@/assets/logo-door3.png";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const BOOTCAMP_BADGE: Record<string, string> = {
  fullstack: "bg-blue-100 text-blue-700",
  rust: "bg-orange-100 text-orange-700",
  solidity: "bg-purple-100 text-purple-700",
  "ai-engineering": "bg-emerald-100 text-emerald-700",
  zk: "bg-pink-100 text-pink-700",
  data: "bg-amber-100 text-amber-700",
};

const OFFERS = [
  "AI tools training",
  "6 months career support",
  "Job guarantee",
  "1-on-1 career coaching after graduation",
  "Full 4-week part-time bootcamp",
  "1 month Claude Code Max subscription included ($200 value)",
  "Private community + token-burn leaderboard",
  "Lifetime access to curriculum updates",
  "Alumni community access",
];

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({ meta: [{ title: "Course — Metana" }] }),
  component: CourseDetail,
});

type CourseModule = { title: string; description: string; duration: string; youllBuild?: string };
type CourseFAQ = { q: string; a: string };
type CourseDetail = {
  tagline: string;
  overview: string[];
  offers: string[];
  outcomes: string[];
  modules: CourseModule[];
  instructor: {
    name: string;
    role: string;
    bio: string;
    avatar: string;
    companies: Array<{ name: string; logo?: string }>;
  };
  faqs: CourseFAQ[];
};

export const courseDetails: Record<string, CourseDetail> = {
  fullstack: {
    tagline: "Ship production-ready full-stack apps in 4 months.",
    overview: [
      "Build modern web applications end-to-end — from a clean component library on the frontend to typed APIs, databases and deploys on the backend.",
      "You'll ship 6 portfolio-ready projects, including a capstone you can take into interviews. Every project is reviewed by a senior engineer who has shipped at companies like Stripe, Vercel and Shopify.",
    ],
    offers: [
      "TypeScript, React 19 and modern Tailwind",
      "Node.js APIs with Postgres and Prisma",
      "Authentication, payments and file storage",
      "CI/CD, observability and production deploys",
    ],
    outcomes: [
      "Land a junior or mid-level full-stack role within 6 months of graduating",
      "Build, deploy and operate a SaaS app from scratch",
      "Communicate technical trade-offs with confidence in interviews",
    ],
    modules: [
      {
        title: "Module 01 — Engineering foundations",
        description:
          "Git, the terminal, modern editor setup, and how senior engineers actually work day to day.",
        duration: "1 week",
      },
      {
        title: "Module 02 — TypeScript & React",
        description:
          "Component patterns, state, effects and the parts of TypeScript that matter for product engineers.",
        duration: "3 weeks",
      },
      {
        title: "Module 03 — APIs & databases",
        description:
          "Build typed Node APIs backed by Postgres with Prisma. Indexes, migrations and query patterns.",
        duration: "3 weeks",
      },
      {
        title: "Module 04 — Auth, payments, storage",
        description:
          "Sessions, OAuth, Stripe checkout, file uploads and signed URLs — the boring bits that make apps real.",
        duration: "2 weeks",
      },
      {
        title: "Module 05 — Ship to production",
        description:
          "CI/CD, monitoring, error tracking and on-call basics. Deploy a real app behind a real domain.",
        duration: "2 weeks",
      },
      {
        title: "Module 06 — Capstone project",
        description:
          "Design, build, ship and present a portfolio-grade SaaS app. Mentor-reviewed end-to-end.",
        duration: "5 weeks",
      },
    ],
    instructor: {
      name: "Daniel Hwang",
      role: "Ex-Stripe staff engineer",
      bio: "Daniel spent 8 years building payments and developer platforms at Stripe and Vercel. He has mentored 400+ engineers into their first full-stack roles.",
      avatar: "https://i.pravatar.cc/120?img=15",
      companies: [{ name: "Stripe" }, { name: "Vercel" }, { name: "Google" }, { name: "Shopify" }],
    },
    faqs: [
      {
        q: "Do I need to know how to code before starting?",
        a: "No. Module 01 assumes zero programming experience, but the pace picks up quickly. If you've never written code, plan to spend an extra 4-6 hours/week in the first month.",
      },
      {
        q: "How much time should I commit per week?",
        a: "Around 22 hours including live sessions, async coursework and project time. Students who treat it like a part-time job get the best outcomes.",
      },
      {
        q: "Is there a job guarantee?",
        a: "Yes — Plan 01 includes a job guarantee. If you don't land a qualifying role within 6 months of graduating, your tuition is refunded.",
      },
    ],
  },
  rust: {
    tagline: "Become a confident systems engineer in Rust.",
    overview: [
      "Rust is the language that lets you ship safe, fast software without garbage collection — and it's now the foundation of Linux kernel modules, Cloudflare's data plane and most modern Web3 infrastructure.",
      "This bootcamp takes you from ownership and borrowing to async runtimes, networking and shipping a real systems-grade project.",
    ],
    offers: [
      "Ownership, lifetimes and the borrow checker, demystified",
      "Async Rust with Tokio and real networking code",
      "Performance profiling, unsafe and FFI",
      "Capstone: a production-grade systems project",
    ],
    outcomes: [
      "Read and contribute to large Rust codebases with confidence",
      "Ship async network services that survive production load",
      "Be hireable as a Rust engineer at infra and Web3 companies",
    ],
    modules: [
      {
        title: "Module 01 — Rust foundations",
        description: "Syntax, types, pattern matching and the mental model behind ownership.",
        duration: "2 weeks",
      },
      {
        title: "Module 02 — Borrowing & lifetimes",
        description: "The borrow checker as your friend. Real examples, not toy ones.",
        duration: "2 weeks",
      },
      {
        title: "Module 03 — Traits & generics",
        description:
          "Designing flexible APIs the Rust way, including trait objects and zero-cost abstractions.",
        duration: "2 weeks",
      },
      {
        title: "Module 04 — Async & networking",
        description: "Tokio, futures, channels and building real HTTP services.",
        duration: "3 weeks",
      },
      {
        title: "Module 05 — Unsafe, FFI & perf",
        description: "When to reach for unsafe, how to call C, and how to profile like a pro.",
        duration: "2 weeks",
      },
      {
        title: "Module 06 — Capstone systems project",
        description:
          "Design and ship a high-performance service — a key-value store, proxy or game engine.",
        duration: "5 weeks",
      },
    ],
    instructor: {
      name: "Marta Lindqvist",
      role: "Rust core contributor",
      bio: "Marta has contributed to the Rust compiler and Tokio runtime, and previously led infra at a Series-C fintech. She teaches the way she wishes she had been taught.",
      avatar: "https://i.pravatar.cc/120?img=44",
      companies: [{ name: "Cloudflare" }, { name: "Mozilla" }, { name: "AWS" }, { name: "Tokio" }],
    },
    faqs: [
      {
        q: "Is Rust a good first language?",
        a: "It's a great second language. If you have at least 3-6 months of experience in any language (Python, JS, Go), you'll thrive. Total beginners should start with the Full-Stack bootcamp.",
      },
      {
        q: "Will I write unsafe code?",
        a: "Yes — but only after you understand why safe Rust exists. You'll learn when unsafe is appropriate and how to audit it.",
      },
      {
        q: "Do you cover Web3?",
        a: "We touch on Substrate and Solana tooling in the capstone, but this is primarily a systems bootcamp. For deep Web3 work, pair it with our Solidity or ZK programs.",
      },
    ],
  },
  solidity: {
    tagline: "Ship audited smart contracts. Not toy demos.",
    overview: [
      "Solidity is deceptively simple — until you're staring at a $2M re-entrancy bug at 3am. This bootcamp teaches you to think like an auditor from day one.",
      "You'll build, test, deploy and break real contracts on EVM chains, with a curriculum modeled after how top audit firms train their junior engineers.",
    ],
    offers: [
      "Solidity, Foundry and modern testing",
      "Security patterns and live audit walkthroughs",
      "Gas optimization that survives mainnet",
      "Deploy and verify on Ethereum, Base and Arbitrum",
    ],
    outcomes: [
      "Write smart contracts that pass professional audits",
      "Read and reason about gas trade-offs at the opcode level",
      "Be hireable as a smart contract engineer or junior auditor",
    ],
    modules: [
      {
        title: "Module 01 — EVM & Solidity foundations",
        description: "Storage, memory, calldata and the EVM execution model.",
        duration: "2 weeks",
      },
      {
        title: "Module 02 — Testing with Foundry",
        description: "Unit, fuzz and invariant testing — the way real protocols ship.",
        duration: "2 weeks",
      },
      {
        title: "Module 03 — Security patterns",
        description:
          "Re-entrancy, oracle manipulation, access control and live audit case studies.",
        duration: "3 weeks",
      },
      {
        title: "Module 04 — Gas optimization",
        description: "Storage packing, assembly, and reading bytecode without fear.",
        duration: "2 weeks",
      },
      {
        title: "Module 05 — DeFi primitives",
        description:
          "AMMs, lending markets and yield strategies — build them from first principles.",
        duration: "2 weeks",
      },
      {
        title: "Module 06 — Capstone protocol",
        description: "Design, build and ship an audited protocol with a public deploy.",
        duration: "2 weeks",
      },
    ],
    instructor: {
      name: "Dmytro Onypko",
      role: "Rust Web3 Protocol Engineer at Eiger",
      bio: "Dmytro Onypko is a Rust Web3 Protocol Engineer at Eiger, where he focuses on the Solana ecosystem by building core interoperability solutions and light client infrastructure. He brings over 15 years of experience in the software industry, with deep expertise in systems engineering, architecture, and high-performance development. Throughout his career, he has spent 7 years in technical leadership roles, including serving as Director of Technology at DOOR3 and holding key positions at InfoPulse and Materialise.",
      avatar: "https://i.pravatar.cc/120?img=47",
      companies: [
        { name: "Eiger", logo: logoEiger },
        { name: "DOOR3", logo: logoDoor3 },
      ],
    },
    faqs: [
      {
        q: "Do I need to know Ethereum already?",
        a: "Helpful but not required. A bit of JavaScript or Python experience is enough to get going. We teach the EVM from scratch.",
      },
      {
        q: "Will I deploy to mainnet?",
        a: "Yes — the capstone deploys to a real L2 (Base or Arbitrum) with a verified contract you can show recruiters.",
      },
      {
        q: "Is this a Web3 dev bootcamp or a security one?",
        a: "Both. We believe you can't write secure contracts without thinking like an attacker, so the two are taught together.",
      },
    ],
  },
  "ai-engineering": {
    tagline: "Build AI products that don't break in production.",
    overview: [
      "Anyone can wire up a chatbot in an afternoon. Shipping an AI product that survives real users, real evals and a real on-call rotation is a different job — and that's the job this bootcamp trains you for.",
      "You'll build a RAG system, an agentic workflow and a production-grade eval harness, and learn the engineering patterns that separate hype from durable systems.",
    ],
    offers: [
      "RAG, retrieval quality and chunking strategies",
      "Agentic systems with tools, memory and guardrails",
      "Evals, observability and regression testing for LLMs",
      "Cost, latency and reliability at scale",
    ],
    outcomes: [
      "Ship LLM features that stand up to real evals",
      "Reason about hallucination, cost and latency trade-offs",
      "Be hireable as an AI product engineer or applied ML engineer",
    ],
    modules: [
      {
        title: "Module 1 — AI-Assisted Development (the new baseline)",
        description:
          "Cursor, Claude Code, GitHub Copilot, Windsurf. How senior engineers actually use these — codebase-wide edits, inline refactoring, prompt patterns that produce code worth merging. Plus: prompting like an engineer with real context, constraints, edge cases, and acceptance criteria across OpenAI, Anthropic, Gemini, and open-source models.",
        duration: "Week 1",
        youllBuild:
          "Refactor a messy legacy codebase in days — same scope that took the original team a quarter.",
      },
      {
        title: "Module 2 — AI-powered testing, debugging & code review",
        description:
          "Use AI to generate meaningful test coverage, surface edge cases, and run code reviews that catch real bugs instead of style nits. Build a debugging workflow where the model is a teammate, not a guess machine.",
        duration: "Week 2",
        youllBuild:
          "Ship a fully-tested feature with AI-generated unit, integration and edge-case tests, plus an AI-assisted PR review checklist.",
      },
      {
        title: "Module 3 — Building with LLMs: RAG, agents, and MCP",
        description:
          "Embeddings, vector stores, chunking strategies, retrieval quality. Agentic loops with tools, planning and memory. Model Context Protocol (MCP) for connecting agents to real systems safely.",
        duration: "Week 3",
        youllBuild:
          "A multi-tool agent that pulls from a real knowledge base, calls external APIs, and exposes itself over MCP to other tools.",
      },
      {
        title: "Module 4 — Production, evals & capstone",
        description:
          "Evals that actually catch regressions, observability for LLM calls, cost/latency tuning, and shipping AI features behind real users. The capstone goes from idea to deployed product.",
        duration: "Week 4",
        youllBuild:
          "A production-grade AI product with evals, monitoring and an on-call runbook — deployed and demoable to recruiters.",
      },
    ],
    instructor: {
      name: "Lena Romanova",
      role: "Staff ML engineer at a YC AI startup",
      bio: "Lena leads applied ML at a YC AI company and previously built recommendation systems at scale. She's obsessed with evals.",
      avatar: "https://i.pravatar.cc/120?img=32",
      companies: [
        { name: "OpenAI" },
        { name: "Anthropic" },
        { name: "Meta" },
        { name: "Y Combinator" },
      ],
    },
    faqs: [
      {
        q: "Do I need an ML background?",
        a: "No. We focus on AI engineering, not training models. Comfort with Python and APIs is enough.",
      },
      {
        q: "Will we cover fine-tuning?",
        a: "We cover when to fine-tune vs. when not to, plus a hands-on lab with a small open-weight model. The focus is on systems around the model.",
      },
      {
        q: "Which providers do you use?",
        a: "OpenAI, Anthropic and a local open-weight model. Skills transfer across providers — we teach patterns, not vendor APIs.",
      },
    ],
  },
  zk: {
    tagline: "Cryptography that actually clicks.",
    overview: [
      "ZK proofs are the rare technology where the math is genuinely hard and the engineering is genuinely hard. Most courses pick one. This one teaches both.",
      "You'll move from arithmetization and constraint systems to writing real Circom and Noir circuits, and ship a verifier to a public testnet.",
    ],
    offers: [
      "Arithmetization, R1CS and the math behind SNARKs",
      "Circom and Noir for practical circuit work",
      "Trusted setup, proving systems and verifier contracts",
      "Capstone: a ZK app deployed to a public testnet",
    ],
    outcomes: [
      "Write and audit real ZK circuits with confidence",
      "Reason about proving systems and trade-offs (Groth16, PLONK, STARK)",
      "Be hireable as a ZK protocol or applications engineer",
    ],
    modules: [
      {
        title: "Module 01 — Math foundations",
        description: "Finite fields, elliptic curves and polynomial commitments — taught visually.",
        duration: "2 weeks",
      },
      {
        title: "Module 02 — Arithmetization",
        description: "Turning programs into constraints. R1CS, AIR and how to think in circuits.",
        duration: "2 weeks",
      },
      {
        title: "Module 03 — Circom in practice",
        description:
          "Write, test and debug Circom circuits. Common pitfalls and how to avoid them.",
        duration: "2 weeks",
      },
      {
        title: "Module 04 — Noir & modern tooling",
        description: "Noir, witness generation and integrating proofs into application code.",
        duration: "2 weeks",
      },
      {
        title: "Module 05 — Proving systems",
        description: "Groth16, PLONK and STARKs — when to use which, with hands-on benchmarks.",
        duration: "2 weeks",
      },
      {
        title: "Module 06 — Capstone ZK app",
        description: "Design a ZK app, write the circuit, deploy the verifier and ship it.",
        duration: "2 weeks",
      },
    ],
    instructor: {
      name: "Priya Nair",
      role: "ZK protocol engineer",
      bio: "Priya has shipped circuits to production at two major ZK rollups and contributes to the Noir compiler. She loves making cryptography feel friendly.",
      avatar: "https://i.pravatar.cc/120?img=44",
      companies: [{ name: "Aztec" }, { name: "Polygon" }, { name: "StarkWare" }, { name: "Noir" }],
    },
    faqs: [
      {
        q: "Do I need a math degree?",
        a: "No. We teach the math you need, the way an engineer would want to learn it. High-school-level algebra is enough to start.",
      },
      {
        q: "Should I take Solidity first?",
        a: "Recommended but not required. A few weeks of Solidity experience makes Module 06 much smoother.",
      },
      {
        q: "Which proving system do you focus on?",
        a: "We start with Groth16 (Circom) for clarity, then move to PLONK (Noir) for modern tooling. You'll understand the trade-offs first-hand.",
      },
    ],
  },
  data: {
    tagline: "Pipelines that survive production.",
    overview: [
      "Most data work fails not because the SQL is hard, but because the pipelines silently break and nobody notices for three weeks. This bootcamp is built around that reality.",
      "You'll learn dbt, Airflow, Snowflake and the operational habits — testing, lineage, observability — that separate a junior analyst from a senior data engineer.",
    ],
    offers: [
      "Dimensional modeling and modern SQL patterns",
      "dbt, Airflow and Snowflake taught with real patterns",
      "Data quality, testing and lineage from day one",
      "Capstone: a production-grade analytics platform",
    ],
    outcomes: [
      "Design data models that scale beyond toy projects",
      "Build and operate pipelines with real testing and alerting",
      "Be hireable as an analytics engineer or data engineer",
    ],
    modules: [
      {
        title: "Module 01 — Modern SQL",
        description: "Window functions, CTEs and query plans. SQL that ages well.",
        duration: "2 weeks",
      },
      {
        title: "Module 02 — Dimensional modeling",
        description: "Facts, dimensions and slowly-changing data — without the dogma.",
        duration: "2 weeks",
      },
      {
        title: "Module 03 — dbt in practice",
        description: "Models, tests, sources and macros. Treat your warehouse like software.",
        duration: "3 weeks",
      },
      {
        title: "Module 04 — Airflow & orchestration",
        description: "DAGs, retries, sensors and how to make pipelines self-healing.",
        duration: "2 weeks",
      },
      {
        title: "Module 05 — Data quality & observability",
        description: "Tests, freshness, lineage and alerting that actually pages the right person.",
        duration: "2 weeks",
      },
      {
        title: "Module 06 — Capstone analytics platform",
        description: "Build a full pipeline end-to-end, with dashboards, tests and on-call docs.",
        duration: "5 weeks",
      },
    ],
    instructor: {
      name: "Yuki Tanaka",
      role: "Senior data engineer",
      bio: "Yuki has built data platforms at two unicorn startups and a Fortune 500. He still believes the best pipeline is a boring pipeline.",
      avatar: "https://i.pravatar.cc/120?img=49",
      companies: [
        { name: "Snowflake" },
        { name: "dbt Labs" },
        { name: "Airbnb" },
        { name: "Stripe" },
      ],
    },
    faqs: [
      {
        q: "Do I need to be good at SQL already?",
        a: "Some SQL helps, but Module 01 levels everyone up. If you've written a SELECT and a JOIN, you'll be fine.",
      },
      {
        q: "Is this an analyst or engineer bootcamp?",
        a: "Analytics engineer leaning into data engineer. By the end you'll be hireable for both, with a stronger lean toward modern stack roles.",
      },
      {
        q: "Which warehouse do you use?",
        a: "Snowflake, with notes on how everything translates to BigQuery and Databricks. Patterns transfer across warehouses.",
      },
    ],
  },
};

export const fallbackDetail: CourseDetail = {
  tagline: "A program built around outcomes, not lectures.",
  overview: [
    "This bootcamp is designed around hands-on projects, weekly mentorship and a curriculum that's updated every cohort.",
    "Every project is reviewed by a senior engineer, and every graduate leaves with a portfolio they're proud to show.",
  ],
  offers: [
    "Live mentor support",
    "Weekly code reviews",
    "Career coaching and job support",
    "Lifetime access to all materials",
  ],
  outcomes: [
    "Ship portfolio-grade projects",
    "Build a network of peers and mentors",
    "Be hireable in your target role",
  ],
  modules: [
    {
      title: "Module 01 — Foundations",
      description: "Set up your environment and get comfortable with the core ideas.",
      duration: "2 weeks",
    },
    {
      title: "Module 02 — Core concepts",
      description: "Build the mental model you'll rely on for the rest of the program.",
      duration: "3 weeks",
    },
    {
      title: "Module 03 — Real projects",
      description: "Apply what you've learned on a project reviewed by a senior engineer.",
      duration: "3 weeks",
    },
    {
      title: "Module 04 — Capstone",
      description: "Design and ship a portfolio-grade project end-to-end.",
      duration: "4 weeks",
    },
  ],
  instructor: {
    name: "Sam Reyes",
    role: "Lead instructor",
    bio: "Sam has been teaching engineers for the past decade and has helped 500+ students land their first role in the field.",
    avatar: "https://i.pravatar.cc/120?img=5",
    companies: [{ name: "Google" }, { name: "Meta" }, { name: "Stripe" }, { name: "Airbnb" }],
  },
  faqs: [
    {
      q: "Is this beginner friendly?",
      a: "Yes — the first module assumes minimal background. Pace yourself and you'll be fine.",
    },
    {
      q: "How much time per week?",
      a: "Plan for around 20 hours per week including live sessions, async work and projects.",
    },
    {
      q: "Is there a job guarantee?",
      a: "Plan 01 includes our job guarantee. See the pricing page for details.",
    },
  ],
};

function CourseDetail() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const course = getCourse(courseId);
  const { get, set } = useEnrollments();
  const enrollment = get(courseId);
  const [now, setNow] = useState(Date.now());
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const APPROVAL_MS = 15_000;
  const elapsed = enrollment.purchasedAt ? now - enrollment.purchasedAt : 0;
  const remaining = Math.max(0, APPROVAL_MS - elapsed);
  const progress = Math.min(100, (elapsed / APPROVAL_MS) * 100);

  useEffect(() => {
    if (enrollment.status === "pending" && remaining === 0 && enrollment.purchasedAt) {
      set(courseId, { ...enrollment, status: "active", approvedAt: Date.now() });
      toast.success("🎉 Your enrollment is approved! Course unlocked.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, enrollment.status]);

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p>Course not found.</p>
        <Link to="/courses" className="text-primary underline">
          Back
        </Link>
      </div>
    );
  }

  const detail = courseDetails[course.id] ?? fallbackDetail;
  const bullets = OFFERS;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <button
            onClick={() => navigate({ to: "/courses" })}
            className="inline-flex items-center gap-2 text-body text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to courses
          </button>

          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 max-w-[1400px] items-start">
            {/* Left: name + overall description */}
            <div className="space-y-6">
              <div className="rounded-2xl p-8 lg:p-10 border border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-primary-header font-extrabold max-w-2xl">{course.title}</h1>
                  <p
                    className={`text-small font-semibold tracking-wider shrink-0 px-3 py-1 rounded-full ${BOOTCAMP_BADGE[course.id] ?? "bg-muted text-muted-foreground"}`}
                  >
                    BOOTCAMP
                  </p>
                </div>
                <p className="text-second-header font-semibold mt-3 max-w-2xl text-foreground/90">
                  {detail.tagline}
                </p>
                <p className="text-body mt-3 max-w-2xl text-muted-foreground">
                  {course.longDescription}
                </p>

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  {(() => {
                    const parts = course.meta.split("·").map((s) => s.trim());
                    const items = [
                      {
                        icon: Clock,
                        label: "Time commitment",
                        value: parts[0] ?? "20H / Week",
                        color: "text-sky-600",
                        bg: "bg-sky-500/10",
                      },
                      {
                        icon: CalendarDays,
                        label: "Duration",
                        value: parts[1] ?? "4 Months",
                        color: "text-violet-600",
                        bg: "bg-violet-500/10",
                      },
                      {
                        icon: Briefcase,
                        label: "Format",
                        value: parts[2] ?? "Part Time",
                        color: "text-amber-600",
                        bg: "bg-amber-500/10",
                      },
                    ];
                    return items.map((it) => (
                      <div
                        key={it.label}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4"
                      >
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${it.bg}`}
                        >
                          <it.icon className={`h-5 w-5 ${it.color}`} />
                        </span>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-smaller text-muted-foreground">{it.label}</p>
                          <p className="font-bold text-small">{it.value}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <div className="mt-6 border-t border-border pt-6">
                  <h2 className="font-bold text-second-header mb-3">About this bootcamp</h2>
                  <div className="space-y-3 text-body text-muted-foreground leading-relaxed">
                    {detail.overview.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {enrollment.status === "none" && (
                    <button
                      onClick={() => setPricingOpen(true)}
                      className="mt-6 inline-flex items-center px-6 py-3 rounded-full bg-brand text-foreground text-button-primary font-semibold hover:bg-brand/90 transition-colors"
                    >
                      Purchase bootcamp
                    </button>
                  )}
                </div>
              </div>

              {/* Curriculum */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-bold text-second-header mb-4">Curriculum</h2>
                <Accordion type="single" collapsible className="w-full">
                  {detail.modules.map((m, i) => (
                    <AccordionItem
                      key={m.title}
                      value={`m-${i}`}
                      className="border-0 border-b border-border last:border-b-0"
                    >
                      <AccordionTrigger className="group hover:no-underline py-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="shrink-0 relative flex items-center justify-center h-12 w-12 rounded-xl bg-muted text-foreground">
                            <Book className="h-6 w-6 absolute transition-all duration-300 ease-out group-data-[state=open]:opacity-0 group-data-[state=open]:scale-75 group-data-[state=open]:-rotate-12" />
                            <BookOpen className="h-6 w-6 absolute transition-all duration-300 ease-out opacity-0 scale-75 rotate-12 group-data-[state=open]:opacity-100 group-data-[state=open]:scale-100 group-data-[state=open]:rotate-0" />
                          </span>
                          <div className="flex flex-col gap-1 flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-3">
                              <span className="shrink-0 px-2.5 py-1 rounded-md bg-muted text-foreground text-smaller font-bold">
                                Week {i + 1}
                              </span>
                              <span className="font-semibold truncate">
                                {m.title.split("—")[0].trim()}
                              </span>
                            </div>
                            <span className="text-body text-muted-foreground truncate">
                              {m.title.includes("—")
                                ? m.title.split("—").slice(1).join("—").trim()
                                : ""}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-5">
                        <p className="text-body text-muted-foreground leading-relaxed">
                          {m.description}
                        </p>
                        {m.youllBuild && (
                          <p className="text-body text-foreground leading-relaxed mt-3">
                            <span className="font-bold">You'll build:</span> {m.youllBuild}
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Outcomes */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-bold text-second-header mb-6">What you'll be able to do</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-border">
                  {detail.outcomes.map((o, i) => {
                    const variants = [
                      { Icon: Briefcase, anim: "animate-icon-bounce" },
                      { Icon: Rocket, anim: "animate-icon-float" },
                      { Icon: MessageSquare, anim: "animate-icon-wiggle" },
                    ];
                    const v = variants[i % 3];
                    return (
                      <li
                        key={o}
                        className="flex flex-col items-center text-center gap-4 px-5 py-2"
                      >
                        <v.Icon
                          className={`h-12 w-12 text-foreground ${v.anim}`}
                          strokeWidth={1.5}
                        />
                        <span className="text-body">{o}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Career Pathway */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="grid md:grid-cols-2 gap-6 items-stretch">
                  <div className="relative w-full h-full min-h-[280px] rounded-xl bg-muted/30 overflow-hidden">
                    <img
                      src={careerHandshakeImg}
                      alt="Career pathway handshake illustration"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <img
                      src={guaranteeBadgeImg}
                      alt="100% Guaranteed Tuition Refund badge"
                      className="absolute right-2 bottom-2 w-20 md:w-24 h-auto drop-shadow-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-xl">Metana's Job Guarantee</h3>
                    <p className="text-body text-muted-foreground leading-relaxed">
                      With our job guarantee, you're guaranteed a new job — or you'll get a full
                      tuition refund. We're so confident that our programs provide a direct path to
                      a high-paying job that we offer the following guarantee:
                    </p>
                    <blockquote className="border-l-4 border-primary pl-4 italic text-body text-foreground leading-relaxed">
                      "If you qualify for our 100% Tuition Refund Guarantee, fulfill the
                      requirements, and still don't get job offers paying $50,000 a year (or $4,166
                      a month) within 10 months after graduation, you'll get a full refund."
                    </blockquote>
                  </div>
                </div>
              </div>

              {/* Instructor */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-bold text-second-header mb-4">Meet your instructor</h2>
                <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
                  <div>
                    <p className="font-bold text-lg">{detail.instructor.name}</p>
                    <p className="text-small text-muted-foreground">{detail.instructor.role}</p>
                    <p className="text-body text-muted-foreground mt-3 leading-relaxed">
                      {detail.instructor.bio}
                    </p>
                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        Experience at
                      </p>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        {detail.instructor.companies.map((c) => {
                          const slug = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
                          const src = c.logo ?? `https://cdn.simpleicons.org/${slug}/737373`;
                          return (
                            <img
                              key={c.name}
                              src={src}
                              alt={c.name}
                              title={c.name}
                              loading="lazy"
                              className="h-12 w-12 object-contain rounded-lg opacity-90 hover:opacity-100 transition-opacity"
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <img
                    src={detail.instructor.avatar}
                    alt={detail.instructor.name}
                    className="h-28 w-28 md:h-32 md:w-32 rounded-2xl object-cover shrink-0 order-first md:order-last"
                  />
                </div>
              </div>

              {/* Testimonials */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-bold text-second-header mb-1">What our graduates say</h2>
                <p className="text-small text-muted-foreground mb-5">
                  Real stories from students who shipped careers after this bootcamp.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 items-stretch">
                  {/* Left column: two stacked cards */}
                  <div className="flex flex-col gap-4 h-full">
                    {/* Rating card */}
                    <div className="rounded-xl bg-brand-foreground text-background p-6 flex items-end justify-between gap-4">
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-background text-background" />
                          ))}
                        </div>
                        <p className="text-body font-bold">from 2,423 students</p>
                      </div>
                      <p className="text-6xl font-extrabold leading-none">4.5</p>
                    </div>
                    {/* Map card */}
                    <div className="rounded-xl border border-border bg-background p-5 flex-1 flex flex-col">
                      <p className="font-bold text-small mb-3">Distribution of job locations</p>
                      <img
                        src={jobLocationsMap}
                        alt="Distribution of job locations"
                        loading="lazy"
                        className="w-full h-full flex-1 object-contain"
                      />
                    </div>
                  </div>

                  {/* Right column: single tall testimonial card */}
                  <figure className="rounded-xl border border-border bg-background p-6 flex flex-col gap-5 h-full">
                    <h3 className="text-second-header font-semibold text-foreground">
                      The bootcamp that finally got me hired
                    </h3>
                    <blockquote className="text-body text-foreground leading-relaxed flex-1">
                      "I tried two other bootcamps before this. The difference is that the mentors
                      actually ship code — and they treat you like a future colleague. The weekly
                      code reviews changed how I think about software, and the capstone is the
                      project I show in every interview. Career support didn't stop at graduation;
                      my coach helped me negotiate $22k more on my first offer."
                    </blockquote>
                    <figcaption className="flex items-center gap-3 mt-auto">
                      <img
                        src="https://i.pravatar.cc/80?img=49"
                        alt="Mei Tanaka"
                        className="h-12 w-12 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">Mei Tanaka</p>
                        <p className="text-smaller text-muted-foreground truncate">
                          AI Engineer at a YC startup
                        </p>
                      </div>
                    </figcaption>
                  </figure>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-bold text-second-header mb-4">Frequently asked questions</h2>
                <div className="divide-y divide-border">
                  {detail.faqs.map((f) => (
                    <details key={f.q} className="group py-4">
                      <summary className="cursor-pointer font-semibold list-none flex items-start justify-between gap-3">
                        <span>{f.q}</span>
                        <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                          ⌄
                        </span>
                      </summary>
                      <p className="mt-2 text-body text-muted-foreground leading-relaxed">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: single card — What we offer + purchase / pending */}
            <aside className="lg:sticky lg:top-6 self-start">
              <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
                <img
                  src={whatWeOfferImg}
                  alt="What we offer"
                  loading="lazy"
                  width={768}
                  height={512}
                  className="w-full h-40 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-bold text-second-header mb-1">What we offer</h3>
                  <p className="text-small text-muted-foreground mb-4">
                    Everything included in this bootcamp.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-body">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand">
                          <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {enrollment.status === "none" && (
                    <button
                      onClick={() => setPricingOpen(true)}
                      className="w-full py-3.5 rounded-full bg-brand text-foreground text-button-primary font-semibold hover:bg-brand/90 transition-colors"
                    >
                      Purchase bootcamp
                    </button>
                  )}

                  {enrollment.status === "pending" && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        disabled
                        className="w-full py-3.5 rounded-full bg-warning/25 text-foreground text-button-primary font-semibold inline-flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Clock className="h-4 w-4" /> Pending approval
                      </button>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-smaller text-muted-foreground text-center">
                        Auto-approves in {Math.ceil(remaining / 1000)}s (demo)
                      </p>
                    </div>
                  )}

                  {enrollment.status === "active" && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toast.success("Launching first module... (demo)")}
                        className="w-full py-3.5 rounded-full bg-brand text-foreground text-button-primary font-semibold hover:bg-brand/90 transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" /> Continue learning
                      </button>
                      <button
                        onClick={() => {
                          set(courseId, { status: "none" });
                          toast.message("Course deactivated (demo)");
                        }}
                        className="w-full py-2.5 rounded-full border border-border bg-background text-foreground text-small font-semibold hover:bg-muted transition-colors"
                      >
                        Deactivate course (demo)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <PricingDialog
        open={pricingOpen}
        onOpenChange={setPricingOpen}
        courseId={courseId}
        onChoose={(plan) => {
          setPricingOpen(false);
          navigate({ to: "/checkout/$courseId", params: { courseId }, search: { plan } });
        }}
      />
    </div>
  );
}
