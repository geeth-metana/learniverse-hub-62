import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  FileText,
  Flag,
  Users,
  Check,
  BookOpen,
  Lock,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { getCourse } from "@/lib/courses-data";
import { Topbar } from "@/components/dashboard/Topbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/courses/learn/$courseId")({
  head: () => ({ meta: [{ title: "Learn — Metana" }] }),
  component: LearnPage,
});

type Unit = { id: string; title: string };
type Module = { id: string; title: string; units: Unit[] };

const MODULES: Module[] = [
  {
    id: "m01",
    title: "Module 01: Introductions and Foundations",
    units: [
      { id: "m01-u1", title: "Algorithms and Problem solving" },
      { id: "m01-u2", title: "Flow diagrams" },
      { id: "m01-u3", title: "Pseudocode" },
      { id: "m01-u4", title: "Pseudocode: Practice" },
    ],
  },
  {
    id: "m02",
    title: "Module 02 : HTML, CSS and JavaScript",
    units: [
      { id: "m02-u1", title: "HTML Essentials" },
      { id: "m02-u2", title: "CSS Layouts and Flexbox" },
      { id: "m02-u3", title: "JavaScript Basics" },
      { id: "m02-u4", title: "DOM Manipulation" },
    ],
  },
  {
    id: "m03",
    title: "Module 03: Intermediate Javascript",
    units: [
      { id: "m03-u1", title: "Functions and Scope" },
      { id: "m03-u2", title: "Async and Promises" },
      { id: "m03-u3", title: "ES Modules" },
      { id: "m03-u4", title: "Error Handling" },
    ],
  },
  {
    id: "m04",
    title: "Module 04 : Introduction to Node",
    units: [
      { id: "m04-u1", title: "Node Runtime Overview" },
      { id: "m04-u2", title: "NPM and Packages" },
      { id: "m04-u3", title: "File System and Streams" },
    ],
  },
  {
    id: "m05",
    title: "Module 05: Backend APIs and REST",
    units: [
      { id: "m05-u1", title: "HTTP Fundamentals" },
      { id: "m05-u2", title: "Building REST APIs with Express" },
      { id: "m05-u3", title: "Authentication and JWT" },
    ],
  },
  {
    id: "m06",
    title: "Module 06 : Database integration",
    units: [
      { id: "m06-u1", title: "SQL Fundamentals" },
      { id: "m06-u2", title: "Postgres and Prisma" },
      { id: "m06-u3", title: "Migrations and Seeding" },
    ],
  },
  {
    id: "m07",
    title: "Module 07: UI/UX Design and Prototyping",
    units: [
      { id: "m07-u1", title: "Design Principles" },
      { id: "m07-u2", title: "Figma Prototyping" },
      { id: "m07-u3", title: "Usability Testing" },
    ],
  },
  {
    id: "m08",
    title: "Module 08 : Front-end Development",
    units: [
      { id: "m08-u1", title: "React Components" },
      { id: "m08-u2", title: "State Management" },
      { id: "m08-u3", title: "Routing and Data Fetching" },
    ],
  },
];

const ACCESSIBLE_MODULES = 3;

// Flat list of all units in order with module index
const FLAT_UNITS = MODULES.flatMap((m, mIdx) =>
  m.units.map((u) => ({ ...u, moduleId: m.id, moduleIndex: mIdx, moduleTitle: m.title })),
);

function LearnPage() {
  const { courseId } = Route.useParams();
  const course = getCourse(courseId);

  const [openModule, setOpenModule] = useState<string>("m01");
  const [activeUnitId, setActiveUnitId] = useState<string>(FLAT_UNITS[0].id);
  const [completedUnits, setCompletedUnits] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lockOpen, setLockOpen] = useState(false);

  type Note = { id: string; title: string; content: string; updatedAt: number };
  const notesKey = `metana:notes:${courseId}`;
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(notesKey);
      if (raw) {
        const parsed: Note[] = JSON.parse(raw);
        setNotes(parsed);
        if (parsed.length) setSelectedNoteId(parsed[0].id);
      }
    } catch {}
  }, [notesKey]);

  const persistNotes = (next: Note[]) => {
    setNotes(next);
    try { localStorage.setItem(notesKey, JSON.stringify(next)); } catch {}
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setDraftTitle("");
    setDraftContent("");
    setIsEditing(true);
  };

  const handleEditNote = () => {
    if (!selectedNote) return;
    setDraftTitle(selectedNote.title);
    setDraftContent(selectedNote.content);
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    const title = draftTitle.trim() || "Untitled";
    const content = draftContent;
    if (selectedNoteId && notes.some((n) => n.id === selectedNoteId)) {
      const next = notes.map((n) => n.id === selectedNoteId ? { ...n, title, content, updatedAt: Date.now() } : n);
      persistNotes(next);
    } else {
      const id = `note-${Date.now()}`;
      const next = [{ id, title, content, updatedAt: Date.now() }, ...notes];
      persistNotes(next);
      setSelectedNoteId(id);
    }
    setIsEditing(false);
  };

  const handleDeleteNote = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    persistNotes(next);
    if (selectedNoteId === id) {
      setSelectedNoteId(next[0]?.id ?? null);
      setIsEditing(false);
    }
  };

  // Countdown until next Monday 00:00 (when next 3 modules unlock)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      next.setDate(now.getDate() + daysUntilMonday);
      next.setHours(0, 0, 0, 0);
      let diff = Math.max(0, next.getTime() - now.getTime());
      const days = Math.floor(diff / 86400000); diff -= days * 86400000;
      const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
      const minutes = Math.floor(diff / 60000); diff -= minutes * 60000;
      const seconds = Math.floor(diff / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);


  const activeIndex = FLAT_UNITS.findIndex((u) => u.id === activeUnitId);
  const activeUnit = FLAT_UNITS[activeIndex];
  const activeModule = MODULES[activeUnit.moduleIndex];

  const progress = Math.round((completedUnits.size / FLAT_UNITS.length) * 100);
  const courseTitle = course?.title ?? "Full Stack Web3 Beginner Bootcamp";

  const moduleLocked = (moduleIndex: number) => moduleIndex >= ACCESSIBLE_MODULES;

  const handleSelectUnit = (unit: (typeof FLAT_UNITS)[number]) => {
    if (moduleLocked(unit.moduleIndex)) {
      setLockOpen(true);
      return;
    }
    setActiveUnitId(unit.id);
  };

  const handlePrev = () => {
    const prev = FLAT_UNITS[activeIndex - 1];
    if (!prev) return;
    setActiveUnitId(prev.id);
    setOpenModule(prev.moduleId);
  };

  const handleCompleteAndNext = () => {
    const next = FLAT_UNITS[activeIndex + 1];
    setCompletedUnits((prev) => {
      const s = new Set(prev);
      s.add(activeUnitId);
      return s;
    });
    if (next && moduleLocked(next.moduleIndex)) {
      setLockOpen(true);
      return;
    }
    if (next) {
      setActiveUnitId(next.id);
      setOpenModule(next.moduleId);
    }
  };

  const nextUnit = FLAT_UNITS[activeIndex + 1];
  const nextIsLocked = !!nextUnit && moduleLocked(nextUnit.moduleIndex);
  const currentCompleted = completedUnits.has(activeUnitId);
  const showModuleLocked = nextIsLocked && currentCompleted;

  const isLast = activeIndex === FLAT_UNITS.length - 1;

  return (
    <>
    <div className="min-h-screen flex bg-background text-foreground text-[14px]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />

        <div className="flex gap-5 p-5 items-stretch min-h-[calc(100vh-72px)]">
          {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[320px] shrink-0 rounded-2xl border border-border bg-card p-5 flex flex-col self-stretch">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-[14px] font-semibold truncate">{courseTitle}</p>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[14px] font-semibold tabular-nums">{progress}%</span>
            </div>

            <div className="space-y-1 overflow-y-auto pr-1">
              {MODULES.map((m, mIdx) => {
                const isOpen = openModule === m.id;
                const locked = moduleLocked(mIdx);
                return (
                  <div key={m.id}>
                    <button
                      onClick={() => setOpenModule(isOpen ? "" : m.id)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[14px] font-medium text-left text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        <span className="truncate">{m.title}</span>
                      </span>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                    </button>
                    {isOpen && m.units.length > 0 && (
                      <ul className="mt-1 space-y-0.5 pl-2">
                        {m.units.map((u) => {
                          const flat = FLAT_UNITS.find((f) => f.id === u.id)!;
                          const active = u.id === activeUnitId;
                          const completed = completedUnits.has(u.id);
                          return (
                            <li key={u.id}>
                              <button
                                onClick={() => handleSelectUnit(flat)}
                                className={`w-full flex items-center justify-between gap-3 pl-4 pr-3 py-2 rounded-lg text-[14px] transition-colors ${
                                  active
                                    ? "bg-brand/30 text-foreground font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                } ${locked ? "opacity-60" : ""}`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{u.title}</span>
                                </span>
                                {completed ? (
                                  <span className="grid h-4 w-4 place-items-center rounded-full bg-brand shrink-0">
                                    <Check className="h-2.5 w-2.5 text-foreground" strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span className="h-4 w-4 rounded-full border border-border shrink-0" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 rounded-2xl border border-border bg-card flex flex-col self-stretch">
          <div className="flex items-center justify-between px-8 pt-6">
            <nav className="flex items-center gap-2 text-[14px] text-muted-foreground">
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{activeModule.title.split(":")[0]}</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground">{activeUnit.title}</span>
            </nav>
            <button
              onClick={() => setNotesOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[14px] font-medium hover:bg-muted transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> Personal Note
            </button>
          </div>

          <hr className="mt-4 border-border" />

          <article className="px-8 py-6 flex-1">
            <h1 className="text-[20px] font-semibold mb-4">
              {activeUnit.title}
            </h1>

            <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
              In our fast-paced world, where problem-solving is not just a technological necessity but an integral part of our daily lives, algorithms take center stage as the unsung heroes behind effective solutions. These step-by-step procedures, akin to a well-crafted recipe, empower the evolution of technology and enhance our ability to navigate the intricacies of everyday challenges.
            </p>

            <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
              Various algorithmic techniques are commonly used to approach different types of problems. Recursion is a method where a function calls itself to break down problems into smaller instances. Divide and Conquer is a powerful strategy that splits a problem into subproblems, solves them independently, and then combines the results. Dynamic Programming is used for optimization problems by breaking them into overlapping subproblems, storing previous results to avoid redundant calculations.
            </p>

            <h2 className="text-[14px] font-semibold mb-3">Step 1: Problem Understanding</h2>
            <ul className="space-y-2 mb-6 pl-5 list-disc text-[14px] text-muted-foreground leading-relaxed marker:text-foreground">
              <li>
                <span className="font-semibold text-foreground">Flowchart:</span> Start by sketching out a flowchart to visually map the problem at hand. Use shapes like rectangles for processes, diamonds for decisions, and arrows for the flow.
              </li>
              <li>
                <span className="font-semibold text-foreground">Pseudocode:</span> Write simple, language-agnostic code-like instructions in pseudocode to outline the logic of the solution. This helps you focus on the algorithm's structure without worrying about syntax.
              </li>
            </ul>

            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Various algorithmic techniques are commonly used to approach different types of problems. Recursion is a method where a function calls itself to break down problems into smaller instances.
            </p>
          </article>

          <div className="mt-auto flex items-center justify-between px-8 py-5 border-t border-border">
            <div className="flex items-center gap-6 text-[14px] text-muted-foreground">
              <button className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                <Flag className="h-4 w-4" /> Support & Feedback
              </button>
              <button className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                <Users className="h-4 w-4" /> Schedule 1 on 1
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={handleCompleteAndNext}
                disabled={isLast || showModuleLocked}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors disabled:pointer-events-none ${
                  showModuleLocked
                    ? "bg-muted text-muted-foreground disabled:opacity-100"
                    : "bg-brand text-foreground hover:bg-brand/90 disabled:opacity-40"
                }`}
              >
                {showModuleLocked ? (
                  <>
                    Module Locked <Lock className="h-3.5 w-3.5" />
                  </>
                ) : nextIsLocked ? (
                  <>Complete</>
                ) : (
                  <>
                    Complete and Next <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
        </div>
      </div>

      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent className="duration-300 ease-out data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[50%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[50%]">
          <DialogHeader>
            <DialogTitle>Module Locked</DialogTitle>
            <DialogDescription className="text-[14px] pt-2">
              You can only access up to {ACCESSIBLE_MODULES} modules per week. The next {MODULES[ACCESSIBLE_MODULES]?.title ?? 'module'} will unlock in:
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <div className="min-w-[64px] rounded-lg bg-muted px-3 py-3 text-center text-[22px] font-bold tabular-nums text-foreground">
                  {String(item.value).padStart(2, "0")}
                </div>
                <span className="mt-1.5 text-[12px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="sm:justify-center">
            <button
              onClick={() => setLockOpen(false)}
              className="w-full max-w-[280px] inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-foreground hover:bg-brand/90 transition-colors"
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notesOpen} onOpenChange={(o) => { setNotesOpen(o); if (!o) setIsEditing(false); }}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border text-left">
            <DialogTitle className="text-left">Personal Notes</DialogTitle>
            <DialogDescription className="text-left text-[13px]">
              {course?.title ?? courseTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[280px_1fr] h-[480px]">
            {/* Left column: notes list */}
            <div className="border-r border-border flex flex-col bg-muted/30">
              <div className="p-3 border-b border-border">
                <button
                  onClick={handleNewNote}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-brand/90 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Create New Note
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notes.length === 0 ? (
                  <div className="p-4 text-[13px] text-muted-foreground text-center">
                    No saved notes yet.
                  </div>
                ) : (
                  <ul className="py-2">
                    {notes.map((n) => (
                      <li key={n.id}>
                        <button
                          onClick={() => { setSelectedNoteId(n.id); setIsEditing(false); }}
                          className={`group w-full text-left px-4 py-3 border-l-2 transition-colors ${
                            selectedNoteId === n.id
                              ? "border-brand bg-background"
                              : "border-transparent hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-medium truncate">{n.title}</span>
                            <Trash2
                              role="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteNote(n.id); }}
                              className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground shrink-0"
                            />
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(n.updatedAt).toLocaleDateString()}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right column: preview / editor */}
            <div className="flex flex-col min-w-0">
              {isEditing ? (
                <>
                  <div className="px-6 py-4 border-b border-border">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="Note title"
                      className="w-full bg-transparent text-[16px] font-semibold outline-none"
                    />
                  </div>
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Write your note here..."
                    className="flex-1 w-full resize-none bg-transparent px-6 py-4 text-[14px] leading-relaxed outline-none"
                  />
                  <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-full border border-border px-4 py-2 text-[13px] font-medium hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-brand/90 transition-colors"
                    >
                      Save Note
                    </button>
                  </div>
                </>
              ) : selectedNote ? (
                <>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="min-w-0">
                      <h3 className="text-[16px] font-semibold truncate">{selectedNote.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Last updated {new Date(selectedNote.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handleEditNote}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-4 text-[14px] leading-relaxed whitespace-pre-wrap">
                    {selectedNote.content || (
                      <span className="text-muted-foreground">This note is empty.</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[13px] text-muted-foreground p-8 text-center">
                  Select a note from the left or create a new one to get started.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
