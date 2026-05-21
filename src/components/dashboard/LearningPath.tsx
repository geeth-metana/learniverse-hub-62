import { Play, Calendar as CalendarIcon, ChevronRight } from "lucide-react";

export function LearningPath() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 mt-6">
      <div>
        <h3 className="text-second-header font-semibold mb-3">Your Learning Path</h3>
        <div className="rounded-2xl border border-dashed border-primary/40 p-5 bg-card">
          <p className="text-main-header font-semibold mb-4">Full Stack Web3 Beginner Bootcamp</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-small text-muted-foreground mb-5">
            <span>191 Lessons</span>
            <span className="text-border">|</span>
            <span>121 Videos</span>
            <span className="text-border">|</span>
            <span>72 Hrs</span>
            <span className="text-border">|</span>
            <span>12 Assignments</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-brand" style={{ width: "69%" }} />
            </div>
            <span className="text-small font-semibold">69%</span>
          </div>
          <button className="mt-4 inline-flex items-center gap-1 text-small text-primary font-medium hover:underline">
            Course Overview <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border-l-4 border-l-brand bg-card p-5 flex flex-col">
        <p className="text-small text-muted-foreground">Next Up</p>
        <p className="text-main-header font-semibold mt-1">Algorithm and Problem Solving</p>
        <div className="flex items-center gap-2 text-small text-muted-foreground mt-3">
          <CalendarIcon className="h-4 w-4" /> 17th April, 2025
        </div>
        <button className="mt-auto pt-5">
          <span className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-brand text-brand-foreground font-semibold text-button-primary hover:opacity-90 transition-opacity">
            <Play className="h-4 w-4 fill-current" /> Continue
          </span>
        </button>
      </div>
    </div>
  );
}
