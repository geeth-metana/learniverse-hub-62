import { createFileRoute, Link, Outlet, useMatch, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  Search,
  LayoutGrid,
  List,
  Box,
  Boxes,
  Check,
  Clock,
  Lock,
  ArrowRight,
  Sparkles,
  Star,
  Plus,
} from "lucide-react";
import { myCourses, allCourses, type Course } from "@/lib/courses-data";
import { useEnrollments } from "@/lib/enrollment";
import { PricingDialog } from "@/components/courses/PricingDialog";
import { ClaimOfferDialog } from "@/components/courses/ClaimOfferDialog";
import { useViewMode } from "@/hooks/use-view-mode";



import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import courseReportLogo from "@/assets/course-report.png";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — Metana Platform" },
      { name: "description", content: "Browse your enrolled and available bootcamp courses on Metana." },
    ],
  }),
  component: CoursesPage,
});

const courseStyles: Record<Course["icon"], { label: string; bg: string; accent: string }> = {
  stack: { label: "FS", bg: "var(--gradient-brand)", accent: "oklch(0.911 0.214 122)" },
  rust: { label: "R", bg: "linear-gradient(135deg, oklch(0.95 0.09 58), oklch(0.9 0.13 35))", accent: "oklch(0.65 0.2 40)" },
  solidity: { label: "Ξ", bg: "linear-gradient(135deg, oklch(0.94 0.04 245), oklch(0.89 0.07 260))", accent: "oklch(0.381 0.063 259)" },
  ai: { label: "AI", bg: "linear-gradient(135deg, oklch(0.94 0.1 155), oklch(0.9 0.1 190))", accent: "oklch(0.65 0.18 160)" },
  zk: { label: "ZK", bg: "linear-gradient(135deg, oklch(0.95 0.08 320), oklch(0.9 0.1 350))", accent: "oklch(0.6 0.18 320)" },
  data: { label: "D", bg: "linear-gradient(135deg, oklch(0.95 0.1 110), oklch(0.9 0.12 145))", accent: "oklch(0.65 0.18 110)" },
};

function CourseVisual({ course, compact = false }: { course: Course; compact?: boolean }) {
  const style = courseStyles[course.icon];

  if (course.cover) {
    return (
      <div className={`relative overflow-hidden rounded-2xl ${compact ? "h-full min-h-36" : "h-40"}`}>
        <img
          src={course.cover}
          alt={course.title}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${compact ? "h-full min-h-36" : "h-64"}`} style={{ background: style.bg }}>
      <div className="absolute left-5 top-5 rounded-full bg-background/80 px-3 py-1 text-small font-semibold text-foreground shadow-[var(--shadow-soft)]">
        Bootcamp
      </div>
      <div className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-background/80 text-main-header font-black text-foreground shadow-[var(--shadow-soft)]">
        {style.label}
      </div>
      <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-background/55 bg-background/70 p-4 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="h-2.5 w-2.5 rounded-full bg-toggle-bg/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        </div>
        <div className="space-y-2">
          <span className="block h-2 rounded-full bg-toggle-bg/80" />
          <span className="block h-2 w-4/5 rounded-full bg-toggle-bg/45" />
          <span className="block h-2 w-2/3 rounded-full bg-toggle-bg/25" />
        </div>
      </div>
      <div
        className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full opacity-25 blur-2xl"
        style={{ background: style.accent }}
      />
    </div>
  );
}

type Testimonial = { name: string; role: string; avatar: string; rating: number; text: string };

const courseTestimonials: Record<string, { rating: number; reviews: number; items: [Testimonial, Testimonial] }> = {
  solidity: {
    rating: 4.9,
    reviews: 1284,
    items: [
      { name: "Aisha Karimov", role: "Smart Contract Engineer", avatar: "https://i.pravatar.cc/80?img=47", rating: 5, text: "Honestly the best Solidity bootcamp out there. The audit walkthroughs finally made re-entrancy and storage collision click for me — I shipped my first audited protocol two weeks after graduating and the mentors still review my PRs." },
      { name: "Marco Pereira", role: "Web3 Developer at Lens", avatar: "https://i.pravatar.cc/80?img=12", rating: 5, text: "I came in writing JavaScript and left writing production-grade Solidity. The capstone forced me to think like an attacker, and the gas-optimization sessions alone were worth the entire tuition." },
    ],
  },
  "ai-engineering": {
    rating: 4.8,
    reviews: 932,
    items: [
      { name: "Lena Romanova", role: "ML Engineer at a YC startup", avatar: "https://i.pravatar.cc/80?img=32", rating: 5, text: "RAG, evals, and agentic systems taught the right way — not the hype way. The eval harness module changed how I ship LLM features at work, and I was hired into a senior role within three months of finishing." },
      { name: "Tomás Silva", role: "AI Product Engineer", avatar: "https://i.pravatar.cc/80?img=15", rating: 5, text: "The agentic systems module is gold. Building a multi-tool agent from first principles, then breaking it on purpose to learn observability, gave me intuition I couldn't have gotten from any course or blog post." },
    ],
  },
  zk: {
    rating: 4.9,
    reviews: 612,
    items: [
      { name: "Priya Nair", role: "ZK Protocol Engineer", avatar: "https://i.pravatar.cc/80?img=44", rating: 5, text: "Circom and Noir finally made sense. The mentors broke down arithmetization and constraint systems into something I could actually reason about, and the office hours were the most valuable hour of every week." },
      { name: "Ben Hartmann", role: "Cryptography Researcher", avatar: "https://i.pravatar.cc/80?img=8", rating: 5, text: "I was contributing to a major ZK rollup within a month of finishing. The curriculum strikes a rare balance — deep enough to actually understand SNARKs, practical enough to ship circuits in production." },
    ],
  },
  data: {
    rating: 4.7,
    reviews: 1045,
    items: [
      { name: "Yuki Tanaka", role: "Senior Data Engineer", avatar: "https://i.pravatar.cc/80?img=49", rating: 5, text: "dbt, Airflow, and Snowflake taught with real production patterns — not toy notebooks. The data quality module alone paid for the bootcamp; I caught two silent pipeline bugs in my first week back at work." },
      { name: "Daniel Okafor", role: "Analytics Engineer", avatar: "https://i.pravatar.cc/80?img=22", rating: 5, text: "Promoted to senior data engineer right after the program. The instructors don't just teach tools — they teach the trade-offs behind them, and that's what hiring managers actually want to hear in interviews." },
    ],
  },
};

const courseHighlights: Record<string, { tagline: string; bullets: string[] }> = {
  solidity: {
    tagline: "Ship audited contracts. Not toy demos.",
    bullets: [
      "Build, test and deploy on real EVM chains.",
      "Master security patterns and gas optimization.",
      "Online program with live sessions and mentorship.",
    ],
  },
  "ai-engineering": {
    tagline: "Your team has the tools. They don't have the system.",
    bullets: [
      "Learn with your team, not just next to them.",
      "Covers RAG, evals, agents and modern LLM stacks.",
      "Online program with live sessions and async material.",
    ],
  },
  zk: {
    tagline: "Cryptography that actually clicks.",
    bullets: [
      "Master Circom, Noir and modern proving systems.",
      "From arithmetization to shipping production circuits.",
      "Online program with live sessions and weekly office hours.",
    ],
  },
  data: {
    tagline: "Pipelines that survive production.",
    bullets: [
      "dbt, Airflow and Snowflake taught with real patterns.",
      "Design data quality and observability from day one.",
      "Online program with live sessions and async material.",
    ],
  },
};

const fallbackHighlights = {
  tagline: "A program built around outcomes, not lectures.",
  bullets: [
    "Hands-on projects reviewed by senior engineers.",
    "Career coaching, mock interviews and job support.",
    "Online program with live sessions and async material.",
  ],
};

function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-primary">

      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < Math.round(value) ? "fill-current" : "fill-none text-muted-foreground/40"}`}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

function TestimonialCard({ t, side, phase, onHoverChange }: { t: Testimonial; side: "left" | "right"; phase: "in" | "out"; onHoverChange?: (hovered: boolean) => void }) {
  const animClass = `testimonial-${side}-${phase === "in" ? "enter" : "exit"}`;
  const hoverRotate = side === "left" ? "group-hover:rotate-[5deg]" : "group-hover:rotate-[-5deg]";
  return (
    <div
      className={`group pointer-events-auto ${animClass}`}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div
        className={`w-[340px] rounded-2xl bg-background p-5 shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${hoverRotate} group-hover:scale-[1.06] group-hover:shadow-[var(--shadow-brand)]`}
      >
      <div className="flex items-center gap-3">
        <img src={t.avatar} alt={t.name} className="h-11 w-11 rounded-full object-cover" />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-small font-semibold text-foreground">{t.name}</p>
            <p className="truncate text-smaller text-muted-foreground">{t.role}</p>
          </div>
          <Stars value={t.rating} />
        </div>
      </div>
      <p className="mt-3 text-small leading-relaxed text-muted-foreground">"{t.text}"</p>
      </div>
    </div>
  );
}

const fallbackData = {
  rating: 4.8,
  reviews: 800,
  items: [
    { name: "Sam Reyes", role: "Bootcamp graduate", avatar: "https://i.pravatar.cc/80?img=5", rating: 5, text: "Life-changing program with mentors who genuinely care. The curriculum kept pushing me past what I thought I could build, and the community alone was worth every minute." },
    { name: "Noor Abadi", role: "Software Engineer", avatar: "https://i.pravatar.cc/80?img=20", rating: 5, text: "Hands-on projects made every concept stick. I left with a portfolio I'm actually proud to show, and a network of peers I still ship side projects with today." },
  ] as [Testimonial, Testimonial],
};

function SliderCard({
  course,
  data,
  style,
  animClass,
  zIndex,
  active,
  setActive,
  onPurchase,
  paused,
  onHoverChange,
}: {
  course: Course;
  data: { rating: number; reviews: number; items: [Testimonial, Testimonial] };
  style: { bg: string };
  animClass: string;
  zIndex: number;
  active: number;
  setActive: (i: number) => void;
  onPurchase: (course: Course) => void;
  paused: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-3xl ${animClass}`}
      style={{ background: style.bg, zIndex }}
    >
      {course.cover && (
        <img
          src={course.cover}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="relative mx-auto flex min-h-[420px] max-w-5xl items-center justify-center gap-10 px-6 py-10 lg:px-8">
        <div className="relative z-10 flex max-w-xl flex-col items-start text-left">
          <h2 className="text-[32px] leading-[1.1] font-bold tracking-tight text-foreground">
            {course.title}
          </h2>

          <p className="mt-4 max-w-xl text-body leading-relaxed text-foreground/80">
            {course.longDescription}
          </p>

          <ul className="mt-4 space-y-2">
            {(courseHighlights[course.id] ?? fallbackHighlights).bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-small text-foreground">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand">
                  <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-small font-semibold text-foreground">{course.meta}</p>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <button
              onClick={() => onPurchase(course)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-button-primary font-semibold text-foreground transition-colors duration-300 hover:bg-brand/90"
            >
              Purchase bootcamp <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/courses/$courseId"
              params={{ courseId: course.id }}
              className="inline-flex items-center gap-1.5 text-small font-semibold text-foreground underline-offset-4 hover:underline"
            >
              View details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <img src={courseReportLogo} alt="Course Report" className="h-6 w-auto object-contain" />
              <span className="text-[20px] font-bold text-foreground tabular-nums leading-none">{data.rating.toFixed(1)}/5</span>
              <Star className="h-5 w-5 fill-current text-primary" strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="relative hidden lg:flex h-[300px] w-[360px] shrink-0 items-center justify-center">
          <div className="absolute inset-x-0 top-[58%] -translate-y-1/2 flex justify-center pointer-events-none opacity-70 blur-[1px] scale-[0.92]">
            <div className="w-[340px] rounded-2xl bg-background p-5 shadow-[var(--shadow-soft)] h-[180px] overflow-hidden" aria-hidden="true">
              <div className="flex items-center gap-3">
                <img src={data.items[1].avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-small font-semibold text-foreground">{data.items[1].name}</p>
                  <p className="truncate text-smaller text-muted-foreground">{data.items[1].role}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 top-[42%] -translate-y-1/2 flex justify-center">
            <TestimonialCard t={data.items[0]} side="right" phase="in" onHoverChange={onHoverChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseSlider({ onPurchase }: { onPurchase: (course: Course) => void }) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % allCourses.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const prevActiveRef = useRef(active);
  useEffect(() => {
    if (prevActiveRef.current === active) return;
    setPrevious(prevActiveRef.current);
    prevActiveRef.current = active;
    const t = window.setTimeout(() => setPrevious(null), 1000);
    return () => window.clearTimeout(t);
  }, [active]);

  const handleSetActive = (i: number) => {
    if (i === active) return;
    setActive(i);
  };

  const renderCourse = (idx: number, animClass: string, zIndex: number, key: string) => {
    const course = allCourses[idx];
    if (!course) return null;
    const style = courseStyles[course.icon];
    const data = courseTestimonials[course.id] ?? fallbackData;
    if (!style || !data) return null;
    return (
      <SliderCard
        key={key}
        course={course}
        data={data}
        style={style}
        animClass={animClass}
        zIndex={zIndex}
        active={active}
        setActive={handleSetActive}
        onPurchase={onPurchase}
        paused={paused}
        onHoverChange={setPaused}
      />
    );
  };

  return (
    <section className="relative mb-7 min-h-[420px] overflow-hidden">
      {previous !== null && renderCourse(previous, "card-stack-leave", 1, `leave-${previous}-${active}`)}
      {renderCourse(active, "card-stack-enter", 2, `enter-${active}`)}
    </section>
  );
}

function StatusBadge({ course }: { course: Course }) {
  const { get } = useEnrollments();
  const status = get(course.id).status;

  if (course.category === "my" || status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-smaller font-semibold text-brand-foreground">
        <Check className="h-3 w-3" strokeWidth={3} /> Active
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/25 px-2.5 py-1 text-smaller font-semibold text-foreground">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-smaller font-semibold text-muted-foreground">
      <Lock className="h-3 w-3" /> Locked
    </span>
  );
}

const courseProgress: Record<string, number> = {
  fullstack: 62,
  rust: 28,
};

function CourseCard({
  course,
  view,
  onOpen,
}: {
  course: Course;
  view: "grid" | "list";
  onOpen: (course: Course) => void;
}) {
  const isMine = course.category === "my";
  const progress = courseProgress[course.id] ?? 0;

  return (
    <article
      onClick={() => onOpen(course)}
      className={`group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow duration-300 ease-out hover:shadow-[var(--shadow-soft-hover)] ${
        view === "list" ? "grid min-h-[220px] grid-cols-1 md:grid-cols-[320px_1fr]" : "flex flex-col"
      }`}
    >
      <div className={view === "list" ? "p-4" : "p-4 pb-0"}>
        <CourseVisual course={course} compact={view === "list"} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-second-header font-bold leading-snug text-foreground">{course.title}</h3>
        </div>
        {isMine && (
          <div className="mb-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-small font-semibold tabular-nums text-foreground">{progress}%</span>
          </div>
        )}
        <p className="text-body text-muted-foreground leading-relaxed line-clamp-3">{course.description}</p>
      </div>
    </article>
  );
}


const OFFER_DEADLINE = new Date("2026-08-28T00:00:00Z").getTime();

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function Digit({ value }: { value: string }) {
  return (
    <span key={value} className="digit-roll inline-block tabular-nums">
      {value}
    </span>
  );
}

function JourneyHeader() {
  const { days, hours, minutes, seconds } = useCountdown(OFFER_DEADLINE);
  const [claimOpen, setClaimOpen] = useState(false);
  const viewMode = useViewMode();
  const parts = [
    String(days).padStart(3, "0"),
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ];
  return (
    <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
      <div className="flex flex-col justify-center">
        <h1 className="text-primary-header font-bold text-foreground">Your Learning Journey</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Your personalized space to learn, practice, and improve every day.
        </p>
      </div>
      {viewMode === "admin" ? (
        <div className="flex items-center">
          <Link
            to="/bootcamps/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-toggle-bg px-5 py-2.5 text-button-primary font-semibold text-background transition-colors hover:bg-toggle-bg/90"
          >
            <Plus className="h-4 w-4 text-primary" /> Create
          </Link>
        </div>
      ) : (
      <div className="flex items-center gap-6 rounded-full bg-muted px-5 py-3">
        <div className="flex items-center text-second-header font-bold text-foreground">
          {parts.map((part, i) => (
            <span key={i} className="flex items-center">
              <Digit value={part} />
              {i < parts.length - 1 && <span className="px-1.5 text-muted-foreground">:</span>}
            </span>
          ))}
        </div>
        <button
          onClick={() => setClaimOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-toggle-bg px-5 py-2.5 text-button-primary font-semibold text-background transition-colors hover:bg-toggle-bg/90"
        >
          <Sparkles className="h-4 w-4 text-primary" /> Claim offer
        </button>
      </div>
      )}
      <ClaimOfferDialog
        open={claimOpen}
        onOpenChange={setClaimOpen}
        countdown={{ days, hours, minutes, seconds }}
      />
    </div>
  );
}

function CoursesPage() {
  const navigate = useNavigate();
  const detailMatch = useMatch({ from: "/courses/$courseId", shouldThrow: false });
  const learnMatch = useMatch({ from: "/courses/learn/$courseId", shouldThrow: false });
  const [tab, setTab] = useState<"my" | "all">("my");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [pricingFor, setPricingFor] = useState<string | null>(null);

  const { get: getEnrollment, all: enrollments } = useEnrollments();

  const list = useMemo(() => {
    const activatedIds = new Set(
      Object.entries(enrollments)
        .filter(([, e]) => e?.status === "active")
        .map(([id]) => id),
    );
    const base =
      tab === "my"
        ? [...myCourses, ...allCourses.filter((c) => activatedIds.has(c.id))]
        : allCourses.filter((c) => !activatedIds.has(c.id));
    const q = query.trim().toLowerCase();
    return q
      ? base.filter((c) => `${c.title} ${c.description} ${c.meta}`.toLowerCase().includes(q))
      : base;
  }, [tab, query, enrollments]);

  const handleOpen = (course: Course) => {
    if (tab === "my") {
      navigate({ to: "/courses/learn/$courseId", params: { courseId: course.id } });
    } else {
      navigate({ to: "/courses/$courseId", params: { courseId: course.id } });
    }
  };

  const handlePurchase = (course: Course) => {
    setPricingFor(course.id);
  };

  if (detailMatch || learnMatch) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1480px]">
            <JourneyHeader />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="relative inline-flex items-center rounded-full border border-border bg-background p-1 shadow-[var(--shadow-soft)]">
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1 top-1 rounded-full bg-primary transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{
                    width: "calc(50% - 4px)",
                    transform: tab === "my" ? "translateX(0%)" : "translateX(100%)",
                  }}
                />
                <button
                  onClick={() => setTab("my")}
                  className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-5 py-2 text-body font-semibold transition-colors ${
                    tab === "my" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Box className="h-4 w-4" /> My Courses
                </button>
                <button
                  onClick={() => setTab("all")}
                  className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-5 py-2 text-body font-semibold transition-colors ${
                    tab === "all" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Boxes className="h-4 w-4" /> All Courses
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    type="text"
                    placeholder="Search..."
                    className="w-72 rounded-full border border-border bg-background py-2.5 pl-9 pr-4 text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-1 rounded-full border border-border p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setView("grid")}
                        className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Grid view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setView("list")}
                        className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        aria-label="List view"
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {tab === "all" && <CourseSlider onPurchase={handlePurchase} />}

            {list.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border py-16 text-center text-body text-muted-foreground">
                No courses match “{query}”.
              </div>
            ) : (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
                    : "flex flex-col gap-4"
                }
              >
                {list.map((course) => (
                  <CourseCard key={course.id} course={course} view={view} onOpen={handleOpen} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <PricingDialog
        open={pricingFor !== null}
        onOpenChange={(open) => !open && setPricingFor(null)}
        courseId={pricingFor}
        onChoose={(plan) => {
          if (pricingFor) {
            const courseId = pricingFor;
            setPricingFor(null);
            navigate({ to: "/checkout/$courseId", params: { courseId }, search: { plan } });
          }
        }}
      />
    </div>
  );
}
