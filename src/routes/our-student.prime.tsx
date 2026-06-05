import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, TrendingUp, Search, Star, Heart, Sparkles } from "@/components/icons";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { usePrimeStore, type PrimeCourse } from "@/lib/prime-store";
import { PrimeBanner } from "@/components/prime/PrimeBanner";

export const Route = createFileRoute("/our-student/prime")({
  head: () => ({
    meta: [
      { title: "Metana Prime — Our Student" },
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
  isFav,
  onToggleFav,
}: {
  course: PrimeCourse;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const rating = ratingFor(course.id);
  const started = course.progress > 0;
  return (
    <article className="group relative flex h-full flex-col rounded-3xl border border-border bg-card p-3 transition-[transform,box-shadow] duration-300 ease-out hover:z-10 hover:scale-[1.1] hover:shadow-[var(--shadow-soft-hover)]">
      {/* Gradient image */}
      <div
        className="relative aspect-[16/10] shrink-0 overflow-hidden rounded-2xl"
        style={{ background: course.gradient }}
      >
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-smaller font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {course.category}
        </span>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="Favorite course"
            aria-pressed={isFav}
            onClick={onToggleFav}
            className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-[var(--shadow-soft)] backdrop-blur transition-colors hover:bg-background"
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-primary text-primary" : ""}`} />
          </button>
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

        {/* Footer — meta + progress, pinned to the bottom */}
        <div className="mt-auto space-y-3 pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-small text-muted-foreground">
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

          {started && (
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(course.progress, 100)}%` }}
                />
              </div>
              <span className="shrink-0 text-small font-semibold text-foreground">
                {course.progress}%
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CourseGrid({
  courses,
  favIds,
  onToggleFav,
}: {
  courses: PrimeCourse[];
  favIds: Set<string>;
  onToggleFav: (id: string) => void;
}) {
  return (
    <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
      {courses.map((course) => (
        <PrimeCourseCard
          key={course.id}
          course={course}
          isFav={favIds.has(course.id)}
          onToggleFav={() => onToggleFav(course.id)}
        />
      ))}
    </div>
  );
}

function PrimePage() {
  const { courses } = usePrimeStore();
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Close the search dropdown when clicking outside of it.
  useEffect(() => {
    if (!searchOpen) return;
    function onDown(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [searchOpen]);

  // Live autocomplete — matches shown once the first letter is typed.
  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return courses.filter(
      (c) =>
        c.inPrime &&
        (c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)),
    );
  }, [courses, query]);

  function toggleFav(id: string) {
    setFavIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (!c.inPrime) return false;
      if (favOnly && !favIds.has(c.id)) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });
  }, [courses, query, favOnly, favIds]);

  // Started courses are highlighted on top and also remain in the full list below.
  const started = filtered.filter((c) => c.progress > 0);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar defaultCollapsed />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {/* Subscribed student — banner without the subscribe CTA */}
            <PrimeBanner />

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
                <button
                  type="button"
                  aria-label="Show favorites"
                  aria-pressed={favOnly}
                  onClick={() => setFavOnly((v) => !v)}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${
                    favOnly
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${favOnly ? "fill-primary" : ""}`} />
                </button>
                <div ref={searchWrapRef} className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchOpen(e.target.value.trim().length > 0);
                    }}
                    onFocus={() => setSearchOpen(query.trim().length > 0)}
                    placeholder="Search courses..."
                    className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-body text-foreground transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring lg:w-72"
                  />

                  {searchOpen && query.trim().length > 0 && (
                    <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-hidden overflow-y-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft-hover)]">
                      {searchMatches.length === 0 ? (
                        <p className="px-4 py-6 text-center text-small text-muted-foreground">
                          No courses match your search
                        </p>
                      ) : (
                        <div className="divide-y divide-border">
                          {searchMatches.map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => {
                                setQuery(course.title);
                                setSearchOpen(false);
                              }}
                              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
                            >
                              <span className="truncate text-small font-semibold text-foreground">
                                {course.title}
                              </span>
                              <span className="shrink-0 text-smaller text-muted-foreground">
                                {course.category}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border py-16 text-center text-body text-muted-foreground">
                {favOnly
                  ? "No favorite courses yet."
                  : courses.length === 0
                    ? "No Prime courses yet."
                    : `No courses match “${query.trim()}”.`}
              </div>
            ) : (
              <div className="space-y-10">
                {/* Upper highlight — started courses (also kept in the full list below) */}
                {started.length > 0 && (
                  <section>
                    <h3 className="mb-4 text-main-header font-bold text-foreground">
                      Continue your learning
                    </h3>
                    <CourseGrid courses={started} favIds={favIds} onToggleFav={toggleFav} />
                  </section>
                )}

                {/* Full list — every Prime course */}
                <section>
                  <h3 className="mb-4 text-main-header font-bold text-foreground">
                    All Prime courses
                  </h3>
                  <CourseGrid courses={filtered} favIds={favIds} onToggleFav={toggleFav} />
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
