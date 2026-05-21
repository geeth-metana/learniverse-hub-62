import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  ArrowLeft,
  Package,
  BookOpen,
  Flag,
  Check,
  Calendar,
  CalendarDays,
  Users,
  ArrowRight,
  Layers,
  FileText,
  PlayCircle,
  ChevronDown,
  Lock,
  Unlock,
  CircleDashed,
  FolderOpen,
  Settings as SettingsIcon,
  Pencil,
  Ban,
  Trash2,
} from "lucide-react";
import { getProduct, updateProduct, deleteProduct, type Product, type ProductItem } from "@/lib/products-store";
import { getCourse } from "@/lib/courses-data";
import { useViewMode } from "@/hooks/use-view-mode";
import { courseDetails, fallbackDetail } from "./courses.$courseId";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
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


export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [
      { title: "Product — Metana Platform" },
      { name: "description", content: "View the courses and prerequisites bundled in this product." },
    ],
  }),
  component: ViewProductPage,
});

function ViewProductPage() {
  const { productId } = useParams({ from: "/products/$productId" });
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | undefined>(() => getProduct(productId));
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<'cohorts' | 'instructors' | 'settings' | null>(null);
  const viewMode = useViewMode();
  const isAdmin = viewMode === 'admin';

  useEffect(() => {
    setProduct(getProduct(productId));
    const sync = () => setProduct(getProduct(productId));
    window.addEventListener("metana:products-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("metana:products-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [productId]);

  if (!product) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="mx-auto max-w-[800px] rounded-3xl border border-dashed border-border py-20 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-body text-muted-foreground">Product not found.</p>
              <button
                onClick={() => navigate({ to: "/products" })}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-button-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Products
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
  const prereq = product.prerequisiteId ? getCourse(product.prerequisiteId) : null;
  const accessibility = product.accessibility ?? "free";
  const optionalIds = product.optionalIds ?? [];
  const items: ProductItem[] =
    product.items && product.items.length > 0
      ? product.items
      : product.courseIds.map((cid, i) => ({ kind: "course", id: `c-${i}`, courseId: cid }));
  const groupCount = items.filter((it) => it.kind === "group").length;
  const optionalCount = optionalIds.length;
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
                onClick={() => navigate({ to: "/products" })}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition-colors"
                aria-label="Back to products"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <p className="text-small text-muted-foreground">Products / {product.title}</p>
            </div>

            {/* Hero */}
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
                    <Package className="h-3.5 w-3.5" /> Product
                  </div>
                  <h1 className="text-primary-header font-bold leading-tight text-foreground">
                    {product.title}
                  </h1>
                  <p className="mt-3 text-body leading-relaxed text-foreground/80">
                    {product.description || "No description"}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {product.published && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-small font-semibold text-brand-foreground">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} /> Published
                      </span>
                    )}
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
              {/* Courses list */}
              <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-second-header font-semibold text-foreground">
                      Course path
                    </h2>
                    <p className="mt-1 text-small text-muted-foreground">
                      {courses.length === 0
                        ? "No courses in this product yet."
                        : accessibility === "linear"
                          ? "Complete each course to unlock the next. Groups unlock together."
                          : "Learners can access any course at any time."}
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

              {/* Sidebar summary */}
              <aside className="lg:sticky lg:top-6 self-start space-y-4">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <h3 className="text-second-header font-semibold text-foreground">Overview</h3>
                  <dl className="mt-4 space-y-3 text-small">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Courses</dt>
                      <dd className="font-semibold text-foreground">{courses.length}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Access</dt>
                      <dd className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                        {accessibility === "linear" ? (
                          <>
                            <Lock className="h-3.5 w-3.5" /> Linear
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3.5 w-3.5" /> Free-form
                          </>
                        )}
                      </dd>
                    </div>
                    {groupCount > 0 && (
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Groups</dt>
                        <dd className="font-semibold text-foreground">{groupCount}</dd>
                      </div>
                    )}
                    {optionalCount > 0 && (
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Optional</dt>
                        <dd className="font-semibold text-foreground">{optionalCount}</dd>
                      </div>
                    )}
                    {prereq && (
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Prerequisite</dt>
                        <dd className="font-semibold text-foreground text-right">{prereq.title}</dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="font-semibold text-foreground">
                        {product.published ? "Published" : "Draft"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd className="font-semibold text-foreground">{created}</dd>
                    </div>
                  </dl>
                </div>

                {(() => {
                  const dummyPricing = {
                    upfront: { enabled: true, totalPrice: 4800, discountPct: 15 },
                    installment: {
                      enabled: true,
                      deposit: 500,
                      fullPrice: 5400,
                      plans: [
                        { id: "p6", months: 6 },
                        { id: "p12", months: 12 },
                        { id: "p24", months: 24 },
                      ],
                    },
                  };
                  const pricing =
                    product.pricing &&
                    (product.pricing.upfront?.enabled || product.pricing.installment?.enabled)
                      ? product.pricing
                      : dummyPricing;
                  return (
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                      <h3 className="text-second-header font-semibold text-foreground">Pricing</h3>
                      <div className="mt-4 space-y-4">
                        {pricing.upfront?.enabled && (() => {
                          const u = pricing.upfront!;
                          const discount = Math.max(0, (u.totalPrice * u.discountPct) / 100);
                          const final = Math.max(0, u.totalPrice - discount);
                          return (
                            <div className="rounded-2xl border border-border bg-background p-4">
                              <p className="text-smaller font-semibold uppercase tracking-wide text-muted-foreground">
                                Upfront
                              </p>
                              <div className="mt-1 flex items-center justify-between flex-wrap">
                                <span className="text-second-header font-bold text-foreground">
                                  ${final.toLocaleString()}
                                </span>
                                {u.discountPct > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-smaller text-muted-foreground line-through">
                                      ${u.totalPrice.toLocaleString()}
                                    </span>
                                    <span className="text-smaller font-bold text-foreground">
                                      {u.discountPct}% off
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                        {pricing.installment?.enabled && (() => {
                          const inst = pricing.installment!;
                          const remaining = Math.max(0, inst.fullPrice - inst.deposit);
                          return (
                            <div className="rounded-2xl border border-border bg-background p-4">
                              <p className="text-smaller font-semibold uppercase tracking-wide text-muted-foreground">
                                Installments
                              </p>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-second-header font-bold text-foreground">
                                  ${inst.fullPrice.toLocaleString()}
                                </span>
                                <span className="text-body text-foreground">
                                  <span className="font-bold">${inst.deposit.toLocaleString()}</span> deposit
                                </span>
                              </div>
                              {inst.plans.length > 0 && (
                                <ul className="mt-3 space-y-1.5">
                                  {inst.plans.map((p) => {
                                    const monthly = p.months > 0 ? remaining / p.months : 0;
                                    return (
                                      <li key={p.id} className="flex items-center justify-between text-small">
                                        <span className="text-muted-foreground">{p.months} months</span>
                                        <span className="font-semibold text-foreground">
                                          ${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {prereq && !product.items && (
                  <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-[oklch(0.65_0.18_60)]" />
                      <h3 className="text-second-header font-semibold text-foreground">
                        Prerequisite
                      </h3>
                    </div>
                    <div className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left">
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-foreground"
                        style={{ background: prereq.gradient }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-small font-semibold text-foreground">
                          {prereq.title}
                        </p>
                        <p className="truncate text-smaller text-muted-foreground">{prereq.meta}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Cohorts */}
                <Collapsible
                  open={expandedCard === 'cohorts'}
                  onOpenChange={(open) => setExpandedCard(open ? 'cohorts' : null)}
                  className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[oklch(0.65_0.18_200)]" />
                      <h3 className="text-second-header font-semibold text-foreground">
                        Upcoming Cohorts
                      </h3>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expandedCard === 'cohorts' ? 'rotate-180' : ''}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <ul className="mt-4 space-y-2">
                      {(() => {
                        const dates: string[] = [];
                        const base = new Date();
                        for (let i = 1; i <= 3; i++) {
                          const d = new Date(base);
                          d.setDate(base.getDate() + i * 14);
                          dates.push(
                            d.toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          );
                        }
                        return dates.map((date, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-small text-foreground"
                          >
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{date}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>

                {/* Instructors */}
                <Collapsible
                  open={expandedCard === 'instructors'}
                  onOpenChange={(open) => setExpandedCard(open ? 'instructors' : null)}
                  className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[oklch(0.65_0.18_280)]" />
                      <h3 className="text-second-header font-semibold text-foreground">
                        Instructors
                      </h3>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expandedCard === 'instructors' ? 'rotate-180' : ''}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="mt-4 space-y-3">
                      {[
                        {
                          name: 'Alex Morgan',
                          role: 'Lead Instructor',
                          image:
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
                        },
                        {
                          name: 'Priya Sharma',
                          role: 'Course Director',
                          image:
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
                        },
                        {
                          name: 'James Chen',
                          role: 'Technical Mentor',
                          image:
                            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
                        },
                      ].map((inst, idx) => (
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
                  </CollapsibleContent>
                </Collapsible>

                {/* Settings (admin only) */}
                {isAdmin && (
                  <Collapsible
                    open={expandedCard === 'settings'}
                    onOpenChange={(open) => setExpandedCard(open ? 'settings' : null)}
                    className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
                  >
                    <CollapsibleTrigger className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4 text-[oklch(0.6_0.05_260)]" />
                        <h3 className="text-second-header font-semibold text-foreground">
                          Settings
                        </h3>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expandedCard === 'settings' ? 'rotate-180' : ''}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => navigate({ to: "/products/new" })}
                          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5 text-left text-small font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                          Edit product
                        </button>
                        <button
                          onClick={() => {
                            const updated = updateProduct(product.id, { published: !product.published });
                            if (updated) setProduct(updated);
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl border border-destructive/40 bg-background px-4 py-2.5 text-left text-small font-semibold text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Ban className="h-4 w-4 text-destructive" />
                          {product.published ? 'Disable product' : 'Enable product'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${product.title}"? This cannot be undone.`)) {
                              deleteProduct(product.id);
                              navigate({ to: "/products" });
                            }
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl border border-destructive bg-destructive px-4 py-2.5 text-left text-small font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
                        >
                          <Trash2 className="h-4 w-4 text-destructive-foreground" />
                          Delete product
                        </button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
