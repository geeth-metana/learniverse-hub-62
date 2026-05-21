const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const days = ["Mon", "", "Wed", "", "Fri", "", ""];

type Cell = 0 | 1 | 2 | 3 | 4; // 0 offline, 1 active, 2 engaged, 3 missed, 4 crown

function seed(i: number, j: number): Cell {
  const r = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  const f = r - Math.floor(r);
  if (f < 0.18) return 0;
  if (f < 0.55) return 1;
  if (f < 0.82) return 2;
  if (f < 0.95) return 3;
  return 4;
}

const colorFor = (c: Cell) => {
  switch (c) {
    case 0: return "bg-secondary";
    case 1: return "bg-brand-light";
    case 2: return "bg-brand";
    case 3: return "bg-accent";
    case 4: return "bg-brand";
  }
};

export function ActivityHeatmap() {
  const cols = 64;
  const rows = 7;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="grid grid-cols-[40px_1fr] gap-3">
        <div />
        <div className="grid grid-cols-8 text-small text-muted-foreground mb-2">
          {months.map((m) => <span key={m}>{m}</span>)}
        </div>

        <div className="flex flex-col justify-between text-small text-muted-foreground py-1">
          {days.map((d, i) => <span key={i} className="h-[18px]">{d}</span>)}
        </div>

        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols * rows }).map((_, idx) => {
            const i = idx % cols;
            const j = Math.floor(idx / cols);
            const c = seed(i, j);
            return (
              <div
                key={idx}
                className={`aspect-square rounded-[3px] ${colorFor(c)} relative flex items-center justify-center`}
              >
                {c === 4 && <span className="text-[8px]">👑</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-border">
        <p className="text-small text-muted-foreground">Understand how your activity is tracked</p>
        <div className="flex flex-wrap gap-4 text-small text-muted-foreground">
          <Legend color="bg-secondary" label="Offline" />
          <Legend color="bg-brand-light" label="Active" />
          <Legend color="bg-brand" label="Engaged" />
          <Legend color="bg-brand" label="Crown of Progress" icon="👑" />
          <Legend color="bg-accent" label="Missed Task" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, icon }: { color: string; label: string; icon?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3.5 w-3.5 rounded-[3px] ${color} flex items-center justify-center text-[8px]`}>{icon}</span>
      {label}
    </span>
  );
}
