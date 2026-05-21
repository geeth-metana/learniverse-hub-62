import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  GripVertical,
  Plus,
  Trash2,
  CreditCard,
  CalendarClock,
  Sparkles,
  Check,
} from "lucide-react";
import type { ProductPricing, InstallmentPlan } from "@/lib/products-store";

type Method = "upfront" | "installment";

const METHOD_META: Record<Method, { title: string; subtitle: string; icon: React.ReactNode }> = {
  upfront: {
    title: "Upfront Payment",
    subtitle: "One-time payment with optional discount",
    icon: <CreditCard className="h-4 w-4" />,
  },
  installment: {
    title: "Installment Plan",
    subtitle: "Initial payment + monthly installments",
    icon: <CalendarClock className="h-4 w-4" />,
  },
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmt(n: number) {
  if (!isFinite(n)) return "$0";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function SetPricingDialog({
  open,
  onOpenChange,
  title,
  description,
  image,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  image: string | null;
  onSave: (pricing: ProductPricing) => void;
  initial?: ProductPricing;
}) {
  const [active, setActive] = useState<Method[]>(() => {
    const a: Method[] = [];
    if (initial?.upfront?.enabled) a.push("upfront");
    if (initial?.installment?.enabled) a.push("installment");
    return a;
  });

  // upfront state
  const [totalPrice, setTotalPrice] = useState<number>(initial?.upfront?.totalPrice ?? 1000);
  const [discountPct, setDiscountPct] = useState<number>(initial?.upfront?.discountPct ?? 0);

  // installment state
  const [deposit, setDeposit] = useState<number>(initial?.installment?.deposit ?? 200);
  const [fullPrice, setFullPrice] = useState<number>(initial?.installment?.fullPrice ?? 1200);
  const [plans, setPlans] = useState<InstallmentPlan[]>(
    initial?.installment?.plans ?? [
      { id: uid(), months: 3 },
      { id: uid(), months: 6 },
    ],
  );

  const [dragOver, setDragOver] = useState(false);
  const [draggingMethod, setDraggingMethod] = useState<Method | null>(null);

  const discountAmount = useMemo(
    () => Math.max(0, (totalPrice * discountPct) / 100),
    [totalPrice, discountPct],
  );
  const finalPrice = useMemo(
    () => Math.max(0, totalPrice - discountAmount),
    [totalPrice, discountAmount],
  );
  const totalWithInitial = useMemo(() => fullPrice + deposit, [fullPrice, deposit]);

  const addMethod = (m: Method) => {
    setActive((prev) => (prev.includes(m) ? prev : [...prev, m]));
  };
  const removeMethod = (m: Method) => {
    setActive((prev) => prev.filter((x) => x !== m));
  };
  const isActive = (m: Method) => active.includes(m);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const m = e.dataTransfer.getData("text/method") as Method;
    if (m === "upfront" || m === "installment") addMethod(m);
    setDraggingMethod(null);
  };

  const addPlan = () => setPlans((p) => [...p, { id: uid(), months: 12 }]);
  const removePlan = (id: string) => setPlans((p) => p.filter((x) => x.id !== id));
  const updatePlan = (id: string, months: number) =>
    setPlans((p) => p.map((x) => (x.id === id ? { ...x, months } : x)));

  const handleSave = () => {
    const pricing: ProductPricing = {};
    if (isActive("upfront")) {
      pricing.upfront = { enabled: true, totalPrice, discountPct };
    }
    if (isActive("installment")) {
      pricing.installment = { enabled: true, deposit, fullPrice, plans };
    }
    onSave(pricing);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm
            data-[state=open]:animate-[apple-fade-in_400ms_cubic-bezier(0.32,0.72,0,1)]
            data-[state=closed]:animate-[apple-fade-out_280ms_cubic-bezier(0.32,0.72,0,1)]"
        />
        <DialogPrimitive.Content className="fixed inset-0 z-50 grid place-items-center p-4 outline-none">
          <div className="pointer-events-auto relative flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-background shadow-[0_30px_80px_-20px_oklch(0.381_0.063_259/0.3)]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border px-8 py-5">
              <div>
                <DialogPrimitive.Title className="text-second-header font-bold tracking-tight">
                  Set Pricing
                </DialogPrimitive.Title>
                <p className="mt-1 text-small text-muted-foreground">
                  Configure payment plans for this product
                </p>
              </div>
              <DialogPrimitive.Close
                className="h-9 w-9 rounded-full grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {/* Body */}
            <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
              {/* LEFT: Builder */}
              <div className="space-y-6">
                {/* Available methods */}
                <section>
                  <h3 className="mb-3 text-small font-semibold uppercase tracking-wide text-muted-foreground">
                    Payment Methods
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(["upfront", "installment"] as Method[]).map((m) => {
                      const used = isActive(m);
                      return (
                        <motion.button
                          key={m}
                          type="button"
                          draggable={!used}
                          onDragStart={(e) => {
                            (e as unknown as React.DragEvent).dataTransfer.setData(
                              "text/method",
                              m,
                            );
                            setDraggingMethod(m);
                          }}
                          onDragEnd={() => setDraggingMethod(null)}
                          onClick={() => !used && addMethod(m)}
                          whileHover={{ y: used ? 0 : -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`group relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                            used
                              ? "border-dashed border-border bg-muted/40 opacity-60 cursor-not-allowed"
                              : "border-border bg-card cursor-grab active:cursor-grabbing hover:border-foreground/30 hover:shadow-[0_8px_24px_-12px_oklch(0.381_0.063_259/0.2)]"
                          }`}
                        >
                          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-foreground">
                                {METHOD_META[m].icon}
                              </span>
                              <span className="text-body font-semibold">
                                {METHOD_META[m].title}
                              </span>
                            </div>
                            <p className="mt-1.5 text-small text-muted-foreground">
                              {METHOD_META[m].subtitle}
                            </p>
                          </div>
                          {used && (
                            <span className="flex items-center gap-1 text-smaller font-semibold text-foreground">
                              <Check className="h-3 w-3" /> Added
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* Drop zone / active configs */}
                <section
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : active.length === 0
                        ? "border-border bg-muted/30"
                        : "border-transparent bg-transparent p-0"
                  }`}
                >
                  {active.length === 0 ? (
                    <div className="grid place-items-center py-10 text-center">
                      <Sparkles className="mb-2 h-6 w-6 text-muted-foreground" />
                      <p className="text-body font-medium">Drop a payment method here</p>
                      <p className="mt-1 text-small text-muted-foreground">
                        Or click a card above to add it
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {isActive("upfront") && (
                          <motion.div
                            key="upfront-config"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_8px_-4px_oklch(0.381_0.063_259/0.08)]"
                          >
                            <ConfigHeader
                              icon={METHOD_META.upfront.icon}
                              title="Upfront Payment"
                              onRemove={() => removeMethod("upfront")}
                            />
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <NumberField
                                label="Total Course Price"
                                prefix="$"
                                value={totalPrice}
                                onChange={setTotalPrice}
                              />
                              <NumberField
                                label="Discount %"
                                suffix="%"
                                value={discountPct}
                                onChange={setDiscountPct}
                              />
                            </div>
                            <div className="mt-4 rounded-xl bg-muted/50 p-4">
                              <SummaryRow label="Original price" value={fmt(totalPrice)} />
                              <SummaryRow
                                label="Discount"
                                value={`− ${fmt(discountAmount)}`}
                                muted
                              />
                              <div className="my-2 border-t border-dashed border-border" />
                              <SummaryRow
                                label="Final payable"
                                value={fmt(finalPrice)}
                                emphasis
                              />
                            </div>
                          </motion.div>
                        )}

                        {isActive("installment") && (
                          <motion.div
                            key="installment-config"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_8px_-4px_oklch(0.381_0.063_259/0.08)]"
                          >
                            <ConfigHeader
                              icon={METHOD_META.installment.icon}
                              title="Installment Plan"
                              onRemove={() => removeMethod("installment")}
                            />
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <NumberField
                                label="Full Course Price"
                                prefix="$"
                                value={fullPrice}
                                onChange={setFullPrice}
                              />
                              <NumberField
                                label="Initial Payment"
                                prefix="$"
                                value={deposit}
                                onChange={setDeposit}
                                labelClassName="text-body font-bold text-foreground"
                              />
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <p className="text-small font-semibold text-foreground">
                                Duration options
                              </p>
                              <button
                                type="button"
                                onClick={addPlan}
                                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-smaller font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
                              >
                                <Plus className="h-3 w-3" /> Add plan
                              </button>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <AnimatePresence initial={false}>
                                {plans.map((p) => {
                                  const monthly = p.months > 0 ? fullPrice / p.months : 0;
                                  return (
                                    <motion.div
                                      key={p.id}
                                      initial={{ opacity: 0, scale: 0.96 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.96 }}
                                      className="rounded-xl border border-border bg-background p-3"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min={1}
                                            value={p.months}
                                            onChange={(e) =>
                                              updatePlan(p.id, Number(e.target.value) || 0)
                                            }
                                            className="w-14 rounded-md border border-border bg-background px-2 py-1 text-body font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                                          />
                                          <span className="text-small text-muted-foreground">
                                            months
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removePlan(p.id)}
                                          className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                      <div className="mt-2 flex items-baseline justify-between">
                                        <span className="text-smaller text-muted-foreground">
                                          Monthly
                                        </span>
                                        <span className="text-second-header font-bold text-foreground">
                                          {fmt(monthly)}
                                        </span>
                                      </div>
                                      <p className="mt-0.5 text-smaller text-muted-foreground">
                                        Starting first month after enrollment
                                      </p>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>

                            <div className="mt-4 rounded-xl bg-muted/50 p-4">
                              <SummaryRow label="Initial Payment" value={fmt(deposit)} />
                              <SummaryRow label="Course Price" value={fmt(fullPrice)} muted />
                              <SummaryRow label="Total" value={fmt(totalWithInitial)} emphasis />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Hint zone when something is active and being dragged */}
                      {draggingMethod && !isActive(draggingMethod) && (
                        <div className="rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 py-6 text-center text-small text-primary">
                          Release to add {METHOD_META[draggingMethod].title}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* RIGHT: Live preview */}
              <aside className="sticky top-6 self-start space-y-3">
                <h3 className="text-small font-semibold uppercase tracking-wide text-muted-foreground">
                  Live Preview
                </h3>
                <div className="relative rounded-2xl bg-card shadow-[0_8px_24px_-12px_oklch(0.381_0.063_259/0.15)]">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{
                      padding: "1.5px",
                      background: "linear-gradient(135deg, #CEFC04, #5BECD7)",
                      WebkitMask:
                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  />
                  <div
                    className="overflow-hidden rounded-2xl"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, rgba(206,252,4,0.02), rgba(91,236,215,0.02))",
                    }}
                  >
                  <div className="p-4">
                    <h4 className="text-second-header font-bold tracking-tight">
                      {title || "Untitled product"}
                    </h4>

                    <div className="mt-4 space-y-3">
                      {active.length === 0 && (
                        <p className="rounded-xl bg-muted/50 p-3 text-center text-small text-muted-foreground">
                          No pricing configured yet
                        </p>
                      )}

                      {isActive("upfront") && (
                        <div className="rounded-xl border border-border bg-background p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-smaller font-semibold uppercase tracking-wide text-muted-foreground">
                              Upfront
                            </span>
                            {discountPct > 0 && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-smaller font-semibold text-foreground">
                                {discountPct}% off
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-primary-header font-bold tracking-tight">
                              {fmt(finalPrice)}
                            </span>
                            {discountPct > 0 && (
                              <span className="text-small text-muted-foreground line-through">
                                {fmt(totalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {isActive("installment") && (
                        <div className="rounded-xl border border-border bg-background p-3">
                          <span className="text-smaller font-semibold uppercase tracking-wide text-muted-foreground">
                            Installments
                          </span>
                          <p className="mt-1 text-body font-bold text-foreground">
                            {fmt(deposit)} initial payment, then
                          </p>
                          <div className="mt-2 grid grid-cols-1 gap-2">
                            {plans.map((p) => {
                              const monthly = p.months > 0 ? fullPrice / p.months : 0;
                              return (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full border border-dashed border-foreground/50" />
                                    <span className="text-small font-medium">
                                      {p.months} months
                                    </span>
                                  </div>
                                  <span className="text-body font-bold">
                                    {fmt(monthly)}
                                    <span className="text-smaller font-normal text-muted-foreground">
                                      /mo
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-2">
                            <span className="text-smaller font-semibold uppercase tracking-wide text-muted-foreground">
                              Total
                            </span>
                            <span className="text-body font-bold text-foreground">
                              {fmt(totalWithInitial)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              </aside>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-background px-8 py-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full border border-border bg-background px-5 py-2.5 text-button-primary font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-primary px-5 py-2.5 text-button-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Save Pricing
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ConfigHeader({
  icon,
  title,
  onRemove,
}: {
  icon: React.ReactNode;
  title: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-foreground">
          {icon}
        </span>
        <span className="text-body font-semibold">{title}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  labelClassName,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  labelClassName?: string;
}) {
  return (
    <label className="block">
      <span className={cn("text-smaller font-semibold text-muted-foreground", labelClassName)}>{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-border bg-background focus-within:ring-1 focus-within:ring-ring">
        {prefix && (
          <span className="pl-3 text-small text-muted-foreground">{prefix}</span>
        )}
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full bg-transparent px-2 py-2 text-body font-semibold focus:outline-none"
        />
        {suffix && (
          <span className="pr-3 text-small text-muted-foreground">{suffix}</span>
        )}
      </div>
    </label>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className={`text-small ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {label}
      </span>
      <span
        className={
          emphasis
            ? "text-second-header font-bold text-foreground"
            : muted
              ? "text-small text-muted-foreground"
              : "text-body font-semibold text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
