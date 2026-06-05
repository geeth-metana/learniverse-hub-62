import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, CreditCard, DollarSign, Building2, Lock, Check, Clock } from "@/components/icons";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { plans, type PlanId, getCourse } from "@/lib/courses-data";
import { useEnrollments } from "@/lib/enrollment";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courseId: string | null;
  initialPlan?: PlanId;
};

export function GetAccessDialog({ open, onOpenChange, courseId, initialPlan }: Props) {
  const navigate = useNavigate();
  const { set } = useEnrollments();

  const [plan, setPlan] = useState<PlanId>(initialPlan ?? "plan-01");
  const [method, setMethod] = useState<"card" | "cashapp" | "bank">("card");
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [promo, setPromo] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [billing, setBilling] = useState<"upfront" | "installment">("upfront");
  const [showPlan, setShowPlan] = useState(false);

  // Reset internal view whenever the dialog opens fresh
  useEffect(() => {
    if (open) setPurchased(false);
  }, [open]);

  // Sync incoming initialPlan when reopening
  if (initialPlan && initialPlan !== plan && !submitting) {
    // no-op — initialPlan is only honored on mount; safe to ignore
  }

  const selectedPlan = plans.find((p) => p.id === plan)!;
  const baseAmount =
    billing === "installment" ? selectedPlan.monthlyEnrollment : selectedPlan.price;
  const discount = promo.trim().toUpperCase() === "METANA10" ? Math.round(baseAmount * 0.1) : 0;
  const total = baseAmount - discount;
  const course = courseId ? getCourse(courseId) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setSubmitting(true);
    toast.loading("Processing payment with Stripe...", { id: "pay" });
    setTimeout(() => {
      set(courseId, {
        status: "pending",
        plan,
        email: email || "guest@metana.io",
        purchasedAt: Date.now(),
      });
      toast.success("Payment received! Pending approval.", { id: "pay" });
      setSubmitting(false);
      setPurchased(true);
    }, 900);
  };

  const goToCourse = () => {
    if (!courseId) return;
    onOpenChange(false);
    navigate({ to: "/courses/$courseId", params: { courseId } });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm
            data-[state=open]:animate-[apple-fade-in_400ms_cubic-bezier(0.32,0.72,0,1)]
            data-[state=closed]:animate-[apple-fade-out_280ms_cubic-bezier(0.32,0.72,0,1)]"
        />
        <DialogPrimitive.Content className="pricing-dialog-content fixed inset-0 z-50 grid place-items-center p-4 outline-none">
          <div className="pricing-dialog-panel pointer-events-auto relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-background shadow-[0_30px_80px_-20px_oklch(0.381_0.063_259/0.25)]">
            <DialogPrimitive.Close
              className="absolute right-5 top-5 z-10 h-9 w-9 rounded-full grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>

            {purchased ? (
              <div className="p-10 md:p-14">
                <DialogPrimitive.Title asChild>
                  <h2 className="text-primary-header font-extrabold tracking-tight">
                    Payment received{" "}
                    <span className="text-muted-foreground">— pending approval</span>
                  </h2>
                </DialogPrimitive.Title>
                <p className="mt-3 text-body text-muted-foreground max-w-xl">
                  Thanks{course ? ` for joining ${course.title}` : ""}. Our team is reviewing your
                  enrollment and will activate access shortly.
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-2xl border-2 border-brand bg-card p-6 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-5 w-5 text-warning" />
                      <h3 className="font-bold">Pending approval</h3>
                    </div>
                    <p className="text-body text-muted-foreground">
                      You'll receive an email once your enrollment is approved. You can track status
                      on the course page.
                    </p>
                    <button
                      type="button"
                      onClick={goToCourse}
                      className="mt-5 w-full py-3.5 rounded-full bg-brand text-foreground text-button-primary font-semibold hover:bg-brand/90 transition-colors"
                    >
                      Go to course page
                    </button>
                  </div>

                  <div className="rounded-2xl border-2 border-dashed border-border p-6">
                    <p className="text-small font-semibold text-muted-foreground">Selected plan</p>
                    <p className="mt-1 text-second-header font-bold">{selectedPlan.name}</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-primary-header font-extrabold">
                        ${total.toLocaleString()}
                      </span>
                      {discount > 0 && (
                        <span className="text-small text-muted-foreground line-through">
                          ${selectedPlan.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="my-4 border-t border-border" />
                    <ul className="space-y-2 text-body">
                      {[
                        "Live mentor support",
                        "Weekly code reviews",
                        "Career coaching",
                        "Lifetime access",
                      ].map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-brand" strokeWidth={3} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-12 p-10 md:p-14 md:grid-cols-2 md:gap-20">
                {/* Left */}
                <div>
                  <DialogPrimitive.Title asChild>
                    <h2 className="text-primary-header font-extrabold tracking-tight">
                      Get access <span className="text-muted-foreground">to the course</span>
                    </h2>
                  </DialogPrimitive.Title>
                  <p className="mt-3 text-body text-muted-foreground max-w-md">
                    Choose the payment method that works best for you and complete your course
                    purchase securely and easily.
                  </p>

                  <h3 className="text-second-header font-bold mt-7 mb-4">Choose Your Plan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {plans.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPlan(p.id)}
                        type="button"
                        className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
                          plan === p.id
                            ? "border-brand shadow-[var(--shadow-soft)]"
                            : "border-border hover:border-foreground/20"
                        }`}
                      >
                        {plan === p.id && (
                          <span className="absolute top-3 right-3 h-6 w-6 rounded-full bg-brand grid place-items-center">
                            <Check className="h-3.5 w-3.5 text-foreground" strokeWidth={3} />
                          </span>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{p.name}</span>
                          {p.popular && (
                            <span className="text-smaller font-semibold px-2 py-0.5 rounded-full bg-brand-light text-foreground">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-primary-header font-extrabold">
                            ${p.price.toLocaleString()}
                          </span>
                          {p.original && (
                            <span className="text-muted-foreground line-through text-small">
                              ${p.original.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-small mt-1">Upfront</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border-2 border-dashed border-border p-5">
                    <button
                      type="button"
                      onClick={() => setShowPlan((v) => !v)}
                      className="w-full flex items-center justify-between text-body"
                    >
                      <span className="font-semibold">Payment Plan</span>
                      <span className="text-muted-foreground inline-flex items-center gap-1">
                        Choose your plan
                        <svg
                          viewBox="0 0 12 12"
                          className={`h-3 w-3 transition-transform ${showPlan ? "rotate-180" : ""}`}
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            d="M2 4l4 4 4-4"
                          />
                        </svg>
                      </span>
                    </button>

                    {showPlan && (
                      <div className="mt-4 rounded-xl bg-muted/40 divide-y divide-border overflow-hidden">
                        {[
                          { id: "upfront" as const, label: "Upfront" },
                          { id: "installment" as const, label: "Installment" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setBilling(opt.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/60"
                          >
                            <span>{opt.label}</span>
                            <span
                              className={`h-5 w-5 rounded-full border-2 grid place-items-center ${
                                billing === opt.id ? "border-brand" : "border-border"
                              }`}
                            >
                              {billing === opt.id && (
                                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 text-body">
                      <span>Promo Code Discount</span>
                      <span className="font-semibold">-${discount.toLocaleString()}</span>
                    </div>
                    {showPromo ? (
                      <div className="mt-3 flex items-stretch gap-2">
                        <input
                          autoFocus
                          value={promo}
                          onChange={(e) => setPromo(e.target.value)}
                          placeholder="Enter code (try METANA10)"
                          className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-body focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            discount > 0
                              ? toast.success("Promo applied!")
                              : toast.error("Invalid promo code")
                          }
                          className="px-5 rounded-full bg-muted text-foreground text-button-primary font-semibold hover:bg-muted/70 transition-colors"
                        >
                          Check
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPromo(true)}
                        className="mt-3 px-3 py-1.5 rounded-full border border-border text-small hover:bg-muted transition-colors"
                      >
                        Add promotional code
                      </button>
                    )}
                    {billing === "installment" && (
                      <>
                        <div className="border-t border-border my-4" />
                        <div className="flex items-center justify-between text-body">
                          <span>Installment Amount</span>
                          <span className="font-semibold">
                            ${selectedPlan.monthly.toLocaleString()}/mo
                          </span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-border my-4" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Amount</span>
                      <span className="font-extrabold text-main-header">
                        ${total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="glass-animated-border bg-card p-6 md:p-7 shadow-[0_24px_60px_-18px_oklch(0.2_0.04_259/0.25)]">
                  <form onSubmit={submit} className="flex flex-col">
                    <h3 className="text-second-header font-bold mb-3">Contact info</h3>
                    <label className="text-small font-medium block mb-1.5">Billing Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-body placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                      required
                    />

                    <h3 className="text-second-header font-bold mt-6 mb-3">Payment method</h3>
                    {(() => {
                      const methods = [
                        { id: "card" as const, label: "Card", icon: CreditCard },
                        { id: "cashapp" as const, label: "Cash App Pay", icon: DollarSign },
                        { id: "bank" as const, label: "Bank", icon: Building2 },
                      ];
                      const idx = methods.findIndex((m) => m.id === method);
                      return (
                        <div className="relative inline-flex w-full items-center rounded-full border border-border bg-background p-1 shadow-[var(--shadow-soft)]">
                          <span
                            aria-hidden
                            className="absolute bottom-1 left-1 top-1 rounded-full bg-primary transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                            style={{
                              width: "calc((100% - 8px) / 3)",
                              transform: `translateX(${idx * 100}%)`,
                            }}
                          />
                          {methods.map((m) => (
                            <button
                              type="button"
                              key={m.id}
                              onClick={() => setMethod(m.id)}
                              className={`relative z-10 flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-3.5 text-small font-semibold transition-colors ${
                                method === m.id
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <m.icon className="h-4 w-4 shrink-0" /> {m.label}
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    {method === "card" && (
                      <div className="mt-5 space-y-3">
                        <div>
                          <label className="text-small font-medium block mb-1.5">
                            Card information
                          </label>
                          <input
                            value={card}
                            onChange={(e) => setCard(e.target.value)}
                            placeholder="1234 1234 1234 1234"
                            className="w-full h-11 px-4 rounded-lg border border-border bg-background text-body placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={exp}
                            onChange={(e) => setExp(e.target.value)}
                            placeholder="MM / YY"
                            className="h-11 px-4 rounded-lg border border-border bg-background text-body placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                          />
                          <input
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="CVC"
                            className="h-11 px-4 rounded-lg border border-border bg-background text-body placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
                          />
                        </div>
                      </div>
                    )}
                    {method === "cashapp" && (
                      <p className="mt-5 text-body text-muted-foreground">
                        You'll be redirected to Cash App to complete the payment (demo).
                      </p>
                    )}
                    {method === "bank" && (
                      <p className="mt-5 text-body text-muted-foreground">
                        Bank transfer instructions will be emailed (demo).
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-6 w-full py-3.5 rounded-full bg-brand text-foreground text-button-primary font-semibold hover:bg-brand/90 transition-colors disabled:opacity-60"
                    >
                      {submitting ? "Processing..." : `Purchase Now · $${total.toLocaleString()}`}
                    </button>

                    <div className="mt-auto pt-6">
                      <div className="flex items-center justify-center gap-2 text-small text-muted-foreground">
                        <Lock className="h-3 w-3" /> Powered by{" "}
                        <span className="font-bold text-foreground">stripe</span>
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-4 text-small text-muted-foreground">
                        <span>Legal</span>
                        <span>Returns</span>
                        <span>Contact</span>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
