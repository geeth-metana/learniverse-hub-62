import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  BookOpen,
  CircleDashed,
  Package,
  GripVertical,
  Upload,
  X,
  ImageIcon,
  Layers,
  Lock,
  Unlock,
} from "lucide-react";
import { allCoursesCombined, getCourse } from "@/lib/courses-data";
import { addProduct } from "@/lib/products-store";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SetPricingDialog } from "@/components/products/SetPricingDialog";
import type { ProductPricing } from "@/lib/products-store";

export const Route = createFileRoute("/products/new")({
  head: () => ({
    meta: [
      { title: "Create Product — Metana Platform" },
      { name: "description", content: "Bundle courses into a product package and publish it." },
    ],
  }),
  component: CreateProductPage,
});

type CourseItem = { kind: "course"; id: string; courseId: string };
type GroupItem = { kind: "group"; id: string; title: string; courseIds: string[] };
type Item = CourseItem | GroupItem;

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function CreateProductPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [optionalIds, setOptionalIds] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<"linear" | "free">("linear");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "course"; itemId: string; courseId: string; groupId?: string }
    | { kind: "group"; itemId: string }
    | null
  >(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricing, setPricing] = useState<ProductPricing | undefined>(undefined);
  const [dragActive, setDragActive] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const itemsBeforeDragRef = useRef<Item[] | null>(null);
  const groupRectsRef = useRef<Map<string, DOMRect>>(new Map());

  const captureGroupRects = () => {
    const map = new Map<string, DOMRect>();
    document.querySelectorAll<HTMLElement>("[data-group-drop]").forEach((el) => {
      const id = el.dataset.groupDrop;
      if (id) map.set(id, el.getBoundingClientRect());
    });
    groupRectsRef.current = map;
  };

  const findGroupAtPoint = (x: number, y: number): string | null => {
    for (const [id, rect] of groupRectsRef.current) {
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return id;
    }
    return null;
  };

  // All course ids currently in product (top-level + inside groups)
  const allUsedCourseIds = useMemo(() => {
    const ids: string[] = [];
    items.forEach((it) => {
      if (it.kind === "course") ids.push(it.courseId);
      else ids.push(...it.courseIds);
    });
    return ids;
  }, [items]);

  const totalCount = allUsedCourseIds.length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCoursesCombined
      .filter((c) => !allUsedCourseIds.includes(c.id))
      .filter((c) => (q ? `${c.title} ${c.description}`.toLowerCase().includes(q) : true))
      .slice(0, 6);
  }, [search, allUsedCourseIds]);

  const addCourseTopLevel = (courseId: string) => {
    if (allUsedCourseIds.includes(courseId)) return;
    setItems((prev) => [...prev, { kind: "course", id: uid("c"), courseId }]);
    setSearch("");
    setSearchOpen(false);
  };

  const addGroup = () => {
    const groupNumber = items.filter((i) => i.kind === "group").length + 1;
    setItems((prev) => [
      ...prev,
      { kind: "group", id: uid("g"), title: `Group ${groupNumber}`, courseIds: [] },
    ]);
  };

  const addCourseToGroup = (groupId: string, courseId: string) => {
    if (allUsedCourseIds.includes(courseId)) return;
    setItems((prev) =>
      prev.map((it) =>
        it.kind === "group" && it.id === groupId
          ? { ...it, courseIds: [...it.courseIds, courseId] }
          : it,
      ),
    );
  };

  const removeFromGroup = (groupId: string, courseId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.kind === "group" && it.id === groupId
          ? { ...it, courseIds: it.courseIds.filter((c) => c !== courseId) }
          : it,
      ),
    );
    setOptionalIds((prev) => prev.filter((id) => id !== courseId));
  };

  const renameGroup = (groupId: string, title: string) => {
    setItems((prev) =>
      prev.map((it) => (it.kind === "group" && it.id === groupId ? { ...it, title } : it)),
    );
  };

  const reorderGroupCourses = (groupId: string, newOrder: string[]) => {
    setItems((prev) =>
      prev.map((it) =>
        it.kind === "group" && it.id === groupId ? { ...it, courseIds: newOrder } : it,
      ),
    );
  };

  const moveCourseToGroup = (itemId: string, groupId: string, baseItems?: Item[]) => {
    setItems((prev) => {
      const source = baseItems ?? prev;
      const moving = source.find((i) => i.id === itemId);
      if (!moving || moving.kind !== "course") return prev;
      const group = source.find((i) => i.id === groupId);
      if (!group || group.kind !== "group") return prev;
      if (group.courseIds.includes(moving.courseId)) return source;
      return source
        .filter((i) => i.id !== itemId)
        .map((i) =>
          i.kind === "group" && i.id === groupId
            ? { ...i, courseIds: [...i.courseIds, moving.courseId] }
            : i,
        );
    });
  };

  const moveCourseFromGroup = (
    sourceGroupId: string,
    courseId: string,
    targetGroupId: string | null,
  ) => {
    setItems((prev) => {
      const sourceGroup = prev.find((i) => i.id === sourceGroupId);
      if (!sourceGroup || sourceGroup.kind !== "group") return prev;
      if (!sourceGroup.courseIds.includes(courseId)) return prev;
      const stripped: Item[] = prev.map((i) =>
        i.kind === "group" && i.id === sourceGroupId
          ? { ...i, courseIds: i.courseIds.filter((c) => c !== courseId) }
          : i,
      );
      if (targetGroupId === null) {
        return [...stripped, { kind: "course", id: uid("c"), courseId }];
      }
      const target = stripped.find((i) => i.id === targetGroupId);
      if (!target || target.kind !== "group") return prev;
      if (target.courseIds.includes(courseId)) return prev;
      return stripped.map((i) =>
        i.kind === "group" && i.id === targetGroupId
          ? { ...i, courseIds: [...i.courseIds, courseId] }
          : i,
      );
    });
  };

  const confirmRemove = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "course") {
      if (pendingDelete.groupId) {
        removeFromGroup(pendingDelete.groupId, pendingDelete.courseId);
      } else {
        setItems((prev) => prev.filter((it) => it.id !== pendingDelete.itemId));
        setOptionalIds((prev) => prev.filter((id) => id !== pendingDelete.courseId));
      }
    } else {
      const group = items.find((i) => i.id === pendingDelete.itemId);
      if (group && group.kind === "group") {
        setOptionalIds((prev) => prev.filter((id) => !group.courseIds.includes(id)));
      }
      setItems((prev) => prev.filter((it) => it.id !== pendingDelete.itemId));
    }
    setPendingDelete(null);
  };

  const toggleOptional = (courseId: string) => {
    setOptionalIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = () => {
    if (!title.trim()) {
      toast.error("Please add a product title");
      return;
    }
    if (totalCount === 0) {
      toast.error("Add at least one course before publishing");
      return;
    }
    const emptyGroup = items.find((it) => it.kind === "group" && it.courseIds.length === 0);
    if (emptyGroup) {
      toast.error("Remove or fill empty groups before publishing");
      return;
    }
    setPricingOpen(true);
  };

  const handleSavePricing = (next: ProductPricing) => {
    setPricing(next);
    setPricingOpen(false);
    addProduct({
      title: title.trim(),
      description: description.trim(),
      image: image ?? undefined,
      courseIds: allUsedCourseIds,
      prerequisiteId: null,
      published: true,
      items,
      optionalIds,
      accessibility,
      pricing: next,
    });
    toast.success("Product published");
    navigate({ to: "/products" });
  };





  let positionCounter = 0;
  const positionMap = new Map<string, number>();
  items.forEach((it) => {
    if (it.kind === "course") {
      positionCounter += 1;
      positionMap.set(it.courseId, positionCounter);
    } else {
      it.courseIds.forEach((cid) => {
        positionCounter += 1;
        positionMap.set(cid, positionCounter);
      });
    }
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => navigate({ to: "/products" })}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition-colors"
                aria-label="Back to products"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-primary-header font-bold text-foreground">Create Product</h1>
                <p className="mt-1 text-body text-muted-foreground">
                  Bundle courses into a product. Group courses or mark them as optional.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
              {/* Left: form */}
              <div className="space-y-6">
                <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <h2 className="text-second-header font-semibold text-foreground">Product details</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-small font-semibold text-foreground">
                        Title
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Web3 Career Track"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-small font-semibold text-foreground">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What's included and who's it for?"
                        rows={3}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-small font-semibold text-foreground">
                        Cover image
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFile(f);
                        }}
                      />
                      {image ? (
                        <div className="relative overflow-hidden rounded-2xl border border-border">
                          <img src={image} alt="cover" className="h-44 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImage(null)}
                            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground shadow-[var(--shadow-soft)] hover:bg-background"
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragActive(true);
                          }}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragActive(false);
                            const f = e.dataTransfer.files?.[0];
                            if (f) handleFile(f);
                          }}
                          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                            dragActive
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-small font-semibold text-foreground">
                            Drag & drop or click to browse
                          </p>
                          <p className="text-smaller text-muted-foreground">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-second-header font-semibold text-foreground">Add courses</h2>
                      <span className="text-small text-muted-foreground">{totalCount} added</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Accessibility checkbox */}
                      <label
                        htmlFor="accessibility-linear"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 pl-[6px] pr-[10px]"
                      >
                        <Checkbox
                          id="accessibility-linear"
                          checked={accessibility === "linear"}
                          onCheckedChange={(v) => setAccessibility(v ? "linear" : "free")}
                          className="h-4 w-4 rounded-full"
                          aria-label="Linear access"
                        />
                        <span className="text-smaller font-semibold text-foreground">Linear</span>
                      </label>
                      <button
                        type="button"
                        onClick={addGroup}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-smaller font-semibold text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <Layers className="h-3.5 w-3.5" /> Add group
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-smaller text-muted-foreground">
                    {accessibility === "linear"
                      ? "Learners must complete each course before unlocking the next. Courses inside a group unlock together."
                      : "Learners can access any course at any time."}
                  </p>

                  <div ref={searchRef} className="relative mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setSearchOpen(true);
                        }}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="Search courses..."
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    {searchOpen && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-[var(--shadow-soft-hover)]">
                        {suggestions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => addCourseTopLevel(c.id)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted transition-colors"
                          >
                            <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-small font-semibold text-foreground">
                                {c.title}
                              </p>
                              <p className="truncate text-smaller text-muted-foreground">{c.meta}</p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-smaller font-semibold text-foreground">
                              <Plus className="h-3.5 w-3.5" /> Add Course
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchOpen && search.trim() && suggestions.length === 0 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-border bg-popover p-4 text-center text-small text-muted-foreground shadow-[var(--shadow-soft-hover)]">
                        No matching courses
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    {items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border py-10 text-center text-body text-muted-foreground">
                        No courses added yet. Search above or add a group.
                      </div>
                    ) : (
                      <Reorder.Group
                        axis="y"
                        values={items}
                        onReorder={setItems}
                        className="space-y-2"
                      >
                        <AnimatePresence initial={false}>
                          {items.map((it) => {
                            if (it.kind === "course") {
                              const c = getCourse(it.courseId);
                              if (!c) return null;
                              const isOptional = optionalIds.includes(c.id);
                              const pos = positionMap.get(c.id);
                              return (
                                <Reorder.Item
                                  key={it.id}
                                  value={it}
                                  layout
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -8 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                  className={`flex items-center gap-3 rounded-2xl border bg-background p-3 transition-opacity ${
                                    draggingItemId === it.id
                                      ? "opacity-80 border-primary"
                                      : "border-border"
                                  }`}
                                  whileDrag={{ scale: 1.02, boxShadow: "var(--shadow-soft-hover)", zIndex: 30 }}
                                   onDragStart={() => {
                                    setDraggingItemId(it.id);
                                    itemsBeforeDragRef.current = items;
                                    captureGroupRects();
                                  }}
                                  onDrag={(_, info) => {
                                    setHoveredGroupId(findGroupAtPoint(info.point.x, info.point.y));
                                  }}
                                  onDragEnd={(_, info) => {
                                    const groupId = findGroupAtPoint(info.point.x, info.point.y);
                                    if (groupId && groupId !== it.id) {
                                      moveCourseToGroup(
                                        it.id,
                                        groupId,
                                        itemsBeforeDragRef.current ?? undefined,
                                      );
                                    }
                                    setDraggingItemId(null);
                                    setHoveredGroupId(null);
                                    itemsBeforeDragRef.current = null;
                                  }}
                                >
                                  <CourseRow
                                    title={c.title}
                                    meta={c.meta}
                                    pos={pos}
                                    isOptional={isOptional}
                                    onToggleOptional={() => toggleOptional(c.id)}
                                    onRemove={() =>
                                      setPendingDelete({
                                        kind: "course",
                                        itemId: it.id,
                                        courseId: c.id,
                                      })
                                    }
                                  />
                                </Reorder.Item>
                              );
                            }
                            // Group
                            const isDropTarget =
                              draggingItemId !== null &&
                              draggingItemId !== it.id &&
                              hoveredGroupId === it.id;
                            return (
                              <Reorder.Item
                                key={it.id}
                                value={it}
                                layout
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                data-group-drop={it.id}
                                className={`rounded-2xl border-2 border-dashed bg-muted/30 p-3 transition-colors ${
                                  isDropTarget ? "border-primary bg-primary/5" : "border-border"
                                }`}
                                whileDrag={{ scale: 1.02, boxShadow: "var(--shadow-soft-hover)" }}
                              >
                                <GroupBlock
                                  group={it}
                                  optionalIds={optionalIds}
                                  positionMap={positionMap}
                                  onRename={(t) => renameGroup(it.id, t)}
                                  onReorderCourses={(order) => reorderGroupCourses(it.id, order)}
                                  onToggleOptional={toggleOptional}
                                  onRemoveCourse={(cid) =>
                                    setPendingDelete({
                                      kind: "course",
                                      itemId: it.id,
                                      courseId: cid,
                                      groupId: it.id,
                                    })
                                  }
                                  onRemoveGroup={() =>
                                    setPendingDelete({ kind: "group", itemId: it.id })
                                  }
                                  draggingCourseId={draggingItemId}
                                  onCourseDragStart={(cid) => {
                                    setDraggingItemId(cid);
                                    captureGroupRects();
                                  }}
                                  onCourseDrag={(_cid, point) => {
                                    setHoveredGroupId(findGroupAtPoint(point.x, point.y));
                                  }}
                                  onCourseDragEnd={(cid, point) => {
                                    const target = findGroupAtPoint(point.x, point.y);
                                    if (target === it.id) {
                                      // dropped within own group — no move
                                    } else {
                                      moveCourseFromGroup(it.id, cid, target);
                                    }
                                    setDraggingItemId(null);
                                    setHoveredGroupId(null);
                                  }}
                                />
                              </Reorder.Item>
                            );
                          })}
                        </AnimatePresence>
                      </Reorder.Group>
                    )}
                  </div>
                </section>
              </div>

              {/* Right: preview */}
              <aside
                className="lg:sticky lg:top-6 self-start relative rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(206,252,4,0.02), rgba(91,236,215,0.02))",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{
                    padding: "1.5px",
                    background: "linear-gradient(135deg, #CEFC04, #5BECD7)",
                    WebkitMask:
                      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
                <h2 className="text-second-header font-semibold text-foreground">Preview</h2>
                <div
                  className="mt-4 relative h-32 overflow-hidden rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.94 0.08 280), oklch(0.9 0.12 320))",
                  }}
                >
                  {image ? (
                    <img src={image} alt="cover" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-foreground/60">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <p className="mt-4 text-second-header font-bold text-foreground">
                  {title || "Untitled product"}
                </p>
                <p className="mt-1 text-small text-muted-foreground line-clamp-3">
                  {description || "Add a description to give learners context."}
                </p>
                <div className="mt-3 flex items-center gap-2 text-smaller text-muted-foreground">
                  {accessibility === "linear" ? (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Linear unlock
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5" /> Free-form access
                    </>
                  )}
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <PreviewList
                    items={items}
                    optionalIds={optionalIds}
                  />
                </div>
                <button
                  onClick={handlePublish}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-button-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Package className="h-4 w-4" /> Publish Product
                </button>
              </aside>
            </div>
          </div>
        </main>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.kind === "group" ? "Remove group?" : "Remove course?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "group"
                ? "This will remove the group and all courses inside it from the product."
                : "This will remove the course from the product. You can add it back from the search."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-center gap-3 sm:justify-center sm:space-x-0">
            <AlertDialogCancel className="mt-0 flex-1 rounded-full border-border bg-background hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SetPricingDialog
        open={pricingOpen}
        onOpenChange={setPricingOpen}
        title={title}
        description={description}
        image={image}
        initial={pricing}
        onSave={handleSavePricing}
      />
    </div>
  );
}


function CourseRow({
  title,
  meta,
  pos,
  isOptional,
  onToggleOptional,
  onRemove,
  compact = false,
}: {
  title: string;
  meta: string;
  pos?: number;
  isOptional: boolean;
  onToggleOptional: () => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  return (
    <>
      <span
        className="grid h-8 w-8 shrink-0 cursor-grab place-items-center rounded-full text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label="Drag to reorder"
        title="Drag to reorder or drop into a group"
      >
        <GripVertical className="h-4 w-4" />
      </span>
      {!compact && pos !== undefined && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-small font-semibold text-foreground">
          {pos}
        </span>
      )}
      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-semibold text-foreground">{title}</p>
        <p className="truncate text-smaller text-muted-foreground">{meta}</p>
      </div>
      {isOptional && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.05_240)] px-2.5 py-1 text-smaller font-semibold text-foreground">
          <CircleDashed className="h-3 w-3" /> Optional
        </span>
      )}
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleOptional}
              className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${
                isOptional
                  ? "border-transparent bg-[oklch(0.94_0.05_240)] text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
              aria-label="Mark as optional"
            >
              <CircleDashed className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-center">
            <p className="font-semibold">
              {isOptional ? "Marked as Optional" : "Mark as Optional"}
            </p>
            <p className="text-smaller text-muted-foreground">
              When enabled, the course becomes non-mandatory. Students can choose whether to
              complete it or skip it.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <button
        onClick={onRemove}
        className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        aria-label="Remove course"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}

function GroupBlock({
  group,
  optionalIds,
  positionMap,
  onRename,
  onReorderCourses,
  onToggleOptional,
  onRemoveCourse,
  onRemoveGroup,
  draggingCourseId,
  onCourseDragStart,
  onCourseDrag,
  onCourseDragEnd,
}: {
  group: GroupItem;
  optionalIds: string[];
  positionMap: Map<string, number>;
  onRename: (t: string) => void;
  onReorderCourses: (order: string[]) => void;
  onToggleOptional: (courseId: string) => void;
  onRemoveCourse: (courseId: string) => void;
  onRemoveGroup: () => void;
  draggingCourseId: string | null;
  onCourseDragStart: (courseId: string) => void;
  onCourseDrag: (courseId: string, point: { x: number; y: number }) => void;
  onCourseDragEnd: (courseId: string, point: { x: number; y: number }) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="grid h-8 w-8 shrink-0 cursor-grab place-items-center rounded-full text-muted-foreground hover:bg-background active:cursor-grabbing"
          title="Drag group"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={group.title}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 min-w-0 rounded-lg bg-transparent px-2 py-1 text-small font-semibold text-foreground hover:bg-background focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-smaller text-muted-foreground">{group.courseIds.length} in group</span>
        <button
          onClick={onRemoveGroup}
          className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          aria-label="Remove group"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {group.courseIds.length > 0 ? (
        <Reorder.Group
          axis="y"
          values={group.courseIds}
          onReorder={onReorderCourses}
          className="space-y-2 pl-4 border-l-2 border-dashed border-border ml-3"
        >
          <AnimatePresence initial={false}>
            {group.courseIds.map((cid) => {
              const c = getCourse(cid);
              if (!c) return null;
              const isOptional = optionalIds.includes(cid);
              return (
                <Reorder.Item
                  key={cid}
                  value={cid}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className={`flex items-center gap-3 rounded-2xl border bg-background p-2.5 transition-opacity ${
                    draggingCourseId === cid ? "opacity-80 border-primary" : "border-border"
                  }`}
                  whileDrag={{ scale: 1.02, boxShadow: "var(--shadow-soft-hover)", zIndex: 30 }}
                  onDragStart={() => onCourseDragStart(cid)}
                  onDrag={(_, info) => onCourseDrag(cid, info.point)}
                  onDragEnd={(_, info) => onCourseDragEnd(cid, info.point)}
                >
                  <CourseRow
                    title={c.title}
                    meta={c.meta}
                    pos={positionMap.get(cid)}
                    isOptional={isOptional}
                    onToggleOptional={() => onToggleOptional(cid)}
                    onRemove={() => onRemoveCourse(cid)}
                  />
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <div className="ml-3 pl-4 border-l-2 border-dashed border-border">
          <p className="rounded-xl border border-dashed border-border bg-background/50 px-3 py-3 text-smaller text-muted-foreground">
            Drag a course here to add it to this group.
          </p>
        </div>
      )}
    </div>
  );
}

function PreviewList({ items, optionalIds }: { items: Item[]; optionalIds: string[] }) {
  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((it) => {
          if (it.kind === "course") {
            const c = getCourse(it.courseId);
            if (!c) return null;
            const isOptional = optionalIds.includes(c.id);
            return (
              <motion.li
                key={it.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-small text-foreground"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{c.title}</span>
                {isOptional && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.05_240)] px-2 py-0.5 text-smaller font-semibold">
                    <CircleDashed className="h-3 w-3" /> Optional
                  </span>
                )}
              </motion.li>
            );
          }
          return (
            <motion.li
              key={it.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="rounded-lg border border-dashed border-border px-2 py-1.5"
            >
              <div className="flex items-center gap-2 text-smaller font-semibold text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                <span className="truncate">{it.title}</span>
                <span className="ml-auto">unlocks together</span>
              </div>
              <ul className="mt-1 space-y-1 pl-5">
                {it.courseIds.map((cid) => {
                  const c = getCourse(cid);
                  if (!c) return null;
                  const isOptional = optionalIds.includes(cid);
                  return (
                    <li
                      key={cid}
                      className="flex items-center gap-2 text-small text-foreground"
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1">{c.title}</span>
                      {isOptional && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.05_240)] px-2 py-0.5 text-smaller font-semibold">
                          <CircleDashed className="h-3 w-3" /> Optional
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
