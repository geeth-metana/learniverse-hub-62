import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { plans, getCourse, type PlanId } from "@/lib/courses-data";
import { useEnrollments } from "@/lib/enrollment";
import { getInvitation } from "@/lib/invitations-store";
import { toast } from "sonner";
import {
  CreditCard,
  Building2,
  Lock,
  ArrowLeft,
  Landmark,
  Banknote,
  ExternalLink,
  Bitcoin,
  Copy,
  UploadCloud,
  FileText,
  Eye,
  BookOpen,
  Shield,
  Calendar,
  PlayCircle,
  Clock,
  Timer,
  Users,
  Award,
} from "lucide-react";

export const Route = createFileRoute("/checkout/$courseId")({
  validateSearch: z.object({
    plan: z.enum(["plan-01", "plan-02"]).optional(),
    invite: z.string().optional(),
    email: z.string().optional(),
    course: z.string().optional(),
    paymentMethod: z.string().optional(),
    subscriptionAmount: z.string().optional(),
    monthlyPayment: z.string().optional(),
    billingCycle: z.string().optional(),
    selectedPlan: z.string().optional(),
    fullAmount: z.string().optional(),
    discountPercent: z.string().optional(),
    discountedFullAmount: z.string().optional(),
    initialDownPayment: z.string().optional(),
    numberOfInstallments: z.string().optional(),
    purchaseAmount: z.string().optional(),
  }),
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
  const [method, setMethod] = useState<"card" | "crypto" | "bank">("card");
  const [cryptoNetwork, setCryptoNetwork] = useState("USDT TRC20");
  const [txAddress, setTxAddress] = useState("");
  const [txError, setTxError] = useState(false);
  const [receipt, setReceipt] = useState<{ name: string; uploadedAt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoInputVisible, setPromoInputVisible] = useState(false);
  const promoWrapRef = useRef<HTMLDivElement | null>(null);
  const promoInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [billing, setBilling] = useState<"upfront" | "installment">("upfront");
  const [showPlan, setShowPlan] = useState(false);
  const invitation = search.invite ? getInvitation(search.invite) : undefined;
  const [prefilled, setPrefilled] = useState(Boolean(invitation));
  const inviteMethod = invitation?.paymentMethod;
  const isBankInvite = prefilled && inviteMethod === "Bank";
  const isLoanInvite = prefilled && inviteMethod === "Loan";
  const isInstallmentInvite = prefilled && inviteMethod === "Installment";
  const isSubscriptionInvite =
    (prefilled && (inviteMethod as string) === "Subscription") ||
    search.paymentMethod === "subscription";
  const subscriptionAmount =
    invitation?.paymentDetails.paymentType === "Subscription"
      ? invitation.paymentDetails.subscriptionAmount
      : Number(search.subscriptionAmount ?? 499);
  const subscriptionMonthly =
    invitation?.paymentDetails.paymentType === "Subscription"
      ? invitation.paymentDetails.monthlyPayment
      : Number(search.monthlyPayment ?? 499);

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

  const effectivePlanId: PlanId = prefilled ? (invitation?.planId ?? "plan-01") : plan;
  const selectedPlan = plans.find((p) => p.id === effectivePlanId)!;
  const effectiveBilling = prefilled
    ? invitation?.paymentType === "Installment"
      ? "installment"
      : "upfront"
    : billing;
  const effectiveEmail = prefilled
    ? (invitation?.studentEmail ?? "student@example.com")
    : (search.email ?? email);
  const emailLocked = prefilled || Boolean(search.email);

  const planAmount =
    effectiveBilling === "installment"
      ? selectedPlan.monthlyEnrollment
      : (selectedPlan.original ?? selectedPlan.price);
  const baseDiscountPercent = 20;
  const subtotalAfterBase = planAmount * (1 - baseDiscountPercent / 100);
  const promoDiscount = appliedPromo === "METANA" ? subtotalAfterBase * 0.1 : 0;
  const total = subtotalAfterBase - promoDiscount;

  const fmt = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    return rounded % 1 === 0
      ? `$${rounded.toLocaleString()}`
      : `$${rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleApplyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) {
      setPromoError("Please enter a promo code.");
      setAppliedPromo(null);
      return;
    }
    if (code === "METANA") {
      setAppliedPromo("METANA");
      setPromoError(null);
      setPromo("METANA");
    } else {
      setAppliedPromo(null);
      setPromoError("Invalid promo code. Please check and try again.");
    }
  };

  useEffect(() => {
    if (!promoInputVisible) return;
    const onDocDown = (e: MouseEvent) => {
      const wrap = promoWrapRef.current;
      if (!wrap) return;
      if (wrap.contains(e.target as Node)) return;
      if (promo.trim() === "" && appliedPromo !== "METANA") {
        setPromoInputVisible(false);
        setPromoError(null);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [promoInputVisible, promo, appliedPromo]);

  useEffect(() => {
    if (promoInputVisible) {
      promoInputRef.current?.focus();
    }
  }, [promoInputVisible]);

  const isApplied = appliedPromo === "METANA";

  const promoField = (
    <div className="w-full" style={{ maxWidth: 280 }} ref={promoWrapRef}>
      {!promoInputVisible && !isApplied ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setPromoInputVisible(true);
              setPromoError(null);
            }}
            className="px-4 py-1.5 rounded-full text-small font-semibold"
            style={{ backgroundColor: "#F3F4F6", color: TEXT_DARK }}
          >
            Add promo code
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-1 rounded-full pl-4 pr-1 py-1"
          style={{ backgroundColor: "#F3F4F6" }}
        >
          <input
            ref={promoInputRef}
            value={promo}
            onChange={(e) => {
              setPromo(e.target.value);
              if (promoError) setPromoError(null);
              if (appliedPromo) setAppliedPromo(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyPromo();
              }
            }}
            placeholder="Enter promo code"
            className="flex-1 bg-transparent outline-none text-small py-1.5 min-w-0"
            style={{ color: TEXT_DARK }}
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            className="px-3 py-1.5 rounded-full text-small font-semibold"
            style={{
              backgroundColor: isApplied ? BRAND : "#E5E7EB",
              color: TEXT_DARK,
            }}
          >
            {isApplied ? "Applied" : "Apply"}
          </button>
        </div>
      )}
      {promoError && (
        <p className="mt-1.5 text-smaller text-right" style={{ color: "#DC2626" }}>{promoError}</p>
      )}
    </div>
  );

  const validate = () => {
    if (!effectiveEmail.includes("@")) return "Please enter a valid billing email.";
    if (method === "card") {
      if (card.replace(/\s/g, "").length < 12) return "Enter a valid card number.";
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(exp)) return "Expiry must be MM/YY.";
      if (cvc.length < 3) return "CVC must be at least 3 digits.";
    }
    if (method === "crypto" && !txAddress.trim()) {
      setTxError(true);
      return "Please paste your transaction address to continue.";
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
              <h1 className="text-primary-header font-bold tracking-tight" style={{ color: TEXT_DARK }}>
                {prefilled ? "Get access to your course" : "Get access to the course"}
              </h1>
              <p className="mt-3 max-w-md" style={{ color: TEXT_MUTED }}>
                {prefilled
                  ? "Fill in your payment details to complete your purchase and unlock access to your course."
                  : "Choose the payment method that works best for you and complete your course purchase securely and easily."}
              </p>

              {!prefilled && !isSubscriptionInvite && (
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
                        border: `2px solid ${plan === p.id ? TEXT_DARK : "transparent"}`,
                      }}
                    >
                      {plan === p.id && (
                        <span
                          className="absolute top-3 right-3 h-6 w-6 rounded-full grid place-items-center"
                          style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
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
              {isSubscriptionInvite ? (
                <div className="rounded-2xl bg-white p-5">
                  {([
                    ["Plan Type", "Subscription"],
                    ["Subscription Amount", `$${subscriptionAmount.toLocaleString()}`],
                    ["Monthly Payment", `$${subscriptionMonthly.toLocaleString()} / month`],
                    ["Billing Cycle", "Monthly"],
                  ] as const).map(([k, v], i, arr) => (
                    <div key={k}>
                      <div className="flex items-center justify-between py-2">
                        <span style={{ color: TEXT_MUTED }}>{k}</span>
                        <span className="font-semibold" style={{ color: TEXT_DARK }}>{v}</span>
                      </div>
                      {i < arr.length - 1 && <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />}
                    </div>
                  ))}
                  <div className="my-3" style={{ borderTop: "1px solid #F0F0F0" }} />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ color: TEXT_DARK }}>Due Today</span>
                    <span className="font-extrabold text-main-header" style={{ color: TEXT_DARK }}>
                      ${subscriptionAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
              <div className="rounded-2xl bg-white p-5">
                {/* Plan Type */}
                {prefilled ? (
                  <div className="flex items-center justify-between py-2">
                    <span style={{ color: TEXT_MUTED }}>Plan Type</span>
                    <span className="font-semibold" style={{ color: TEXT_DARK }}>Upfront</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowPlan((v) => !v)}
                      className="w-full flex items-center justify-between py-2"
                    >
                      <span style={{ color: TEXT_MUTED }}>Plan Type</span>
                      <span className="inline-flex items-center gap-1 font-semibold" style={{ color: TEXT_DARK }}>
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
                      <div className="mt-2 rounded-xl overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
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
                              style={{ borderColor: billing === opt.id ? TEXT_DARK : "#E5E7EB" }}
                            >
                              {billing === opt.id && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TEXT_DARK }} />}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                <div className="flex items-center justify-between py-2">
                  <span style={{ color: TEXT_MUTED }}>Plan Amount</span>
                  <span className="font-semibold" style={{ color: TEXT_DARK }}>{fmt(planAmount)}</span>
                </div>
                <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                <div className="flex items-center justify-between py-2">
                  <span style={{ color: TEXT_MUTED }}>Discount</span>
                  <span className="font-semibold" style={{ color: TEXT_DARK }}>{baseDiscountPercent}%</span>
                </div>
                <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                <div className="flex items-start justify-between py-2 gap-4">
                  <span className="pt-2" style={{ color: TEXT_MUTED }}>Promo Code</span>
                  {promoField}
                </div>
                {appliedPromo === "METANA" && (
                  <>
                    <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between py-2">
                      <span style={{ color: TEXT_MUTED }}>Promo Code Discount</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>-{fmt(promoDiscount)}</span>
                    </div>
                  </>
                )}
                {!prefilled && effectiveBilling === "installment" && (
                  <>
                    <div className="my-2" style={{ borderTop: "1px solid #F0F0F0" }} />
                    <div className="flex items-center justify-between py-2">
                      <span style={{ color: TEXT_MUTED }}>Installment Amount</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>${selectedPlan.monthly.toLocaleString()}/mo</span>
                    </div>
                  </>
                )}
                <div className="my-3" style={{ borderTop: "1px solid #F0F0F0" }} />
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: TEXT_DARK }}>Total Amount</span>
                  <span className="font-extrabold text-main-header" style={{ color: TEXT_DARK }}>{fmt(total)}</span>
                </div>
              </div>
              )}

              {isSubscriptionInvite && (
                <>
                  <h3 className="text-second-header font-bold mt-8 mb-4" style={{ color: TEXT_DARK }}>
                    Product Details
                  </h3>
                  <div className="bg-white rounded-2xl p-6 lg:p-8">
                    <ProductDetailsList
                      rows={[
                        { icon: BookOpen, label: "Course", value: "Metana Prime" },
                        { icon: Shield, label: "Access Type", value: "Subscription Access" },
                        { icon: CreditCard, label: "Payment Type", value: "Subscription" },
                        { icon: Calendar, label: "Billing Cycle", value: "Monthly" },
                        { icon: Banknote, label: "Monthly Payment", value: `$${subscriptionMonthly.toLocaleString()} / month` },
                        { icon: Award, label: "Certificate", value: "Not Applicable" },
                      ]}
                      muted={TEXT_MUTED}
                      dark={TEXT_DARK}
                    />
                  </div>
                </>
              )}
              {prefilled && !isSubscriptionInvite && (
                <>
                  {isBankInvite && invitation?.paymentDetails.paymentType === "Bank" && (
                    <>
                      <h3 className="text-second-header font-bold mt-8 mb-4 inline-flex items-center gap-2" style={{ color: TEXT_DARK }}>
                        <Landmark className="h-5 w-5" /> Bank Transfer Details
                      </h3>
                      <div className="bg-white rounded-2xl p-6 lg:p-8">
                        <dl className="flex flex-col">
                          {([
                            ["Bank Name", invitation.paymentDetails.bankName],
                            ["Account Name", invitation.paymentDetails.accountName],
                            ["Account Number", invitation.paymentDetails.accountNumber],
                            ["Routing Number", invitation.paymentDetails.routingNumber],
                            ["SWIFT Code", invitation.paymentDetails.swiftCode],
                            ["Reference Note", invitation.paymentDetails.referenceNote],
                          ] as const).map(([k, v], i, arr) => (
                            <div
                              key={k}
                              className="flex items-center justify-between py-3"
                              style={{ borderBottom: i < arr.length - 1 ? "1px solid #F0F0F0" : undefined }}
                            >
                              <dt style={{ color: TEXT_MUTED }}>{k}</dt>
                              <dd className="font-semibold text-right break-all" style={{ color: TEXT_DARK }}>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </>
                  )}
                  {isLoanInvite && invitation?.paymentDetails.paymentType === "Loan" && (
                    <>
                      <h3 className="text-second-header font-bold mt-8 mb-4 inline-flex items-center gap-2" style={{ color: TEXT_DARK }}>
                        <Banknote className="h-5 w-5" /> Loan Application
                      </h3>
                      <div className="bg-white rounded-2xl p-6 lg:p-8">
                        <p style={{ color: TEXT_MUTED }}>
                          You'll be redirected to{" "}
                          <span className="font-semibold" style={{ color: TEXT_DARK }}>
                            {invitation.paymentDetails.loanProviderName}
                          </span>{" "}
                          to complete financing before accessing the course.
                        </p>
                        <p className="mt-3 break-all text-small" style={{ color: TEXT_DARK }}>
                          {invitation.paymentDetails.loanApplicationLink}
                        </p>
                      </div>
                    </>
                  )}
                  {isInstallmentInvite && invitation?.paymentDetails.paymentType === "Installment" && (
                    <>
                      <h3 className="text-second-header font-bold mt-8 mb-4" style={{ color: TEXT_DARK }}>
                        Installment Schedule
                      </h3>
                      <div className="bg-white rounded-2xl p-6 lg:p-8">
                        <dl className="flex flex-col">
                          {([
                            ["Plan Type", "Installment"],
                            ["Selected Plan", invitation.paymentDetails.selectedPlan ?? "Installment Plan"],
                            ["Full Amount", `$${invitation.paymentDetails.fullAmount.toLocaleString()}`],
                            ["Discount", `${invitation.paymentDetails.discountPercent ?? 0}%`],
                            ["Discounted Full Amount", `$${(invitation.paymentDetails.discountedFullAmount ?? invitation.paymentDetails.fullAmount).toLocaleString()}`],
                            ["Down Payment", `$${invitation.paymentDetails.initialDownPayment.toLocaleString()}`],
                            ["Monthly Payment", `$${Math.round(invitation.paymentDetails.monthlyPayment).toLocaleString()} / month`],
                            ["Installments", `${invitation.paymentDetails.timePeriodMonths}`],
                            ["Due Today", `$${invitation.paymentDetails.initialDownPayment.toLocaleString()}`],
                          ] as const).map(([k, v], i, arr) => (
                            <div
                              key={k}
                              className="flex items-center justify-between py-3"
                              style={{
                                borderBottom: i < arr.length - 1 ? "1px solid #F0F0F0" : undefined,
                                backgroundColor: k === "Due Today" || k === "Down Payment" ? "rgba(204,246,33,0.18)" : undefined,
                                paddingLeft: k === "Due Today" || k === "Down Payment" ? 12 : undefined,
                                paddingRight: k === "Due Today" || k === "Down Payment" ? 12 : undefined,
                                borderRadius: k === "Due Today" || k === "Down Payment" ? 8 : undefined,
                              }}
                            >
                              <dt style={{ color: TEXT_MUTED }}>{k}</dt>
                              <dd className="font-semibold text-right" style={{ color: TEXT_DARK }}>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </>
                  )}
                  <h3 className="text-second-header font-bold mt-8 mb-4" style={{ color: TEXT_DARK }}>
                    Product Details
                  </h3>
                  <div className="bg-white rounded-2xl p-6 lg:p-8">
                    <ProductDetailsList
                      rows={[
                        { icon: BookOpen, label: "Course", value: invitation?.course ?? course.title ?? "AI Builder Pack" },
                        { icon: Shield, label: "Access Type", value: invitation?.accessType ?? "Full Program Access" },
                        { icon: Calendar, label: "Cohort Date", value: invitation?.cohortDate ?? "Jun 12, 2026" },
                        { icon: CreditCard, label: "Payment Type", value: invitation?.paymentType ?? (effectiveBilling === "installment" ? "Installment" : "Upfront") },
                        { icon: PlayCircle, label: "Lessons", value: "70 Lessons" },
                        { icon: Clock, label: "Duration", value: "4 Months" },
                        { icon: Timer, label: "Weekly Commitment", value: "22H / Week" },
                        { icon: Users, label: "Support", value: "Instructor-led guidance" },
                        { icon: Award, label: "Certificate", value: invitation?.certificateIncluded === false ? "Not included" : "Included" },
                      ]}
                      muted={TEXT_MUTED}
                      dark={TEXT_DARK}
                    />
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
                disabled={emailLocked}
                readOnly={emailLocked}
                className="w-full px-4 py-3 rounded-xl disabled:cursor-not-allowed"
                style={{
                  backgroundColor: emailLocked ? "#F3F4F6" : PAGE_BG,
                  color: emailLocked ? TEXT_MUTED : TEXT_DARK,
                }}
                required
              />

              <h3 className="font-bold mt-6 mb-4" style={{ color: TEXT_DARK }}>Payment method</h3>
              {(() => {
                const methods = [
                  { id: "card" as const, label: "Card", icon: CreditCard },
                  { id: "crypto" as const, label: "Crypto", icon: Bitcoin },
                  { id: "bank" as const, label: "Bank", icon: Building2 },
                ];
                const idx = methods.findIndex((m) => m.id === method);
                return (
                  <div className="relative inline-flex w-full items-center rounded-full p-1" style={{ backgroundColor: "#F1F3F5" }}>
                    <span
                      aria-hidden
                      className="absolute bottom-1 left-1 top-1 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      style={{
                        width: "calc((100% - 8px) / 3)",
                        transform: `translateX(${idx * 100}%)`,
                        backgroundColor: "#FFFFFF",
                        boxShadow: "0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.08)",
                      }}
                    />
                    {methods.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className="group relative z-10 flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-3 text-small font-semibold transition-all duration-200 ease-in-out"
                        style={{ color: method === m.id ? "#1A1A1A" : "#6B7280" }}
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
              {method === "crypto" && (() => {
                const walletAddress = "TX9a82kLm2039xMetanaDemo";
                const amountDue = isSubscriptionInvite
                  ? subscriptionAmount
                  : isInstallmentInvite && invitation?.paymentDetails.paymentType === "Installment"
                    ? invitation.paymentDetails.initialDownPayment
                    : total;
                return (
                  <div className="mt-5 space-y-3">
                    <div>
                      <label className="text-body block mb-2" style={{ color: TEXT_MAIN }}>Crypto Network</label>
                      <select
                        value={cryptoNetwork}
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl"
                        style={{ backgroundColor: PAGE_BG, color: TEXT_DARK }}
                      >
                        <option>USDT TRC20</option>
                        <option>Ethereum</option>
                        <option>Bitcoin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-body block mb-2" style={{ color: TEXT_MAIN }}>Wallet Address</label>
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ backgroundColor: PAGE_BG }}>
                        <span className="flex-1 truncate text-small font-mono" style={{ color: TEXT_DARK }}>{walletAddress}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(walletAddress);
                            toast.success("Wallet address copied");
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-smaller font-semibold"
                          style={{ backgroundColor: "#F3F4F6", color: TEXT_DARK }}
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: PAGE_BG }}>
                      <span style={{ color: TEXT_MUTED }}>Amount Due</span>
                      <span className="font-semibold" style={{ color: TEXT_DARK }}>${amountDue.toLocaleString()}</span>
                    </div>
                    <div>
                      <label className="text-body block mb-2" style={{ color: TEXT_MAIN }}>Transaction Address</label>
                      <input
                        value={txAddress}
                        onChange={(e) => { setTxAddress(e.target.value); if (txError) setTxError(false); }}
                        placeholder="Paste your transaction address or hash"
                        className="w-full px-4 py-3 rounded-xl"
                        style={{ backgroundColor: "#F3F4F6", color: TEXT_DARK, border: "none" }}
                      />
                      <p className="text-smaller mt-1.5" style={{ color: txError ? "#DC2626" : TEXT_MUTED }}>
                        {txError
                          ? "Please paste your transaction address to continue."
                          : "Paste the transaction address after completing the crypto payment."}
                      </p>
                    </div>
                    <p className="text-smaller" style={{ color: TEXT_MUTED }}>
                      Your course access will be activated after payment confirmation.
                    </p>
                  </div>
                );
              })()}
              {method === "bank" && (() => {
                const bank =
                  invitation?.paymentDetails.paymentType === "Bank"
                    ? invitation.paymentDetails
                    : {
                        accountName: "Metana / Edmore LLC",
                        bankName: "Example Business Bank",
                        accountNumber: "000123456789",
                        routingNumber: "021000021",
                        swiftCode: "EXAMPLEUS",
                        referenceNote: `${effectiveEmail} · ${invitation?.course ?? course.title}`,
                      };
                const uploadLabel = isSubscriptionInvite
                  ? "Upload Subscription Payment Receipt"
                  : isInstallmentInvite
                    ? "Upload Down Payment Receipt"
                    : "Upload Bank Receipt";
                const onFile = (file: File) => {
                  setReceipt({
                    name: file.name,
                    uploadedAt: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
                  });
                };
                return (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl p-4" style={{ backgroundColor: PAGE_BG }}>
                      <h4 className="font-semibold mb-3 inline-flex items-center gap-2" style={{ color: TEXT_DARK }}>
                        <Landmark className="h-4 w-4" /> Bank Transfer Details
                      </h4>
                      <dl className="bg-white rounded-xl px-4">
                        {([
                          ["Account Name", bank.accountName],
                          ["Bank Name", bank.bankName],
                          ["Account Number", bank.accountNumber],
                          ["Routing Number", bank.routingNumber],
                          ["SWIFT Code", bank.swiftCode],
                          ["Reference Note", bank.referenceNote],
                        ] as const).map(([k, v], i, arr) => (
                          <div
                            key={k}
                            className="flex items-center justify-between py-2.5"
                            style={{ borderBottom: i < arr.length - 1 ? "1px solid #F0F0F0" : undefined }}
                          >
                            <dt className="text-small" style={{ color: TEXT_MUTED }}>{k}</dt>
                            <dd className="text-small font-semibold text-right break-all" style={{ color: TEXT_DARK }}>{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-3 text-smaller" style={{ color: TEXT_MUTED }}>
                        Please include the reference note when making the transfer.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold" style={{ color: TEXT_DARK }}>{uploadLabel}</h4>
                      <p className="text-small mt-1 mb-3" style={{ color: TEXT_MUTED }}>
                        Upload your bank transfer receipt to complete your payment request.
                      </p>
                      {!receipt ? (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            const f = e.dataTransfer.files?.[0];
                            if (f) onFile(f);
                          }}
                          className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
                          style={{
                            borderColor: dragOver ? TEXT_DARK : "#E5E7EB",
                            backgroundColor: dragOver ? "#F9FAFB" : "#FFFFFF",
                          }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadCloud className="h-6 w-6 mx-auto mb-2" style={{ color: TEXT_MUTED }} />
                          <p className="text-small" style={{ color: TEXT_DARK }}>
                            Drag and drop receipt here
                          </p>
                          <p className="text-smaller mt-1" style={{ color: TEXT_MUTED }}>
                            or <span className="underline">Browse files</span> · PDF, PNG, JPG · Max 10MB
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) onFile(f);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white" style={{ border: "1px solid #F0F0F0" }}>
                          <FileText className="h-5 w-5 shrink-0" style={{ color: TEXT_DARK }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-small font-semibold truncate" style={{ color: TEXT_DARK }}>{receipt.name}</p>
                            <p className="text-smaller" style={{ color: TEXT_MUTED }}>Uploaded {receipt.uploadedAt}</p>
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-smaller font-semibold"
                            style={{ backgroundColor: "#F3F4F6", color: TEXT_DARK }}
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {isLoanInvite && invitation?.paymentDetails.paymentType === "Loan" ? (
                <a
                  href={invitation.paymentDetails.loanApplicationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 py-3.5 rounded-full font-semibold hover:opacity-90"
                  style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                >
                  Continue to Loan Application <ExternalLink className="h-4 w-4" />
                </a>
              ) : (() => {
                const amount = isSubscriptionInvite
                  ? subscriptionAmount
                  : isInstallmentInvite && invitation?.paymentDetails.paymentType === "Installment"
                    ? invitation.paymentDetails.initialDownPayment
                    : total;
                const amountLabel = `$${Math.round(amount).toLocaleString()}`;
                const isBank = method === "bank";
                const isCrypto = method === "crypto";
                const disabled = submitting || (isBank && !receipt) || (isCrypto && !txAddress.trim());
                let label: string;
                if (submitting) label = "Processing...";
                else if (isBank) {
                  label = isSubscriptionInvite
                    ? `Send Receipt and Start Subscription · ${amountLabel}`
                    : `Send Receipt and Purchase · ${amountLabel}`;
                } else if (isCrypto) {
                  label = `Confirm Crypto Payment · ${amountLabel}`;
                } else if (isSubscriptionInvite) {
                  label = `Start Subscription · ${amountLabel}`;
                } else if (isInstallmentInvite && invitation?.paymentDetails.paymentType === "Installment") {
                  label = `Pay Down Payment · ${amountLabel}`;
                } else {
                  label = `Purchase Now · ${fmt(total)}`;
                }
                return (
                  <button
                    type="submit"
                    disabled={disabled}
                    className="mt-6 w-full py-3.5 rounded-full font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                  >
                    {label}
                  </button>
                );
              })()}

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

type IconType = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

function ProductDetailsList({
  rows,
  muted,
  dark,
}: {
  rows: { icon: IconType; label: string; value: string }[];
  muted: string;
  dark: string;
}) {
  return (
    <dl className="flex flex-col">
      {rows.map((r, i) => {
        const Icon = r.icon;
        return (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4 py-3"
            style={{ borderBottom: i < rows.length - 1 ? "1px solid #F0F0F0" : undefined }}
          >
            <dt className="flex items-center gap-3 min-w-0" style={{ color: muted }}>
              <Icon className="h-4 w-4 shrink-0" style={{ color: muted }} />
              <span className="truncate">{r.label}</span>
            </dt>
            <dd className="font-semibold text-right" style={{ color: dark }}>{r.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
