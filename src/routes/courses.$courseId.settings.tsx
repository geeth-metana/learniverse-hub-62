import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { getCourse } from "@/lib/courses-data";
import { ArrowLeft, Settings as SettingsIcon, MoreVertical, Pencil } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/courses/$courseId/settings")({
  head: () => ({ meta: [{ title: "Course Settings — Metana" }] }),
  component: CourseSettingsPage,
});

function RadioCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
}) {
  return (
    <label
      className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200 ${
        checked
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:bg-primary/5 hover:border-primary/30"
      }`}
    >
      <input type="radio" checked={checked} onChange={onChange} className="peer sr-only" />
      <div
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
          checked
            ? "border-primary bg-primary"
            : "border-muted-foreground/30 bg-transparent group-hover:border-primary/50"
        }`}
      >
        {checked && <div className="h-2 w-2 rounded-full bg-background" />}
      </div>
      <div>
        <p className="text-body font-semibold text-[#1A1A1A]">{title}</p>
        {description && <p className="mt-1 text-small text-muted-foreground">{description}</p>}
      </div>
    </label>
  );
}

function CourseSettingsPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const course = getCourse(courseId);

  const [accessSetting, setAccessSetting] = useState<"open" | "free" | "buy" | "recurring">("free");
  const [visibility, setVisibility] = useState<"always" | "enrollees">("always");
  const [progression, setProgression] = useState<"linear" | "free">("linear");
  const [certificate, setCertificate] = useState("Certificate of Completion");

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

            <div className="mb-6">
              <h1 className="text-primary-header font-bold text-foreground">Course Settings</h1>
              <p className="mt-1 text-body text-muted-foreground">
                Manage your course settings, access controls, and display options.
              </p>
            </div>

            {/* Course Image & Menu */}
            <div className="relative mb-6 h-48 w-full overflow-hidden rounded-3xl bg-muted sm:h-64 shadow-[var(--shadow-soft)]">
              {course?.cover ? (
                <img
                  src={course.cover}
                  alt={course?.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-primary/20 to-primary/5" />
              )}
              <div className="absolute right-4 top-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="grid h-10 w-10 place-items-center rounded-full bg-background/90 text-foreground transition-all duration-200 hover:bg-[#1A1A1A] hover:text-white shadow-sm">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 rounded-2xl p-2 shadow-[var(--shadow-soft)]"
                  >
                    <DropdownMenuItem
                      onClick={() => navigate({ to: "/courses/$courseId", params: { courseId } })}
                      className="cursor-pointer gap-2 rounded-xl py-2.5 text-body font-medium"
                    >
                      <Pencil className="h-4 w-4" /> Edit Course
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2 rounded-xl py-2.5 text-body font-medium bg-muted">
                      <SettingsIcon className="h-4 w-4" /> Edit Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
              {/* Course Access Setting */}
              <section className="border-b border-border p-6">
                <div>
                  <h2 className="text-second-header font-bold text-[#1A1A1A]">
                    Course Access Setting
                  </h2>
                  <p className="mt-1 text-small text-muted-foreground">
                    Controls how users will gain access to the course.
                  </p>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <RadioCard
                    checked={accessSetting === "open"}
                    onChange={() => setAccessSetting("open")}
                    title="Open"
                    description="course not protected."
                  />
                  <RadioCard
                    checked={accessSetting === "free"}
                    onChange={() => setAccessSetting("free")}
                    title="Free"
                    description="course protected; registration required."
                  />
                  <RadioCard
                    checked={accessSetting === "buy"}
                    onChange={() => setAccessSetting("buy")}
                    title="Buy Now"
                    description="one-time payment required."
                  />
                  <RadioCard
                    checked={accessSetting === "recurring"}
                    onChange={() => setAccessSetting("recurring")}
                    title="Recurring"
                    description="recurring payment required."
                  />
                </div>
              </section>

              {/* Display and Content Options */}
              <section className="border-b border-border p-6">
                <div>
                  <h2 className="text-second-header font-bold text-[#1A1A1A]">
                    Display and Content Options
                  </h2>
                  <p className="mt-1 text-small text-muted-foreground">
                    Controls the look and feed of the course and optional content settings.
                  </p>
                </div>
                <div className="mt-6 grid gap-8 lg:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <label className="text-small font-semibold text-[#1A1A1A]">
                      Course Certificate
                    </label>
                    <div className="flex w-full flex-wrap items-center gap-4 sm:flex-nowrap">
                      <select
                        value={certificate}
                        onChange={(e) => setCertificate(e.target.value)}
                        className="h-12 w-full max-w-[280px] rounded-2xl border border-border bg-background px-4 text-body text-[#1A1A1A] outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      >
                        <option>Certificate of Completion</option>
                        <option>Certificate of Excellence</option>
                        <option>No Certificate</option>
                      </select>
                      <button className="h-12 rounded-full border border-border bg-background px-6 text-button-primary font-semibold text-[#1A1A1A] shadow-sm transition-all duration-200 hover:bg-muted hover:shadow">
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-small font-semibold text-[#1A1A1A]">Access Mode</label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <RadioCard
                        checked={visibility === "always"}
                        onChange={() => setVisibility("always")}
                        title="Always Visible"
                      />
                      <RadioCard
                        checked={visibility === "enrollees"}
                        onChange={() => setVisibility("enrollees")}
                        title="Only visible to enrollees"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Course Navigation Setting */}
              <section className="p-6">
                <div>
                  <h2 className="text-second-header font-bold text-[#1A1A1A]">
                    Course Navigation Setting
                  </h2>
                  <p className="mt-1 text-small text-muted-foreground">
                    Controls how users interact with the content and their navigational experience.
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <label className="text-small font-semibold text-[#1A1A1A]">
                    Progression Mode
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
                    <RadioCard
                      checked={progression === "linear"}
                      onChange={() => setProgression("linear")}
                      title="Linear"
                      description="Students must complete lessons in order."
                    />
                    <RadioCard
                      checked={progression === "free"}
                      onChange={() => setProgression("free")}
                      title="Free Form"
                      description="Students can access any lesson at any time."
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-end gap-4">
              <button
                onClick={() => navigate({ to: "/courses" })}
                className="rounded-full border border-border bg-background px-6 py-3 text-button-primary font-semibold text-[#1A1A1A] transition-all hover:bg-muted"
              >
                Cancel
              </button>
              <button className="rounded-full bg-primary px-6 py-3 text-button-primary font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow">
                Save Settings
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
