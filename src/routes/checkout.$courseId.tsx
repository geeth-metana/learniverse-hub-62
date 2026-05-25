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
  const [prefilled, setPrefilled] = useState(false);

  const TEXT_MAIN = "#24324A";
  const TEXT_DARK = "#1A1A1A";
  const TEXT_MUTED = "#6B7280";
  const BRAND = "#CCF621";
  const PAGE_BG = "#FAFAFA";

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

  const effectivePlanId: PlanId = prefilled ? "plan-01" : plan;
  const selectedPlan = plans.find((p) => p.id === effectivePlanId)!;
  const effectiveBilling = prefilled ? "upfront" : billing;
  const effectiveEmail = prefilled ? "student@example.com" : email;
  const effectivePromo = prefilled ? "" : promo;
  const baseAmount = effectiveBilling === "installment" ? selectedPlan.monthlyEnrollment : selectedPlan.price;
  const discount = effectivePromo.trim().toUpperCase() === "METANA10" ? Math.round(baseAmount * 0.1) : 0;
  const total = baseAmount - discount;

  const validate = () => {
    if (!effectiveEmail.includes("@")) return "Please enter a valid billing email.";
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
      set(courseId, { status: "pending", plan: effectivePlanId, email: effectiveEmail, purchasedAt: Date.now() });
      toast.success("Payment received! Pending approval.", { id: "pay" });
      navigate({ to: "/courses/$courseId", params: { courseId } });
    }, 1600);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG, color: TEXT_MAIN }}>
        <main className="min-h-screen flex flex-col items-center py-10 lg:py-16 px-6 lg:px-10">
          <div className="w-full max-w-6xl">
            <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
              <button
                onClick={() => navigate({ to: "/courses" })}
                className="inline-flex items-center gap-2 text-body"
                style={{ color: TEXT_MUTED }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to courses
              </button>
              {/* Preview state switcher */}
              <div className="inline-flex items-center bg-white rounded-full p-1" role="tablist" aria-label="Preview state">
                {([
                  { id: false, label: "Not Pre-filled" },
                  { id: true, label: "Pre-filled" },
                ] as const).map((opt) => {
                  const active = prefilled === opt.id;
                  return (
                    <button
                      key={String(opt.id)}
                      type="button"
                      onClick={() => setPrefilled(opt.id)}
                      className="px-4 py-1.5 rounded-full text-small font-semibold transition-colors"
                      style={{
                        backgroundColor: active ? BRAND : "transparent",
                        color: active ? TEXT_DARK : TEXT_MUTED,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 w-full">
            {/* Left */}
            <div>
              <h1 className="text-primary-header font-extrabold tracking-tight" style={{ color: TEXT_DARK }}>
                {prefilled ? (
                  <>Get access <span style={{ color: TEXT_MUTED }}>to your</span> <span style={{ color: TEXT_DARK }}>course</span></>
                ) : (
                  <>Get access <span style={{ color: TEXT_MUTED }}>to the</span> <span style={{ color: TEXT_DARK }}>course</span></>
                )}
              </h1>
              <p className="mt-3 max-w-md" style={{ color: TEXT_MUTED }}>
                {prefilled
                  ? "Fill in your payment details to complete your purchase and unlock access to your course."
                  : "Choose the payment method that works best for you and complete your course purchase securely and easily."}
              </p>

              {!prefilled && (
                <>
                <h3 className="text-second-header font-bold mt-8 mb-4" style={{ color: TEXT_DARK }}>
                  Choose Your Plan
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlan(p.id)}
                      type="button"
                      className="text-left rounded-2xl bg-white p-5 transition-all relative"
                      style={{
                        outline: plan === p.id ? `2px solid ${BRAND}` : "2px solid transparent",
                        outlineOffset: "-2px",
                      }}
                    >
                      {plan === p.id && (
                        <span
                          className="absolute top-3 right-3 h-6 w-6 rounded-full grid place-items-center"
                          style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                        >
                          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><path fill="none" stroke="currentColor" strokeWidth="3" d="M3 8l3.5 3.5L13 5" /></svg>
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold" style={{ color: TEXT_DARK }}>{p.name}</span>
                        {p.popular && (
                          <span
                            className="text-smaller font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                          >
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-primary-header font-extrabold" style={{ color: TEXT_DARK }}>${p.price.toLocaleString()}</span>
                        {p.original && (
                          <span className="line-through text-small" style={{ color: TEXT_MUTED }}>
                            ${p.original.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-small mt-1" style={{ color: TEXT_MUTED }}>Upfront</p>
                    </button>
                  ))}
                </div>
                </>
              )}

              <h3 className="text-second-header font-bold mt-8 mb-4" style={{ color: TEXT_DARK }}>
                Payment Plan
              </h3>
              <div className="rounded-2xl bg-white p-5">
                {prefilled ? (
                  <>
                    <div className="flex items-center justify-between py-2">
                      <span style={{ color: TEXT_MUTED }}>Plan Type</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>Upfront</span>
                    </div>
                    <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between py-2">
                      <span style={{ color: TEXT_MUTED }}>Plan Amount</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>
                        ${(selectedPlan.original ?? selectedPlan.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between py-2">
                      <span style={{ color: TEXT_MUTED }}>Discount</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>20%</span>
                    </div>
                    <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between py-2">
                      <span style={{ color: TEXT_MUTED }}>Promo Code</span>
                      {showPromo ? (
                        <input
                          autoFocus
                          value={promo}
                          onChange={(e) => setPromo(e.target.value)}
                          placeholder="METANA10"
                          className="px-3 py-1.5 rounded-lg text-small text-right"
                          style={{ backgroundColor: PAGE_BG, color: TEXT_DARK, maxWidth: 180 }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPromo(true)}
                          className="px-3 py-1.5 rounded-lg text-small"
                          style={{ backgroundColor: PAGE_BG, color: TEXT_MAIN }}
                        >
                          Add promotional code
                        </button>
                      )}
                    </div>
                    <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between py-2">
                      <span style={{ color: TEXT_MUTED }}>Promo Code Discount</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>-${discount.toLocaleString()}</span>
                    </div>
                    <div className="my-3" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>Total Amount</span>
                      <span className="font-extrabold text-main-header" style={{ color: TEXT_DARK }}>
                        ${total.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowPlan((v) => !v)}
                      className="w-full flex items-center justify-between"
                    >
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>Plan Type</span>
                      <span className="inline-flex items-center gap-1" style={{ color: TEXT_MUTED }}>
                        {effectiveBilling === "installment" ? "Installment" : "Upfront"}
                        <svg
                          viewBox="0 0 12 12"
                          className={`h-3 w-3 transition-transform ${showPlan ? "rotate-180" : ""}`}
                        >
                          <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M2 4l4 4 4-4" />
                        </svg>
                      </span>
                    </button>

                    {showPlan && (
                      <div className="mt-4 rounded-xl overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
                        {([
                          { id: "upfront" as const, label: "Upfront" },
                          { id: "installment" as const, label: "Installment" },
                        ]).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setBilling(opt.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                          >
                            <span style={{ color: TEXT_MAIN }}>{opt.label}</span>
                            <span
                              className="h-5 w-5 rounded-full border-2 grid place-items-center"
                              style={{ borderColor: billing === opt.id ? BRAND : "#E5E7EB" }}
                            >
                              {billing === opt.id && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BRAND }} />}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span style={{ color: TEXT_MAIN }}>Promo Code Discount</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>-${discount.toLocaleString()}</span>
                    </div>
                    {showPromo ? (
                    <input
                      autoFocus
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                      placeholder="Enter code (try METANA10)"
                      className="mt-3 w-full px-4 py-2 rounded-lg"
                      style={{ backgroundColor: PAGE_BG, color: TEXT_DARK }}
                    />
                    ) : (
                    <button
                      type="button"
                      onClick={() => setShowPromo(true)}
                      className="mt-3 px-3 py-1.5 rounded-lg text-small"
                      style={{ backgroundColor: PAGE_BG, color: TEXT_MAIN }}
                    >
                      Add promotional code
                    </button>
                    )}
                    {effectiveBilling === "installment" && (
                  <>
                    <div className="my-4" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between">
                      <span style={{ color: TEXT_MAIN }}>Installment Amount</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>${selectedPlan.monthly.toLocaleString()}/mo</span>
                    </div>
                  </>
                    )}
                    <div className="my-4" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>Total Amount</span>
                      <span className="font-extrabold text-main-header" style={{ color: TEXT_DARK }}>${total.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              {prefilled && (
                <>
                  <h3 className="text-second-header font-bold mt-8 mb-4" style={{ color: TEXT_DARK }}>
                    Product Details
                  </h3>
                  <div className="bg-white rounded-2xl p-6 lg:p-8">
                    <dl className="flex flex-col">
                      {([
                        ["Course", "AI Builder Pack"],
                        ["Access Type", "Full Program Access"],
                        ["Payment Type", "Upfront"],
                        ["Lessons", "70 Lessons"],
                        ["Duration", "4 Months"],
                        ["Weekly Commitment", "22H / Week"],
                        ["Support", "Instructor-led guidance"],
                        ["Certificate", "Included"],
                      ] as const).map(([k, v], i, arr) => (
                        <div
                          key={k}
                          className="flex items-center justify-between py-3"
                          style={{ borderBottom: i < arr.length - 1 ? "1px solid #F0F0F0" : undefined }}
                        >
                          <dt style={{ color: TEXT_MUTED }}>{k}</dt>
                          <dd className="font-semibold text-right" style={{ color: TEXT_DARK }}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </>
              )}
            </div>

            {/* Right */}
            <div className="h-fit flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 lg:p-8" style={{ boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)" }}>
            <form
              onSubmit={submit}
              className="flex flex-col"
            >
              <h3 className="font-bold mb-4" style={{ color: TEXT_DARK }}>Contact Info</h3>
              <label className="text-body block mb-2" style={{ color: TEXT_MAIN }}>Billing Email</label>
              <input
                type="email"
                value={effectiveEmail}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={prefilled}
                readOnly={prefilled}
                className="w-full px-4 py-3 rounded-xl disabled:cursor-not-allowed"
                style={{
                  backgroundColor: prefilled ? "#F3F4F6" : PAGE_BG,
                  color: prefilled ? TEXT_MUTED : TEXT_DARK,
                }}
                required
              />

              <h3 className="font-bold mt-6 mb-4" style={{ color: TEXT_DARK }}>Payment method</h3>
              {(() => {
                const methods = [
                  { id: "card" as const, label: "Card", icon: CreditCard },
                  { id: "cashapp" as const, label: "Cash App Pay", icon: DollarSign },
                  { id: "bank" as const, label: "Bank", icon: Building2 },
                ];
                const idx = methods.findIndex((m) => m.id === method);
                return (
                  <div className="relative inline-flex w-full items-center rounded-full p-1" style={{ backgroundColor: PAGE_BG }}>
                    <span
                      aria-hidden
                      className="absolute bottom-1 left-1 top-1 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      style={{
                        width: "calc((100% - 8px) / 3)",
                        transform: `translateX(${idx * 100}%)`,
                        backgroundColor: BRAND,
                      }}
                    />
                    {methods.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className="relative z-10 flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-3 text-small font-semibold transition-colors"
                        style={{ color: method === m.id ? TEXT_DARK : TEXT_MUTED }}
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
                    <label className="text-body block mb-2" style={{ color: TEXT_MAIN }}>Card information</label>
                    <input
                      value={card}
                      onChange={(e) => setCard(e.target.value)}
                      placeholder="1234 1234 1234 1234"
                      className="w-full px-4 py-3 rounded-xl"
                      style={{ backgroundColor: PAGE_BG, color: TEXT_DARK }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={exp}
                      onChange={(e) => setExp(e.target.value)}
                      placeholder="MM / YY"
                      className="px-4 py-3 rounded-xl"
                      style={{ backgroundColor: PAGE_BG, color: TEXT_DARK }}
                    />
                    <input
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="CVC"
                      className="px-4 py-3 rounded-xl"
                      style={{ backgroundColor: PAGE_BG, color: TEXT_DARK }}
                    />
                  </div>
                </div>
              )}
              {method === "cashapp" && (
                <p className="mt-5 text-body" style={{ color: TEXT_MUTED }}>
                  You'll be redirected to Cash App to complete the payment (demo).
                </p>
              )}
              {method === "bank" && (
                <p className="mt-5 text-body" style={{ color: TEXT_MUTED }}>
                  Bank transfer instructions will be emailed (demo).
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full py-3.5 rounded-full font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: BRAND, color: TEXT_DARK }}
              >
                {submitting ? "Processing..." : `Purchase Now · $${total.toLocaleString()}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-small" style={{ color: TEXT_MUTED }}>
                <Lock className="h-3 w-3" /> Powered by <span className="font-bold" style={{ color: TEXT_DARK }}>stripe</span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-4 text-small" style={{ color: TEXT_MUTED }}>
                <span>Legal</span>
                <span>Returns</span>
                <span>Contact</span>
              </div>
            </form>
            </div>
            </div>
          </div>
          </div>
        </main>
    </div>
  );
}
