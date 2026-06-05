import { Maximize2 } from "@/components/icons";

export function Announcements() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-second-header font-semibold">Announcements</h3>
        <button className="text-muted-foreground hover:text-foreground">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div
        className="rounded-2xl border border-border p-4 mb-3"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.97 0.08 122 / 0.66), oklch(0.96 0.04 190 / 0.44))",
        }}
      >
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <p className="text-body font-bold leading-snug">
              Unlocking the Future: Exploring Opportunities in Web3
            </p>
            <p className="text-small text-muted-foreground mt-2">
              Explore how blockchain, dApps, and digital assets are industries and unlocking new
              opportunities.
            </p>
          </div>
          <div className="rounded-lg bg-foreground/90 aspect-[4/3] flex items-center justify-center">
            <span className="text-smaller font-bold text-brand">CAREER QUEST</span>
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full ${i === 0 ? "w-4 bg-primary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
      </div>

      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex gap-3 items-center p-3 rounded-xl border border-border mb-2 last:mb-0"
        >
          <div className="h-12 w-16 rounded-md bg-foreground/90 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-brand">QUEST</span>
          </div>
          <p className="text-body font-medium leading-snug">
            Unlocking the Future: Exploring Opportunities in Web3
          </p>
        </div>
      ))}
    </div>
  );
}
