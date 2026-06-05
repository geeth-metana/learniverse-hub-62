import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  BookOpen,
  TrendingUp,
  Search,
  MoreVertical,
  Star,
  Heart,
  Sparkles,
} from "@/components/icons";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useViewMode } from "@/hooks/use-view-mode";
import { usePrimeStore, type PrimeCourse } from "@/lib/prime-store";
import { PrimeSettingsMenu } from "@/components/prime/PrimeSettingsMenu";
import { CreatePrimeCourseDialog } from "@/components/prime/CreatePrimeCourseDialog";
import { PrimeBanner } from "@/components/prime/PrimeBanner";
import { PricingDialog } from "@/components/courses/PricingDialog";
import { primePlans } from "@/lib/courses-data";

export const Route = createFileRoute("/prime")({
  head: () => ({
    meta: [
      { title: "Metana Prime — Metana Platform" },
      {
        name: "description",
        content: "Premium subscription access to Metana courses, mentorship and resources.",
      },
    ],
  }),
  component: PrimePage,
});

// Deterministic 4.5–4.9 rating so each course shows a stable value.
function ratingFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return (4.5 + (sum % 5) / 10).toFixed(1);
}

function PrimeCourseCard({
  course,
  isAdmin,
  onSelect,
}: {
  course: PrimeCourse;
  isAdmin: boolean;
  onSelect?: () => void;
}) {
  const [fav, setFav] = useState(false);
  const rating = ratingFor(course.id);
  return (
    <article
      onClick={isAdmin ? undefined : onSelect}
      className={`group relative flex h-full flex-col rounded-3xl border border-border bg-card p-3
    transform-gpu transition-all duration-500 ease-out
    hover:z-10 hover:scale-[1.02] hover:shadow-[var(--shadow-soft-hover)]
    ${isAdmin ? "" : "cursor-pointer"
        }`}
    >
      {/* Gradient image */}
      <div
        className="relative h-40 shrink-0 overflow-hidden rounded-2xl"
        style={{ background: course.gradient }}
      >
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-smaller font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {course.category}
        </span>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {isAdmin ? (
            <button
              type="button"
              aria-label="Course options"
              onClick={(e) => e.stopPropagation()}
              className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-[var(--shadow-soft)] backdrop-blur transition-colors hover:bg-background"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Favorite course"
              aria-pressed={fav}
              onClick={(e) => {
                e.stopPropagation();
                setFav((v) => !v);
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-[var(--shadow-soft)] backdrop-blur transition-colors hover:bg-background"
            >
              <Heart className={`h-4 w-4 ${fav ? "fill-primary text-primary" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-2 pt-4">
        {/* Headline row — duration + rating */}
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-baseline gap-1">
            <span className="text-body font-bold text-foreground">{course.hours} Hrs</span>
            <span className="text-small text-muted-foreground">/ course</span>
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 text-small">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{rating}</span>
            <span className="text-muted-foreground">/ 5.0</span>
          </span>
        </div>

        <div className="my-3 border-t border-border" />

        <h3 className="line-clamp-1 text-second-header font-bold leading-snug text-foreground">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-small text-muted-foreground">{course.description}</p>

        {/* Meta row */}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-4 text-small text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> {course.lessons} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> {course.level}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> {course.category}
          </span>
        </div>
      </div>
    </article>
  );
}

// Insert the AI showcase band after this many course cards (2 rows × 4 columns at xl).
const ROW_BREAK = 8;

// A Coursera-style showcase band: a colored intro panel + a grid of that category's courses.
function PrimeCategoryBand({
  title,
  description,
  courses,
  showSubscribe,
  onSubscribe,
  onSelectCourse,
}: {
  title: string;
  description: string;
  courses: PrimeCourse[];
  showSubscribe: boolean;
  onSubscribe: () => void;
  onSelectCourse: (id: string) => void;
}) {
  return (
    <section
      className="overflow-hidden my-20 rounded-3xl border border-border p-4 sm:p-5 "
      style={{ background: "#fafafaff" }}
    >
      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Intro panel */}
        <div className="flex shrink-0 flex-col justify-center gap-4 p-2 lg:w-[300px] lg:p-4">
          <h3 className="text-2xl font-bold leading-tight text-foreground">{title}</h3>
          <p className="text-small leading-relaxed text-foreground">{description}</p>
          {showSubscribe && (
            <button
              type="button"
              onClick={onSubscribe}
              className="mt-24 w-fit rounded-full bg-primary px-6 py-4 text-button-primary font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
            >
              Subscribe Prime
            </button>
          )}
        </div>

        {/* Course cards — same size as the main grid cards */}
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <PrimeCourseCard
              key={course.id}
              course={course}
              isAdmin={false}
              onSelect={() => onSelectCourse(course.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PrimePage() {
  const viewMode = useViewMode();
  const isAdmin = viewMode === "admin";
  const navigate = useNavigate();
  const { courses } = usePrimeStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pricingFor, setPricingFor] = useState<string | null>(null);
  // true = opened from a single course card (show buy card); false = opened from Subscribe Prime.
  const [pricingSingle, setPricingSingle] = useState(false);

  const filtered = useMemo(() => {
    const primeCourses = courses.filter((c) => c.inPrime);
    const q = query.trim().toLowerCase();
    if (!q) return primeCourses;
    return primeCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [courses, query]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar defaultCollapsed />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {/* Hero — students get the Prime banner, admins get a plain title */}
            {isAdmin ? (
              <h1 className="mb-8 text-primary-header font-bold text-foreground">Metana Prime</h1>
            ) : (
              <PrimeBanner
                onSubscribe={() => {
                  setPricingSingle(false);
                  setPricingFor("metana-prime");
                }}
              />
            )}

            {/* Courses section header — title + description with search on the same row */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-primary-header font-bold text-foreground">Prime Courses</h2>
                {/* <p className="mt-1 max-w-xl text-body text-muted-foreground">
                  Explore premium learning paths, individual courses, and subscription options built
                  for continuous career growth.
                </p> */}
              </div>

              <div className="flex items-center gap-3">
                {isAdmin && <PrimeSettingsMenu />}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search courses..."
                    className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-body text-foreground shadow-[var(--shadow-soft)] transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring lg:w-72"
                  />
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-button-primary font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" /> Create Prime Course
                  </button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border py-16 text-center text-body text-muted-foreground">
                {courses.length === 0
                  ? "No Prime courses yet."
                  : `No courses match “${query.trim()}”.`}
              </div>
            ) : (
              <>
                {/* First 2 rows (8 cards at xl) — full grid when searching */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {(query.trim() ? filtered : filtered.slice(0, ROW_BREAK)).map((course) => (
                    <PrimeCourseCard
                      key={course.id}
                      course={course}
                      isAdmin={isAdmin}
                      onSelect={() => {
                        setPricingSingle(true);
                        setPricingFor(course.id);
                      }}
                    />
                  ))}
                </div>

                {/* AI showcase band — inserted after the first 2 rows */}
                {!query.trim() &&
                  (() => {
                    const aiCourses = courses.filter((c) => c.inPrime && c.category === "AI");
                    if (aiCourses.length === 0) return null;
                    return (
                      <div className="mt-10">
                        <PrimeCategoryBand
                          title="Artificial Intelligence Courses"
                          description="Explore multiple career pathways with entry-level AI programs built for continuous growth."
                          courses={aiCourses}
                          showSubscribe={!isAdmin}
                          onSubscribe={() => {
                            setPricingSingle(false);
                            setPricingFor("metana-prime");
                          }}
                          onSelectCourse={(id) => {
                            setPricingSingle(true);
                            setPricingFor(id);
                          }}
                        />
                      </div>
                    );
                  })()}

                {/* Remaining courses below the band */}
                {!query.trim() && filtered.length > ROW_BREAK && (
                  <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {filtered.slice(ROW_BREAK).map((course) => (
                      <PrimeCourseCard
                        key={course.id}
                        course={course}
                        isAdmin={isAdmin}
                        onSelect={() => {
                          setPricingSingle(true);
                          setPricingFor(course.id);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {isAdmin && <CreatePrimeCourseDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {/* Students pick a plan, then continue to the pre-filled checkout. */}
      <PricingDialog
        open={pricingFor !== null}
        onOpenChange={(open) => !open && setPricingFor(null)}
        courseId={pricingFor}
        plansData={primePlans}
        onChoose={(plan) => {
          if (pricingFor) {
            const courseId = pricingFor;
            setPricingFor(null);
            navigate({ to: "/checkout/$courseId", params: { courseId }, search: { plan } });
          }
        }}
        onBuyCourse={
          pricingSingle
            ? () => {
              if (pricingFor) {
                const courseId = pricingFor;
                setPricingFor(null);
                navigate({ to: "/checkout/$courseId", params: { courseId } });
              }
            }
            : undefined
        }
      />
    </div>
  );
}
