import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { LearningPath } from "@/components/dashboard/LearningPath";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { Announcements } from "@/components/dashboard/Announcements";
import { ScheduledEvents } from "@/components/dashboard/ScheduledEvents";

export const Route = createFileRoute("/our-student")({
  head: () => ({
    meta: [
      { title: "Dashboard — Our Student" },
      {
        name: "description",
        content:
          "Our Student dashboard: learning path, announcements, scheduled events and activity.",
      },
    ],
  }),
  component: OurStudentDashboard,
});

function OurStudentDashboard() {
  // Child routes (/our-student/courses, /our-student/prime) render their own
  // full pages, so defer to the Outlet when one of them is active.
  const coursesMatch = useMatch({ from: "/our-student/courses", shouldThrow: false });
  const primeMatch = useMatch({ from: "/our-student/prime", shouldThrow: false });
  if (coursesMatch || primeMatch) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6">
            <section className="min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-primary-header font-bold">
                  Hi, Welcome back Eric..! <span className="inline-block">👋</span>
                </h1>
                <span className="text-small text-muted-foreground">27th Dec, 2024</span>
              </div>
              <WelcomeCard />
              <LearningPath />
              <ActivityHeatmap />
            </section>

            <aside className="min-w-0">
              <Announcements />
              <ScheduledEvents />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
