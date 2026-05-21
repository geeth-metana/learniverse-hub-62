import { CalendarClock, Bell, Maximize2 } from "lucide-react";

const events = [
  { date: "APR 16", time: "05:00 PM", title: "Frontend vs Backend: Tech Talk", subtitle: "Full Stack Web3 Bootcamp - Jordan Lee", live: true },
  { date: "APR 16", time: "06:00 PM", title: "Frontend vs Backend: Tech Talk", subtitle: "Full Stack Web3 Bootcamp - Jordan Lee" },
  { date: "APR 17", time: "10:30 PM", title: "Frontend vs Backend: Tech Talk", subtitle: "Full Stack Web3 Bootcamp - Jordan Lee" },
  { date: "APR 17", time: "11:15 PM", title: "Frontend vs Backend: Tech Talk", subtitle: "Full Stack Web3 Bootcamp - Jordan Lee" },
];

export function ScheduledEvents() {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-second-header font-semibold">Scheduled Events</h3>
        <button className="text-muted-foreground hover:text-foreground"><Maximize2 className="h-4 w-4" /></button>
      </div>

      <div className="rounded-2xl border border-border p-2">
        <div className="grid grid-cols-2 gap-1 p-1 mb-2">
          <button className="flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-light text-foreground text-body font-medium">
            <CalendarClock className="h-4 w-4" /> Upcoming Events
          </button>
          <button className="flex items-center justify-center gap-2 py-2 rounded-xl text-muted-foreground text-body">
            <CalendarClock className="h-4 w-4" /> Past Events
          </button>
        </div>

        <div className="divide-y divide-border">
          {events.map((e, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 ${e.live ? "bg-brand-light/40 rounded-xl" : ""}`}>
              <div className="text-center w-14 shrink-0">
                <p className="text-small font-bold">{e.date}</p>
                <p className="text-smaller text-muted-foreground">{e.time}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-body font-semibold truncate">{e.title}</p>
                  {e.live && <span className="text-smaller px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground font-bold">Live</span>}
                </div>
                <p className="text-small text-muted-foreground truncate">{e.subtitle}</p>
              </div>
              <button className="text-muted-foreground hover:text-foreground shrink-0">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
