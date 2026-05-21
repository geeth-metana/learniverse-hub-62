import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { plans, getCourse, type PlanId } from "@/lib/courses-data";
import { useEnrollments } from "@/lib/enrollment";
import { toast } from "sonner";
import { CreditCard, DollarSign, Building2, Lock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/checkout/$courseId")({
  validateSearch: z.object({ plan: z.enum(["plan-01", "plan-02"]).optional() }),
  head: () => ({ meta: [{ title: "Checkout — Metana" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { courseId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const course = getCourse(courseId);
  const { set, get } = useEnrollments();
  const existing = get(courseId);

  const [plan, setPlan] = useState<PlanId>(search.plan ?? "plan-01");
  const [method, setMethod] = useState<"card" | "cashapp" | "bank">("card");
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [promo, setPromo] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [billing, setBilling] = useState<"upfront" | "installment">("upfront");
  const [showPlan, setShowPlan] = useState(false);

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Course not found.</p>
          <Link to="/courses" className="text-primary underline">Back to Courses</Link>
        </div>
      </div>
    );
  }

  if (existing.status === "pending" || existing.status === "active") {
    return (
      <div className="min-h-screen bg-background">
          <main className="min-h-screen grid place-items-center p-8">
            <div className="max-w-md text-center bg-card border border-border rounded-2xl p-8 shadow-[var(--shadow-soft)]">
              <h1 className="text-primary-header font-bold mb-2">Already enrolled</h1>
              <p className="text-muted-foreground mb-6">
                You already have a {existing.status} enrollment for this course.
              </p>
              <Link
                to="/courses/$courseId"
                params={{ courseId }}
                className="inline-block px-6 py-2.5 rounded-full bg-brand text-foreground font-semibold"
              >
                View course
              </Link>
            </div>
          </main>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.id === plan)!;
  const baseAmount = billing === "installment" ? selectedPlan.monthlyEnrollment : selectedPlan.price;
  const discount = promo.trim().toUpperCase() === "METANA10" ? Math.round(baseAmount * 0.1) : 0;
  const total = baseAmount - discount;

  const validate = () => {
    if (!email.includes("@")) return "Please enter a valid billing email.";
    if (method === "card") {
      if (card.replace(/\s/g, "").length < 12) return "Enter a valid card number.";
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(exp)) return "Expiry must be MM/YY.";
      if (cvc.length < 3) return "CVC must be at least 3 digits.";
    }
    return null;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    toast.loading("Processing payment with Stripe...", { id: "pay" });
    setTimeout(() => {
      set(courseId, { status: "pending", plan, email, purchasedAt: Date.now() });
      toast.success("Payment received! Pending approval.", { id: "pay" });
      navigate({ to: "/courses/$courseId", params: { courseId } });
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-background">
        <main className="min-h-screen p-6 lg:p-10">
          <button
            onClick={() => navigate({ to: "/courses" })}
            className="inline-flex items-center gap-2 text-body text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to courses
          </button>

          <div className="grid lg:grid-cols-2 gap-10 max-w-6xl">
            {/* Left */}
            <div>
              <h1 className="text-primary-header font-extrabold tracking-tight">
                Get access <span className="text-muted-foreground">to the course</span>
              </h1>
              <p className="text-muted-foreground mt-3 max-w-md">
                Choose the payment method that works best for you and complete your course
                purchase securely and easily.
              </p>

              <h3 className="text-second-header font-bold mt-8 mb-4">Choose Your Plan</h3>
              <div className="grid grid-cols-2 gap-4">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    type="button"
                    className={`text-left rounded-2xl border-2 p-5 transition-all relative ${
                      plan === p.id ? "border-brand shadow-[var(--shadow-soft)]" : "border-border"
                    }`}
                  >
                    {plan === p.id && (
                      <span className="absolute top-3 right-3 h-6 w-6 rounded-full bg-brand grid place-items-center">
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path fill="none" stroke="currentColor" strokeWidth="3" d="M3 8l3.5 3.5L13 5" /></svg>
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{p.name}</span>
                      {p.popular && (
                        <span className="text-smaller font-semibold px-2 py-0.5 rounded-full bg-brand-light">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-primary-header font-extrabold">${p.price.toLocaleString()}</span>
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
                  className="w-full flex items-center justify-between"
                >
                  <span className="font-semibold">Payment Plan</span>
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    Choose your plan
                    <svg
                      viewBox="0 0 12 12"
                      className={`h-3 w-3 transition-transform ${showPlan ? "rotate-180" : ""}`}
                    >
                      <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M2 4l4 4 4-4" />
                    </svg>
                  </span>
                </button>

                {showPlan && (
                  <div className="mt-4 rounded-xl bg-muted/40 divide-y divide-border overflow-hidden">
                    {([
                      { id: "upfront" as const, label: "Upfront" },
                      { id: "installment" as const, label: "Installment" },
                    ]).map((opt) => (
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
                          {billing === opt.id && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span>Promo Code Discount</span>
                  <span className="font-semibold">-${discount.toLocaleString()}</span>
                </div>
                {showPromo ? (
                  <input
                    autoFocus
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="Enter code (try METANA10)"
                    className="mt-3 w-full px-4 py-2 rounded-lg border border-border bg-background"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPromo(true)}
                    className="mt-3 px-3 py-1.5 rounded-lg border border-border text-small hover:bg-muted"
                  >
                    Add promotional code
                  </button>
                )}
                {billing === "installment" && (
                  <>
                    <div className="border-t border-border my-4" />
                    <div className="flex items-center justify-between">
                      <span>Installment Amount</span>
                      <span className="font-semibold">${selectedPlan.monthly.toLocaleString()}/mo</span>
                    </div>
                  </>
                )}
                <div className="border-t border-border my-4" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-extrabold text-main-header">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="glass-animated-border bg-card h-fit p-6 lg:p-8 shadow-[0_10px_30px_-18px_oklch(0.2_0.04_259/0.18)]">
            <form
              onSubmit={submit}
              className="flex flex-col"
            >
              <h3 className="font-bold mb-4">Contact info</h3>
              <label className="text-body block mb-2">Billing Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                required
              />

              <h3 className="font-bold mt-6 mb-4">Payment method</h3>
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
                        className={`relative z-10 flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-3 text-small font-semibold transition-colors ${
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
                    <label className="text-body block mb-2">Card information</label>
                    <input
                      value={card}
                      onChange={(e) => setCard(e.target.value)}
                      placeholder="1234 1234 1234 1234"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={exp}
                      onChange={(e) => setExp(e.target.value)}
                      placeholder="MM / YY"
                      className="px-4 py-3 rounded-xl border border-border bg-background"
                    />
                    <input
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="CVC"
                      className="px-4 py-3 rounded-xl border border-border bg-background"
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
                className="mt-6 w-full py-3.5 rounded-full bg-brand text-foreground font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Processing..." : `Purchase Now · $${total.toLocaleString()}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-small text-muted-foreground">
                <Lock className="h-3 w-3" /> Powered by <span className="font-bold text-foreground">stripe</span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-4 text-small text-muted-foreground">
                <span>Legal</span>
                <span>Returns</span>
                <span>Contact</span>
              </div>
            </form>
            </div>
          </div>
        </main>
    </div>
  );
}
