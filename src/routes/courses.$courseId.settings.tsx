import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { getCourse } from "@/lib/courses-data";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Tag,
  Users,
  GitBranch,
} from "lucide-react";

export const Route = createFileRoute("/courses/$courseId/settings")({
  head: () => ({ meta: [{ title: "Course Settings — Metana" }] }),
  component: CourseSettingsPage,
});

function Row({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-body font-semibold text-foreground">{title}</p>
          <p className="text-small text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function CourseSettingsPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const course = getCourse(courseId);

  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [published, setPublished] = useState(true);
  const [locked, setLocked] = useState(false);
  const [accessibility, setAccessibility] = useState<"linear" | "free">("linear");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[960px]">
            <button
              onClick={() => navigate({ to: "/courses" })}
              className="mb-5 inline-flex items-center gap-2 text-small font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Learning Journey
            </button>

            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-primary-header font-bold text-foreground">Course Settings</h1>
                <p className="mt-1 text-body text-muted-foreground">
                  {course ? `Manage settings for "${course.title}".` : "Manage course settings."}
                </p>
              </div>
              <Link
                to="/courses/$courseId"
                params={{ courseId }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-small font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <SettingsIcon className="h-4 w-4" /> View course
              </Link>
            </div>

            {/* General */}
            <section className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="mb-2 text-second-header font-bold text-foreground">General</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-small font-semibold text-foreground">
                  Title
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-body font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-small font-semibold text-foreground">
                  Slug
                  <input
                    defaultValue={courseId}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-body font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="sm:col-span-2 flex flex-col gap-1.5 text-small font-semibold text-foreground">
                  Description
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-body font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
            </section>

            {/* Access */}
            <section className="mb-6 rounded-3xl border border-border bg-card p-2 sm:p-6 shadow-[var(--shadow-soft)]">
              <h2 className="mb-1 px-4 pt-4 sm:px-0 sm:pt-0 text-second-header font-bold text-foreground">
                Access & Visibility
              </h2>
              <div className="px-4 sm:px-0">
                <Row
                  icon={published ? Eye : EyeOff}
                  title="Published"
                  description="Make this course visible to enrolled students."
                  action={
                    <button
                      onClick={() => setPublished((v) => !v)}
                      className={`h-7 w-12 rounded-full p-1 transition-colors ${published ? "bg-primary" : "bg-muted"}`}
                      aria-pressed={published}
                    >
                      <span
                        className={`block h-5 w-5 rounded-full bg-background shadow transition-transform ${published ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  }
                />
                <Row
                  icon={locked ? Lock : Unlock}
                  title="Locked"
                  description="Prevent new enrollments while keeping content available."
                  action={
                    <button
                      onClick={() => setLocked((v) => !v)}
                      className={`h-7 w-12 rounded-full p-1 transition-colors ${locked ? "bg-primary" : "bg-muted"}`}
                      aria-pressed={locked}
                    >
                      <span
                        className={`block h-5 w-5 rounded-full bg-background shadow transition-transform ${locked ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  }
                />
                <Row
                  icon={GitBranch}
                  title="Progression"
                  description="Choose between linear progression or free-form access."
                  action={
                    <select
                      value={accessibility}
                      onChange={(e) => setAccessibility(e.target.value as "linear" | "free")}
                      className="h-9 rounded-lg border border-border bg-background px-3 text-small font-semibold text-foreground"
                    >
                      <option value="linear">Linear</option>
                      <option value="free">Free-form</option>
                    </select>
                  }
                />
                <Row
                  icon={Tag}
                  title="Category"
                  description="Used for filtering and discovery."
                  action={
                    <select className="h-9 rounded-lg border border-border bg-background px-3 text-small font-semibold text-foreground">
                      <option>Bootcamp</option>
                      <option>Workshop</option>
                      <option>Self-paced</option>
                    </select>
                  }
                />
                <Row
                  icon={Users}
                  title="Instructors"
                  description="Manage who can edit content and review submissions."
                  action={
                    <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-small font-semibold text-foreground transition-colors hover:bg-muted">
                      Manage
                    </button>
                  }
                />
              </div>
            </section>

            {/* Danger zone */}
            <section className="mb-10 rounded-3xl border border-destructive/30 bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="mb-1 text-second-header font-bold text-destructive">Danger zone</h2>
              <p className="mb-4 text-small text-muted-foreground">
                Deleting this course removes all modules, lessons, and student progress.
              </p>
              <button className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-small font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90">
                <Trash2 className="h-4 w-4" /> Delete course
              </button>
            </section>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => navigate({ to: "/courses" })}
                className="rounded-full border border-border bg-background px-5 py-2.5 text-button-primary font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-button-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                <Save className="h-4 w-4" /> Save changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}