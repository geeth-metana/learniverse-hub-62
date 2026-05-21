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
              className="relative mb-6 overflow-hidden rounded-3xl p-8 lg:p-10"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.94 0.08 280), oklch(0.9 0.12 320))",
              }}
            >
              <div className="flex flex-wrap items-stretch justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-small font-semibold text-foreground shadow-[var(--shadow-soft)]">
                    <Package className="h-3.5 w-3.5" /> Program
                  </div>
                  <h1 className="text-primary-header font-bold leading-tight text-foreground">
                    {product.title}
                  </h1>
                  <p className="mt-3 text-body leading-relaxed text-foreground/80">
                    {product.description || "No description"}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3.5 py-2 text-small font-semibold text-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> {courses.length} course
                      {courses.length === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3.5 py-2 text-small font-semibold text-foreground">
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
                    {groupCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3.5 py-2 text-small font-semibold text-foreground">
                        <FolderOpen className="h-3.5 w-3.5" /> {groupCount} group
                        {groupCount === 1 ? "" : "s"}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3.5 py-2 text-small font-semibold text-foreground">
                      <Calendar className="h-3.5 w-3.5" /> Created {created}
                    </span>
                  </div>
                </div>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-56 shrink-0 rounded-2xl object-cover shadow-[var(--shadow-soft)]"
                  />
                ) : (
                  <div className="grid h-full w-32 shrink-0 place-items-center rounded-3xl bg-background/80 text-foreground shadow-[var(--shadow-soft)]">
                    <Package className="h-9 w-9" />
                  </div>
                )}
              </div>
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
                    return (
                      <AccordionItem
                        key={key}
                        value={key}
                        className={
                          inGroup
                            ? "overflow-hidden bg-transparent border-b-0"
                            : "overflow-hidden rounded-2xl border border-border bg-background"
                        }
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex w-full items-center gap-4 text-left">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-small font-semibold text-foreground">
                              {idx}
                            </span>
                            <div
                              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-foreground"
                              style={{ background: c.gradient }}
                            >
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-body font-semibold text-foreground">
                                  {c.title}
                                </p>
                                {isOptional && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.05_240)] px-2 py-0.5 text-smaller font-semibold text-foreground">
                                    <CircleDashed className="h-3 w-3" /> Optional
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-small text-muted-foreground">
                                {c.description}
                              </p>
                              <p className="mt-1 text-smaller font-semibold text-foreground">
                                {c.meta}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="border-t border-border bg-muted/30 px-4 pb-4 pt-3">
                          <CourseModulesAccordion modules={detail.modules} />
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => setOpenCourseId(c.id)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-smaller font-semibold text-foreground transition-colors hover:bg-muted"
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
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[oklch(0.65_0.18_280)]" />
                    <h3 className="text-second-header font-semibold text-foreground">
                      Instructors
                    </h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {instructors.map((inst, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                      >
                        <img
                          src={inst.image}
                          alt={inst.name}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-small font-semibold text-foreground">
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
