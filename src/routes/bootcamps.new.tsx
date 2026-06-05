import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  ClipboardList,
  HelpCircle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Settings2,
  Globe,
  GripVertical,
  BookOpen,
  Bold,
  Italic,
  Underline,
  List as ListIcon,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Eye,
  X,
  Users,
  CheckCircle2,
  Circle,
  CircleDashed,
  Box,
  MessageSquare,
} from "@/components/icons";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export const Route = createFileRoute("/bootcamps/new")({
  head: () => ({
    meta: [
      { title: "Create Course — Metana Platform" },
      {
        name: "description",
        content:
          "Design your course curriculum. Build modules, units, and lessons with content, quizzes, and assignments.",
      },
    ],
  }),
  component: CreateBootcampPage,
});

// ----------------- Types -----------------

type LessonType = "text";
type UnitItemKind = "content" | "quiz" | "assignment" | "feedback";

type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  body: string;
  optional?: boolean;
};

type FeedbackQuestion = {
  id: string;
  title: string;
  label: string;
  ratingType: string;
};

type QuizAnswer = { id: string; text: string };
type QuizQuestion = {
  id: string;
  question: string;
  answers: QuizAnswer[];
  correctId?: string;
};

type UnitItem = {
  id: string;
  kind: UnitItemKind;
  title: string;
  body: string;
  lessons: Lesson[]; // only for "content"
  optional?: boolean;
  multipleQuestions?: boolean; // only for "feedback"
  questions?: FeedbackQuestion[]; // only for "feedback"
  quizzes?: QuizQuestion[]; // only for "quiz"
};

type Unit = {
  id: string;
  title: string;
  items: UnitItem[];
  optional?: boolean;
};

type Module = {
  id: string;
  title: string;
  optional?: boolean;
  units: Unit[];
};

// ----------------- Helpers -----------------

const uid = () => Math.random().toString(36).slice(2, 9);

const seed: Module[] = [
  {
    id: uid(),
    title: "Introduction to Design Thinking",
    units: [
      {
        id: uid(),
        title: "Foundations",
        items: [
          {
            id: uid(),
            kind: "content",
            title: "The Role of Design",
            body: "",
            lessons: [
              { id: uid(), title: "What is design?", type: "text", body: "" },
              { id: uid(), title: "Design vs. Art", type: "text", body: "" },
            ],
          },
          {
            id: uid(),
            kind: "quiz",
            title: "Foundations Quiz",
            body: "",
            lessons: [],
          },
          {
            id: uid(),
            kind: "assignment",
            title: "Sketch your first concept",
            body: "",
            lessons: [],
          },
        ],
      },
    ],
  },
];

// ----------------- Page -----------------

type Selection =
  | { kind: "course" }
  | { kind: "module"; moduleId: string }
  | { kind: "unit"; moduleId: string; unitId: string }
  | { kind: "item"; moduleId: string; unitId: string; itemId: string }
  | { kind: "lesson"; moduleId: string; unitId: string; itemId: string; lessonId: string };

function CreateBootcampPage() {
  const [courseTitle, setCourseTitle] = useState("Untitled Course");
  const [courseDescription, setCourseDescription] = useState("");
  const [modules, setModules] = useState<Module[]>(seed);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({ [seed[0].id]: true });
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [selection, setSelection] = useState<Selection>({ kind: "course" });
  const [previewMode, setPreviewMode] = useState(false);

  const handlePublish = () => {
    toast.success("Course published.");
  };

  // ---------- Module ops ----------
  const addModule = () => {
    const m: Module = {
      id: uid(),
      title: "New Module",
      units: [],
    };
    setModules((ms) => [...ms, m]);
    setOpenModules((o) => ({ ...o, [m.id]: true }));
    setSelection({ kind: "module", moduleId: m.id });
  };

  const deleteModule = (mid: string) => {
    if (!window.confirm("Delete this module and all its contents?")) return;
    setModules((ms) => ms.filter((m) => m.id !== mid));
  };

  // ---------- Unit ops ----------
  const addUnit = (mid: string) => {
    const u: Unit = { id: uid(), title: "New Unit", items: [] };
    setModules((ms) => ms.map((m) => (m.id === mid ? { ...m, units: [...m.units, u] } : m)));
    setOpenModules((o) => ({ ...o, [mid]: true }));
    setOpenUnits((o) => ({ ...o, [u.id]: true }));
    setSelection({ kind: "unit", moduleId: mid, unitId: u.id });
  };

  const deleteUnit = (mid: string, uidToDelete: string) => {
    if (!window.confirm("Delete this unit and all its items?")) return;
    setModules((ms) =>
      ms.map((m) =>
        m.id === mid ? { ...m, units: m.units.filter((u) => u.id !== uidToDelete) } : m,
      ),
    );
  };

  // ---------- Item ops ----------
  const addItem = (mid: string, unitId: string, kind: UnitItemKind) => {
    const titleByKind: Record<UnitItemKind, string> = {
      content: "New Content",
      quiz: "New Quiz",
      assignment: "New Assignment",
      feedback: "New Feedback",
    };
    const item: UnitItem = {
      id: uid(),
      kind,
      title: titleByKind[kind],
      body: "",
      lessons: [],
      ...(kind === "feedback"
        ? {
            multipleQuestions: false,
            questions: [{ id: uid(), title: "", label: "", ratingType: "" }],
          }
        : {}),
    };
    setModules((ms) =>
      ms.map((m) =>
        m.id === mid
          ? {
              ...m,
              units: m.units.map((u) =>
                u.id === unitId ? { ...u, items: [...u.items, item] } : u,
              ),
            }
          : m,
      ),
    );
    setOpenUnits((o) => ({ ...o, [unitId]: true }));
    if (kind === "content") setOpenItems((o) => ({ ...o, [item.id]: true }));
    setSelection({ kind: "item", moduleId: mid, unitId, itemId: item.id });
  };

  const deleteItem = (mid: string, unitId: string, itemId: string) => {
    if (!window.confirm("Delete this item?")) return;
    setModules((ms) =>
      ms.map((m) =>
        m.id === mid
          ? {
              ...m,
              units: m.units.map((u) =>
                u.id === unitId ? { ...u, items: u.items.filter((i) => i.id !== itemId) } : u,
              ),
            }
          : m,
      ),
    );
  };

  // ---------- Lesson ops ----------
  const addLesson = (mid: string, unitId: string, itemId: string) => {
    const l: Lesson = { id: uid(), title: "New Lesson", type: "text", body: "" };
    setModules((ms) =>
      ms.map((m) =>
        m.id === mid
          ? {
              ...m,
              units: m.units.map((u) =>
                u.id === unitId
                  ? {
                      ...u,
                      items: u.items.map((i) =>
                        i.id === itemId ? { ...i, lessons: [...i.lessons, l] } : i,
                      ),
                    }
                  : u,
              ),
            }
          : m,
      ),
    );
    setOpenItems((o) => ({ ...o, [itemId]: true }));
    setSelection({ kind: "lesson", moduleId: mid, unitId, itemId, lessonId: l.id });
  };

  const deleteLesson = (mid: string, unitId: string, itemId: string, lessonId: string) => {
    if (!window.confirm("Delete this lesson?")) return;
    setModules((ms) =>
      ms.map((m) =>
        m.id === mid
          ? {
              ...m,
              units: m.units.map((u) =>
                u.id === unitId
                  ? {
                      ...u,
                      items: u.items.map((i) =>
                        i.id === itemId
                          ? { ...i, lessons: i.lessons.filter((l) => l.id !== lessonId) }
                          : i,
                      ),
                    }
                  : u,
              ),
            }
          : m,
      ),
    );
  };

  // ---------- Updaters ----------
  const updateModule = (mid: string, patch: Partial<Module>) =>
    setModules((ms) => ms.map((m) => (m.id === mid ? { ...m, ...patch } : m)));

  const updateUnit = (mid: string, unitId: string, patch: Partial<Unit>) =>
    setModules((ms) =>
      ms.map((m) =>
        m.id === mid
          ? { ...m, units: m.units.map((u) => (u.id === unitId ? { ...u, ...patch } : u)) }
          : m,
      ),
    );

  const updateItem = (mid: string, unitId: string, itemId: string, patch: Partial<UnitItem>) =>
    setModules((ms) =>
      ms.map((m) =>
        m.id === mid
          ? {
              ...m,
              units: m.units.map((u) =>
                u.id === unitId
                  ? {
                      ...u,
                      items: u.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
                    }
                  : u,
              ),
            }
          : m,
      ),
    );

  const updateLesson = (
    mid: string,
    unitId: string,
    itemId: string,
    lessonId: string,
    patch: Partial<Lesson>,
  ) =>
    setModules((ms) =>
      ms.map((m) =>
        m.id === mid
          ? {
              ...m,
              units: m.units.map((u) =>
                u.id === unitId
                  ? {
                      ...u,
                      items: u.items.map((i) =>
                        i.id === itemId
                          ? {
                              ...i,
                              lessons: i.lessons.map((l) =>
                                l.id === lessonId ? { ...l, ...patch } : l,
                              ),
                            }
                          : i,
                      ),
                    }
                  : u,
              ),
            }
          : m,
      ),
    );

  // ---------- Selection lookups ----------
  const selected = useMemo(() => {
    if (selection.kind === "course") return null;
    const m = modules.find((x) => x.id === (selection as any).moduleId);
    if (!m) return null;
    if (selection.kind === "module") return { module: m };
    const u = m.units.find((x) => x.id === (selection as any).unitId);
    if (!u) return { module: m };
    if (selection.kind === "unit") return { module: m, unit: u };
    const i = u.items.find((x) => x.id === (selection as any).itemId);
    if (!i) return { module: m, unit: u };
    if (selection.kind === "item") return { module: m, unit: u, item: i };
    const l = i.lessons.find((x) => x.id === (selection as any).lessonId);
    return { module: m, unit: u, item: i, lesson: l };
  }, [selection, modules]);

  // ---------- Breadcrumb ----------
  const moduleIndex = (mid: string) => modules.findIndex((m) => m.id === mid) + 1;
  const unitIndex = (m: Module, uid2: string) => m.units.findIndex((u) => u.id === uid2) + 1;
  const itemIndex = (u: Unit, iid: string) => u.items.findIndex((i) => i.id === iid) + 1;
  const lessonIndex = (i: UnitItem, lid: string) => i.lessons.findIndex((l) => l.id === lid) + 1;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (previewMode) {
    return (
      <PreviewView
        courseTitle={courseTitle}
        modules={modules}
        onExit={() => setPreviewMode(false)}
      />
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="grid grid-cols-12 gap-6">
            {/* ============ Curriculum tree ============ */}
            <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
              <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden flex flex-col h-[calc(100vh-7rem)]">
                <button
                  onClick={() => setSelection({ kind: "course" })}
                  className={`flex items-center gap-3 px-5 py-5 border-b border-border text-left transition-colors hover:bg-muted/50 ${
                    selection.kind === "course" ? "bg-muted/60" : ""
                  }`}
                >
                  <div className="h-10 w-10 grid place-items-center rounded-xl bg-[var(--gradient-brand)] text-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-small text-muted-foreground">Course</p>
                    <p className="font-semibold truncate">{courseTitle}</p>
                  </div>
                </button>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {modules.map((m) => {
                    const mOpen = openModules[m.id];
                    return (
                      <div key={m.id} className="rounded-2xl border border-border bg-background/50">
                        {/* Module row */}
                        <div
                          className={`group flex items-center gap-2 px-3 py-2.5 rounded-2xl cursor-pointer transition-colors ${
                            selection.kind !== "course" &&
                            (selection as any).moduleId === m.id &&
                            selection.kind === "module"
                              ? "bg-muted"
                              : "hover:bg-muted/60"
                          }`}
                          onClick={() => setSelection({ kind: "module", moduleId: m.id })}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenModules((o) => ({ ...o, [m.id]: !o[m.id] }));
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {mOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          {mOpen ? (
                            <FolderOpen className="h-4 w-4 text-[oklch(0.68_0.17_275)]" />
                          ) : (
                            <Folder className="h-4 w-4 text-[oklch(0.68_0.17_275)]" />
                          )}
                          <span className="flex-1 truncate text-base font-medium">{m.title}</span>
                          {m.optional && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                              optional
                            </span>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteModule(m.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete module</TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Units */}
                        {mOpen && (
                          <div className="px-2 pb-2 space-y-1">
                            {m.units.map((u) => {
                              const uOpen = openUnits[u.id];
                              const uSelected =
                                selection.kind === "unit" && (selection as any).unitId === u.id;
                              return (
                                <div key={u.id} className="rounded-xl">
                                  <div
                                    className={`group flex items-center gap-2 pl-7 pr-2 py-2.5 rounded-xl cursor-pointer transition-colors ${
                                      uSelected ? "bg-muted" : "hover:bg-muted/50"
                                    }`}
                                    onClick={() =>
                                      setSelection({
                                        kind: "unit",
                                        moduleId: m.id,
                                        unitId: u.id,
                                      })
                                    }
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenUnits((o) => {
                                          const isOpen = !!o[u.id];
                                          if (isOpen) return { ...o, [u.id]: false };
                                          return { [u.id]: true };
                                        });
                                      }}
                                      className="text-muted-foreground hover:text-foreground"
                                    >
                                      {uOpen ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>
                                    <Box className="h-4 w-4 text-[oklch(0.7_0.15_200)]" />
                                    <span className="flex-1 truncate text-base font-medium">
                                      {u.title}
                                    </span>
                                    {u.optional && <OptionalBadge small />}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteUnit(m.id, u.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {uOpen && (
                                    <div className="pl-9 pr-1 py-1 space-y-1">
                                      {u.items.map((i) => {
                                        const iSelected =
                                          (selection.kind === "item" &&
                                            (selection as any).itemId === i.id) ||
                                          (selection.kind === "lesson" &&
                                            (selection as any).itemId === i.id);
                                        const iOpen = openItems[i.id];
                                        const Icon =
                                          i.kind === "content"
                                            ? BookOpen
                                            : i.kind === "quiz"
                                              ? HelpCircle
                                              : i.kind === "assignment"
                                                ? ClipboardList
                                                : MessageSquare;
                                        return (
                                          <div key={i.id}>
                                            <div
                                              className={`group flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-lg cursor-pointer ${
                                                iSelected && selection.kind === "item"
                                                  ? "bg-muted"
                                                  : "hover:bg-muted/50"
                                              }`}
                                              onClick={() =>
                                                setSelection({
                                                  kind: "item",
                                                  moduleId: m.id,
                                                  unitId: u.id,
                                                  itemId: i.id,
                                                })
                                              }
                                            >
                                              {i.kind === "content" ? (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenItems((o) => ({
                                                      ...o,
                                                      [i.id]: !o[i.id],
                                                    }));
                                                  }}
                                                  className="text-muted-foreground hover:text-foreground"
                                                >
                                                  {iOpen ? (
                                                    <ChevronDown className="h-3 w-3" />
                                                  ) : (
                                                    <ChevronRight className="h-3 w-3" />
                                                  )}
                                                </button>
                                              ) : (
                                                <span className="w-3" />
                                              )}
                                              <Icon
                                                className={`h-4 w-4 ${
                                                  i.kind === "content"
                                                    ? "text-[oklch(0.65_0.16_240)]"
                                                    : i.kind === "quiz"
                                                      ? "text-[oklch(0.7_0.18_60)]"
                                                      : i.kind === "assignment"
                                                        ? "text-[oklch(0.65_0.18_320)]"
                                                        : "text-[oklch(0.7_0.16_160)]"
                                                }`}
                                              />
                                              <span className="flex-1 truncate text-base">
                                                {i.title}
                                              </span>
                                              {i.optional && <OptionalBadge small />}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteItem(m.id, u.id, i.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>

                                            {/* Lessons (only for content) */}
                                            {i.kind === "content" && iOpen && (
                                              <div className="pl-7 py-1 space-y-1">
                                                {i.lessons.map((l) => {
                                                  const lSelected =
                                                    selection.kind === "lesson" &&
                                                    (selection as any).lessonId === l.id;
                                                  return (
                                                    <div
                                                      key={l.id}
                                                      onClick={() =>
                                                        setSelection({
                                                          kind: "lesson",
                                                          moduleId: m.id,
                                                          unitId: u.id,
                                                          itemId: i.id,
                                                          lessonId: l.id,
                                                        })
                                                      }
                                                      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer ${
                                                        lSelected ? "bg-muted" : "hover:bg-muted/50"
                                                      }`}
                                                    >
                                                      <FileText className="h-4 w-4 text-[oklch(0.65_0.16_240)]" />
                                                      <span className="flex-1 truncate text-base">
                                                        {l.title}
                                                      </span>
                                                      {l.optional && <OptionalBadge small />}
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          deleteLesson(m.id, u.id, i.id, l.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                                      >
                                                        <Trash2 className="h-3 w-3" />
                                                      </button>
                                                    </div>
                                                  );
                                                })}
                                                <button
                                                  onClick={() => addLesson(m.id, u.id, i.id)}
                                                  className="flex items-center gap-1.5 px-2 py-1 text-small text-muted-foreground hover:text-foreground"
                                                >
                                                  <Plus className="h-3 w-3" /> Add lesson
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}

                                      {/* Add item buttons */}
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        <PillBtn onClick={() => addItem(m.id, u.id, "content")}>
                                          <BookOpen className="h-3 w-3" /> Content
                                        </PillBtn>
                                        <PillBtn onClick={() => addItem(m.id, u.id, "quiz")}>
                                          <HelpCircle className="h-3 w-3" /> Quiz
                                        </PillBtn>
                                        <PillBtn onClick={() => addItem(m.id, u.id, "assignment")}>
                                          <ClipboardList className="h-3 w-3" /> Assignment
                                        </PillBtn>
                                        <PillBtn onClick={() => addItem(m.id, u.id, "feedback")}>
                                          <MessageSquare className="h-3 w-3" /> Feedback
                                        </PillBtn>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            <button
                              onClick={() => addUnit(m.id)}
                              className="w-full flex items-center justify-center gap-2 mt-1 py-2 text-small text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Unit
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={() => addModule()}
                    className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-2xl border border-dashed border-border text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add Module
                  </button>
                </div>

                <div className="p-3 border-t border-border space-y-2">
                  <button
                    onClick={() => setPreviewMode(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-border text-base font-semibold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Eye className="h-4 w-4" /> View as User
                  </button>
                  <button
                    onClick={handlePublish}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Globe className="h-4 w-4" /> Publish Course
                  </button>
                </div>
              </div>
            </aside>

            {/* ============ Editor pane ============ */}
            <section className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-5 h-[calc(100vh-7rem)]">
              {/* Breadcrumb / header */}
              <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-soft)] shrink-0">
                {selection.kind === "course" ? (
                  <Crumb icon={Sparkles} label="Course Overview" iconClass="text-brand" />
                ) : (
                  <>
                    <Crumb
                      icon={Folder}
                      label={`${pad(moduleIndex(selected!.module.id))} Module`}
                      iconClass="text-[oklch(0.68_0.17_275)]"
                    />
                    {"unit" in (selected ?? {}) && selected!.unit && (
                      <Crumb
                        icon={Box}
                        label={`${pad(unitIndex(selected!.module, selected!.unit.id))} Unit`}
                        iconClass="text-[oklch(0.7_0.15_200)]"
                      />
                    )}
                    {"item" in (selected ?? {}) && (selected as any).item && (
                      <Crumb
                        icon={
                          (selected as any).item.kind === "content"
                            ? BookOpen
                            : (selected as any).item.kind === "quiz"
                              ? HelpCircle
                              : (selected as any).item.kind === "assignment"
                                ? ClipboardList
                                : MessageSquare
                        }
                        iconClass={
                          (selected as any).item.kind === "content"
                            ? "text-[oklch(0.65_0.16_240)]"
                            : (selected as any).item.kind === "quiz"
                              ? "text-[oklch(0.7_0.18_60)]"
                              : (selected as any).item.kind === "assignment"
                                ? "text-[oklch(0.65_0.18_320)]"
                                : "text-[oklch(0.7_0.16_160)]"
                        }
                        label={`${pad(itemIndex(selected!.unit!, (selected as any).item.id))} ${
                          (selected as any).item.kind === "content"
                            ? "Content"
                            : (selected as any).item.kind === "quiz"
                              ? "Quiz"
                              : (selected as any).item.kind === "assignment"
                                ? "Assignment"
                                : "Feedback"
                        }`}
                      />
                    )}
                    {"lesson" in (selected ?? {}) && (selected as any).lesson && (
                      <Crumb
                        icon={FileText}
                        iconClass="text-[oklch(0.65_0.16_240)]"
                        label={`${pad(
                          lessonIndex((selected as any).item, (selected as any).lesson.id),
                        )} Lesson`}
                      />
                    )}
                  </>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-body hover:bg-muted/60 transition-colors">
                    <Settings2 className="h-4 w-4" /> Course Setting
                  </button>
                </div>
              </div>

              {/* Editor body */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {selection.kind === "course" && (
                  <CourseEditor
                    title={courseTitle}
                    description={courseDescription}
                    onTitle={setCourseTitle}
                    onDescription={setCourseDescription}
                  />
                )}

                {selection.kind === "module" && selected?.module && (
                  <ModuleEditor
                    module={selected.module}
                    onChange={(p) => updateModule(selected.module.id, p)}
                  />
                )}

                {selection.kind === "unit" && selected?.unit && (
                  <UnitEditor
                    unit={selected.unit}
                    onChange={(p) => updateUnit(selected.module.id, selected.unit!.id, p)}
                    onAdd={(kind) => addItem(selected.module.id, selected.unit!.id, kind)}
                  />
                )}

                {selection.kind === "item" && (selected as any)?.item && (
                  <ItemEditor
                    item={(selected as any).item}
                    onChange={(p) =>
                      updateItem(
                        selected!.module.id,
                        selected!.unit!.id,
                        (selected as any).item.id,
                        p,
                      )
                    }
                    onAddLesson={() =>
                      addLesson(selected!.module.id, selected!.unit!.id, (selected as any).item.id)
                    }
                  />
                )}

                {selection.kind === "lesson" && (selected as any)?.lesson && (
                  <LessonEditor
                    lesson={(selected as any).lesson}
                    onChange={(p) =>
                      updateLesson(
                        selected!.module.id,
                        selected!.unit!.id,
                        (selected as any).item.id,
                        (selected as any).lesson.id,
                        p,
                      )
                    }
                  />
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// ----------------- Subcomponents -----------------

function PillBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-full border border-border text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
    >
      {children}
    </button>
  );
}

function Crumb({ icon: Icon, label, iconClass }: { icon: any; label: string; iconClass?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-body">
      <Icon className={`h-4 w-4 ${iconClass ?? "text-muted-foreground"}`} />
      <span className="font-medium">{label}</span>
    </div>
  );
}

function EditorCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] p-6 lg:p-8 space-y-5">
      {children}
    </div>
  );
}

function TitleInput({
  value,
  onChange,
  placeholder = "Enter the Title here",
  label = "Title",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-small font-medium text-muted-foreground px-1">{label}</label>
      <div className="rounded-2xl border border-border bg-background px-5 py-4">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-section-header font-semibold placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function Toolbar() {
  const Btn = ({ children }: { children: React.ReactNode }) => (
    <button className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
      {children}
    </button>
  );
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/40 px-3 py-2 flex-wrap">
      <select className="bg-transparent text-small px-2 py-1 rounded-md outline-none">
        <option>Aptos (Body)</option>
        <option>Inter</option>
        <option>Mono</option>
      </select>
      <select className="bg-transparent text-small px-2 py-1 rounded-md outline-none">
        <option>12</option>
        <option>14</option>
        <option>16</option>
      </select>
      <div className="w-px h-5 bg-border mx-1" />
      <Btn>
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn>
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn>
        <Underline className="h-4 w-4" />
      </Btn>
      <div className="w-px h-5 bg-border mx-1" />
      <Btn>
        <ListIcon className="h-4 w-4" />
      </Btn>
      <Btn>
        <ListOrdered className="h-4 w-4" />
      </Btn>
      <Btn>
        <ImageIcon className="h-4 w-4" />
      </Btn>
      <Btn>
        <LinkIcon className="h-4 w-4" />
      </Btn>
      <button className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-small text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <Upload className="h-3.5 w-3.5" /> Upload Resources
      </button>
    </div>
  );
}

function BodyTextarea({
  value,
  onChange,
  placeholder = "Enter the description here",
  min = 320,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: min }}
        className="w-full bg-transparent outline-none resize-none text-body placeholder:text-muted-foreground"
      />
    </div>
  );
}

function CourseEditor({
  title,
  description,
  onTitle,
  onDescription,
}: {
  title: string;
  description: string;
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
}) {
  return (
    <EditorCard>
      <div>
        <h2 className="text-section-header font-semibold">Course Details</h2>
        <p className="text-body text-muted-foreground">
          Provide a clear name and summary to define your course.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <TitleInput
            value={title}
            onChange={onTitle}
            label="Course Title"
            placeholder="Enter course name"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border text-body hover:bg-muted/60 transition-colors">
          <Upload className="h-4 w-4" /> Upload Cover Image
        </button>
      </div>
      <Toolbar />
      <BodyTextarea value={description} onChange={onDescription} min={360} />
      <div className="rounded-2xl border border-border p-5">
        <h3 className="font-semibold mb-1">Course Access Setting</h3>
        <p className="text-body text-muted-foreground">
          Controls how users will gain access to the course.
        </p>
      </div>
    </EditorCard>
  );
}

function OptionalToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="ml-auto flex items-center gap-2 text-small">
      <span className="text-muted-foreground">Optional</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted"
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function OptionalBadge({ small }: { small?: boolean }) {
  return (
    <span
      className={`${
        small ? "text-[9px] px-1 py-0" : "text-[10px] px-1.5 py-0.5"
      } uppercase tracking-wider rounded-full bg-accent text-accent-foreground`}
    >
      optional
    </span>
  );
}

function ModuleEditor({
  module: m,
  onChange,
}: {
  module: Module;
  onChange: (p: Partial<Module>) => void;
}) {
  return (
    <EditorCard>
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-section-header font-semibold">Module</h2>
        <OptionalToggle value={!!m.optional} onChange={(v) => onChange({ optional: v })} />
      </div>
      <TitleInput
        value={m.title}
        onChange={(v) => onChange({ title: v })}
        label="Module Title"
        placeholder="Enter module title"
      />
      <p className="text-body text-muted-foreground">
        Add units to this module from the curriculum on the left, then build content, quizzes, and
        assignments inside each unit.
      </p>
    </EditorCard>
  );
}

function UnitEditor({
  unit,
  onChange,
  onAdd,
}: {
  unit: Unit;
  onChange: (p: Partial<Unit>) => void;
  onAdd: (kind: UnitItemKind) => void;
}) {
  return (
    <EditorCard>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-section-header font-semibold">Unit</h2>
          <p className="text-body text-muted-foreground">
            A unit groups content lessons, a quiz, and assignments together.
          </p>
        </div>
        <OptionalToggle value={!!unit.optional} onChange={(v) => onChange({ optional: v })} />
      </div>
      <TitleInput
        value={unit.title}
        onChange={(v) => onChange({ title: v })}
        label="Unit Title"
        placeholder="Enter unit title"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <AddCard
          icon={BookOpen}
          iconClass="text-[oklch(0.65_0.16_240)]"
          title="Content"
          desc="Add reading lessons"
          onClick={() => onAdd("content")}
        />
        <AddCard
          icon={HelpCircle}
          iconClass="text-[oklch(0.7_0.18_60)]"
          title="Quiz"
          desc="Test knowledge"
          onClick={() => onAdd("quiz")}
        />
        <AddCard
          icon={ClipboardList}
          iconClass="text-[oklch(0.65_0.18_320)]"
          title="Assignment"
          desc="Hands-on work"
          onClick={() => onAdd("assignment")}
        />
        <AddCard
          icon={MessageSquare}
          iconClass="text-[oklch(0.7_0.16_160)]"
          title="Feedback"
          desc="Collect learner input"
          onClick={() => onAdd("feedback")}
        />
      </div>
    </EditorCard>
  );
}

function AddCard({
  icon: Icon,
  iconClass,
  title,
  desc,
  onClick,
}: {
  icon: any;
  iconClass?: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-dashed border-border p-4 hover:border-brand hover:bg-muted/40 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="h-9 w-9 grid place-items-center rounded-xl bg-muted">
          <Icon className={`h-4 w-4 ${iconClass ?? "text-foreground"}`} />
        </div>
        <Plus className="h-4 w-4 text-muted-foreground ml-auto" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-small text-muted-foreground">{desc}</p>
    </button>
  );
}

function ItemEditor({
  item,
  onChange,
  onAddLesson,
}: {
  item: UnitItem;
  onChange: (p: Partial<UnitItem>) => void;
  onAddLesson: () => void;
}) {
  const label =
    item.kind === "content"
      ? "Content"
      : item.kind === "quiz"
        ? "Quiz"
        : item.kind === "assignment"
          ? "Assignment"
          : "Feedback";
  const Icon =
    item.kind === "content"
      ? BookOpen
      : item.kind === "quiz"
        ? HelpCircle
        : item.kind === "assignment"
          ? ClipboardList
          : MessageSquare;
  const iconColor =
    item.kind === "content"
      ? "text-[oklch(0.65_0.16_240)]"
      : item.kind === "quiz"
        ? "text-[oklch(0.7_0.18_60)]"
        : item.kind === "assignment"
          ? "text-[oklch(0.65_0.18_320)]"
          : "text-[oklch(0.7_0.16_160)]";
  if (item.kind === "feedback") {
    return <FeedbackEditor item={item} onChange={onChange} />;
  }
  if (item.kind === "quiz") {
    return <QuizEditor item={item} onChange={onChange} />;
  }
  return (
    <EditorCard>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-muted">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-section-header font-semibold">{label}</h2>
          <p className="text-small text-muted-foreground">
            {item.kind === "content"
              ? "Group of text lessons learners read in order."
              : "A task learners submit for review."}
          </p>
        </div>
        <OptionalToggle value={!!item.optional} onChange={(v) => onChange({ optional: v })} />
      </div>
      <TitleInput
        value={item.title}
        onChange={(v) => onChange({ title: v })}
        label={`${label} Title`}
        placeholder={`Enter ${item.kind} title`}
      />
      <Toolbar />
      <BodyTextarea
        value={item.body}
        onChange={(v) => onChange({ body: v })}
        placeholder={
          item.kind === "assignment"
            ? "Describe the assignment, deliverables, and grading criteria"
            : "Overview for this content section"
        }
      />
      {item.kind === "assignment" && (
        <div className="rounded-2xl border border-dashed border-border p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 grid place-items-center rounded-xl bg-muted">
              <Upload className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Upload assignment document</p>
              <p className="text-small text-muted-foreground">
                Learners will see a readable preview of this document.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-body hover:bg-muted/60 transition-colors">
              <Upload className="h-4 w-4" /> Upload
            </button>
          </div>
          <div className="rounded-xl bg-muted/40 p-4 text-small text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Document preview</p>
            <p>
              Once uploaded, the document content will appear here in a readable view for learners
              to read inline before submitting their work.
            </p>
          </div>
        </div>
      )}
      {item.kind === "content" && (
        <button
          onClick={onAddLesson}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-body font-medium hover:opacity-90 transition-opacity w-fit"
        >
          <Plus className="h-4 w-4" /> Add Lesson
        </button>
      )}
    </EditorCard>
  );
}

function FeedbackEditor({
  item,
  onChange,
}: {
  item: UnitItem;
  onChange: (p: Partial<UnitItem>) => void;
}) {
  const multiple = item.multipleQuestions ?? false;
  const questions: FeedbackQuestion[] =
    item.questions && item.questions.length > 0
      ? item.questions
      : [{ id: uid(), title: "", label: "", ratingType: "" }];
  const [openId, setOpenId] = useState<string>(questions[questions.length - 1].id);

  const updateQuestion = (qid: string, p: Partial<FeedbackQuestion>) => {
    onChange({
      questions: questions.map((q) => (q.id === qid ? { ...q, ...p } : q)),
    });
  };
  const addQuestion = () => {
    const nq = { id: uid(), title: "", label: "", ratingType: "" };
    onChange({ questions: [...questions, nq] });
    setOpenId(nq.id);
  };
  const removeQuestion = (qid: string) => {
    if (questions.length <= 1) return;
    onChange({ questions: questions.filter((q) => q.id !== qid) });
  };

  const visibleQuestions = multiple ? questions : questions.slice(0, 1);

  return (
    <EditorCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-muted">
            <MessageSquare className="h-5 w-5 text-[oklch(0.7_0.16_160)]" />
          </div>
          <div>
            <h2 className="text-section-header font-semibold">Review &amp; Feedback</h2>
            <label className="mt-1 inline-flex items-center gap-2 text-small text-muted-foreground cursor-pointer select-none">
              <span>Multiple Questions</span>
              <button
                type="button"
                onClick={() => onChange({ multipleQuestions: !multiple })}
                aria-pressed={multiple}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  multiple ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${
                    multiple ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
        <OptionalToggle value={!!item.optional} onChange={(v) => onChange({ optional: v })} />
        <button
          type="button"
          className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </div>

      <div className="space-y-3">
        {visibleQuestions.map((q, idx) => {
          const isOpen = openId === q.id;
          const headerLabel = q.title.trim() || `Question ${String(idx + 1).padStart(2, "0")}`;
          return (
            <div
              key={q.id}
              className={`rounded-2xl border border-border ${isOpen ? "bg-card" : "bg-muted/40"}`}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : q.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
              >
                {multiple && <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="flex-1 text-body font-medium text-foreground">{headerLabel}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-small font-medium text-muted-foreground">
                      Feedback Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={q.title}
                      onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                      placeholder="e.g. Share your thoughts or rating"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-small font-medium text-muted-foreground">
                      Label Text <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={q.label}
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                      placeholder="e.g. Share your thoughts, suggestions, or experience…"
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-small font-medium text-muted-foreground">
                      Type of Rating
                    </label>
                    <div className="relative">
                      <select
                        value={q.ratingType}
                        onChange={(e) => updateQuestion(q.id, { ratingType: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-body outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Select type</option>
                        <option value="stars">Stars (1-5)</option>
                        <option value="numeric">Numeric (1-10)</option>
                        <option value="emoji">Emoji reactions</option>
                        <option value="thumbs">Thumbs up / down</option>
                        <option value="text">Text only</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  {multiple && questions.length > 1 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="flex items-center gap-1.5 text-small text-destructive hover:opacity-80 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove question
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {multiple && (
        <button
          type="button"
          onClick={addQuestion}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-border text-body font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add New Question
        </button>
      )}
    </EditorCard>
  );
}

function QuizEditor({
  item,
  onChange,
}: {
  item: UnitItem;
  onChange: (p: Partial<UnitItem>) => void;
}) {
  const quizzes: QuizQuestion[] =
    item.quizzes && item.quizzes.length > 0
      ? item.quizzes
      : [{ id: uid(), question: "", answers: [] }];
  const [openId, setOpenId] = useState<string>(quizzes[quizzes.length - 1].id);

  const updateQuiz = (qid: string, p: Partial<QuizQuestion>) => {
    onChange({ quizzes: quizzes.map((q) => (q.id === qid ? { ...q, ...p } : q)) });
  };
  const addQuiz = () => {
    const nq: QuizQuestion = { id: uid(), question: "", answers: [] };
    onChange({ quizzes: [...quizzes, nq] });
    setOpenId(nq.id);
  };
  const removeQuiz = (qid: string) => {
    if (quizzes.length <= 1) return;
    onChange({ quizzes: quizzes.filter((q) => q.id !== qid) });
  };
  const addAnswer = (q: QuizQuestion) => {
    if (q.answers.length >= 4) return;
    updateQuiz(q.id, { answers: [...q.answers, { id: uid(), text: "" }] });
  };
  const updateAnswer = (q: QuizQuestion, aid: string, text: string) => {
    updateQuiz(q.id, {
      answers: q.answers.map((a) => (a.id === aid ? { ...a, text } : a)),
    });
  };
  const removeAnswer = (q: QuizQuestion, aid: string) => {
    updateQuiz(q.id, {
      answers: q.answers.filter((a) => a.id !== aid),
      correctId: q.correctId === aid ? undefined : q.correctId,
    });
  };

  return (
    <EditorCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-muted">
            <HelpCircle className="h-5 w-5 text-[oklch(0.7_0.18_60)]" />
          </div>
          <div>
            <h2 className="text-section-header font-semibold">Quiz</h2>
            <p className="text-small text-muted-foreground">
              Add questions one by one. Each can have up to 4 answers — pick the correct one.
            </p>
          </div>
        </div>
        <OptionalToggle value={!!item.optional} onChange={(v) => onChange({ optional: v })} />
      </div>

      <div className="space-y-3">
        {quizzes.map((q, idx) => {
          const isOpen = openId === q.id;
          const headerLabel = q.question.trim() || `Question ${String(idx + 1).padStart(2, "0")}`;
          return (
            <div
              key={q.id}
              className={`rounded-2xl border border-border ${isOpen ? "bg-card" : "bg-muted/40"}`}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : q.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-body font-medium text-foreground">{headerLabel}</span>
                {q.correctId && <span className="text-xs text-muted-foreground">Correct set</span>}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-small font-medium text-muted-foreground">
                      Question <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={q.question}
                      onChange={(e) => updateQuiz(q.id, { question: e.target.value })}
                      placeholder="Enter the quiz question"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-small font-medium text-muted-foreground">
                        Answers ({q.answers.length}/4)
                      </label>
                      <span className="text-xs text-muted-foreground">
                        Click the circle to mark the correct answer
                      </span>
                    </div>
                    <div className="space-y-2">
                      {q.answers.map((a, i) => {
                        const isCorrect = q.correctId === a.id;
                        return (
                          <div
                            key={a.id}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                              isCorrect
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => updateQuiz(q.id, { correctId: a.id })}
                              aria-label="Mark correct"
                              className="shrink-0"
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <span className="text-small font-medium text-muted-foreground w-6">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <input
                              value={a.text}
                              onChange={(e) => updateAnswer(q, a.id, e.target.value)}
                              placeholder={`Answer ${i + 1}`}
                              className="flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => removeAnswer(q, a.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove answer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {q.answers.length < 4 && (
                      <button
                        type="button"
                        onClick={() => addAnswer(q)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-small font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add Answer
                      </button>
                    )}
                  </div>

                  {quizzes.length > 1 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeQuiz(q.id)}
                        className="flex items-center gap-1.5 text-small text-destructive hover:opacity-80 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove question
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addQuiz}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-border text-body font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <Plus className="h-4 w-4" /> Add New Question
      </button>
    </EditorCard>
  );
}

function LessonEditor({
  lesson,
  onChange,
}: {
  lesson: Lesson;
  onChange: (p: Partial<Lesson>) => void;
}) {
  return (
    <EditorCard>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-muted">
          <FileText className="h-5 w-5 text-[oklch(0.65_0.16_240)]" />
        </div>
        <div>
          <h2 className="text-section-header font-semibold">Lesson</h2>
          <p className="text-small text-muted-foreground">Text-based reading lesson.</p>
        </div>
        <OptionalToggle value={!!lesson.optional} onChange={(v) => onChange({ optional: v })} />
      </div>
      <TitleInput
        value={lesson.title}
        onChange={(v) => onChange({ title: v })}
        label="Lesson Title"
        placeholder="Enter lesson title"
      />
      <Toolbar />
      <BodyTextarea
        value={lesson.body}
        onChange={(v) => onChange({ body: v })}
        placeholder="Write the lesson content here…"
        min={420}
      />
    </EditorCard>
  );
}

// ----------------- Preview (View as User) -----------------

function PreviewView({
  courseTitle,
  modules,
  onExit,
}: {
  courseTitle: string;
  modules: Module[];
  onExit: () => void;
}) {
  type Sel = { mid: string; uid: string; iid: string; lid?: string };

  const firstSel: Sel | null = (() => {
    for (const m of modules) {
      for (const u of m.units) {
        const i = u.items[0];
        if (i) return { mid: m.id, uid: u.id, iid: i.id, lid: i.lessons[0]?.id };
      }
    }
    return null;
  })();

  const [sel, setSel] = useState<Sel | null>(firstSel);
  const [openMods, setOpenMods] = useState<Record<string, boolean>>(
    firstSel ? { [firstSel.mid]: true } : {},
  );
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const flatItems = useMemo(() => {
    const list: Sel[] = [];
    for (const m of modules) {
      for (const u of m.units) {
        for (const i of u.items) {
          if (i.kind === "content" && i.lessons.length) {
            for (const l of i.lessons) list.push({ mid: m.id, uid: u.id, iid: i.id, lid: l.id });
          } else {
            list.push({ mid: m.id, uid: u.id, iid: i.id });
          }
        }
      }
    }
    return list;
  }, [modules]);

  const selKey = (s: Sel) => `${s.iid}:${s.lid ?? ""}`;
  const idx = sel ? flatItems.findIndex((x) => selKey(x) === selKey(sel)) : -1;
  const totalDone = Object.values(completed).filter(Boolean).length;
  const progress = flatItems.length ? Math.round((totalDone / flatItems.length) * 100) : 0;

  const current = sel
    ? (() => {
        const m = modules.find((m) => m.id === sel.mid)!;
        const u = m.units.find((u) => u.id === sel.uid)!;
        const i = u.items.find((i) => i.id === sel.iid)!;
        const l = sel.lid ? i.lessons.find((l) => l.id === sel.lid) : undefined;
        return { m, u, i, l };
      })()
    : null;

  const moduleNum = (mid: string) =>
    String(modules.findIndex((m) => m.id === mid) + 1).padStart(2, "0");

  const goPrev = () => {
    if (idx > 0) setSel(flatItems[idx - 1]);
  };
  const goNext = () => {
    if (sel) setCompleted((c) => ({ ...c, [selKey(sel)]: true }));
    if (idx >= 0 && idx < flatItems.length - 1) setSel(flatItems[idx + 1]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[var(--gradient-brand)]" />
          <span className="font-semibold">Preview Mode</span>
          <span className="text-small text-muted-foreground">— viewing as a learner</span>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive text-white text-body font-semibold hover:opacity-90 transition-opacity"
        >
          <X className="h-4 w-4" /> Exit Preview
        </button>
      </div>

      <div className="flex-1 min-h-0 p-6 lg:p-8">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left: curriculum */}
          <aside className="col-span-12 lg:col-span-4 xl:col-span-3 h-full">
            <div className="h-full rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] flex flex-col overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <p className="font-semibold truncate">{courseTitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-small text-muted-foreground">{progress}%</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {modules.map((m) => {
                  const open = openMods[m.id] ?? false;
                  return (
                    <div key={m.id}>
                      <button
                        onClick={() => setOpenMods((o) => ({ ...o, [m.id]: !o[m.id] }))}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted/60 text-left"
                      >
                        <span className="flex-1 truncate text-body font-medium">
                          Module {moduleNum(m.id)}: {m.title}
                        </span>
                        {m.optional && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-border text-muted-foreground uppercase tracking-wide">
                            optional
                          </span>
                        )}
                        {open ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {open && (
                        <div className="pl-3 pr-1 pb-1 space-y-0.5">
                          {m.units.flatMap((u) =>
                            u.items.flatMap((i) => {
                              const rows: {
                                key: string;
                                sel: Sel;
                                title: string;
                                optional: boolean;
                              }[] =
                                i.kind === "content" && i.lessons.length
                                  ? i.lessons.map((l) => ({
                                      key: `${i.id}:${l.id}`,
                                      sel: { mid: m.id, uid: u.id, iid: i.id, lid: l.id },
                                      title: l.title,
                                      optional: !!l.optional || !!i.optional || !!u.optional,
                                    }))
                                  : [
                                      {
                                        key: `${i.id}:`,
                                        sel: { mid: m.id, uid: u.id, iid: i.id },
                                        title: i.title,
                                        optional: !!i.optional || !!u.optional,
                                      },
                                    ];
                              return rows.map((r) => {
                                const active = sel && selKey(sel) === r.key;
                                const done = !!completed[r.key];
                                return (
                                  <button
                                    key={r.key}
                                    onClick={() => setSel(r.sel)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                                      active
                                        ? "bg-[color-mix(in_oklab,var(--brand)_22%,transparent)]"
                                        : "hover:bg-muted/60"
                                    }`}
                                  >
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="flex-1 truncate text-body">{r.title}</span>
                                    {r.optional && (
                                      <span className="text-[9px] px-1 py-0 rounded-md border border-border text-muted-foreground uppercase tracking-wide">
                                        optional
                                      </span>
                                    )}
                                    {done ? (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : r.optional ? (
                                      <CircleDashed className="h-4 w-4 text-muted-foreground/50" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground/50" />
                                    )}
                                  </button>
                                );
                              });
                            }),
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right: single card content */}
          <section className="col-span-12 lg:col-span-8 xl:col-span-9 h-full">
            <div className="h-full rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-8 py-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-body text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                  {current && (
                    <>
                      <span>Module {moduleNum(current.m.id)}</span>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-foreground font-medium truncate">
                        {current.l ? current.l.title : current.i.title}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {current ? (
                  <article className="max-w-3xl space-y-5">
                    <h1 className="text-primary-header font-semibold">
                      Unit{" "}
                      {String(current.m.units.findIndex((u) => u.id === current.u.id) + 1).padStart(
                        2,
                        "0",
                      )}{" "}
                      : {current.u.title}
                    </h1>
                    <h2 className="text-section-header font-semibold">
                      {current.l ? current.l.title : current.i.title}
                    </h2>
                    <div className="text-body text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {(current.l?.body || current.i.body || "").trim() ||
                        "No content has been added yet. Switch back to the editor to add content for this section."}
                    </div>
                  </article>
                ) : (
                  <div className="grid place-items-center h-full text-muted-foreground">
                    No content yet.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-border flex items-center justify-end">
                <div className="flex items-center gap-3">
                  <button
                    onClick={goPrev}
                    disabled={idx <= 0}
                    className="flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-muted/60 transition-colors disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" /> Previous
                  </button>
                  <button
                    onClick={goNext}
                    className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Complete and Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
