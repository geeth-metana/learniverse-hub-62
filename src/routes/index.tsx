import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { LearningPath } from "@/components/dashboard/LearningPath";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { Announcements } from "@/components/dashboard/Announcements";
import { ScheduledEvents } from "@/components/dashboard/ScheduledEvents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Metana Platform" },
      { name: "description", content: "Your Metana LMS dashboard: learning path, announcements, scheduled events and activity." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
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
