import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  Plus,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Send,
  Share2,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Link2,
  Wallet,
  CalendarClock,
  Banknote,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import {
  addCustomCohort,
  addInvitation,
  salesCourses,
  updateInvitation,
  useCustomCohorts,
  useInvitations,
  type Invitation,
  type InvitationStatus,
  type PaymentDetails,
  type PaymentMethod,
  type SalesCourse,
} from "@/lib/invitations-store";

import { SlidersHorizontal, Eye, FileText, CheckCircle, Clock } from "lucide-react";

const BRAND = "#CCF621";
const PAGE_BG = "#FFFFFF";
const TEXT_DARK = "#1A1A1A";
const TEXT_MUTED = "#6B7280";
const BORDER = "#EAEAEA";
const SOFT = "#F3F4F6";

export const Route = createFileRoute("/sales/payments")({
  head: () => ({
    meta: [
      { title: "Payment — Metana" },
      {
        name: "description",
        content:
          "Create and manage student payment plans, checkout links, and invitations.",
      },
    ],
  }),
  component: PaymentPage,
});

function statusPill(status: InvitationStatus) {
  const map: Record<InvitationStatus, { bg: string; color: string }> = {
    Pending: { bg: "#F3F4F6", color: "#4B5563" },
    "Invite Sent": { bg: "#FEF9C3", color: "#854D0E" },
    Paid: { bg: "rgba(204, 246, 33, 0.35)", color: "#3F5C00" },
    Expired: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-smaller font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function planSetupLabel(inv: Invitation): string {
  const d = inv.paymentDetails;
  switch (d.paymentType) {
    case "Upfront":
      return `${d.planName} · $${d.checkoutAmount.toLocaleString()}`;
    case "Installment":
      return `$${d.initialDownPayment.toLocaleString()} down · $${d.monthlyPayment.toLocaleString()}/mo`;
    case "Bank":
      return "Bank Transfer";
    case "Loan":
      return "Loan Redirect";
  }
}

function PaymentPage() {
  const invitations = useInvitations();
  const [addOpen, setAddOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<Invitation | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return invitations;
    const q = query.toLowerCase();
    return invitations.filter(
      (i) =>
        i.studentEmail.toLowerCase().includes(q) ||
        (i.studentName?.toLowerCase().includes(q) ?? false) ||
        i.course.toLowerCase().includes(q),
    );
  }, [invitations, query]);

  const stats = useMemo(() => {
    return {
      total: invitations.length,
      sent: invitations.filter((i) => i.status === "Invite Sent").length,
      paid: invitations.filter((i) => i.status === "Paid").length,
      pending: invitations.filter((i) => i.status === "Pending").length,
    };
  }, [invitations]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: PAGE_BG, color: TEXT_DARK }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1480px]">
            <div className="mb-6">
              <h1 className="text-primary-header font-bold" style={{ color: TEXT_DARK }}>
                Payment
              </h1>
              <p className="mt-1 text-body" style={{ color: TEXT_MUTED }}>
                Create and manage student payment plans, checkout links, and invitations.
              </p>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Payment Plans" value={stats.total} Icon={FileText} />
              <StatCard label="Invite Sent" value={stats.sent} Icon={Send} />
              <StatCard label="Paid Students" value={stats.paid} Icon={CheckCircle} />
              <StatCard label="Pending Payments" value={stats.pending} Icon={Clock} />
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div
                className="flex min-w-[260px] flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <Search className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by student, email, or course"
                  className="w-full bg-transparent text-body outline-none"
                  style={{ color: TEXT_DARK }}
                />
              </div>
              <button
                aria-label="Filters"
                className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-[#F3F4F6]"
                style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className="ml-auto inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: BRAND, color: TEXT_DARK }}
              >
                <Plus className="h-4 w-4" /> Create Payment Plan
              </button>
            </div>

            <section
              className="overflow-hidden rounded-2xl bg-white"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <h2 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
                  Assigned Users
                </h2>
                <span className="text-small" style={{ color: TEXT_MUTED }}>
                  {filtered.length} {filtered.length === 1 ? "user" : "users"}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body">
                  <thead>
                    <tr style={{ color: TEXT_MUTED }}>
                      {[
                        "Student",
                        "Email",
                        "Course",
                        "Cohort Date",
                        "Payment Method",
                        "Plan / Setup",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-small font-medium uppercase tracking-wide"
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-14 text-center text-body"
                          style={{ color: TEXT_MUTED }}
                        >
                          No students match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-[#F8F8F8]"
                          style={{
                            borderBottom:
                              idx < filtered.length - 1 ? `1px solid ${BORDER}` : undefined,
                          }}
                        >
                          <td className="px-6 py-4 font-semibold" style={{ color: TEXT_DARK }}>
                            {row.studentName ?? "—"}
                          </td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>{row.studentEmail}</td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>{row.course}</td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>{row.cohortDate}</td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>{row.paymentMethod}</td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>{planSetupLabel(row)}</td>
                          <td className="px-6 py-4">{statusPill(row.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <IconAction
                                label={row.status === "Invite Sent" ? "Resend Invitation" : "Send Invitation"}
                                onClick={() => {
                                  updateInvitation(row.id, { status: "Invite Sent" });
                                  toast.success(`Invitation sent to ${row.studentEmail}`);
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </IconAction>
                              <IconAction
                                label="Copy Link"
                                onClick={() => copyLink(row.checkoutLink)}
                              >
                                <Link2 className="h-4 w-4" />
                              </IconAction>
                              <IconAction
                                label="View Details"
                                onClick={() => setInviteResult(row)}
                              >
                                <Eye className="h-4 w-4" />
                              </IconAction>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {addOpen && (
        <AddStudentModal
          onClose={() => setAddOpen(false)}
          onConfirm={(inv) => {
            setAddOpen(false);
            setInviteResult(inv);
          }}
        />
      )}

      {inviteResult && (
        <InvitationModal invitation={inviteResult} onClose={() => setInviteResult(null)} />
      )}
    </div>
  );
}

function copyLink(link: string) {
  navigator.clipboard?.writeText(link).then(
    () => toast.success("Link copied"),
    () => toast.error("Could not copy link"),
  );
}

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl bg-white p-5"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: SOFT, color: TEXT_DARK }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-second-header font-bold leading-tight" style={{ color: TEXT_DARK }}>
          {value.toLocaleString()}
        </p>
        <p className="mt-0.5 text-small" style={{ color: TEXT_MUTED }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-[#F3F4F6]"
      style={{ color: TEXT_MUTED }}
    >
      {children}
    </button>
  );
}

function SelectPill({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full bg-white px-4 py-2.5 pr-9 text-body outline-none"
        style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: TEXT_MUTED }}
      />
    </div>
  );
}

// ===================== Add Student Modal =====================

type Step = 1 | 2 | 3 | 4 | 5;

type UpfrontPlanState = {
  id: "plan-01" | "plan-02";
  name: "Plan 01" | "Plan 02";
  planAmount: number;
  discountPercent: number;
};

const UPFRONT_PLANS: UpfrontPlanState[] = [
  { id: "plan-01", name: "Plan 01", planAmount: 12370, discountPercent: 20 },
  { id: "plan-02", name: "Plan 02", planAmount: 17500, discountPercent: 20 },
];

function AddStudentModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (inv: Invitation) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState<SalesCourse | null>(null);
  const [cohort, setCohort] = useState<SalesCourse["cohorts"][number] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [createCohortMode, setCreateCohortMode] = useState(false);

  // Upfront state
  const [upfrontPlanId, setUpfrontPlanId] = useState<"plan-01" | "plan-02">("plan-01");
  const [upfrontDiscount, setUpfrontDiscount] = useState<Record<"plan-01" | "plan-02", number>>({
    "plan-01": 20,
    "plan-02": 20,
  });

  // Installment state
  const [fullAmount, setFullAmount] = useState(14000);
  const [downPayment, setDownPayment] = useState(2000);
  const [months, setMonths] = useState<3 | 6 | 9 | 12>(6);

  // Bank state (preview only)
  const bank = {
    bankName: "Example Business Bank",
    accountName: "Metana / Edmore LLC",
    accountNumber: "000123456789",
    routingNumber: "021000021",
    swiftCode: "EXAMPLEUS",
  };

  // Loan state
  const [loanProvider, setLoanProvider] = useState("Metana Financing Partner");
  const [loanLink, setLoanLink] = useState("https://metana.io/finance/apply?invite=INV-10294");

  const [createdInvitation, setCreatedInvitation] = useState<Invitation | null>(null);

  const emailOk = /.+@.+\..+/.test(email.trim());

  const next = () => {
    if (step === 1) {
      if (!emailOk) return toast.error("Enter a valid email.");
      if (!course) return toast.error("Select a course.");
      setStep(2);
    } else if (step === 2) {
      if (!cohort) return toast.error("Select a cohort date.");
      setStep(3);
    } else if (step === 3) {
      if (!paymentMethod) return toast.error("Select a payment method.");
      setStep(4);
    } else if (step === 4) {
      if (paymentMethod === "Installment") {
        if (downPayment >= fullAmount) return toast.error("Down payment cannot exceed full amount.");
      }
      setStep(5);
    }
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const buildPaymentDetails = (): PaymentDetails => {
    if (paymentMethod === "Upfront") {
      const plan = UPFRONT_PLANS.find((p) => p.id === upfrontPlanId)!;
      const dp = upfrontDiscount[plan.id];
      const checkoutAmount = Math.round(plan.planAmount * (1 - dp / 100));
      return {
        paymentType: "Upfront",
        planName: plan.name,
        planAmount: plan.planAmount,
        discountPercent: dp,
        checkoutAmount,
      };
    }
    if (paymentMethod === "Installment") {
      const remaining = Math.max(0, fullAmount - downPayment);
      const monthly = months > 0 ? Math.round(remaining / months) : 0;
      return {
        paymentType: "Installment",
        fullAmount,
        initialDownPayment: downPayment,
        timePeriodMonths: months,
        monthlyPayment: monthly,
        totalAmount: fullAmount,
      };
    }
    if (paymentMethod === "Bank") {
      return {
        paymentType: "Bank",
        ...bank,
        referenceNote: `${email.trim()} · ${course?.title ?? ""}`,
      };
    }
    return {
      paymentType: "Loan",
      loanProviderName: loanProvider,
      loanApplicationLink: loanLink,
      redirectRequired: true,
    };
  };

  const confirm = () => {
    if (!course || !cohort || !paymentMethod) return;
    const details = buildPaymentDetails();

    // Back-compat fields used by the pre-filled checkout for upfront/installment
    const planAmount =
      details.paymentType === "Upfront"
        ? details.planAmount
        : details.paymentType === "Installment"
          ? details.fullAmount
          : 0;
    const checkoutAmount =
      details.paymentType === "Upfront"
        ? details.checkoutAmount
        : details.paymentType === "Installment"
          ? details.totalAmount
          : 0;
    const discountPercent = details.paymentType === "Upfront" ? details.discountPercent : 0;
    const planLabel: "Plan 01" | "Plan 02" =
      details.paymentType === "Upfront"
        ? (details.planName as "Plan 01" | "Plan 02")
        : "Plan 01";
    const planId: "plan-01" | "plan-02" =
      details.paymentType === "Upfront" ? upfrontPlanId : "plan-01";

    const inv = addInvitation({
      studentName: email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      studentEmail: email.trim(),
      course: course.title,
      courseId: course.id,
      cohortDate: cohort.date,
      plan: planLabel,
      planId,
      paymentType: paymentMethod,
      planAmount,
      discountPercent,
      checkoutAmount,
      paymentMethod,
      paymentDetails: details,
      accessType: "Full Program Access",
      certificateIncluded: true,
      status: "Pending",
    });
    setCreatedInvitation(inv);
    onConfirm(inv);
  };

  const stepperLabels = [
    "Student & Course",
    "Cohort Date",
    "Payment Method",
    "Plan Setup",
    "Preview & Confirm",
  ];

  return (
    <ModalShell
      title={createCohortMode ? "Create New Cohort" : "Create Payment Plan"}
      onClose={onClose}
      maxWidth={960}
      topAlign
    >
      <StepIndicator step={step} labels={stepperLabels} />
      <motion.div
        layout
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="mt-6"
      >
        {createCohortMode && course ? (
          <CreateCohortView
            course={course}
            onCancel={() => setCreateCohortMode(false)}
            onCreate={(c) => {
              addCustomCohort(course.title, c);
              setCohort(c);
              setCreateCohortMode(false);
              toast.success("Cohort created");
            }}
          />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
            {step === 1 && (
              <Step1
                email={email}
                setEmail={setEmail}
                course={course}
                setCourse={(c) => {
                  setCourse(c);
                  setCohort(null);
                }}
              />
            )}
            {step === 2 && course && (
              <Step2
                course={course}
                cohort={cohort}
                setCohort={setCohort}
                onCreateNew={() => setCreateCohortMode(true)}
              />
            )}
            {step === 3 && (
              <Step3PaymentMethod method={paymentMethod} setMethod={setPaymentMethod} />
            )}
            {step === 4 && paymentMethod && (
              <Step4PlanSetup
                method={paymentMethod}
                upfrontPlanId={upfrontPlanId}
                setUpfrontPlanId={setUpfrontPlanId}
                upfrontDiscount={upfrontDiscount}
                setUpfrontDiscount={setUpfrontDiscount}
                fullAmount={fullAmount}
                setFullAmount={setFullAmount}
                downPayment={downPayment}
                setDownPayment={setDownPayment}
                months={months}
                setMonths={setMonths}
                bank={bank}
                loanProvider={loanProvider}
                setLoanProvider={setLoanProvider}
                loanLink={loanLink}
                setLoanLink={setLoanLink}
              />
            )}
            {step === 5 && course && cohort && paymentMethod && (
              <Step5Preview
                email={email}
                course={course}
                cohort={cohort}
                paymentMethod={paymentMethod}
                details={buildPaymentDetails()}
              />
            )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {!createCohortMode && (
        <div
          className="mt-8 flex items-center justify-end gap-3 pt-5"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          {step > 1 && (
            <button
              onClick={back}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold"
              style={{ backgroundColor: SOFT, color: TEXT_DARK }}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold"
              style={{ backgroundColor: BRAND, color: TEXT_DARK }}
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={confirm}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold"
              style={{ backgroundColor: BRAND, color: TEXT_DARK }}
            >
              Confirm & Generate Invitation
            </button>
          )}
        </div>
      )}
    </ModalShell>
  );
}

function StepIndicator({ step, labels }: { step: Step; labels: string[] }) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-small font-semibold"
              style={{ backgroundColor: done ? BRAND : SOFT, color: TEXT_DARK }}
            >
              {active && (
                <motion.span
                  layoutId="active-step-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: BRAND }}
                />
              )}
              <span className="relative z-10">
                {done ? <Check className="h-4 w-4" /> : n}
              </span>
            </div>
            <motion.span
              animate={{ color: active ? TEXT_DARK : TEXT_MUTED }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="hidden text-smaller font-medium lg:inline"
            >
              {label}
            </motion.span>
            {i < labels.length - 1 && (
              <motion.div
                animate={{ backgroundColor: done ? BRAND : BORDER }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-px flex-1"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1({
  email,
  setEmail,
  course,
  setCourse,
}: {
  email: string;
  setEmail: (v: string) => void;
  course: SalesCourse | null;
  setCourse: (c: SalesCourse | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = salesCourses.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="flex flex-col gap-5">
      <Field label="Student Email" required>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@example.com"
          maxLength={255}
          className="w-full rounded-xl bg-white px-4 py-3 text-body outline-none"
          style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
        />
      </Field>
      <Field label="Select Course" required>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-left text-body"
            style={{ border: `1px solid ${BORDER}`, color: course ? TEXT_DARK : TEXT_MUTED }}
          >
            {course?.title ?? "Search and select a course"}
            <ChevronUp className="h-4 w-4" style={{ color: TEXT_MUTED }} />
          </button>
          {open && (
            <div
              className="absolute bottom-full z-20 mb-2 w-full overflow-hidden rounded-xl bg-white"
              style={{ border: `1px solid ${BORDER}`, boxShadow: "0 -10px 30px rgba(15,23,42,0.08)" }}
            >
              <ul className="max-h-64 overflow-y-auto">
                {filtered.map((c) => (
                  <li key={c.title}>
                    <button
                      type="button"
                      onClick={() => {
                        setCourse(c);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-body hover:bg-[#F9FAFB]"
                      style={{ color: TEXT_DARK }}
                    >
                      {c.title}
                      {course?.title === c.title && (
                        <Check className="h-4 w-4" style={{ color: TEXT_DARK }} />
                      )}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-4 py-3 text-small" style={{ color: TEXT_MUTED }}>
                    No courses found.
                  </li>
                )}
              </ul>
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <Search className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses"
                  className="w-full bg-transparent text-body outline-none"
                  style={{ color: TEXT_DARK }}
                />
              </div>
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}

function Step2({
  course,
  cohort,
  setCohort,
  onCreateNew,
}: {
  course: SalesCourse;
  cohort: SalesCourse["cohorts"][number] | null;
  setCohort: (c: SalesCourse["cohorts"][number]) => void;
  onCreateNew: () => void;
}) {
  const custom = useCustomCohorts();
  const cohorts = useMemo(() => {
    return [...(custom[course.title] ?? []), ...course.cohorts];
  }, [custom, course]);
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl px-4 py-3 text-body"
        style={{ backgroundColor: SOFT, color: TEXT_DARK }}
      >
        <span style={{ color: TEXT_MUTED }}>Selected Course: </span>
        <span className="font-semibold">{course.title}</span>
      </div>
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Select Cohort Date
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {cohorts.map((c) => {
          const active = cohort?.date === c.date && cohort?.time === c.time;
          return (
            <button
              key={`${c.date}-${c.time}`}
              type="button"
              onClick={() => setCohort(c)}
              className="flex items-start justify-between rounded-xl bg-white p-4 text-left transition-colors"
              style={{ border: `2px solid ${active ? BRAND : BORDER}` }}
            >
              <div>
                <p className="font-semibold" style={{ color: TEXT_DARK }}>{c.date}</p>
                <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>
                  {c.day} · {c.time}
                </p>
                <p className="mt-2 text-small" style={{ color: TEXT_MUTED }}>
                  {c.seats} seats available
                </p>
              </div>
              <span
                className="grid h-5 w-5 place-items-center rounded-full"
                style={{ border: `2px solid ${active ? BRAND : BORDER}` }}
              >
                {active && (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BRAND }} />
                )}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 rounded-xl bg-white p-4 text-body font-semibold"
          style={{ border: `2px dashed ${BORDER}`, color: TEXT_DARK }}
        >
          <Plus className="h-4 w-4" /> Create New Cohort Date
        </button>
      </div>
    </div>
  );
}

function CreateCohortView({
  course,
  onCancel,
  onCreate,
}: {
  course: SalesCourse;
  onCancel: () => void;
  onCreate: (c: { date: string; day: string; time: string; seats: number }) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState<number | "">(30);

  const submit = () => {
    if (!date) return toast.error("Cohort date is required.");
    if (!time) return toast.error("Start time is required.");
    if (!seats || Number(seats) <= 0) return toast.error("Max student limit must be greater than 0.");
    const d = new Date(date + "T00:00:00");
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const [hh, mm] = time.split(":");
    const h = Number(hh);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    const formattedTime = `${h12}:${mm} ${ampm}`;
    onCreate({ date: formattedDate, day: dayName, time: formattedTime, seats: Number(seats) });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Course">
        <input
          readOnly
          value={course.title}
          className="w-full rounded-xl px-4 py-3 text-body"
          style={{ backgroundColor: SOFT, color: TEXT_MUTED, border: `1px solid ${BORDER}` }}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cohort Date" required>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl bg-white px-4 py-3 text-body outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
          />
        </Field>
        <Field label="Start Time" required>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl bg-white px-4 py-3 text-body outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
          />
        </Field>
      </div>
      <Field label="Max Student Limit" required>
        <input
          type="number"
          min={1}
          value={seats}
          onChange={(e) => setSeats(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="30"
          className="w-full rounded-xl bg-white px-4 py-3 text-body outline-none"
          style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
        />
      </Field>
      <div
        className="mt-4 flex items-center justify-end gap-3 pt-5"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold"
          style={{ backgroundColor: SOFT, color: TEXT_DARK }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold"
          style={{ backgroundColor: BRAND, color: TEXT_DARK }}
        >
          Create Cohort
        </button>
      </div>
    </div>
  );
}

function Step3PaymentMethod({
  method,
  setMethod,
}: {
  method: PaymentMethod | null;
  setMethod: (m: PaymentMethod) => void;
}) {
  const options: { id: PaymentMethod; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { id: "Upfront", icon: Wallet, desc: "Pay the full amount at once." },
    { id: "Installment", icon: CalendarClock, desc: "Set an initial down payment and monthly schedule." },
    { id: "Bank", icon: Landmark, desc: "Share bank transfer details with the student." },
    { id: "Loan", icon: Banknote, desc: "Share loan application link with the student." },
  ];
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Select Payment Method
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const active = method === o.id;
          const Icon = o.icon;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setMethod(o.id)}
              className="relative flex items-start gap-3 rounded-xl bg-white p-4 text-left transition-colors"
              style={{ border: `2px solid ${active ? BRAND : BORDER}` }}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                style={{ backgroundColor: SOFT, color: TEXT_DARK }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: TEXT_DARK }}>{o.id}</p>
                <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>{o.desc}</p>
              </div>
              {active && (
                <span
                  className="grid h-6 w-6 place-items-center rounded-full"
                  style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                >
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step4PlanSetup(props: {
  method: PaymentMethod;
  upfrontPlanId: "plan-01" | "plan-02";
  setUpfrontPlanId: (v: "plan-01" | "plan-02") => void;
  upfrontDiscount: Record<"plan-01" | "plan-02", number>;
  setUpfrontDiscount: (v: Record<"plan-01" | "plan-02", number>) => void;
  fullAmount: number;
  setFullAmount: (v: number) => void;
  downPayment: number;
  setDownPayment: (v: number) => void;
  months: 3 | 6 | 9 | 12;
  setMonths: (v: 3 | 6 | 9 | 12) => void;
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    swiftCode: string;
  };
  loanProvider: string;
  setLoanProvider: (v: string) => void;
  loanLink: string;
  setLoanLink: (v: string) => void;
}) {
  if (props.method === "Upfront") {
    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
          Select Upfront Plan
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {UPFRONT_PLANS.map((p) => {
            const active = props.upfrontPlanId === p.id;
            const dp = props.upfrontDiscount[p.id];
            const checkout = Math.round(p.planAmount * (1 - dp / 100));
            return (
              <div
                key={p.id}
                onClick={() => props.setUpfrontPlanId(p.id)}
                className="relative cursor-pointer rounded-2xl bg-white p-5 transition-colors"
                style={{ border: `2px solid ${active ? BRAND : BORDER}` }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold" style={{ color: TEXT_DARK }}>{p.name}</p>
                  <span className="text-small" style={{ color: TEXT_MUTED }}>Upfront</span>
                </div>
                <p className="mt-2 text-primary-header font-bold" style={{ color: TEXT_DARK }}>
                  ${p.planAmount.toLocaleString()}
                </p>
                <div className="my-3 h-px w-full" style={{ backgroundColor: BORDER }} />
                <label className="flex flex-col gap-1.5">
                  <span className="text-small" style={{ color: TEXT_MUTED }}>Discount</span>
                  <div
                    className="flex items-center rounded-lg bg-white"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={dp}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        props.setUpfrontDiscount({
                          ...props.upfrontDiscount,
                          [p.id]: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        })
                      }
                      placeholder="20"
                      className="w-full bg-transparent px-3 py-2 text-body outline-none"
                      style={{ color: TEXT_DARK }}
                    />
                    <span className="pr-3 text-small" style={{ color: TEXT_MUTED }}>%</span>
                  </div>
                </label>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-small" style={{ color: TEXT_MUTED }}>Checkout Amount</span>
                  <span className="font-semibold" style={{ color: TEXT_DARK }}>
                    ${checkout.toLocaleString()}
                  </span>
                </div>
                {active && (
                  <span
                    className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full"
                    style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (props.method === "Installment") {
    const remaining = Math.max(0, props.fullAmount - props.downPayment);
    const monthly = props.months > 0 ? Math.round(remaining / props.months) : 0;
    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
          Setup Installment Plan
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Amount" required>
            <CurrencyInput value={props.fullAmount} onChange={props.setFullAmount} />
          </Field>
          <Field label="Initial Down Payment" required>
            <CurrencyInput value={props.downPayment} onChange={props.setDownPayment} />
          </Field>
          <Field label="Time Period" required>
            <select
              value={props.months}
              onChange={(e) => props.setMonths(Number(e.target.value) as 3 | 6 | 9 | 12)}
              className="w-full rounded-xl bg-white px-4 py-3 text-body outline-none"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
            >
              {[3, 6, 9, 12].map((m) => (
                <option key={m} value={m}>{m} months</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${BORDER}` }}>
          {[
            ["Initial Payment", `$${props.downPayment.toLocaleString()}`],
            ["Monthly Payment", `$${monthly.toLocaleString()} / month`],
            ["Duration", `${props.months} months`],
            ["Total Amount", `$${props.fullAmount.toLocaleString()}`],
          ].map(([k, v], i, arr) => (
            <div
              key={k}
              className="flex items-center justify-between py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : undefined }}
            >
              <span style={{ color: TEXT_MUTED }}>{k}</span>
              <span className="font-semibold" style={{ color: TEXT_DARK }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (props.method === "Bank") {
    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
          Bank Transfer Details
        </h4>
        <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${BORDER}` }}>
          {[
            ["Account Name", props.bank.accountName],
            ["Bank Name", props.bank.bankName],
            ["Account Number", props.bank.accountNumber],
            ["Routing Number", props.bank.routingNumber],
            ["SWIFT Code", props.bank.swiftCode],
            ["Reference Note", "Student email + course name"],
          ].map(([k, v], i, arr) => (
            <div
              key={k}
              className="flex items-center justify-between py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : undefined }}
            >
              <span style={{ color: TEXT_MUTED }}>{k}</span>
              <span className="font-semibold" style={{ color: TEXT_DARK }}>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-small" style={{ color: TEXT_MUTED }}>
          The student will receive these bank transfer details in the invitation and checkout page.
        </p>
      </div>
    );
  }

  // Loan
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Loan Payment Link
      </h4>
      <div className="rounded-xl bg-white p-4" style={{ border: `1px solid ${BORDER}` }}>
        <p className="text-small font-semibold" style={{ color: TEXT_DARK }}>Redirect Preview</p>
        <p className="mt-1 break-all text-small" style={{ color: TEXT_MUTED }}>{props.loanLink}</p>
      </div>
      <Field label="Loan Provider Name" required>
        <input
          value={props.loanProvider}
          onChange={(e) => props.setLoanProvider(e.target.value)}
          className="w-full rounded-xl bg-white px-4 py-3 text-body outline-none"
          style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
        />
      </Field>
      <Field label="Loan Application Link" required>
        <input
          value={props.loanLink}
          onChange={(e) => props.setLoanLink(e.target.value)}
          className="w-full rounded-xl bg-white px-4 py-3 text-body outline-none"
          style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
        />
      </Field>
      <p className="text-small" style={{ color: TEXT_MUTED }}>
        The student will be redirected to the loan application page to complete financing before accessing the course.
      </p>
    </div>
  );
}

function CurrencyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div
      className="flex items-center rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <span className="pl-4 text-body" style={{ color: TEXT_MUTED }}>$</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full bg-transparent px-3 py-3 text-body outline-none"
        style={{ color: TEXT_DARK }}
      />
    </div>
  );
}

function Step5Preview({
  email,
  course,
  cohort,
  paymentMethod,
  details,
}: {
  email: string;
  course: SalesCourse;
  cohort: SalesCourse["cohorts"][number];
  paymentMethod: PaymentMethod;
  details: PaymentDetails;
}) {
  const base: [string, string][] = [
    ["Student Email", email],
    ["Course", course.title],
    ["Cohort Date", cohort.date],
    ["Payment Method", paymentMethod],
    ["Access Type", "Full Program Access"],
    ["Certificate", "Included"],
  ];

  let extra: [string, string][] = [];
  if (details.paymentType === "Upfront") {
    extra = [
      ["Plan", details.planName],
      ["Plan Amount", `$${details.planAmount.toLocaleString()}`],
      ["Discount", `${details.discountPercent}%`],
      ["Checkout Amount", `$${details.checkoutAmount.toLocaleString()}`],
    ];
  } else if (details.paymentType === "Installment") {
    extra = [
      ["Full Amount", `$${details.fullAmount.toLocaleString()}`],
      ["Initial Down Payment", `$${details.initialDownPayment.toLocaleString()}`],
      ["Time Period", `${details.timePeriodMonths} months`],
      ["Monthly Payment", `$${details.monthlyPayment.toLocaleString()} / month`],
      ["Total Amount", `$${details.totalAmount.toLocaleString()}`],
    ];
  } else if (details.paymentType === "Bank") {
    extra = [
      ["Bank Name", details.bankName],
      ["Account Name", details.accountName],
      ["Account Number", details.accountNumber],
      ["Reference Note", details.referenceNote],
    ];
  } else {
    extra = [
      ["Loan Provider", details.loanProviderName],
      ["Redirect Link", details.loanApplicationLink],
    ];
  }

  const rows = [...base, ...extra];

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Invitation Preview
      </h4>
      <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${BORDER}` }}>
        <dl>
          {rows.map(([k, v], i) => (
            <div
              key={k}
              className="flex items-center justify-between gap-4 py-3"
              style={{ borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : undefined }}
            >
              <dt style={{ color: TEXT_MUTED }}>{k}</dt>
              <dd className="break-all text-right font-semibold" style={{ color: TEXT_DARK }}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="text-small" style={{ color: TEXT_MUTED }}>
        This will generate a pre-filled checkout invitation for the selected student.
      </p>
    </div>
  );
}

function Step6Send({ invitation, onDone }: { invitation: Invitation; onDone: () => void }) {
  const link = useMemo(() => {
    if (typeof window === "undefined") return invitation.checkoutLink;
    return `${window.location.origin}/checkout/${invitation.courseId}?invite=${invitation.id}`;
  }, [invitation]);
  const [sent, setSent] = useState(false);

  const sendInvitation = () => {
    updateInvitation(invitation.id, { status: "Invite Sent" });
    setSent(true);
    toast.success(`Invitation sent to ${invitation.studentEmail}`);
  };
  const shareManually = () => {
    const msg = `Hi, your Metana course checkout link is ready. Use this secure link to complete your payment and get access: ${link}`;
    navigator.clipboard?.writeText(msg).then(
      () => toast.success("Share message copied"),
      () => toast.error("Could not copy message"),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "rgba(204, 246, 33, 0.2)", color: TEXT_DARK }}
      >
        <p className="font-semibold">The checkout invitation has been created successfully.</p>
        <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>Invitation ID: {invitation.id}</p>
      </div>
      <div>
        <p className="mb-2 text-small font-medium" style={{ color: TEXT_DARK }}>
          Generated invitation link
        </p>
        <div
          className="flex items-center gap-2 rounded-full bg-white pl-4 pr-1 py-1"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <input
            readOnly
            value={link}
            className="w-full bg-transparent py-2 text-small outline-none"
            style={{ color: TEXT_DARK }}
          />
          <button
            onClick={() => copyLink(link)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-small font-semibold"
            style={{ backgroundColor: SOFT, color: TEXT_DARK }}
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={sendInvitation}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-button-primary font-semibold"
          style={{ backgroundColor: BRAND, color: TEXT_DARK }}
        >
          <Send className="h-4 w-4" /> Send Invitation
        </button>
        <button
          onClick={() => copyLink(link)}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-button-primary font-semibold"
          style={{ backgroundColor: SOFT, color: TEXT_DARK }}
        >
          <Copy className="h-4 w-4" /> Copy Link
        </button>
        <button
          onClick={shareManually}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-button-primary font-semibold"
          style={{ backgroundColor: SOFT, color: TEXT_DARK }}
        >
          <Share2 className="h-4 w-4" /> Share Manually
        </button>
      </div>
      {sent && (
        <p className="text-small" style={{ color: TEXT_MUTED }}>
          Invitation sent to{" "}
          <span className="font-semibold" style={{ color: TEXT_DARK }}>{invitation.studentEmail}</span>
        </p>
      )}
      <div className="flex items-center justify-end pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold"
          style={{ backgroundColor: SOFT, color: TEXT_DARK }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-small font-medium" style={{ color: TEXT_DARK }}>
        {label}
        {required && <span style={{ color: "#DC2626" }}> *</span>}
      </span>
      {children}
    </label>
  );
}

// ===================== Invitation Modal (view existing) =====================

function InvitationModal({
  invitation,
  onClose,
}: {
  invitation: Invitation;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const localLink = useMemo(() => {
    if (typeof window === "undefined") return invitation.checkoutLink;
    return `${window.location.origin}/checkout/${invitation.courseId}?invite=${invitation.id}`;
  }, [invitation]);
  const [sent, setSent] = useState(
    invitation.status === "Invite Sent" || invitation.status === "Paid",
  );

  const sendInvitation = () => {
    updateInvitation(invitation.id, { status: "Invite Sent" });
    setSent(true);
    toast.success(`Invitation sent to ${invitation.studentEmail}`);
  };
  const shareManually = () => {
    const msg = `Hi, your Metana course checkout link is ready. Use this secure link to complete your payment and get access: ${localLink}`;
    navigator.clipboard?.writeText(msg).then(
      () => toast.success("Share message copied"),
      () => toast.error("Could not copy message"),
    );
  };

  return (
    <ModalShell title="Send Invitation" onClose={onClose} maxWidth={620}>
      <div className="flex flex-col gap-5">
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "rgba(204, 246, 33, 0.2)", color: TEXT_DARK }}
        >
          <p className="font-semibold">The checkout invitation has been created successfully.</p>
          <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>
            Invitation ID: {invitation.id}
          </p>
        </div>
        <div>
          <p className="mb-2 text-small font-medium" style={{ color: TEXT_DARK }}>
            Generated invitation link
          </p>
          <div
            className="flex items-center gap-2 rounded-full bg-white pl-4 pr-1 py-1"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <input
              readOnly
              value={localLink}
              className="w-full bg-transparent py-2 text-small outline-none"
              style={{ color: TEXT_DARK }}
            />
            <button
              onClick={() => copyLink(localLink)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-small font-semibold"
              style={{ backgroundColor: SOFT, color: TEXT_DARK }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={sendInvitation}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-button-primary font-semibold"
            style={{ backgroundColor: BRAND, color: TEXT_DARK }}
          >
            <Send className="h-4 w-4" /> Send Invitation
          </button>
          <button
            onClick={() => copyLink(localLink)}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-button-primary font-semibold"
            style={{ backgroundColor: SOFT, color: TEXT_DARK }}
          >
            <Copy className="h-4 w-4" /> Copy Link
          </button>
          <button
            onClick={shareManually}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-button-primary font-semibold"
            style={{ backgroundColor: SOFT, color: TEXT_DARK }}
          >
            <Share2 className="h-4 w-4" /> Share Manually
          </button>
        </div>
        {sent && (
          <p className="text-small" style={{ color: TEXT_MUTED }}>
            Invitation sent to{" "}
            <span className="font-semibold" style={{ color: TEXT_DARK }}>
              {invitation.studentEmail}
            </span>
          </p>
        )}
        <button
          onClick={() =>
            navigate({
              to: "/checkout/$courseId",
              params: { courseId: invitation.courseId },
              search: { plan: invitation.planId, invite: invitation.id } as never,
            })
          }
          className="inline-flex items-center justify-center gap-2 self-end rounded-full px-4 py-2 text-small font-medium hover:underline"
          style={{ color: TEXT_DARK }}
        >
          Preview pre-filled checkout <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </ModalShell>
  );
}

// ===================== Shared Modal Shell =====================

function ModalShell({
  title,
  onClose,
  children,
  maxWidth = 640,
  topAlign = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
  topAlign?: boolean;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 ${
        topAlign ? "items-start" : "items-center py-6"
      }`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
      onClick={onClose}
    >
      <motion.div
        layout
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-[90vw] rounded-2xl bg-white p-6 lg:p-8"
        style={{
          maxWidth,
          marginTop: topAlign ? 72 : undefined,
          marginBottom: topAlign ? 48 : undefined,
          color: TEXT_DARK,
          boxShadow: "0 20px 60px rgba(15,23,42,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-main-header font-bold" style={{ color: TEXT_DARK }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <X className="h-4 w-4" style={{ color: TEXT_MUTED }} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}