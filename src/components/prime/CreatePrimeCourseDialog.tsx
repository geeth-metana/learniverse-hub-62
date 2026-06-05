import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addPrimeCourse,
  PRIME_GRADIENTS,
  PRIME_CATEGORIES,
  PRIME_LEVELS,
  type PrimeCategory,
  type PrimeLevel,
} from "@/lib/prime-store";

export function CreatePrimeCourseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PrimeCategory>(PRIME_CATEGORIES[0]);
  const [level, setLevel] = useState<PrimeLevel>(PRIME_LEVELS[0]);
  const [hours, setHours] = useState("");
  const [lessons, setLessons] = useState("");
  const [gradient, setGradient] = useState(PRIME_GRADIENTS[0].value);

  function reset() {
    setTitle("");
    setDescription("");
    setCategory(PRIME_CATEGORIES[0]);
    setLevel(PRIME_LEVELS[0]);
    setHours("");
    setLessons("");
    setGradient(PRIME_GRADIENTS[0].value);
  }

  function handleSave() {
    if (!title.trim()) {
      toast.error("Please enter a course title");
      return;
    }
    addPrimeCourse({
      title: title.trim(),
      description: description.trim() || "Premium Metana Prime course.",
      category,
      level,
      hours: Math.max(0, Number(hours) || 0),
      lessons: Math.max(0, Number(lessons) || 0),
      progress: 0,
      gradient,
    });
    toast.success("Prime course created");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-second-header font-bold">Create Prime course</DialogTitle>
          <DialogDescription className="text-small">
            Add a new course to the Metana Prime catalogue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-small font-semibold text-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Design Masterclass"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What learners get from this course."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-small shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-semibold text-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {PRIME_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-small font-medium transition-colors ${
                    category === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-semibold text-foreground">Level</label>
            <div className="flex flex-wrap gap-2">
              {PRIME_LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`rounded-full px-3 py-1.5 text-small font-medium transition-colors ${
                    level === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-small font-semibold text-foreground">Hours</label>
              <Input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 8"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-small font-semibold text-foreground">Lessons</label>
              <Input
                type="number"
                min={0}
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="e.g. 34"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-semibold text-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRIME_GRADIENTS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  aria-label={g.label}
                  onClick={() => setGradient(g.value)}
                  style={{ background: g.value }}
                  className={`h-9 w-9 rounded-full transition-all ${
                    gradient === g.value
                      ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-full" onClick={handleSave}>
            Create course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
