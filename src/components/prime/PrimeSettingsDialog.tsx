import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  X,
  Check,
  ArrowLeft,
  CreditCard,
  BookOpen,
  Trash2,
  Search,
} from "@/components/icons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  slugifyPrime,
  updateCourses,
  updatePlans,
  usePrimeStore,
  type PrimeCourse,
  type PrimePlan,
} from "@/lib/prime-store";

type Tab = "courses" | "pricing";
type SubView = "list" | "edit";

function SaveButton({ onClick, label = "Save Changes" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-button-primary font-semibold text-primary-foreground transition-opacity hover:opacity-90"
    >
      <Check className="h-4 w-4" strokeWidth={3} /> {label}
    </button>
  );
}

function blankPlan(): PrimePlan {
  return {
    id: "",
    name: "",
    description: "",
    monthly: 0,
    yearly: 0,
    features: [""],
    popular: false,
  };
}

function makePlanId(name: string, existing: PrimePlan[]): string {
  const base = slugifyPrime(name) || "prime-plan";
  let id = base;
  let n = 2;
  while (existing.some((p) => p.id === id)) id = `${base}-${n++}`;
  return id;
}

export function PrimeSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { courses, plans } = usePrimeStore();
  const [tab, setTab] = useState<Tab>("courses");

  // Courses tab — local draft of course membership, committed on save.
  const [coursesDraft, setCoursesDraft] = useState<PrimeCourse[]>(courses);
  const [courseSearch, setCourseSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Subscription tab — master/detail.
  const [subView, setSubView] = useState<SubView>("list");
  const [editing, setEditing] = useState<PrimePlan | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Re-seed local drafts whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setCoursesDraft(courses.map((c) => ({ ...c })));
      setCourseSearch("");
      setSearchOpen(false);
      setSubView("list");
      setEditing(null);
      setEditingId(null);
    }
  }, [open, courses]);

  // Close the course search dropdown when clicking outside of it.
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

  function switchTab(next: Tab) {
    setTab(next);
    setSubView("list");
    setEditing(null);
    setEditingId(null);
  }

  // ---- Courses ----
  const courseQuery = courseSearch.trim().toLowerCase();
  const courseMatches = (c: PrimeCourse) =>
    !courseQuery ||
    c.title.toLowerCase().includes(courseQuery) ||
    c.category.toLowerCase().includes(courseQuery);

  function moveCourse(id: string, inPrime: boolean) {
    setCoursesDraft((d) => d.map((c) => (c.id === id ? { ...c, inPrime } : c)));
  }
  // Bulk actions apply to whatever is currently matched by the search.
  function addAllToPrime() {
    setCoursesDraft((d) => d.map((c) => (courseMatches(c) ? { ...c, inPrime: true } : c)));
  }
  function removeAllFromPrime() {
    setCoursesDraft((d) => d.map((c) => (courseMatches(c) ? { ...c, inPrime: false } : c)));
  }
  function saveCourses() {
    updateCourses(coursesDraft);
    toast.success("Prime courses updated");
    onOpenChange(false);
  }

  // ---- Plans ----
  function openEditPlan(plan: PrimePlan) {
    setEditing({ ...plan, features: [...plan.features] });
    setEditingId(plan.id);
    setSubView("edit");
  }
  function openNewPlan() {
    setEditing(blankPlan());
    setEditingId(null);
    setSubView("edit");
  }
  function backToList() {
    setSubView("list");
    setEditing(null);
    setEditingId(null);
  }
  function patchEditing(patch: Partial<PrimePlan>) {
    setEditing((e) => (e ? { ...e, ...patch } : e));
  }
  function setFeature(fi: number, value: string) {
    setEditing((e) =>
      e ? { ...e, features: e.features.map((f, j) => (j === fi ? value : f)) } : e,
    );
  }
  function addFeature() {
    setEditing((e) => (e ? { ...e, features: [...e.features, ""] } : e));
  }
  function removeFeature(fi: number) {
    setEditing((e) => (e ? { ...e, features: e.features.filter((_, j) => j !== fi) } : e));
  }
  function savePlan() {
    if (!editing) return;
    const cleaned: PrimePlan = {
      ...editing,
      name: editing.name.trim() || "Untitled plan",
      description: editing.description.trim(),
      monthly: Math.max(0, Number(editing.monthly) || 0),
      yearly: Math.max(0, Number(editing.yearly) || 0),
      features: editing.features.map((f) => f.trim()).filter(Boolean),
    };
    let next: PrimePlan[];
    let keepId = editingId;
    if (editingId) {
      next = plans.map((p) => (p.id === editingId ? { ...cleaned, id: editingId } : p));
    } else {
      keepId = makePlanId(cleaned.name, plans);
      next = [...plans, { ...cleaned, id: keepId }];
    }
    // Only one plan can be recommended at a time.
    if (cleaned.popular) next = next.map((p) => ({ ...p, popular: p.id === keepId }));
    updatePlans(next);
    toast.success("Subscription plans updated");
    backToList();
  }
  function deletePlan() {
    if (!editingId) return;
    updatePlans(plans.filter((p) => p.id !== editingId));
    toast.success("Plan removed");
    backToList();
  }
  // Recommended is toggled directly on the plan card; only one plan can be recommended.
  function setRecommended(id: string, v: boolean) {
    updatePlans(
      plans.map((p) => (p.id === id ? { ...p, popular: v } : v ? { ...p, popular: false } : p)),
    );
  }

  const navItems: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: "courses", label: "Add Prime Course", icon: BookOpen },
    { key: "pricing", label: "Subscription", icon: CreditCard },
  ];

  function renderCourseRow(course: PrimeCourse) {
    const inPrime = course.inPrime;
    return (
      <div
        key={course.id}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-semibold text-foreground">{course.title}</p>
          <p className="text-smaller text-muted-foreground">{course.category}</p>
        </div>
        <button
          type="button"
          aria-label={inPrime ? "Remove from Prime" : "Add to Prime"}
          onClick={() => moveCourse(course.id, !inPrime)}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors ${
            inPrime
              ? "hover:bg-muted hover:text-destructive"
              : "hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          {inPrime ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  function renderSection(title: string, list: PrimeCourse[]) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-small font-semibold text-foreground">
            {title}
          </span>
          <span className="text-smaller text-muted-foreground">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-small text-muted-foreground">
            No courses
          </div>
        ) : (
          <div className="space-y-2">{list.map(renderCourseRow)}</div>
        )}
      </div>
    );
  }

  const inPrimeList = coursesDraft.filter((c) => c.inPrime);
  const availableList = coursesDraft.filter((c) => !c.inPrime);
  const dropdownList = coursesDraft.filter(courseMatches);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Prime Settings</DialogTitle>
        <div className="flex h-[720px]">
          {/* Left nav */}
          <aside className="w-64 shrink-0 border-r border-border bg-muted/30 p-6">
            <h2 className="text-second-header font-bold text-foreground">Prime Settings</h2>
            <p className="mt-1 text-small text-muted-foreground">
              Manage access and subscription configuration for Metana Prime.
            </p>
            <nav className="relative mt-6">
              {/* Sliding indicator — animates between nav items (each item is h-11 = 44px + 4px gap). */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-11 rounded-full bg-[#1a1a1a] transition-transform duration-300 ease-out"
                style={{
                  transform: `translateY(${navItems.findIndex((i) => i.key === tab) * 48}px)`,
                }}
              />
              <div className="relative space-y-1">
                {navItems.map((item) => {
                  const active = tab === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => switchTab(item.key)}
                      className={`relative flex h-11 w-full items-center gap-3 rounded-full px-4 text-body font-medium transition-colors ${
                        active
                          ? "font-semibold text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] ${active ? "text-primary" : ""}`}
                        strokeWidth={1.8}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Right content — fixed header & footer, only the middle scrolls */}
          <div className="flex min-w-0 flex-1 flex-col">
            {tab === "courses" ? (
              <>
                <header className="shrink-0 border-b border-border px-8 pt-8 pb-6">
                  <h3 className="text-second-header font-bold text-foreground">Add Prime Course</h3>
                  <p className="mt-0.5 text-small text-muted-foreground">
                    Search any course, then add it to or remove it from Metana Prime.
                  </p>
                </header>

                {/* Search dropdown — click to reveal all courses with bulk actions */}
                <div className="shrink-0 border-b border-border px-8 py-4">
                  <div ref={searchWrapRef} className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      onClick={() => setSearchOpen(true)}
                      placeholder="Search courses to add or remove..."
                      className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-3 text-small text-foreground transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />

                    {searchOpen && (
                      <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft-hover)]">
                        {/* Bulk actions */}
                        <div className="flex items-center gap-2 border-b border-border p-2">
                          <button
                            type="button"
                            onClick={addAllToPrime}
                            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-muted px-3 text-small font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            <Plus className="h-4 w-4" /> Select all
                          </button>
                          <button
                            type="button"
                            onClick={removeAllFromPrime}
                            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-muted px-3 text-small font-semibold text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" /> Remove all
                          </button>
                        </div>

                        {/* All courses */}
                        <div className="max-h-72 space-y-0.5 overflow-y-auto p-2">
                          {dropdownList.length === 0 ? (
                            <p className="px-2 py-6 text-center text-small text-muted-foreground">
                              No courses match your search
                            </p>
                          ) : (
                            dropdownList.map((course) => (
                              <button
                                key={course.id}
                                type="button"
                                onClick={() => moveCourse(course.id, !course.inPrime)}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-small font-semibold text-foreground">
                                    {course.title}
                                  </p>
                                  <p className="text-smaller text-muted-foreground">
                                    {course.category}
                                  </p>
                                </div>
                                {course.inPrime ? (
                                  <span className="inline-flex shrink-0 items-center gap-1 text-smaller font-semibold text-muted-foreground">
                                    <X className="h-3.5 w-3.5" /> Remove
                                  </span>
                                ) : (
                                  <span className="inline-flex shrink-0 items-center gap-1 text-smaller font-semibold text-primary">
                                    <Plus className="h-3.5 w-3.5" /> Add
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
                  {renderSection("In Metana Prime", inPrimeList)}
                  <div className="border-t border-border" />
                  {renderSection("Available courses", availableList)}
                </div>

                <div className="flex shrink-0 justify-end border-t border-border px-8 py-5">
                  <SaveButton onClick={saveCourses} />
                </div>
              </>
            ) : subView === "list" ? (
              <>
                <header className="shrink-0 border-b border-border px-8 pt-8 pb-6">
                  <h3 className="text-second-header font-bold text-foreground">Subscription</h3>
                  <p className="mt-0.5 text-small text-muted-foreground">
                    Choose a plan to edit its details, or add a new plan.
                  </p>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditPlan(plan)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openEditPlan(plan);
                          }
                        }}
                        className="flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-soft-hover)]"
                      >
                        <span className="mb-1 text-body font-bold text-foreground">
                          {plan.name}
                        </span>
                        {plan.description && (
                          <p className="mb-3 line-clamp-2 text-small text-muted-foreground">
                            {plan.description}
                          </p>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-second-header font-bold text-foreground">
                            ${plan.monthly.toLocaleString()}
                          </span>
                          <span className="text-small text-muted-foreground">
                            /mo · ${plan.yearly.toLocaleString()}/yr
                          </span>
                        </div>

                        {/* Recommended toggle lives on the card itself */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-4 flex items-center justify-between border-t border-border pt-3"
                        >
                          <span className="text-small font-medium text-foreground">
                            Recommended plan
                          </span>
                          <Switch
                            checked={!!plan.popular}
                            onCheckedChange={(v) => setRecommended(plan.id, v)}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={openNewPlan}
                      className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-5 text-small font-semibold text-muted-foreground shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-soft-hover)]"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                        <Plus className="h-5 w-5" />
                      </span>
                      Add a plan
                    </button>
                  </div>
                </div>

                <div className="flex shrink-0 justify-end border-t border-border px-8 py-5">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-11 items-center rounded-full border border-border px-5 text-button-primary font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <header className="flex shrink-0 items-center gap-3 border-b border-border px-8 pt-8 pb-6">
                  <button
                    type="button"
                    aria-label="Back to plans"
                    onClick={backToList}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-second-header font-bold text-foreground">
                      {editingId ? "Edit plan" : "Add a plan"}
                    </h3>
                    <p className="mt-0.5 text-small text-muted-foreground">
                      {editingId
                        ? "Update this subscription plan's details."
                        : "Create a new subscription plan."}
                    </p>
                  </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
                  {editing && (
                    <div className="mx-auto flex max-w-lg flex-col gap-4">
                      <div className="space-y-1.5">
                        <label className="text-small font-semibold text-foreground">
                          Plan name
                        </label>
                        <Input
                          value={editing.name}
                          onChange={(e) => patchEditing({ name: e.target.value })}
                          placeholder="e.g. Prime Pro"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-small font-semibold text-foreground">
                          Short description
                        </label>
                        <Input
                          value={editing.description}
                          onChange={(e) => patchEditing({ description: e.target.value })}
                          placeholder="One line shown under the plan name."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-small font-semibold text-foreground">
                            Monthly price
                          </label>
                          <div className="flex items-baseline gap-1.5 rounded-md border border-input px-3 py-2">
                            <span className="text-small text-muted-foreground">$</span>
                            <input
                              type="number"
                              min={0}
                              value={editing.monthly}
                              onChange={(e) => patchEditing({ monthly: Number(e.target.value) })}
                              className="w-full min-w-0 bg-transparent text-body font-bold text-foreground focus:outline-none"
                            />
                            <span className="text-small text-muted-foreground">/mo</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-small font-semibold text-foreground">
                            Annual price
                          </label>
                          <div className="flex items-baseline gap-1.5 rounded-md border border-input px-3 py-2">
                            <span className="text-small text-muted-foreground">$</span>
                            <input
                              type="number"
                              min={0}
                              value={editing.yearly}
                              onChange={(e) => patchEditing({ yearly: Number(e.target.value) })}
                              className="w-full min-w-0 bg-transparent text-body font-bold text-foreground focus:outline-none"
                            />
                            <span className="text-small text-muted-foreground">/yr</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-small font-semibold text-foreground">Features</label>
                        <div className="space-y-2">
                          {editing.features.map((f, fi) => (
                            <div key={fi} className="flex items-center gap-2">
                              <Input
                                value={f}
                                onChange={(e) => setFeature(fi, e.target.value)}
                                placeholder="Feature"
                                className="text-small"
                              />
                              <button
                                type="button"
                                aria-label="Remove feature"
                                onClick={() => removeFeature(fi)}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={addFeature}
                          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-card py-2 text-small font-semibold text-foreground shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-soft-hover)]"
                        >
                          <Plus className="h-4 w-4" /> Add feature
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-between border-t border-border px-8 py-5">
                  {editingId ? (
                    <button
                      type="button"
                      onClick={deletePlan}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-button-primary font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={backToList}
                      className="inline-flex h-11 items-center rounded-full border border-border px-5 text-button-primary font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <SaveButton onClick={savePlan} label={editingId ? "Save plan" : "Add plan"} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
