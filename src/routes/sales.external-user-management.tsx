import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  Plus,
  Search,
  X,
  Check,
  ChevronDown,
  Copy,
  Send,
  Share2,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import {
  addInvitation,
  salesCourses,
  salesPlans,
  updateInvitation,
  useInvitations,
  type Invitation,
  type InvitationStatus,
  type SalesCourse,
} from "@/lib/invitations-store";

const BRAND = "#CCF621";
const PAGE_BG = "#FAFAFA";
const TEXT_DARK = "#1A1A1A";
const TEXT_MUTED = "#6B7280";
const BORDER = "#EAEAEA";
const SOFT = "#F3F4F6";

export const Route = createFileRoute("/sales/external-user-management")({
  head: () => ({
    meta: [
      { title: "External User Management — Metana" },
      {
        name: "description",
        content:
          "Manage assigned students, grant course access, select plans, and send pre-filled checkout invitations.",
      },
    ],
  }),
  component: ExternalUserManagementPage,
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

function ExternalUserManagementPage() {
  const invitations = useInvitations();
  const [addOpen, setAddOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<Invitation | null>(null);
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [statusFilter, setStatusFilter] = useState<"All Statuses" | InvitationStatus>(
    "All Statuses",
  );

  const filtered = useMemo(() => {
    return invitations.filter((i) => {
      if (statusFilter !== "All Statuses" && i.status !== statusFilter) return false;
      if (courseFilter !== "All Courses" && i.course !== courseFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !i.studentEmail.toLowerCase().includes(q) &&
          !(i.studentName?.toLowerCase().includes(q) ?? false)
        )
          return false;
      }
      return true;
    });
  }, [invitations, query, courseFilter, statusFilter]);

  const courseOptions = useMemo(
    () => ["All Courses", ...Array.from(new Set(invitations.map((i) => i.course)))],
    [invitations],
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: PAGE_BG, color: TEXT_DARK }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1480px]">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-primary-header font-bold" style={{ color: TEXT_DARK }}>
                  External User Management
                </h1>
                <p className="mt-1 text-body" style={{ color: TEXT_MUTED }}>
                  Manage assigned students, grant course access, select plans, and send pre-filled checkout invitations.
                </p>
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: BRAND, color: TEXT_DARK }}
              >
                <Plus className="h-4 w-4" /> Add Student
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <div
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <Search className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-full bg-transparent text-body outline-none"
                  style={{ color: TEXT_DARK }}
                />
              </div>
              <SelectPill
                value={courseFilter}
                options={courseOptions}
                onChange={setCourseFilter}
              />
              <SelectPill
                value={statusFilter}
                options={["All Statuses", "Pending", "Invite Sent", "Paid", "Expired"]}
                onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              />
            </div>

            {/* Table */}
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
                        "Plan",
                        "Payment Type",
                        "Status",
                        "Invitation",
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
                          colSpan={9}
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
                          style={{
                            borderBottom:
                              idx < filtered.length - 1 ? `1px solid ${BORDER}` : undefined,
                          }}
                        >
                          <td className="px-6 py-4 font-semibold" style={{ color: TEXT_DARK }}>
                            {row.studentName ?? "—"}
                          </td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>
                            {row.studentEmail}
                          </td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>
                            {row.course}
                          </td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>
                            {row.cohortDate}
                          </td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>
                            {row.plan}
                          </td>
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>
                            {row.paymentType}
                          </td>
                          <td className="px-6 py-4">{statusPill(row.status)}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => copyLink(row.checkoutLink)}
                              className="inline-flex items-center gap-1.5 text-small font-medium hover:underline"
                              style={{ color: TEXT_DARK }}
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              {row.status === "Paid" ? "Open Link" : "Copy Link"}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 text-small">
                              <button
                                onClick={() => setInviteResult(row)}
                                className="hover:underline"
                                style={{ color: TEXT_DARK }}
                              >
                                View
                              </button>
                              {row.status !== "Paid" && (
                                <button
                                  onClick={() => {
                                    updateInvitation(row.id, { status: "Invite Sent" });
                                    toast.success(`Invitation sent to ${row.studentEmail}`);
                                  }}
                                  className="hover:underline"
                                  style={{ color: TEXT_DARK }}
                                >
                                  {row.status === "Invite Sent" ? "Resend" : "Send"}
                                </button>
                              )}
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
          <option key={o} value={o}>
            {o}
          </option>
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

type Step = 1 | 2 | 3 | 4;

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
  const [plan, setPlan] = useState<(typeof salesPlans)[number] | null>(null);

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
      if (!plan) return toast.error("Select a plan.");
      setStep(4);
    }
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const confirm = () => {
    if (!course || !cohort || !plan) return;
    const inv = addInvitation({
      studentName: email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      studentEmail: email.trim(),
      course: course.title,
      courseId: course.id,
      cohortDate: cohort.date,
      plan: plan.name,
      planId: plan.id,
      paymentType: plan.paymentType,
      planAmount: plan.original,
      discountPercent: plan.discountPercent,
      checkoutAmount: plan.price,
      accessType: "Full Program Access",
      certificateIncluded: true,
      status: "Invite Sent",
    });
    toast.success("Invitation created");
    onConfirm(inv);
  };

  return (
    <ModalShell title="Add Student Access" onClose={onClose} maxWidth={760}>
      <StepIndicator step={step} />
      <div className="mt-6">
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
          <Step2 course={course} cohort={cohort} setCohort={setCohort} />
        )}
        {step === 3 && <Step3 plan={plan} setPlan={setPlan} />}
        {step === 4 && course && cohort && plan && (
          <Step4 email={email} course={course} cohort={cohort} plan={plan} />
        )}
      </div>

      <div
        className="mt-8 flex items-center justify-between gap-3 pt-5"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <button
          onClick={step === 1 ? onClose : back}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold"
          style={{ backgroundColor: SOFT, color: TEXT_DARK }}
        >
          {step === 1 ? "Cancel" : (<><ArrowLeft className="h-4 w-4" /> Back</>)}
        </button>
        {step < 4 ? (
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
    </ModalShell>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = ["Student & Course", "Cohort Date", "Select Plan", "Preview & Confirm"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-small font-semibold"
              style={{
                backgroundColor: active || done ? BRAND : SOFT,
                color: TEXT_DARK,
              }}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </div>
            <span
              className="hidden text-small font-medium md:inline"
              style={{ color: active ? TEXT_DARK : TEXT_MUTED }}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                className="h-px flex-1"
                style={{ backgroundColor: done ? BRAND : BORDER }}
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
            <ChevronDown className="h-4 w-4" style={{ color: TEXT_MUTED }} />
          </button>
          {open && (
            <div
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl bg-white"
              style={{ border: `1px solid ${BORDER}`, boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: `1px solid ${BORDER}` }}
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
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-body hover:bg-[color:var(--soft,#F9FAFB)]"
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
}: {
  course: SalesCourse;
  cohort: SalesCourse["cohorts"][number] | null;
  setCohort: (c: SalesCourse["cohorts"][number]) => void;
}) {
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
        {course.cohorts.map((c) => {
          const active = cohort?.date === c.date;
          return (
            <button
              key={c.date}
              type="button"
              onClick={() => setCohort(c)}
              className="flex items-start justify-between rounded-xl bg-white p-4 text-left transition-colors"
              style={{
                border: `2px solid ${active ? BRAND : BORDER}`,
              }}
            >
              <div>
                <p className="font-semibold" style={{ color: TEXT_DARK }}>
                  {c.date}
                </p>
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
      </div>
    </div>
  );
}

function Step3({
  plan,
  setPlan,
}: {
  plan: (typeof salesPlans)[number] | null;
  setPlan: (p: (typeof salesPlans)[number]) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {salesPlans.map((p) => {
        const active = plan?.id === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlan(p)}
            className="relative flex flex-col rounded-2xl bg-white p-5 text-left transition-colors"
            style={{ border: `2px solid ${active ? BRAND : BORDER}` }}
          >
            {p.popular && (
              <span
                className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-smaller font-semibold"
                style={{ backgroundColor: BRAND, color: TEXT_DARK }}
              >
                Popular
              </span>
            )}
            <p className="text-body font-semibold" style={{ color: TEXT_DARK }}>
              {p.name}
            </p>
            <p className="mt-2 text-primary-header font-bold" style={{ color: TEXT_DARK }}>
              ${p.price.toLocaleString()}
            </p>
            <p className="text-small" style={{ color: TEXT_MUTED }}>
              {p.paymentType}
            </p>
            <div
              className="my-3 h-px w-full"
              style={{ backgroundColor: BORDER }}
            />
            <p className="text-small" style={{ color: TEXT_MUTED }}>
              Original price:{" "}
              <span className="line-through">${p.original.toLocaleString()}</span>
            </p>
            <p className="text-small" style={{ color: TEXT_MUTED }}>
              Discount: {p.discountPercent}%
            </p>
            <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>
              {p.note}
            </p>
            {active && (
              <span
                className="absolute bottom-4 right-4 grid h-6 w-6 place-items-center rounded-full"
                style={{ backgroundColor: BRAND, color: TEXT_DARK }}
              >
                <Check className="h-4 w-4" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Step4({
  email,
  course,
  cohort,
  plan,
}: {
  email: string;
  course: SalesCourse;
  cohort: SalesCourse["cohorts"][number];
  plan: (typeof salesPlans)[number];
}) {
  const rows: [string, string][] = [
    ["Student Email", email],
    ["Course", course.title],
    ["Access Type", "Full Program Access"],
    ["Cohort Date", cohort.date],
    ["Plan", plan.name],
    ["Payment Type", plan.paymentType],
    ["Plan Amount", `$${plan.original.toLocaleString()}`],
    ["Discount", `${plan.discountPercent}%`],
    ["Checkout Amount", `$${plan.price.toLocaleString()}`],
    ["Certificate", "Included"],
  ];
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
              className="flex items-center justify-between py-3"
              style={{
                borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : undefined,
              }}
            >
              <dt style={{ color: TEXT_MUTED }}>{k}</dt>
              <dd className="text-right font-semibold" style={{ color: TEXT_DARK }}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="text-small" style={{ color: TEXT_MUTED }}>
        This will generate a pre-filled checkout link for the selected student.
      </p>
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

// ===================== Invitation Modal =====================

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
  const [sent, setSent] = useState(invitation.status === "Invite Sent" || invitation.status === "Paid");

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
            Invitation sent to <span className="font-semibold" style={{ color: TEXT_DARK }}>{invitation.studentEmail}</span>
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
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 lg:p-8"
        style={{ maxWidth, color: TEXT_DARK }}
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
      </div>
    </div>
  );
}