import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  ArrowLeft,
  Package,
  BookOpen,
  Check,
  Calendar,
  Users,
  ArrowRight,
  Layers,
  FileText,
  PlayCircle,
  Lock,
  Unlock,
  CircleDashed,
  FolderOpen,
  Sparkles,
  Trophy,
  Clock,
  GraduationCap,
  Award,
} from "lucide-react";
import {
  getProductBySlug,
  type Product,
  type ProductItem,
} from "@/lib/products-store";
import { getCourse } from "@/lib/courses-data";
import { courseDetails, fallbackDetail } from "./courses.$courseId";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Lesson = { title: string; duration: string };
type Unit = { title: string; lessons: Lesson[] };

function buildUnits(moduleTitle: string, moduleIdx: number): Unit[] {
  const base = moduleTitle.replace(/^Module\s*\d+\s*[—-]\s*/i, "").trim() || "Topic";
  const unitsPerModule = 3;
  return Array.from({ length: unitsPerModule }, (_, u) => {
    const lessonCount = 3 + ((moduleIdx + u) % 2);
    return {
      title: `Unit ${u + 1} — ${base} ${["essentials", "in practice", "deep dive"][u] ?? "more"}`,
      lessons: Array.from({ length: lessonCount }, (_, l) => ({
        title: `Lesson ${u + 1}.${l + 1} — ${base} ${["intro", "walkthrough", "exercise", "review", "challenge"][l] ?? "extra"}`,
        duration: `${8 + ((l + u + moduleIdx) % 5) * 3} min`,
      })),
    };
  });
}

export const Route = createFileRoute("/programs/$programSlug")({
  head: () => ({
    meta: [
      { title: "Program — Metana Platform" },
      { name: "description", content: "Your learning program overview." },
    ],
  }),
  component: ProgramPage,
});

const instructors = [
  {
    name: "Alex Morgan",
    role: "Lead Instructor",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Priya Sharma",
    role: "Course Director",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "James Chen",
    role: "Technical Mentor",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face",
  },
];

function ProgramPage() {
  const { programSlug } = useParams({ from: "/programs/$programSlug" });
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | undefined>(() =>
    getProductBySlug(programSlug),
  );
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);

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

  if (!product) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="mx-auto max-w-[800px] rounded-3xl border border-dashed border-border py-20 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-body text-muted-foreground">Program not found.</p>
              <button
                onClick={() => navigate({ to: "/courses" })}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-button-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Courses
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const courses = product.courseIds.map(getCourse).filter(Boolean) as NonNullable<
    ReturnType<typeof getCourse>
  >[];
  const accessibility = product.accessibility ?? "free";
  const optionalIds = product.optionalIds ?? [];
  const items: ProductItem[] =
    product.items && product.items.length > 0
      ? product.items
      : product.courseIds.map((cid, i) => ({ kind: "course", id: `c-${i}`, courseId: cid }));
  const groupCount = items.filter((it) => it.kind === "group").length;
  const created = new Date(product.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Stable pseudo per-course progress for demo realism.
  const hashId = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const courseProgress: Record<string, number> = {};
  courses.forEach((c, i) => {
    const seeded: Record<string, number> = { fullstack: 72, solidity: 18, rust: 45, "ai-engineering": 12, zk: 0, data: 0 };
    courseProgress[c.id] = seeded[c.id] ?? (i === 0 ? 60 : i === 1 ? 25 : 0);
  });
  const overallProgress = courses.length
    ? Math.round(courses.reduce((acc, c) => acc + (courseProgress[c.id] ?? 0), 0) / courses.length)
    : 0;
  const totalLessons = courses.reduce((acc, c) => {
    const d = courseDetails[c.id] ?? fallbackDetail;
    return acc + (d.modules?.length ?? 0) * 9;
  }, 0);
  const nextCourse = courses.find((c) => (courseProgress[c.id] ?? 0) > 0 && (courseProgress[c.id] ?? 0) < 100) ?? courses[0];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => navigate({ to: "/courses" })}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition-colors"
                aria-label="Back to courses"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <p className="text-small text-muted-foreground">Programs / {product.title}</p>
            </div>

            <section
              className="relative mb-6 overflow-hidden rounded-[28px] p-8 lg:p-10"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.96 0.05 260), oklch(0.93 0.09 295) 55%, oklch(0.92 0.12 330))",
              }}
            >
              {/* decorative glows */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
                style={{ background: "oklch(0.88 0.18 330)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 bottom-[-40%] h-72 w-72 rounded-full opacity-50 blur-3xl"
                style={{ background: "var(--brand)" }}
              />
              <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
                <div className="min-w-0">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 text-smaller font-semibold uppercase tracking-wide text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-[oklch(0.65_0.2_320)]" /> Program
                  </div>
                  <h1 className="text-primary-header font-bold leading-[1.05] tracking-tight text-foreground">
                    {product.title}
                  </h1>
                  <p className="mt-3 max-w-xl text-body leading-relaxed text-foreground/75">
                    {product.description || "No description"}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3.5 py-1.5 text-small font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> {courses.length} course
                      {courses.length === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3.5 py-1.5 text-small font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {totalLessons}+ lessons
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3.5 py-1.5 text-small font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                      {accessibility === "linear" ? (
                        <>
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Linear path
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5 text-muted-foreground" /> Free-form
                        </>
                      )}
                    </span>
                    {groupCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3.5 py-1.5 text-small font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> {groupCount} group{groupCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  {/* Overall progress + CTA */}
                  <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-background/85 p-5 shadow-[var(--shadow-soft)] backdrop-blur sm:flex-row sm:items-center sm:gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-smaller font-semibold uppercase tracking-wide text-muted-foreground">
                          Overall progress
                        </p>
                        <p className="text-small font-bold tabular-nums text-foreground">{overallProgress}%</p>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${overallProgress}%`, backgroundColor: "#D0FC03" }}
                        />
                      </div>
                      {nextCourse && (
                        <p className="mt-2 truncate text-smaller text-muted-foreground">
                          {(courseProgress[nextCourse.id] ?? 0) > 0 ? "Continue" : "Start"}{" "}
                          <span className="font-semibold text-foreground">{nextCourse.title}</span>
                        </p>
                      )}
                    </div>
                    {nextCourse && (
                      <button
                        onClick={() => setOpenCourseId(nextCourse.id)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-button-primary font-semibold text-background shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-hover)]"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {(courseProgress[nextCourse.id] ?? 0) > 0 ? "Continue learning" : "Start learning"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-[320px]">
                  {product.image ? (
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-[0_30px_60px_-20px_oklch(0.3_0.1_300_/_0.35)] ring-1 ring-background/70">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-1/3"
                        style={{ background: "linear-gradient(to top, oklch(0.2 0.05 280 / 0.55), transparent)" }}
                      />
                      <div className="absolute left-4 right-4 bottom-4 flex items-center gap-2 rounded-2xl bg-background/90 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
                        <Trophy className="h-4 w-4 text-[oklch(0.78_0.15_75)]" />
                        <p className="text-smaller font-semibold text-foreground">
                          Certificate on completion
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid aspect-[4/5] w-full place-items-center rounded-3xl bg-background/80 text-foreground shadow-[var(--shadow-soft)]">
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Stats strip */}
            <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { icon: GraduationCap, label: "Courses", value: `${courses.length}` },
                { icon: FileText, label: "Lessons", value: `${totalLessons}+` },
                { icon: Clock, label: "Time invested", value: `${Math.round((overallProgress / 100) * Math.max(20, courses.length * 40))}h` },
                { icon: Award, label: "Started", value: created },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                    <s.icon className="h-4.5 w-4.5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-smaller uppercase tracking-wide text-muted-foreground">{s.label}</p>
                    <p className="truncate text-small font-bold text-foreground">{s.value}</p>
                  </div>
                </div>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-second-header font-semibold text-foreground">
                      Course path
                    </h2>
                    <p className="mt-1 text-small text-muted-foreground">
                      {courses.length === 0
                        ? "No courses in this program yet."
                        : accessibility === "linear"
                          ? "Complete each course to unlock the next. Groups unlock together."
                          : "You can access any course at any time."}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-smaller font-semibold text-foreground">
                    {accessibility === "linear" ? (
                      <>
                        <Lock className="h-3.5 w-3.5" /> Linear
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5" /> Free-form
                      </>
                    )}
                  </span>
                </div>

                {courses.length > 0 && (() => {
                  let pos = 0;
                  const renderCourseItem = (
                    courseId: string,
                    key: string,
                    inGroup = false,
                  ) => {
                    const c = getCourse(courseId);
                    if (!c) return null;
                    pos += 1;
                    const idx = pos;
                    const isOptional = optionalIds.includes(c.id);
                    const detail = courseDetails[c.id] ?? fallbackDetail;
                    const prog = courseProgress[c.id] ?? 0;
                    const status: "completed" | "in-progress" | "locked" | "available" =
                      prog >= 100
                        ? "completed"
                        : prog > 0
                          ? "in-progress"
                          : accessibility === "linear" && idx > 1
                            ? "locked"
                            : "available";
                    const lessonCount = (detail.modules?.length ?? 0) * 9;
                    return (
                      <AccordionItem
                        key={key}
                        value={key}
                        className={
                          inGroup
                            ? "overflow-hidden bg-transparent border-b-0"
                            : "group overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)]"
                        }
                      >
                        <AccordionTrigger className="px-4 py-4 hover:no-underline">
                          <div className="flex w-full items-center gap-4 text-left">
                            <div className="relative shrink-0">
                              <div
                                className="grid h-14 w-14 place-items-center rounded-2xl text-foreground shadow-[var(--shadow-soft)] transition-transform duration-300 group-hover:scale-[1.04]"
                                style={{ background: c.gradient }}
                              >
                                {status === "completed" ? (
                                  <Check className="h-6 w-6 text-foreground" strokeWidth={3} />
                                ) : status === "locked" ? (
                                  <Lock className="h-5 w-5 text-foreground/70" />
                                ) : (
                                  <BookOpen className="h-5 w-5" />
                                )}
                              </div>
                              <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-background text-smaller font-bold text-foreground shadow-[var(--shadow-soft)] ring-1 ring-border">
                                {idx}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-body font-bold text-foreground">
                                  {c.title}
                                </p>
                                {status === "completed" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-smaller font-bold text-brand-foreground">
                                    <Check className="h-3 w-3" strokeWidth={3} /> Completed
                                  </span>
                                )}
                                {status === "in-progress" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.05_240)] px-2 py-0.5 text-smaller font-bold text-foreground">
                                    <PlayCircle className="h-3 w-3" /> In progress
                                  </span>
                                )}
                                {status === "locked" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-smaller font-bold text-muted-foreground">
                                    <Lock className="h-3 w-3" /> Locked
                                  </span>
                                )}
                                {isOptional && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.05_240)] px-2 py-0.5 text-smaller font-semibold text-foreground">
                                    <CircleDashed className="h-3 w-3" /> Optional
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-small text-muted-foreground">
                                {c.description}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-smaller font-semibold text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {c.meta}
                                </span>
                                <span className="text-border">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> {lessonCount} lessons
                                </span>
                              </div>
                              {status !== "locked" && (
                                <div className="mt-3 flex items-center gap-3">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full transition-[width] duration-500"
                                      style={{ width: `${prog}%`, backgroundColor: "#D0FC03" }}
                                    />
                                  </div>
                                  <span className="shrink-0 text-smaller font-bold tabular-nums text-foreground">{prog}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="border-t border-border bg-muted/30 px-4 pb-4 pt-3">
                          <CourseModulesAccordion modules={detail.modules} />
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => setOpenCourseId(c.id)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-smaller font-semibold text-background transition-transform hover:-translate-y-0.5"
                            >
                              Open course <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  };

                  return (
                    <div className="mt-5 space-y-3">
                      {items.map((it) => {
                        if (it.kind === "course") {
                          return (
                            <Accordion key={it.id} type="single" collapsible>
                              {renderCourseItem(it.courseId, it.id)}
                            </Accordion>
                          );
                        }
                        return (
                          <div
                            key={it.id}
                            className="rounded-2xl border border-dashed border-border bg-muted/30 p-3"
                          >
                            <div className="mb-2 flex items-center gap-2 px-1">
                              <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              <p className="text-small font-semibold text-foreground">
                                {it.title}
                              </p>
                              <span className="rounded-full bg-background px-2 py-0.5 text-smaller font-semibold text-muted-foreground">
                                {it.courseIds.length} course
                                {it.courseIds.length === 1 ? "" : "s"} · unlock together
                              </span>
                            </div>
                            {it.courseIds.length > 0 && (
                              <Accordion
                                type="single"
                                collapsible
                                className="divide-y divide-border rounded-xl border border-border bg-background"
                              >
                                {it.courseIds.map((cid) =>
                                  renderCourseItem(cid, `${it.id}-${cid}`, true),
                                )}
                              </Accordion>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>

              <aside className="lg:sticky lg:top-6 self-start space-y-4">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[oklch(0.95_0.05_280)]">
                        <Users className="h-4 w-4 text-[oklch(0.5_0.15_280)]" />
                      </div>
                      <h3 className="text-second-header font-semibold text-foreground">
                        Instructors
                      </h3>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-smaller font-semibold text-muted-foreground">
                      {instructors.length}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {instructors.map((inst, idx) => (
                      <div
                        key={idx}
                        className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)]"
                      >
                        <div className="relative shrink-0">
                          <div
                            className="rounded-full p-[2px]"
                            style={{ background: "var(--gradient-brand)" }}
                          >
                            <img
                              src={inst.image}
                              alt={inst.name}
                              className="h-11 w-11 rounded-full object-cover ring-2 ring-background"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-small font-bold text-foreground">
                            {inst.name}
                          </p>
                          <p className="truncate text-smaller text-muted-foreground">
                            {inst.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Up next card */}
                {nextCourse && (
                  <div
                    className="relative overflow-hidden rounded-3xl border border-border p-6 shadow-[var(--shadow-soft)]"
                    style={{ background: "linear-gradient(135deg, oklch(0.97 0.02 260), oklch(0.94 0.05 280))" }}
                  >
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-foreground" />
                      <h3 className="text-small font-bold uppercase tracking-wide text-foreground">Up next</h3>
                    </div>
                    <p className="mt-3 text-body font-bold text-foreground">{nextCourse.title}</p>
                    <p className="mt-1 text-smaller text-muted-foreground line-clamp-2">{nextCourse.description}</p>
                    <button
                      onClick={() => setOpenCourseId(nextCourse.id)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-small font-semibold text-background transition-transform hover:-translate-y-0.5"
                    >
                      {(courseProgress[nextCourse.id] ?? 0) > 0 ? "Continue" : "Start"} course
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={!!openCourseId} onOpenChange={(o) => !o && setOpenCourseId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {openCourseId && (() => {
            const c = getCourse(openCourseId);
            if (!c) return null;
            const detail = courseDetails[c.id] ?? fallbackDetail;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-foreground"
                      style={{ background: c.gradient }}
                    >
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <DialogTitle>{c.title}</DialogTitle>
                      <DialogDescription>{c.description}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="mt-4">
                  <CourseModulesAccordion modules={detail.modules} />
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourseModulesAccordion({
  modules,
}: {
  modules: { title: string; description: string; duration: string }[];
}) {
  if (!modules?.length) {
    return (
      <p className="text-small text-muted-foreground">No modules defined for this course yet.</p>
    );
  }
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {modules.map((m, mi) => {
        const units = buildUnits(m.title, mi);
        return (
          <AccordionItem
            key={mi}
            value={`m-${mi}`}
            className="overflow-hidden rounded-xl border border-border bg-background"
          >
            <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
              <div className="flex w-full items-center gap-3 text-left">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted">
                  <Layers className="h-4 w-4 text-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-semibold text-foreground">{m.title}</p>
                  <p className="truncate text-smaller text-muted-foreground">
                    {units.length} units · {m.duration}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-border bg-muted/20 px-3 pb-3 pt-2">
              <Accordion type="single" collapsible className="space-y-1.5">
                {units.map((u, ui) => (
                  <AccordionItem
                    key={ui}
                    value={`u-${mi}-${ui}`}
                    className="overflow-hidden rounded-lg border border-border bg-background"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex w-full items-center gap-2.5 text-left">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <p className="truncate text-small font-semibold text-foreground">
                          {u.title}
                        </p>
                        <span className="ml-auto text-small text-muted-foreground">
                          {u.lessons.length} lessons
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border px-3 pb-2 pt-1.5">
                      <ul className="space-y-1">
                        {u.lessons.map((l, li) => (
                          <li
                            key={li}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-small text-foreground hover:bg-muted/60"
                          >
                            <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">{l.title}</span>
                            <span className="shrink-0 text-muted-foreground">{l.duration}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
