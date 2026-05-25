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

import { SlidersHorizontal, Eye, Clock, Users } from "lucide-react";
import {
  TrendingUp,
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  Circle,
  Mail,
  MousePointerClick,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
  const paid = { bg: "rgba(204, 246, 33, 0.35)", color: "#3F5C00" };
  const pending = { bg: "#F3F4F6", color: "#4B5563" };
  const rejected = { bg: "#FEE2E2", color: "#991B1B" };
  const invite = { bg: "#FEF9C3", color: "#854D0E" };
  const map: Record<InvitationStatus, { bg: string; color: string }> = {
    Pending: pending,
    "Invite Sent": invite,
    Paid: paid,
    Expired: rejected,
    "Installment Pending Approval": pending,
    "Installment Approved": paid,
    "Installment Rejected": rejected,
    "Bank Transfer Pending": pending,
    "Bank Transfer Confirmed": paid,
    "Loan Pending": pending,
    "Loan Approved": paid,
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
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);
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

  const viewing = useMemo(
    () => invitations.find((i) => i.id === viewDetailsId) ?? null,
    [invitations, viewDetailsId],
  );

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
                Track sales payments, create payment plans, and manage student checkout invitations.
              </p>
            </div>

            <AnalyticsSection />

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div
                className="flex min-w-[260px] flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <Search className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by student, email, course, or payment type"
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
                                onClick={() => setViewDetailsId(row.id)}
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

      {viewing && (
        <PaymentOverviewDrawer
          invitation={viewing}
          onClose={() => setViewDetailsId(null)}
        />
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

// ===================== Analytics =====================

const INCOMING_DATA = [
  { month: "Jan", Upfront: 42000, Installment: 18000, Bank: 8000, Loan: 5000 },
  { month: "Feb", Upfront: 38000, Installment: 22000, Bank: 9000, Loan: 6000 },
  { month: "Mar", Upfront: 52000, Installment: 26000, Bank: 11000, Loan: 7000 },
  { month: "Apr", Upfront: 46000, Installment: 31000, Bank: 10000, Loan: 6500 },
  { month: "May", Upfront: 61000, Installment: 34000, Bank: 12000, Loan: 9000 },
  { month: "Jun", Upfront: 72000, Installment: 39000, Bank: 15000, Loan: 11000 },
];

const PAYMENT_SPLIT = [
  { name: "Upfront", value: 42, color: "#CCF621" },
  { name: "Installment", value: 34, color: "#A3E635" },
  { name: "Bank", value: 14, color: "#84CC16" },
  { name: "Loan", value: 10, color: "#D9F99D" },
];

type KpiTone = "lime" | "mint" | "yellow" | "teal";

function AnalyticsSection() {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          tone="lime"
          label="Total Sales Revenue"
          description="Overall revenue generated from student payment plans."
          value="$284,600"
          Icon={Wallet}
        />
        <KpiCard
          tone="mint"
          label="Incoming Payments"
          description="Expected payments from active student plans."
          value="$72,400"
          Icon={TrendingUp}
        />
        <KpiCard
          tone="yellow"
          label="Pending Payments"
          description="Payments waiting to be completed or confirmed."
          value="$41,250"
          subValue="23 Students"
          Icon={Clock}
        />
        <KpiCard
          tone="teal"
          label="Paid Students"
          description="Students who successfully completed payment."
          value="39 Students"
          Icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Incoming Payments"
          subtitle="Expected revenue by payment method over time."
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={INCOMING_DATA} barGap={4} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2E8" vertical={false} />
              <XAxis
                dataKey="month"
                stroke={TEXT_DARK}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: TEXT_DARK }}
              />
              <YAxis
                stroke={TEXT_DARK}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: TEXT_DARK }}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "rgba(204, 246, 33, 0.08)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${BORDER}`,
                  background: "#FFFFFF",
                  boxShadow: "0 8px 24px rgba(17, 24, 39, 0.08)",
                  padding: "10px 12px",
                }}
                labelStyle={{ color: TEXT_DARK, fontSize: 12, marginBottom: 4, fontWeight: 600 }}
                itemStyle={{ color: TEXT_DARK, fontSize: 13, fontWeight: 500 }}
                formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name]}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: 12, fontSize: 12, color: TEXT_DARK }}
                formatter={(value: string) => (
                  <span style={{ color: TEXT_DARK }}>{value}</span>
                )}
              />
              <Bar dataKey="Upfront" fill="#CCF621" radius={[8, 8, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Installment" fill="#A3E635" radius={[8, 8, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Bank" fill="#84CC16" radius={[8, 8, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Loan" fill="#D9F99D" radius={[8, 8, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Type Split" subtitle="Distribution of payment plans by method.">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${BORDER}`,
                  background: "#FFFFFF",
                  boxShadow: "0 8px 24px rgba(17, 24, 39, 0.08)",
                }}
                labelStyle={{ color: TEXT_DARK, fontWeight: 600 }}
                itemStyle={{ color: TEXT_DARK }}
                formatter={(v: number) => `${v}%`}
              />
              <Pie
                data={PAYMENT_SPLIT}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                stroke="#FFFFFF"
                strokeWidth={2}
                label={(e: { value: number }) => `${e.value}%`}
                labelLine={{ stroke: TEXT_DARK }}
              >
                {PAYMENT_SPLIT.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: 8, fontSize: 12, color: TEXT_DARK }}
                formatter={(value: string) => (
                  <span style={{ color: TEXT_DARK }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

const KPI_TONES: Record<
  KpiTone,
  { bgFull: string; bgSoft: string; glowFull: string; glowSoft: string; icon: string }
> = {
  lime: {
    bgFull: "linear-gradient(135deg, #F7FFD6 0%, #ECFBC0 100%)",
    bgSoft: "linear-gradient(135deg, rgba(247,255,214,0.45) 0%, rgba(236,251,192,0.45) 100%)",
    glowFull: "radial-gradient(circle at top right, rgba(204,246,33,0.55), transparent 65%)",
    glowSoft: "radial-gradient(circle at top right, rgba(204,246,33,0.22), transparent 65%)",
    icon: "#9BBF14",
  },
  mint: {
    bgFull: "linear-gradient(135deg, #EAFBE7 0%, #DAF5D2 100%)",
    bgSoft: "linear-gradient(135deg, rgba(234,251,231,0.45) 0%, rgba(218,245,210,0.45) 100%)",
    glowFull: "radial-gradient(circle at top right, rgba(132,204,22,0.45), transparent 65%)",
    glowSoft: "radial-gradient(circle at top right, rgba(132,204,22,0.18), transparent 65%)",
    icon: "#6BAE2A",
  },
  yellow: {
    bgFull: "linear-gradient(135deg, #FBFBD6 0%, #F4F5B5 100%)",
    bgSoft: "linear-gradient(135deg, rgba(251,251,214,0.45) 0%, rgba(244,245,181,0.45) 100%)",
    glowFull: "radial-gradient(circle at top right, rgba(234,225,80,0.55), transparent 65%)",
    glowSoft: "radial-gradient(circle at top right, rgba(234,225,80,0.22), transparent 65%)",
    icon: "#B7A60C",
  },
  teal: {
    bgFull: "linear-gradient(135deg, #E0F5EE 0%, #CFEDE4 100%)",
    bgSoft: "linear-gradient(135deg, rgba(224,245,238,0.45) 0%, rgba(207,237,228,0.45) 100%)",
    glowFull: "radial-gradient(circle at top right, rgba(45,212,168,0.4), transparent 65%)",
    glowSoft: "radial-gradient(circle at top right, rgba(45,212,168,0.18), transparent 65%)",
    icon: "#3F9C84",
  },
};

function KpiCard({
  tone,
  label,
  description,
  value,
  subValue,
  Icon,
}: {
  tone: KpiTone;
  label: string;
  description: string;
  value: string;
  subValue?: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const t = KPI_TONES[tone];
  return (
    <div
      className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl p-5"
      style={{
        background: t.bgSoft,
        border: `1px solid ${BORDER}`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32"
        style={{
          background: t.glowSoft,
        }}
      />
      <span
        className="relative grid h-10 w-10 place-items-center rounded-full bg-white/70 backdrop-blur"
        style={{ color: t.icon, border: `1px solid rgba(255,255,255,0.6)` }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="relative">
        <p className="text-small font-semibold" style={{ color: TEXT_DARK }}>
          {label}
        </p>
        <p className="mt-1 text-small leading-snug" style={{ color: TEXT_MUTED }}>
          {description}
        </p>
      </div>
      <div className="relative mt-auto">
        <p className="text-second-header font-bold leading-tight" style={{ color: TEXT_DARK }}>
          {value}
        </p>
        {subValue && (
          <p className="mt-0.5 text-small font-medium" style={{ color: TEXT_MUTED }}>
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl bg-white p-5 ${className}`}
      style={{ border: `1px solid ${BORDER}` }}
    >
      <div>
        <h3 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>{subtitle}</p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
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
              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-small font-semibold transition-colors hover:bg-[#F3F4F6]"
              style={{
                backgroundColor: done ? TEXT_DARK : SOFT,
                color: done ? "#FFFFFF" : TEXT_DARK,
              }}
            >
              {active && (
                <motion.span
                  layoutId="active-step-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: TEXT_DARK }}
                />
              )}
              <span className="relative z-10" style={{ color: active ? "#FFFFFF" : undefined }}>
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
                animate={{ backgroundColor: done ? TEXT_DARK : BORDER }}
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
              className={`flex items-start justify-between rounded-xl bg-white p-4 text-left transition-colors ${active ? "" : "hover:bg-[#F3F4F6]"}`}
              style={{ border: `2px solid ${active ? TEXT_DARK : BORDER}` }}
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
                style={{
                  border: `2px solid ${active ? TEXT_DARK : BORDER}`,
                  backgroundColor: active ? TEXT_DARK : "transparent",
                }}
              >
                {active && (
                  <Check className="h-3 w-3" style={{ color: "#FFFFFF" }} />
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
              className={`relative flex items-start gap-3 rounded-xl bg-white p-4 text-left transition-colors ${active ? "" : "hover:bg-[#F3F4F6]"}`}
              style={{ border: `2px solid ${active ? TEXT_DARK : BORDER}` }}
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
                  style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
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
                className={`relative cursor-pointer rounded-2xl bg-white p-5 transition-colors ${active ? "" : "hover:bg-[#F3F4F6]"}`}
                style={{ border: `2px solid ${active ? TEXT_DARK : BORDER}` }}
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
                    style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
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
          marginTop: topAlign ? "10vh" : undefined,
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

// ===================== Payment Overview Drawer =====================

type ProofFile = { name: string; uploadedAt: string };

type ApprovalState = "Pending Review" | "Approved" | "Rejected";

function deriveApproval(status: InvitationStatus): ApprovalState {
  if (status === "Installment Approved") return "Approved";
  if (status === "Installment Rejected") return "Rejected";
  return "Pending Review";
}

function PaymentOverviewDrawer({
  invitation,
  onClose,
}: {
  invitation: Invitation;
  onClose: () => void;
}) {
  const inv = invitation;
  const [approval, setApproval] = useState<ApprovalState>(deriveApproval(inv.status));
  const [proof, setProof] = useState<ProofFile | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const isInstallment = inv.paymentDetails.paymentType === "Installment";

  const [installments, setInstallments] = useState<InstallmentRow[]>(() =>
    isInstallment && inv.paymentDetails.paymentType === "Installment"
      ? seedInstallments(inv.paymentDetails, inv.cohortDate)
      : [],
  );

  const approvedCount = installments.filter((i) => i.status === "Approved").length;
  const totalCount = installments.length;
  const progressPct = totalCount ? Math.round((approvedCount / totalCount) * 100) : 0;

  const overallInstallmentStatus = (() => {
    if (!totalCount) return "Awaiting Installments";
    if (approvedCount === totalCount) return "Fully Approved";
    if (installments.some((i) => i.status === "Pending Review")) return "Pending Review";
    if (approvedCount > 0) return "Partially Approved";
    return "Awaiting Installments";
  })();

  const nextDue = installments.find((i) => i.status !== "Approved")?.dueDate ?? "—";

  const [timelineLog, setTimelineLog] = useState<string[]>([]);

  const approveInstallment = (id: string) => {
    setInstallments((prev) => {
      const next = prev.map((it) =>
        it.id === id ? { ...it, status: "Approved" as InstallmentStatus } : it,
      );
      const target = next.find((i) => i.id === id);
      if (target) {
        setTimelineLog((log) => [...log, `${target.label} approved`]);
        // sync overall invitation status
        const allApproved = next.every((i) => i.status === "Approved");
        if (allApproved) updateInvitation(inv.id, { status: "Installment Approved" });
        else updateInvitation(inv.id, { status: "Installment Pending Approval" });
      }
      return next;
    });
    setApproval("Approved");
    toast.success("Installment approved");
  };

  const rejectInstallment = (id: string) => {
    setInstallments((prev) => {
      const next = prev.map((it) =>
        it.id === id
          ? { ...it, status: "Rejected" as InstallmentStatus, proof: null }
          : it,
      );
      const target = next.find((i) => i.id === id);
      if (target) setTimelineLog((log) => [...log, `${target.label} rejected`]);
      return next;
    });
    toast.success("Installment rejected");
  };

  const uploadInstallmentProof = (id: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be 10MB or smaller");
      return;
    }
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    setInstallments((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              proof: { name: file.name, uploadedAt: `Uploaded ${today}` },
              status: it.status === "Upcoming" ? "Pending Review" : "Pending Review",
            }
          : it,
      ),
    );
    toast.success("Proof uploaded");
  };

  const removeInstallmentProof = (id: string) => {
    setInstallments((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, proof: null, status: "Proof Required" } : it,
      ),
    );
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be 10MB or smaller");
      return;
    }
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    setProof({ name: file.name, uploadedAt: `Uploaded ${today}` });
    toast.success("Proof uploaded");
  };

  const createdDate = new Date(inv.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.35)" }}
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[640px] flex-col bg-white"
        style={{ boxShadow: "-20px 0 60px rgba(15,23,42,0.18)" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div>
            <h3 className="text-main-header font-bold" style={{ color: TEXT_DARK }}>
              Payment Overview
            </h3>
            <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>
              Student and payment plan details
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <X className="h-4 w-4" style={{ color: TEXT_MUTED }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6" style={{ backgroundColor: "#FAFAFA" }}>
          {/* Student Details */}
          <DrawerSection title="Student Details">
            <Row label="Student Name" value={inv.studentName ?? "—"} />
            <Row label="Email" value={inv.studentEmail} />
            <Row label="Assigned Salesperson" value="John Miller" />
            <Row label="Status" value={<span>{statusPill(inv.status)}</span>} />
            <Row label="Created Date" value={createdDate} last />
          </DrawerSection>

          {/* Course Access */}
          <DrawerSection title="Course Access Details">
            <Row label="Course" value={inv.course} />
            <Row label="Access Type" value={inv.accessType} />
            <Row label="Cohort Date" value={inv.cohortDate} />
            <Row label="Duration" value="4 Months" />
            <Row label="Lessons" value="70 Lessons" />
            <Row
              label="Certificate"
              value={inv.certificateIncluded ? "Included" : "Not included"}
              last
            />
          </DrawerSection>

          {/* Payment Details */}
          <DrawerSection title="Payment Details">
            <PaymentDetailsBlock invitation={inv} />
          </DrawerSection>

          {/* Timeline */}
          <DrawerSection title="Payment Status Timeline">
            <Timeline invitation={inv} approval={approval} />
          </DrawerSection>

          {/* Installment Approval */}
          {isInstallment && inv.paymentDetails.paymentType === "Installment" && (
            <DrawerSection title="Installment Approval">
              <p className="text-small" style={{ color: TEXT_MUTED }}>
                Students pay installments through a third-party provider. Verify the setup
                before approving access.
              </p>
              <div
                className="mt-3 flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: SOFT }}
              >
                <span className="text-small font-semibold" style={{ color: TEXT_DARK }}>
                  Approval Status
                </span>
                <ApprovalPill state={approval} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <MiniStat
                  label="Initial Down Payment"
                  value={`$${inv.paymentDetails.initialDownPayment.toLocaleString()}`}
                />
                <MiniStat
                  label="Monthly Payment"
                  value={`$${inv.paymentDetails.monthlyPayment.toLocaleString()} / mo`}
                />
                <MiniStat
                  label="Time Period"
                  value={`${inv.paymentDetails.timePeriodMonths} Months`}
                />
                <MiniStat
                  label="Full Amount"
                  value={`$${inv.paymentDetails.fullAmount.toLocaleString()}`}
                />
              </div>
              <div className="mt-4">
                <label
                  className="mb-1.5 block text-small font-medium"
                  style={{ color: TEXT_DARK }}
                >
                  Approval Note
                </label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add an internal note about this approval"
                  rows={3}
                  className="w-full resize-none rounded-xl bg-white px-3 py-2 text-small outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={handleApprove}
                  disabled={approval === "Approved"}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold disabled:opacity-60"
                  style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve Installment
                </button>
                <button
                  onClick={handleReject}
                  disabled={approval === "Rejected"}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold disabled:opacity-60"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#B42318",
                    border: "1px solid #FECDCA",
                  }}
                >
                  <AlertCircle className="h-4 w-4" /> Reject Installment
                </button>
              </div>
            </DrawerSection>
          )}

          {/* Proof Upload */}
          <DrawerSection title="Payment Proof">
            <p className="text-small" style={{ color: TEXT_MUTED }}>
              Upload proof of payment, bank transfer receipt, installment approval PDF, or
              other supporting documents.
            </p>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFile(e.dataTransfer.files?.[0]);
              }}
              className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-8 text-center transition-colors"
              style={{
                border: `1.5px dashed ${dragOver ? TEXT_DARK : BORDER}`,
                backgroundColor: dragOver ? "rgba(204,246,33,0.08)" : "#FFFFFF",
              }}
            >
              <Upload className="h-5 w-5" style={{ color: TEXT_MUTED }} />
              <p className="mt-2 text-small font-medium" style={{ color: TEXT_DARK }}>
                Drop file here or click to upload
              </p>
              <p className="mt-0.5 text-smaller" style={{ color: TEXT_MUTED }}>
                PDF, PNG, JPG up to 10MB
              </p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
              />
            </label>
            {proof && (
              <div
                className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-2.5"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ backgroundColor: SOFT, color: TEXT_DARK }}
                >
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-small font-medium"
                    style={{ color: TEXT_DARK }}
                  >
                    {proof.name}
                  </p>
                  <p className="text-smaller" style={{ color: TEXT_MUTED }}>
                    {proof.uploadedAt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Preview not available in demo")}
                  className="rounded-full px-3 py-1.5 text-small font-medium hover:bg-[#F3F4F6]"
                  style={{ color: TEXT_DARK }}
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => setProof(null)}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#FEE2E2]"
                  style={{ color: "#B42318" }}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </DrawerSection>
        </div>
      </motion.aside>
    </div>
  );
}

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl bg-white p-5"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <h4 className="mb-3 text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        {title}
      </h4>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-2.5"
      style={{ borderBottom: last ? undefined : `1px solid ${BORDER}` }}
    >
      <span className="text-small" style={{ color: TEXT_MUTED }}>
        {label}
      </span>
      <span
        className="text-small font-medium text-right"
        style={{ color: TEXT_DARK, wordBreak: "break-word" }}
      >
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: SOFT }}>
      <p className="text-smaller" style={{ color: TEXT_MUTED }}>
        {label}
      </p>
      <p className="mt-0.5 text-small font-semibold" style={{ color: TEXT_DARK }}>
        {value}
      </p>
    </div>
  );
}

function ApprovalPill({ state }: { state: ApprovalState }) {
  const map: Record<ApprovalState, { bg: string; color: string }> = {
    "Pending Review": { bg: "#F3F4F6", color: "#4B5563" },
    Approved: { bg: "rgba(204, 246, 33, 0.45)", color: "#3F5C00" },
    Rejected: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[state];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-smaller font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {state}
    </span>
  );
}

function PaymentDetailsBlock({ invitation }: { invitation: Invitation }) {
  const d = invitation.paymentDetails;
  if (d.paymentType === "Upfront") {
    return (
      <>
        <Row label="Payment Method" value="Upfront" />
        <Row label="Plan" value={d.planName} />
        <Row label="Plan Amount" value={`$${d.planAmount.toLocaleString()}`} />
        <Row label="Discount" value={`${d.discountPercent}%`} />
        <Row label="Promo Code Discount" value="$0" />
        <Row label="Total Amount" value={`$${d.checkoutAmount.toLocaleString()}`} />
        <Row
          label="Payment Status"
          value={statusPill(invitation.status)}
          last
        />
      </>
    );
  }
  if (d.paymentType === "Installment") {
    return (
      <>
        <Row label="Payment Method" value="Installment" />
        <Row label="Full Amount" value={`$${d.fullAmount.toLocaleString()}`} />
        <Row
          label="Initial Down Payment"
          value={`$${d.initialDownPayment.toLocaleString()}`}
        />
        <Row label="Time Period" value={`${d.timePeriodMonths} Months`} />
        <Row
          label="Monthly Payment"
          value={`$${d.monthlyPayment.toLocaleString()} / month`}
        />
        <Row label="Installment Status" value={statusPill(invitation.status)} />
        <Row label="Next Payment Due" value="Jul 12, 2026" last />
      </>
    );
  }
  if (d.paymentType === "Bank") {
    return (
      <>
        <Row label="Payment Method" value="Bank" />
        <Row label="Bank Name" value={d.bankName} />
        <Row label="Account Name" value={d.accountName} />
        <Row label="Reference Note" value={d.referenceNote} />
        <Row label="Transfer Status" value={statusPill(invitation.status)} last />
      </>
    );
  }
  return (
    <>
      <Row label="Payment Method" value="Loan" />
      <Row label="Loan Provider" value={d.loanProviderName} />
      <Row
        label="Loan Link"
        value={
          <a
            href={d.loanApplicationLink}
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: TEXT_DARK }}
          >
            {d.loanApplicationLink}
          </a>
        }
      />
      <Row label="Loan Status" value={statusPill(invitation.status)} last />
    </>
  );
}

type TimelineState = "done" | "current" | "pending";

function Timeline({
  invitation,
  approval,
}: {
  invitation: Invitation;
  approval: ApprovalState;
}) {
  const status = invitation.status;
  const isInstallment = invitation.paymentDetails.paymentType === "Installment";

  const items: { label: string; icon: React.ComponentType<{ className?: string }>; state: TimelineState }[] = [
    { label: "Payment plan created", icon: FileText, state: "done" },
    {
      label: "Invitation sent",
      icon: Mail,
      state:
        status === "Pending"
          ? "current"
          : "done",
    },
    {
      label: "Student opened link",
      icon: MousePointerClick,
      state:
        status === "Pending"
          ? "pending"
          : status === "Invite Sent"
            ? "current"
            : "done",
    },
    {
      label: "Payment submitted",
      icon: CreditCard,
      state:
        status === "Paid" ||
        status === "Installment Approved" ||
        status === "Bank Transfer Confirmed" ||
        status === "Loan Approved"
          ? "done"
          : status === "Installment Pending Approval" ||
              status === "Bank Transfer Pending" ||
              status === "Loan Pending"
            ? "current"
            : "pending",
    },
    {
      label: isInstallment
        ? approval === "Approved"
          ? "Installment approved"
          : approval === "Rejected"
            ? "Installment rejected"
            : "Payment approved"
        : "Payment approved",
      icon: ShieldCheck,
      state:
        status === "Paid" ||
        status === "Installment Approved" ||
        status === "Bank Transfer Confirmed" ||
        status === "Loan Approved"
          ? "done"
          : status === "Installment Rejected"
            ? "current"
            : "pending",
    },
  ];

  return (
    <ol className="relative space-y-3">
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1;
        const tone =
          it.state === "done"
            ? { bg: BRAND, color: TEXT_DARK, text: TEXT_DARK }
            : it.state === "current"
              ? { bg: SOFT, color: TEXT_DARK, text: TEXT_DARK }
              : { bg: "#FFFFFF", color: TEXT_MUTED, text: TEXT_MUTED };
        const Icon = it.state === "done" ? CheckCircle2 : it.state === "current" ? it.icon : Circle;
        return (
          <li key={it.label} className="relative flex items-start gap-3">
            <span
              className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full"
              style={{
                backgroundColor: tone.bg,
                color: tone.color,
                border: it.state === "pending" ? `1px solid ${BORDER}` : "none",
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-4 top-8 h-full w-px"
                style={{ backgroundColor: BORDER }}
              />
            )}
            <div className="flex flex-1 items-center justify-between pt-1.5">
              <span className="text-small font-medium" style={{ color: tone.text }}>
                {it.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-smaller font-semibold capitalize"
                style={{
                  backgroundColor:
                    it.state === "done"
                      ? "rgba(204,246,33,0.35)"
                      : it.state === "current"
                        ? SOFT
                        : "transparent",
                  color:
                    it.state === "done"
                      ? "#3F5C00"
                      : it.state === "current"
                        ? TEXT_DARK
                        : TEXT_MUTED,
                }}
              >
                {it.state}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}