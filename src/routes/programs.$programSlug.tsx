import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Flame,
  Lock,
  Package,
  PlayCircle,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  Cell,
} from "recharts";
import { getProductBySlug, type Product } from "@/lib/products-store";
import { getCourse } from "@/lib/courses-data";
import { courseDetails, fallbackDetail } from "./courses.$courseId";

const BRAND = "#CCF621";
const BRAND_SOFT = "#F0FBC2";
const INK = "#1A1A1A";
const INK_2 = "#24324A";
const MUTED = "#6B7280";
const BG = "#F8FAF7";
const BORDER = "#E5E7EB";

type LessonKind = "video" | "reading" | "quiz" | "assignment";
type LessonStatus = "completed" | "current" | "available" | "locked";
type Lesson = { id: string; title: string; duration: string; kind: LessonKind; status: LessonStatus };
type Unit = { id: string; title: string; lessons: Lesson[] };
type Mod = { id: string; title: string; units: Unit[] };
type CourseStatus = "completed" | "in-progress" | "available" | "locked";
type CourseNode = {
  id: string;
  title: string;
  description: string;
  meta: string;
  gradient: string;
  modules: Mod[];
  totalLessons: number;
  completedLessons: number;
  progress: number;
  status: CourseStatus;
};

export const Route = createFileRoute("/programs/$programSlug")({
  head: () => ({
    meta: [
      { title: "Program — Metana Platform" },
      { name: "description", content: "Your Metana learning program overview." },
    ],
  }),
  component: ProgramPage,
});

function buildCourseTree(courseId: string, seededProgress: number): {
  modules: Mod[];
  totalLessons: number;
  completedLessons: number;
} {
  const detail = courseDetails[courseId] ?? fallbackDetail;
  const rawModules = detail.modules ?? [];
  const modules: Mod[] = rawModules.map((m, mi) => {
    const base = m.title.replace(/^Module\s*\d+\s*[—-]\s*/i, "").trim() || "Topic";
    const units: Unit[] = Array.from({ length: 2 }, (_, u) => {
      const lessonCount = 3 + ((mi + u) % 2);
      const lessons: Lesson[] = Array.from({ length: lessonCount }, (_, l) => {
        const kinds: LessonKind[] = ["video", "reading", "quiz", "assignment"];
        return {
          id: `${courseId}-m${mi}-u${u}-l${l}`,
          title: `Lesson ${l + 1} — ${base} ${["intro", "walkthrough", "exercise", "review"][l] ?? "extra"}`,
          duration: `${6 + ((l + u + mi) % 5) * 3} min`,
          kind: kinds[(l + u) % kinds.length],
          status: "available",
        };
      });
      return {
        id: `${courseId}-m${mi}-u${u}`,
        title: `Unit 0${u + 1} — ${base} ${u === 0 ? "essentials" : "in practice"}`,
        lessons,
      };
    });
    return { id: `${courseId}-m${mi}`, title: `Module 0${mi + 1}: ${base}`, units };
  });

  const totalLessons = modules.reduce(
    (a, m) => a + m.units.reduce((aa, u) => aa + u.lessons.length, 0),
    0,
  );
  const completedLessons = Math.round((seededProgress / 100) * totalLessons);

  let remaining = completedLessons;
  let currentMarked = false;
  for (const m of modules) {
    for (const u of m.units) {
      for (const l of u.lessons) {
        if (remaining > 0) {
          l.status = "completed";
          remaining -= 1;
        } else if (!currentMarked && seededProgress > 0 && seededProgress < 100) {
          l.status = "current";
          currentMarked = true;
        } else {
          l.status = "available";
        }
      }
    }
  }
  return { modules, totalLessons, completedLessons };
}

function ProgramPage() {
  const { programSlug } = useParams({ from: "/programs/$programSlug" });
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | undefined>(() =>
    getProductBySlug(programSlug),
  );

  useEffect(() => {
    setProduct(getProductBySlug(programSlug));
    const sync = () => setProduct(getProductBySlug(programSlug));
    window.addEventListener("metana:products-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("metana:products-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [programSlug]);

  const courses: CourseNode[] = useMemo(() => {
    if (!product) return [];
    const seeded: Record<string, number> = {
      fullstack: 100,
      solidity: 65,
      rust: 100,
      "ai-engineering": 30,
      zk: 0,
      data: 0,
    };
    const isLinear = (product.accessibility ?? "free") === "linear";
    const list = product.courseIds
      .map((id) => getCourse(id))
      .filter(Boolean) as NonNullable<ReturnType<typeof getCourse>>[];

    const built = list.map((c, i) => {
      const prog = seeded[c.id] ?? (i === 0 ? 60 : i === 1 ? 25 : 0);
      const { modules, totalLessons, completedLessons } = buildCourseTree(c.id, prog);
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        meta: c.meta,
        gradient: c.gradient,
        modules,
        totalLessons,
        completedLessons,
        progress: prog,
        status: "available" as CourseStatus,
      };
    });

    // Apply lock logic
    built.forEach((c, i) => {
      if (c.progress >= 100) c.status = "completed";
      else if (c.progress > 0) c.status = "in-progress";
      else if (isLinear && i > 0 && built[i - 1].progress < 100) c.status = "locked";
      else c.status = "available";
    });

    // Mark first non-completed course's first available lesson as current if not already
    const hasCurrent = built.some((c) =>
      c.modules.some((m) => m.units.some((u) => u.lessons.some((l) => l.status === "current"))),
    );
    if (!hasCurrent) {
      const target = built.find((c) => c.status === "in-progress" || c.status === "available");
      if (target) {
        outer: for (const m of target.modules) {
          for (const u of m.units) {
            for (const l of u.lessons) {
              if (l.status === "available") {
                l.status = "current";
                break outer;
              }
            }
          }
        }
      }
    }

    // Lock lessons of locked courses
    built.forEach((c) => {
      if (c.status === "locked") {
        c.modules.forEach((m) =>
          m.units.forEach((u) => u.lessons.forEach((l) => (l.status = "locked"))),
        );
      }
    });

    return built;
  }, [product]);

  if (!product) {
    return (
      <div className="flex min-h-screen" style={{ background: BG }}>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6 lg:p-10">
            <div className="mx-auto max-w-[800px] rounded-3xl border border-dashed border-border bg-white py-20 text-center">
              <Package className="mx-auto h-10 w-10" style={{ color: MUTED }} />
              <p className="mt-4 text-sm" style={{ color: MUTED }}>
                Program not found.
              </p>
              <button
                onClick={() => navigate({ to: "/courses" })}
                className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: BRAND, color: INK }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Courses
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isLinear = (product.accessibility ?? "free") === "linear";
  const totalLessons = courses.reduce((a, c) => a + c.totalLessons, 0);
  const completedLessons = courses.reduce((a, c) => a + c.completedLessons, 0);
  const programProgress = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  const currentCourse =
    courses.find((c) => c.status === "in-progress") ??
    courses.find((c) => c.status === "available") ??
    courses[0];

  // Streak data
  const weekly = [
    { day: "Mon", v: 3 },
    { day: "Tue", v: 2 },
    { day: "Wed", v: 0 },
    { day: "Thu", v: 4 },
    { day: "Fri", v: 1 },
    { day: "Sat", v: 5 },
    { day: "Sun", v: 2 },
  ];
  const weeklyCompleted = weekly.reduce((a, d) => a + d.v, 0);
  const currentStreakDays = 7;
  const learningMomentum =
    currentStreakDays * 10 + completedLessons * 2 + weeklyCompleted * 5;

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-[1280px]">
            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3"
            >
              <button
                onClick={() => navigate({ to: "/courses" })}
                className="grid h-9 w-9 place-items-center rounded-full bg-white transition-colors hover:bg-neutral-100"
                style={{ border: `1px solid ${BORDER}` }}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" style={{ color: INK_2 }} />
              </button>
              <p className="text-sm" style={{ color: MUTED }}>
                Programs <span className="mx-1.5">/</span>
                <span style={{ color: INK_2 }}>{product.title}</span>
              </p>
            </motion.div>

            {/* HERO */}
            <ProgramHeroCard
              product={product}
              isLinear={isLinear}
              programProgress={programProgress}
              completedLessons={completedLessons}
              totalLessons={totalLessons}
              currentCourseTitle={currentCourse?.title ?? ""}
              currentStreakDays={currentStreakDays}
              onContinue={() =>
                currentCourse &&
                navigate({ to: "/courses/$courseId", params: { courseId: currentCourse.id } })
              }
            />

            {/* GRID */}
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
              {/* Curriculum */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <h2
                      className="text-xl font-bold tracking-tight"
                      style={{ color: INK }}
                    >
                      Program Curriculum
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: MUTED }}>
                      {isLinear
                        ? "Complete each course to unlock the next."
                        : "Jump into any course — they're all unlocked for you."}
                    </p>
                  </div>
                  <StatusPill linear={isLinear} />
                </div>

                <div className="space-y-3">
                  {courses.map((c, idx) => (
                    <CourseAccordion
                      key={c.id}
                      course={c}
                      index={idx + 1}
                      onOpenLesson={() =>
                        navigate({ to: "/courses/$courseId", params: { courseId: c.id } })
                      }
                    />
                  ))}
                  {courses.length === 0 && (
                    <div
                      className="rounded-3xl bg-white p-10 text-center"
                      style={{ border: `1px solid ${BORDER}` }}
                    >
                      <p className="text-sm" style={{ color: MUTED }}>
                        No courses in this program yet.
                      </p>
                    </div>
                  )}
                </div>
              </motion.section>

              {/* Sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-5 lg:sticky lg:top-6 self-start"
              >
                <InstructorCard />
                <LearningStreakCard
                  weekly={weekly}
                  currentStreakDays={currentStreakDays}
                  weeklyCompleted={weeklyCompleted}
                  learningMomentum={learningMomentum}
                />
                <RecommendedCourseCard />
              </motion.aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================== SUBCOMPONENTS ============================== */

function StatusPill({ linear }: { linear: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold"
      style={{ border: `1px solid ${BORDER}`, color: INK_2 }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: linear ? INK_2 : BRAND }}
      />
      {linear ? "Linear Program" : "Self-Paced Program"}
    </span>
  );
}

function ProgressBar({ value, height = 8 }: { value: number; height?: number }) {
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height, background: "#EEF1EE" }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
        className="h-full rounded-full"
        style={{ background: BRAND }}
      />
    </div>
  );
}

function ProgramHeroCard({
  product,
  isLinear,
  programProgress,
  completedLessons,
  totalLessons,
  currentCourseTitle,
  currentStreakDays,
  onContinue,
}: {
  product: Product;
  isLinear: boolean;
  programProgress: number;
  completedLessons: number;
  totalLessons: number;
  currentCourseTitle: string;
  currentStreakDays: number;
  onContinue: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="relative overflow-hidden rounded-[24px] bg-white p-6 lg:p-8"
      style={{
        border: `1px solid ${BORDER}`,
        boxShadow:
          "0 1px 2px rgba(20,30,50,0.04), 0 8px 28px rgba(20,30,50,0.04)",
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        {/* Left */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: BRAND_SOFT, color: INK }}
            >
              <Sparkles className="h-3 w-3" /> Metana Program
            </span>
            <StatusPill linear={isLinear} />
          </div>

          <h1
            className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight lg:text-[34px]"
            style={{ color: INK }}
          >
            {product.title}
          </h1>
          <p
            className="mt-3 max-w-xl text-[15px] leading-relaxed"
            style={{ color: MUTED }}
          >
            {product.description ||
              "Master AI-powered software engineering through structured courses, projects, mentorship, and real-world workflows."}
          </p>

          {/* Progress block */}
          <div className="mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: INK }}
                >
                  {programProgress}%
                </span>
                <span className="text-sm" style={{ color: MUTED }}>
                  Complete
                </span>
              </div>
              <span className="text-sm font-semibold" style={{ color: INK_2 }}>
                {completedLessons} / {totalLessons} Lessons
              </span>
            </div>
            <ProgressBar value={programProgress} />
            {currentCourseTitle && (
              <p className="mt-3 text-sm" style={{ color: MUTED }}>
                Current Course:{" "}
                <span className="font-semibold" style={{ color: INK_2 }}>
                  {currentCourseTitle}
                </span>
              </p>
            )}
          </div>

          <div className="mt-6">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-shadow"
              style={{
                background: BRAND,
                color: INK,
                boxShadow: "0 6px 20px rgba(204, 246, 33, 0.45)",
              }}
            >
              <PlayCircle className="h-4 w-4" />
              Continue Learning
            </motion.button>
          </div>
        </div>

        {/* Right - image */}
        <div className="relative">
          <div
            className="relative aspect-[5/4] w-full overflow-hidden rounded-[20px]"
            style={{ border: `1px solid ${BORDER}` }}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: BRAND_SOFT }}
              >
                <Package className="h-12 w-12" style={{ color: INK_2 }} />
              </div>
            )}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.25))",
              }}
            />
          </div>

        </div>
      </div>
    </motion.section>
  );
}

/* ---------- Curriculum ---------- */

function CourseAccordion({
  course,
  index,
  onOpenLesson,
}: {
  course: CourseNode;
  index: number;
  onOpenLesson: () => void;
}) {
  const locked = course.status === "locked";
  const [open, setOpen] = useState(course.status === "in-progress");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: locked ? 0.7 : 1, y: 0 }}
      whileHover={locked ? undefined : { y: -2 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-[20px] bg-white"
      style={{
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 2px rgba(20,30,50,0.03), 0 4px 14px rgba(20,30,50,0.03)",
      }}
    >
      <button
        type="button"
        disabled={locked}
        onClick={() => !locked && setOpen((o) => !o)}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left ${locked ? "cursor-not-allowed" : "hover:bg-[#FAFCFA]"}`}
      >
        <div className="relative shrink-0">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: course.gradient }}
          >
            {course.status === "completed" ? (
              <Check className="h-6 w-6" strokeWidth={3} style={{ color: INK }} />
            ) : locked ? (
              <Lock className="h-5 w-5" style={{ color: INK_2 }} />
            ) : (
              <BookOpen className="h-5 w-5" style={{ color: INK_2 }} />
            )}
          </div>
          <span
            className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-bold"
            style={{ border: `1px solid ${BORDER}`, color: INK_2 }}
          >
            {index}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-bold" style={{ color: INK }}>
              {course.title}
            </p>
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="mt-0.5 truncate text-xs" style={{ color: MUTED }}>
            {course.description}
          </p>

          <div
            className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold"
            style={{ color: MUTED }}
          >
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {course.meta}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" /> {course.totalLessons} lessons
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: locked ? "#EAECEA" : "#EEF1EE" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 0.9 }}
                className="h-full rounded-full"
                style={{ background: locked ? "#C9CDC9" : BRAND }}
              />
            </div>
            <span
              className="shrink-0 text-[11px] font-bold tabular-nums"
              style={{ color: locked ? MUTED : INK }}
            >
              {course.progress}%
            </span>
          </div>

          {locked && (
            <p className="mt-2 text-[11px]" style={{ color: MUTED }}>
              Complete the previous course to unlock this.
            </p>
          )}
        </div>

        {!locked && (
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-full"
            style={{ background: "#F3F5F3" }}
          >
            <ChevronDown className="h-4 w-4" style={{ color: INK_2 }} />
          </motion.div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && !locked && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div
              className="space-y-2 px-5 pb-5 pt-2"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              {course.modules.map((m, mi) => (
                <ModuleAccordion
                  key={m.id}
                  mod={m}
                  index={mi}
                  onOpenLesson={onOpenLesson}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CourseStatusBadge({ status }: { status: CourseStatus }) {
  if (status === "completed")
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{ background: BRAND, color: INK }}
      >
        <Check className="h-3 w-3" strokeWidth={3} /> Completed
      </span>
    );
  if (status === "in-progress")
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{ background: BRAND_SOFT, color: INK }}
      >
        <PlayCircle className="h-3 w-3" /> In Progress
      </span>
    );
  if (status === "locked")
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{ background: "#F1F3F1", color: MUTED }}
      >
        <Lock className="h-3 w-3" /> Locked
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: "#F1F3F1", color: INK_2 }}
    >
      Not Started
    </span>
  );
}

function ModuleAccordion({
  mod,
  index,
  onOpenLesson,
}: {
  mod: Mod;
  index: number;
  onOpenLesson: () => void;
}) {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="overflow-hidden rounded-2xl"
      style={{ border: `1px solid ${BORDER}`, background: "#FBFCFB" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white"
      >
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold"
          style={{ background: "#fff", border: `1px solid ${BORDER}`, color: INK_2 }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: INK }}>
            {mod.title}
          </p>
          <p className="text-[11px]" style={{ color: MUTED }}>
            {mod.units.length} units ·{" "}
            {mod.units.reduce((a, u) => a + u.lessons.length, 0)} lessons
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4" style={{ color: MUTED }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <div
              className="space-y-1.5 px-3 pb-3 pt-2"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              {mod.units.map((u, ui) => (
                <UnitAccordion
                  key={u.id}
                  unit={u}
                  index={ui}
                  onOpenLesson={onOpenLesson}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UnitAccordion({
  unit,
  index,
  onOpenLesson,
}: {
  unit: Unit;
  index: number;
  onOpenLesson: () => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const completed = unit.lessons.filter((l) => l.status === "completed").length;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#FAFCFA]"
      >
        <FileText className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold" style={{ color: INK }}>
          {unit.title}
        </p>
        <span className="shrink-0 text-[11px]" style={{ color: MUTED }}>
          {completed}/{unit.lessons.length}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5" style={{ color: MUTED }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="space-y-1 px-2 pb-2 pt-1.5" style={{ borderTop: `1px solid ${BORDER}` }}>
              {unit.lessons.map((l) => (
                <LessonRow key={l.id} lesson={l} onClick={onOpenLesson} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LessonRow({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
  const isCurrent = lesson.status === "current";
  const isCompleted = lesson.status === "completed";
  const isLocked = lesson.status === "locked";

  return (
    <motion.li
      whileHover={isLocked ? undefined : { y: -1, x: 2 }}
      transition={{ duration: 0.15 }}
      onClick={() => !isLocked && onClick()}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      style={
        isCurrent
          ? {
              background: BRAND_SOFT,
              borderLeft: `3px solid ${BRAND}`,
              boxShadow: "0 0 0 1px rgba(204,246,33,0.35)",
            }
          : undefined
      }
    >
      <LessonStatusIcon status={lesson.status} kind={lesson.kind} />
      <span
        className={`min-w-0 flex-1 truncate text-[13px] ${isCompleted ? "line-through" : ""}`}
        style={{ color: isLocked ? MUTED : isCurrent ? INK : INK_2 }}
      >
        {lesson.title}
      </span>
      <span className="shrink-0 text-[11px]" style={{ color: MUTED }}>
        {lesson.duration}
      </span>
      {isCurrent && (
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          style={{ background: BRAND, color: INK }}
        >
          Continue
        </span>
      )}
    </motion.li>
  );
}

function LessonStatusIcon({
  status,
  kind,
}: {
  status: LessonStatus;
  kind: LessonKind;
}) {
  if (status === "completed") {
    return (
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
        style={{ background: BRAND }}
      >
        <Check className="h-3 w-3" strokeWidth={3} style={{ color: INK }} />
      </span>
    );
  }
  if (status === "locked") {
    return <Lock className="h-4 w-4 shrink-0" style={{ color: MUTED }} />;
  }
  if (status === "current") {
    return (
      <span className="relative grid h-5 w-5 shrink-0 place-items-center">
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{ background: BRAND }}
        />
        <PlayCircle className="relative h-4 w-4" style={{ color: INK }} />
      </span>
    );
  }
  // available -> kind icon
  const Icon =
    kind === "video"
      ? PlayCircle
      : kind === "quiz"
        ? Star
        : kind === "assignment"
          ? FileText
          : BookOpen;
  return <Icon className="h-4 w-4 shrink-0" style={{ color: MUTED }} />;
}

/* ---------- Sidebar Cards ---------- */

function InstructorCard() {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-[20px] bg-white p-5"
      style={{
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 2px rgba(20,30,50,0.03), 0 4px 14px rgba(20,30,50,0.03)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: BRAND_SOFT }}
        >
          <Users className="h-4 w-4" style={{ color: INK }} />
        </div>
        <h3 className="text-base font-bold" style={{ color: INK }}>
          Your Instructor
        </h3>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div
          className="rounded-full p-[2px]"
          style={{ background: BRAND }}
        >
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face"
            alt="Ashane Perera"
            className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold" style={{ color: INK }}>
            Ashane Perera
          </p>
          <p className="truncate text-xs" style={{ color: MUTED }}>
            AI Engineering Instructor
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed" style={{ color: MUTED }}>
        Guides students through real-world AI workflows, software engineering
        practices, and project-based learning.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { v: "4.9", l: "Rating" },
          { v: "120+", l: "Students" },
          { v: "AI/SE", l: "Domain" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-xl p-2.5 text-center"
            style={{ background: "#F7F9F7" }}
          >
            <p className="text-sm font-bold" style={{ color: INK }}>
              {s.v}
            </p>
            <p className="text-[10px]" style={{ color: MUTED }}>
              {s.l}
            </p>
          </div>
        ))}
      </div>

      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition-transform hover:-translate-y-0.5"
        style={{ background: INK_2, color: "#fff" }}
      >
        View Profile <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

function LearningStreakCard({
  weekly,
  currentStreakDays,
  weeklyCompleted,
  learningMomentum,
}: {
  weekly: { day: string; v: number }[];
  currentStreakDays: number;
  weeklyCompleted: number;
  learningMomentum: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-[20px] bg-white p-5"
      style={{
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 2px rgba(20,30,50,0.03), 0 4px 14px rgba(20,30,50,0.03)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ background: BRAND_SOFT }}
          >
            <Zap className="h-4 w-4" style={{ color: INK }} />
          </div>
          <h3 className="text-base font-bold" style={{ color: INK }}>
            Learning Streak
          </h3>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
          style={{ background: BRAND, color: INK }}
        >
          {currentStreakDays} Day Streak
        </span>
      </div>

      <p className="mt-3 text-xs" style={{ color: MUTED }}>
        {weeklyCompleted} Lessons Completed This Week
      </p>

      <div className="mt-3 h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: MUTED }}
            />
            <RTooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              contentStyle={{
                background: "#fff",
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                fontSize: 11,
                padding: "6px 8px",
              }}
              labelStyle={{ color: INK_2, fontWeight: 600 }}
              formatter={(v: number) => [`${v} lessons`, ""]}
            />
            <Bar dataKey="v" radius={[6, 6, 6, 6]}>
              {weekly.map((d, i) => (
                <Cell key={i} fill={d.v > 0 ? BRAND : "#EEF1EE"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2.5" style={{ background: "#F7F9F7" }}>
          <p className="text-[10px]" style={{ color: MUTED }}>
            Streak Score
          </p>
          <p className="text-sm font-bold" style={{ color: INK }}>
            {currentStreakDays * weeklyCompleted}
          </p>
        </div>
        <div
          className="group relative rounded-xl p-2.5"
          style={{ background: BRAND_SOFT }}
          title="Calculated using streak days, total completed lessons, and recent weekly activity."
        >
          <p className="text-[10px]" style={{ color: INK_2 }}>
            Learning Momentum
          </p>
          <p className="text-sm font-bold" style={{ color: INK }}>
            {learningMomentum}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendedCourseCard() {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="overflow-hidden rounded-[20px] bg-white"
      style={{
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 2px rgba(20,30,50,0.03), 0 4px 14px rgba(20,30,50,0.03)",
      }}
    >
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ background: BRAND_SOFT }}
          >
            <Sparkles className="h-4 w-4" style={{ color: INK }} />
          </div>
          <h3 className="text-base font-bold" style={{ color: INK }}>
            Recommended Next
          </h3>
        </div>
      </div>
      <div className="p-5 pt-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold" style={{ color: INK }}>
            AI Agents & Automation
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: BRAND_SOFT, color: INK }}
          >
            Recommended
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: MUTED }}>
          Build tool-using AI agents and automation workflows.
        </p>
        <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold" style={{ color: MUTED }}>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> 12 Hours
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3" /> 24 Lessons
          </span>
        </div>
      </div>
    </motion.div>
  );
}