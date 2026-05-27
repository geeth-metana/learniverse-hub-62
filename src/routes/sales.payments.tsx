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
  deleteInvitation,
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
  User as UserIcon,
  BookOpen,
  ListChecks,
  Layers,
  UploadCloud,
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
    case "Subscription":
      return `Subscription · $${d.monthlyPayment.toLocaleString()}/mo`;
  }
}

function PaymentPage() {
  const invitations = useInvitations();
  const [addOpen, setAddOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<Invitation | null>(null);
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Invitation | null>(null);
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

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold leading-tight" style={{ color: TEXT_DARK, fontSize: 20 }}>
                  Assigned Users
                </h2>
                <span className="text-small" style={{ color: TEXT_MUTED }}>
                  {filtered.length} {filtered.length === 1 ? "user" : "users"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="flex w-[340px] max-w-full items-center gap-2 rounded-full bg-white px-4 py-2.5"
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
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-button-primary font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                >
                  <Plus className="h-4 w-4" /> Create Payment Plan
                </button>
              </div>
            </div>

            <section
              className="overflow-hidden rounded-2xl bg-white"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <style>{`
                .pay-row { transition: background-color 0.2s ease; }
                .pay-row > td { position: relative; transition: background-color 0.2s ease; }
                .pay-row > td::after {
                  content: "";
                  position: absolute;
                  left: 0;
                  right: 0;
                  bottom: -1px;
                  height: 1px;
                  background: #CCF621;
                  transform: scaleX(0);
                  transform-origin: left center;
                  transition: transform 0.25s ease;
                }
                .pay-row:hover { background: rgba(204, 246, 33, 0.06); }
                .pay-row:hover > td::after { transform: scaleX(1); }
              `}</style>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body">
                  <thead>
                    <tr style={{ color: TEXT_MUTED }}>
                      {[
                        "Student",
                        "Email",
                        "Course",
                        "Payment Method",
                        "Status",
                        "Payment Link",
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
                          colSpan={7}
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
                          className="pay-row"
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
                          <td className="px-6 py-4" style={{ color: TEXT_DARK }}>{row.paymentMethod}</td>
                          <td className="px-6 py-4">{statusPill(row.status)}</td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => copyLink(row.checkoutLink)}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-smaller font-semibold transition-colors hover:bg-[#E5E7EB]"
                              style={{ backgroundColor: SOFT, color: TEXT_DARK }}
                            >
                              <Link2 className="h-3.5 w-3.5" /> Copy Payment Link
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <IconAction
                                label="Copy Payment Link"
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
                              <IconAction
                                label="Remove"
                                onClick={() => setRemoveTarget(row)}
                              >
                                <Trash2 className="h-4 w-4" style={{ color: "#B42318" }} />
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

      {removeTarget && (
        <ConfirmRemoveModal
          invitation={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={() => {
            deleteInvitation(removeTarget.id);
            toast.success(`Removed ${removeTarget.studentName ?? removeTarget.studentEmail}`);
            setRemoveTarget(null);
          }}
        />
      )}
    </div>
  );
}

// ===================== Installments Panel (split layout) =====================

type GroupedPaymentLite = {
  id: string;
  label: string;
  installmentIds: string[];
  dueDate: string;
  reason: string;
  note: string;
  status: "Pending Payment" | "Pending" | "Approved" | "Rejected";
  proof: ProofFile | null;
};

function InstallmentsPanel({
  invitation,
  isInstallment,
  installments,
  groups,
  approvedCount,
  totalCount,
  progressPct,
  accessStatus,
  showUpcoming,
  setShowUpcoming,
  selectedInstallmentId,
  setSelectedInstallmentId,
  onUploadProof,
  onRemoveProof,
  onApprove,
  onReject,
  onOpenPostpone,
  onChangeDueDate,
  onUploadGroupProof,
  onApproveGroup,
  onRejectGroup,
  onDetachGroup,
  onChangeGroupDueDate,
  onEditAmount,
  onEditGroupAmount,
}: {
  invitation: Invitation;
  isInstallment: boolean;
  installments: InstallmentRow[];
  groups: GroupedPaymentLite[];
  approvedCount: number;
  totalCount: number;
  progressPct: number;
  accessStatus: "Active" | "Suspended";
  showUpcoming: boolean;
  setShowUpcoming: (v: boolean) => void;
  selectedInstallmentId: string | null;
  setSelectedInstallmentId: (id: string | null) => void;
  onUploadProof: (id: string, file: File | undefined) => void;
  onRemoveProof: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenPostpone: () => void;
  onChangeDueDate: (id: string) => void;
  onUploadGroupProof: (id: string, file: File | undefined) => void;
  onApproveGroup: (id: string) => void;
  onRejectGroup: (id: string) => void;
  onDetachGroup: (id: string) => void;
  onChangeGroupDueDate: (id: string) => void;
  onEditAmount: (id: string) => void;
  onEditGroupAmount: (id: string) => void;
}) {
  if (!isInstallment || invitation.paymentDetails.paymentType !== "Installment") {
    return (
      <PanelSection title="Installment Payments">
        <div
          className="rounded-xl px-4 py-10 text-center"
          style={{ backgroundColor: "#FAFAFA", border: `1px dashed ${BORDER}` }}
        >
          <p className="text-small" style={{ color: TEXT_MUTED }}>
            This student does not have an installment payment plan.
          </p>
        </div>
      </PanelSection>
    );
  }

  const d = invitation.paymentDetails;
  const activeStatuses: InstallmentStatus[] = [
    "Pending",
    "Payment Failed",
    "Overdue",
    "Needs New Proof",
    "Combined Plan Pending",
    "Combined Plan Approved",
    "Approved",
  ];
  const activeRows = installments.filter((i) => activeStatuses.includes(i.status));
  const upcomingRows = installments.filter((i) => i.status === "Upcoming");
  const visibleRows = showUpcoming ? [...activeRows, ...upcomingRows] : activeRows;

  const selected =
    visibleRows.find((i) => i.id === selectedInstallmentId) ?? visibleRows[0] ?? null;
  const groupedIds = new Set(groups.flatMap((g) => g.installmentIds));
  const visibleIndividualRows = visibleRows.filter((i) => !groupedIds.has(i.id));
  const monthly = (invitation.paymentDetails as InstallmentDetailsLite).monthlyPayment;
  const groupTotal = (g: GroupedPaymentLite) =>
    g.installmentIds
      .map((id) => installments.find((i) => i.id === id)?.amount ?? monthly)
      .reduce((s, a) => s + a, 0);
  const groupIncluded = (g: GroupedPaymentLite) =>
    g.installmentIds
      .map((id) => installments.find((i) => i.id === id)?.label)
      .filter(Boolean)
      .join(" + ");
  const groupStatusLabel = (g: GroupedPaymentLite): InstallmentStatus =>
    g.status === "Approved" ? "Combined Plan Approved" : "Combined Plan Pending";
  const selectedGroup = groups.find((g) => g.id === selectedInstallmentId) ?? null;

  return (
    <section>
      <h4 className="mb-4 text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Installment Payments
      </h4>

      {/* Top summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MiniStat label="Full Amount" value={`$${d.fullAmount.toLocaleString()}`} />
        <MiniStat
          label="Down Payment"
          value={`$${d.initialDownPayment.toLocaleString()}`}
        />
        <MiniStat
          label="Monthly Payment"
          value={`$${d.monthlyPayment.toLocaleString()}`}
        />
        <MiniStat label="Approved" value={`${approvedCount} / ${totalCount}`} />
        <MiniStat label="Access" value={accessStatus} />
      </div>

      <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: SOFT }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-small font-semibold" style={{ color: TEXT_DARK }}>
            {approvedCount} of {totalCount} Installments Approved
          </span>
          <span className="text-small font-medium" style={{ color: TEXT_DARK }}>
            {progressPct}%
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "#E5E7EB" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, backgroundColor: BRAND }}
          />
        </div>
      </div>

      {/* Split view */}
      <div
        className="mt-4 grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-[42%_58%]"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {/* Left list */}
        <div
          className="flex flex-col"
          style={{ borderRight: `1px solid ${BORDER}` }}
        >
          <div
            className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-2.5"
            style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#FAFAFA" }}
          >
            <span className="text-small font-semibold" style={{ color: TEXT_DARK }}>
              Installments
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenPostpone}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-smaller font-semibold transition-colors hover:bg-[#E5E7EB]"
                style={{ backgroundColor: "#F3F4F6", color: TEXT_DARK }}
              >
                <CalendarClock className="h-3.5 w-3.5" /> Combined Plans
              </button>
              <button
                type="button"
                aria-label={showUpcoming ? "Hide upcoming installments" : "Show upcoming installments"}
                title={showUpcoming ? "Hide upcoming" : "Show upcoming"}
                onClick={() => setShowUpcoming(!showUpcoming)}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                style={{ backgroundColor: showUpcoming ? TEXT_DARK : "#E5E7EB" }}
              >
                <span
                  className="ml-0.5 inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{ transform: `translateX(${showUpcoming ? 16 : 0}px)` }}
                />
              </button>
            </div>
          </div>
          <div className="max-h-[440px] overflow-y-auto">
            {/* Down payment (always first, static) */}
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div className="min-w-0">
                <p
                  className="truncate text-small font-semibold"
                  style={{ color: TEXT_DARK }}
                >
                  Down Payment
                </p>
                <p className="text-smaller" style={{ color: TEXT_MUTED }}>
                  Stripe · ${d.initialDownPayment.toLocaleString()}
                </p>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-smaller font-semibold"
                style={{
                  backgroundColor: "rgba(204,246,33,0.45)",
                  color: "#3F5C00",
                }}
              >
                Approved
              </span>
            </div>

            {visibleIndividualRows.map((it) => {
              const isSelected = selected?.id === it.id;
              const isUpcoming = it.status === "Upcoming";
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => !isUpcoming && setSelectedInstallmentId(it.id)}
                  disabled={isUpcoming}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    backgroundColor: isSelected
                      ? "rgba(204,246,33,0.12)"
                      : "transparent",
                    opacity: isUpcoming ? 0.55 : 1,
                    cursor: isUpcoming ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-small font-semibold"
                      style={{ color: TEXT_DARK }}
                    >
                      {it.label}
                    </p>
                    <p className="text-smaller" style={{ color: TEXT_MUTED }}>
                      Due {it.dueDate} · ${it.amount.toLocaleString()}
                    </p>
                  </div>
                  <InstallmentStatusPill status={it.status} />
                </button>
              );
            })}

            {/* Combined Installment rows — inline in the main list */}
            {groups.map((g) => {
              const isSelected = selectedInstallmentId === g.id;
              const total = groupTotal(g);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedInstallmentId(g.id)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    backgroundColor: isSelected
                      ? "rgba(204,246,33,0.12)"
                      : "transparent",
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-small font-semibold"
                      style={{ color: TEXT_DARK }}
                    >
                      Combined Installment
                    </p>
                    <p className="text-smaller" style={{ color: TEXT_MUTED }}>
                      Due {g.dueDate}
                    </p>
                    <p className="text-smaller" style={{ color: TEXT_MUTED }}>
                      {groupIncluded(g)} · ${total.toLocaleString()}
                    </p>
                  </div>
                  <InstallmentStatusPill status={groupStatusLabel(g)} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right detail */}
        <div className="flex flex-col p-5">
          {selectedGroup ? (
            <CombinedPlanDetailPanel
              group={selectedGroup}
              index={groups.findIndex((g) => g.id === selectedGroup.id) + 1}
              installments={installments}
              total={groupTotal(selectedGroup)}
              included={groupIncluded(selectedGroup)}
              onUpload={(file) => onUploadGroupProof(selectedGroup.id, file)}
              onApprove={() => onApproveGroup(selectedGroup.id)}
              onDetach={() => onDetachGroup(selectedGroup.id)}
            />
          ) : selected ? (
            <InstallmentDetailPanel
              row={selected}
              onUpload={(file) => onUploadProof(selected.id, file)}
              onRejectProof={() => onRemoveProof(selected.id)}
              onApprove={() => onApprove(selected.id)}
              onReject={() => onReject(selected.id)}
              onOpenPostpone={onOpenPostpone}
              onOpenChangeDueDate={() => onChangeDueDate(selected.id)}
            />
          ) : (
            <div className="grid h-full place-items-center text-small" style={{ color: TEXT_MUTED }}>
              Select an installment to view details.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type InstallmentDetailsLite = { monthlyPayment: number };

function CombinedPlanDetailPanel({
  group,
  index,
  installments,
  total,
  included,
  onUpload,
  onApprove,
  onDetach,
  onChangeDueDate,
  onEditAmount,
}: {
  group: GroupedPaymentLite;
  index: number;
  installments: InstallmentRow[];
  total: number;
  included: string;
  onUpload: (file: File | undefined) => void;
  onApprove: () => void;
  onDetach: () => void;
  onChangeDueDate: () => void;
  onEditAmount: () => void;
}) {
  const isApproved = group.status === "Approved";
  const status: InstallmentStatus = isApproved
    ? "Combined Plan Approved"
    : "Combined Plan Pending";
  const statusLabel = isApproved ? "Approved" : "Pending";
  const planId = `CP-${String(index).padStart(3, "0")}`;
  const includedItems = group.installmentIds
    .map((id) => installments.find((i) => i.id === id))
    .filter((i): i is InstallmentRow => Boolean(i));
  const paymentMethod = includedItems[0]?.paymentMethod ?? "Offline";
  const isStripe = paymentMethod === "Stripe";

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
            Combined Installment
          </p>
          <p className="mt-0.5 text-small" style={{ color: TEXT_MUTED }}>
            {included} · ${total.toLocaleString()} · Due {group.dueDate}
          </p>
        </div>
        <InstallmentStatusPill status={status} />
      </div>

      {/* Combined payment details */}
      <div
        className="mt-4 rounded-xl p-4"
        style={{ backgroundColor: "#F9FAFB", border: `1px solid ${BORDER}` }}
      >
        <p className="mb-2 text-smaller font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
          Combined Payment Details
        </p>
        <div className="space-y-1.5">
          <Row label="Combined Plan ID" value={planId} />
          <Row label="Includes" value={included} />
          <Row label="Due Date" value={group.dueDate} />
          <Row label="Total Amount" value={`$${total.toLocaleString()}`} />
          <Row label="Payment Method" value={paymentMethod} />
          <Row label="Status" value={statusLabel} last={!isStripe || !isApproved} />
          {isStripe && isApproved && (
            <Row
              label="Stripe Transaction ID"
              value={`txn_${group.id.slice(-6)}`}
              last
            />
          )}
        </div>
      </div>

      {/* Included installments */}
      <div
        className="mt-3 rounded-xl p-4"
        style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}` }}
      >
        <p className="mb-2 text-smaller font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
          Included Installments
        </p>
        <ul className="space-y-1.5">
          {includedItems.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between text-small"
              style={{ color: TEXT_DARK }}
            >
              <span>{it.label} · ${it.amount.toLocaleString()}</span>
              <span className="text-smaller" style={{ color: TEXT_MUTED }}>
                Original Due {it.dueDate}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-smaller" style={{ color: TEXT_MUTED }}>
          This is one payment for the selected installments.
        </p>
      </div>

      {/* Proof / upload */}
      {group.proof ? (
        <div
          className="mt-3 rounded-xl p-4"
          style={{ backgroundColor: "#F9FAFB", border: `1px solid ${BORDER}` }}
        >
          <div className="space-y-1.5">
            <Row label="File" value={group.proof.name} />
            <Row label="Uploaded" value={group.proof.uploadedAt} last />
          </div>
        </div>
      ) : !isStripe && !isApproved ? (
        <label
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-8 text-center"
          style={{ border: `1.5px dashed ${BORDER}`, backgroundColor: "#FAFAFA" }}
        >
          <UploadCloud className="h-6 w-6" style={{ color: TEXT_MUTED }} />
          <p className="mt-2 text-small font-medium" style={{ color: TEXT_DARK }}>
            Upload combined payment proof
          </p>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0] ?? undefined)}
          />
        </label>
      ) : null}

      {/* Actions */}
      {isApproved ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toast.success(isStripe ? "Opening receipt" : "Opening proof")}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            View {isStripe ? "Receipt" : "Proof"}
          </button>
          <button
            type="button"
            onClick={() => toast.success(isStripe ? "Receipt downloaded" : "Proof downloaded")}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            Download {isStripe ? "Receipt" : "Proof"}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onChangeDueDate}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            <CalendarClock className="h-4 w-4" /> Change Due Date
          </button>
          <button
            type="button"
            onClick={onEditAmount}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            Edit Amount
          </button>
          <button
            type="button"
            onClick={onDetach}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            Detach Combined Plan
          </button>
          {!isStripe && group.proof && (
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
              style={{ backgroundColor: BRAND, color: TEXT_DARK }}
            >
              <CheckCircle2 className="h-4 w-4" /> Approve Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InstallmentDetailPanel({
  row,
  onUpload,
  onRejectProof,
  onApprove,
  onReject,
  onOpenPostpone,
  onOpenChangeDueDate,
}: {
  row: InstallmentRow;
  onUpload: (file: File | undefined) => void;
  onRejectProof: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOpenPostpone: () => void;
  onOpenChangeDueDate: () => void;
}) {
  const isApproved =
    row.status === "Approved" || row.status === "Combined Plan Approved";
  const isDeclined = row.status === "Payment Failed";
  const isStripe = row.paymentMethod === "Stripe";
  // Offline pending payments need a proof upload before approval
  const canUpload =
    !isStripe && (row.status === "Pending" || isDeclined) && !row.proof;
  // Approve only allowed when proof is uploaded for offline pending payments
  const canApprove =
    !isStripe && row.status === "Pending" && !!row.proof;
  const showStripeRepay = isStripe && isDeclined;
  const showSecondaryActions =
    !isApproved && (row.status === "Pending" || isDeclined);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
            {row.label}
          </p>
          <p className="mt-0.5 text-small" style={{ color: TEXT_MUTED }}>
            Due {row.dueDate} · ${row.amount.toLocaleString()} · {row.paymentMethod}
          </p>
        </div>
        <InstallmentStatusPill status={row.status} />
      </div>

      {/* Proof preview */}
      {row.proof ? (
        <div
          className="mt-4 rounded-xl p-4"
          style={{ backgroundColor: "#F9FAFB", border: `1px solid ${BORDER}` }}
        >
          <div
            className="grid h-40 place-items-center rounded-lg"
            style={{ backgroundColor: "#FFFFFF", border: `1px dashed ${BORDER}` }}
          >
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-7 w-7" style={{ color: TEXT_MUTED }} />
              <span className="text-smaller" style={{ color: TEXT_MUTED }}>
                {isStripe ? "Stripe receipt preview" : "Document preview"}
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Row label="File" value={row.proof.name} />
            <Row label="Uploaded" value={row.proof.uploadedAt} />
            {isApproved && <Row label="Approved by" value="John Miller" />}
            {isApproved && <Row label="Approved on" value={row.dueDate} />}
            {isStripe && row.stripeTxnId && (
              <Row label="Stripe Txn" value={row.stripeTxnId} />
            )}
            <Row label="Amount" value={`$${row.amount.toLocaleString()}`} />
            <Row label="Installment" value={row.label} last />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toast.info("Preview not available in demo")}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-small font-semibold"
              style={{ backgroundColor: SOFT, color: TEXT_DARK }}
            >
              <Eye className="h-4 w-4" /> {isStripe ? "View Receipt" : "View Proof"}
            </button>
            <button
              type="button"
              onClick={() => toast.success("Download started")}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-small font-semibold"
              style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
            >
              Download Proof
            </button>
          </div>
        </div>
      ) : canUpload ? (
        <label
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-10 text-center"
          style={{ border: `1.5px dashed ${BORDER}`, backgroundColor: "#FAFAFA" }}
        >
          <UploadCloud className="h-6 w-6" style={{ color: TEXT_MUTED }} />
          <p className="mt-2 text-small font-medium" style={{ color: TEXT_DARK }}>
            Drag and drop or click to upload proof
          </p>
          <p className="mt-0.5 text-smaller" style={{ color: TEXT_MUTED }}>
            PDF, PNG, JPG up to 10MB
          </p>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0] ?? undefined)}
          />
        </label>
      ) : showStripeRepay ? (
        <div
          className="mt-4 rounded-xl p-4"
          style={{ backgroundColor: "#FEF2F2", border: `1px solid #FECDCA` }}
        >
          <p className="text-small font-semibold" style={{ color: "#991B1B" }}>
            Card payment was declined
          </p>
          <p className="mt-1 text-smaller" style={{ color: TEXT_MUTED }}>
            Send the student a new attempt link or notify them to update their card.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toast.success("Retry link sent")}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-small font-semibold"
              style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
            >
              Send Retry Link
            </button>
            <button
              type="button"
              onClick={() => copyLink(`https://pay.example.com/retry/${row.id}`)}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-small font-semibold"
              style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
            >
              Copy Retry Link
            </button>
          </div>
        </div>
      ) : (
        <div
          className="mt-4 rounded-xl px-4 py-8 text-center text-small"
          style={{ backgroundColor: "#FAFAFA", border: `1px dashed ${BORDER}`, color: TEXT_MUTED }}
        >
          {isStripe
            ? "Card payment — proof not required."
            : row.status === "Upcoming"
              ? "This installment is not due yet."
              : "No action required."}
        </div>
      )}

      {/* Internal note */}
      {!isApproved && (
        <div className="mt-4">
          <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
            Internal note
          </p>
          <textarea
            rows={2}
            placeholder="Add an internal note for this installment…"
            className="w-full resize-none rounded-xl px-3 py-2 text-small"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
          />
        </div>
      )}

      {/* Action buttons — appear AFTER the internal note */}
      {(canApprove || showSecondaryActions) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canApprove && (
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
              style={{ backgroundColor: BRAND, color: TEXT_DARK }}
            >
              <CheckCircle2 className="h-4 w-4" /> Approve Payment
            </button>
          )}
          {showSecondaryActions && (
            <>
              <button
                type="button"
                onClick={onOpenChangeDueDate}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
                style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
              >
                <CalendarClock className="h-4 w-4" /> Change Due Date
              </button>
              <button
                type="button"
                onClick={onOpenPostpone}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold"
                style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
              >
                <Layers className="h-4 w-4" /> Combined Plans
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== Postpone Modal =====================

function PostponeModal({
  installments,
  onClose,
  onConfirm,
}: {
  installments: InstallmentRow[];
  onClose: () => void;
  onConfirm: (
    ids: string[],
    payload: { dueDate: string; reason: string; note: string },
  ) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [months, setMonths] = useState(2);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const calculatedTotal = installments
    .filter((i) => selected.includes(i.id))
    .reduce((sum, i) => sum + i.amount, 0);
  const suggestedDue = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  })();
  const [dueDate, setDueDate] = useState(suggestedDue);
  useEffect(() => {
    setDueDate(suggestedDue);
  }, [months]);
  const formattedDue = (() => {
    const d = new Date(dueDate);
    return isNaN(d.getTime())
      ? dueDate
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
  })();

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white p-6"
        style={{ boxShadow: "0 30px 80px rgba(15,23,42,0.25)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-second-header font-bold" style={{ color: TEXT_DARK }}>
              Create Combined Plan
            </h3>
            <p className="mt-1 text-smaller" style={{ color: TEXT_MUTED }}>
              Select multiple installments and combine them into one payment the student can complete later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <X className="h-4 w-4" style={{ color: TEXT_DARK }} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Select installments
            </p>
            <div
              className="max-h-44 overflow-y-auto rounded-xl"
              style={{ border: `1px solid ${BORDER}` }}
            >
              {installments.length === 0 && (
                <p className="px-3 py-2 text-smaller" style={{ color: TEXT_MUTED }}>
                  No installments eligible to combine.
                </p>
              )}
              {installments.map((it) => (
                <label
                  key={it.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2"
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(it.id)}
                    onChange={() => toggle(it.id)}
                  />
                  <span className="text-small" style={{ color: TEXT_DARK }}>
                    {it.label}
                  </span>
                  <span className="ml-auto text-smaller" style={{ color: TEXT_MUTED }}>
                    ${it.amount.toLocaleString()} · {it.status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Calculated total (locked) */}
          <div className="rounded-xl p-3" style={{ backgroundColor: SOFT }}>
            <div className="flex items-center justify-between">
              <span className="text-smaller" style={{ color: TEXT_MUTED }}>
                Combined Plan Total
              </span>
              <span className="text-small font-semibold" style={{ color: TEXT_DARK }}>
                ${calculatedTotal.toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-smaller" style={{ color: TEXT_MUTED }}>
              Locked — sum of selected installments.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
                Combined Payment Due Date
              </p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl bg-white px-3 py-2 text-small"
                style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
              />
            </div>
            <div>
              <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
                Extend by (months)
              </p>
              <input
                type="number"
                min={1}
                max={12}
                value={months}
                onChange={(e) => setMonths(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-xl px-3 py-2 text-small"
                style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Reason
            </p>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2 text-small"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
            >
              <option value="">Select a reason…</option>
              <option>Student requested more time</option>
              <option>Financial delay</option>
              <option>Bank transfer delay</option>
              <option>Internal approval</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Internal note
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl px-3 py-2 text-small"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm(selected, { dueDate: formattedDue, reason, note })
            }
            disabled={selected.length === 0}
            className="rounded-full px-4 py-2 text-small font-semibold disabled:opacity-50"
            style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
          >
            Create Combined Plan
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ===================== Change Due Date Modal =====================

function ChangeDueDateModal({
  row,
  title = "Change Due Date",
  description,
  onClose,
  onConfirm,
}: {
  row: { label: string; dueDate: string };
  title?: string;
  description?: string;
  onClose: () => void;
  onConfirm: (payload: { newDueDate: string; reason: string; note: string }) => void;
}) {
  const current = new Date(row.dueDate);
  const suggested = (() => {
    const d = isNaN(current.getTime()) ? new Date() : new Date(current.getTime());
    d.setDate(d.getDate() + 17);
    return d.toISOString().slice(0, 10);
  })();
  const [newDueDate, setNewDueDate] = useState(suggested);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const formatted = (() => {
    const d = new Date(newDueDate);
    return isNaN(d.getTime())
      ? newDueDate
      : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  })();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-6"
        style={{ boxShadow: "0 30px 80px rgba(15,23,42,0.25)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-second-header font-bold" style={{ color: TEXT_DARK }}>
              {title}
            </h3>
            <p className="mt-1 text-smaller" style={{ color: TEXT_MUTED }}>
              {description ?? `Update the due date for ${row.label}. The installment stays Pending.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <X className="h-4 w-4" style={{ color: TEXT_DARK }} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Current Due Date
            </p>
            <div
              className="rounded-xl px-3 py-2 text-small"
              style={{ backgroundColor: SOFT, color: TEXT_DARK }}
            >
              {row.dueDate}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              New Due Date
            </p>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2 text-small"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
            />
          </div>
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Reason
            </p>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2 text-small"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
            >
              <option value="">Select a reason…</option>
              <option>Student requested more time</option>
              <option>Financial delay</option>
              <option>Bank transfer delay</option>
              <option>Internal approval</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Internal note
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add context for the team…"
              className="w-full resize-none rounded-xl px-3 py-2 text-small"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!newDueDate}
            onClick={() => onConfirm({ newDueDate: formatted, reason, note })}
            className="rounded-full px-4 py-2 text-small font-semibold disabled:opacity-50"
            style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
          >
            Save Due Date
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function copyLink(link: string) {
  navigator.clipboard?.writeText(link).then(
    () => toast.success("Link copied"),
    () => toast.error("Could not copy link"),
  );
}

// ===================== Edit Amount Modal =====================

function EditAmountModal({
  title = "Edit Installment Amount",
  originalAmount,
  originalLabel,
  carryOptions,
  isLast,
  onClose,
  onConfirm,
}: {
  title?: string;
  originalAmount: number;
  originalLabel: string;
  carryOptions: { id: string; label: string }[];
  isLast: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    amountPaid: number;
    remaining: number;
    carryToId: string | null;
    note: string;
  }) => void;
}) {
  const [amountPaid, setAmountPaid] = useState<number>(originalAmount);
  const [carryToId, setCarryToId] = useState<string>(
    carryOptions[0]?.id ?? "",
  );
  const [note, setNote] = useState("");
  const remaining = Math.max(0, originalAmount - (Number(amountPaid) || 0));
  const showCarry = !isLast && remaining > 0;
  const showNeglected = isLast && remaining > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-6"
        style={{ boxShadow: "0 30px 80px rgba(15,23,42,0.25)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-second-header font-bold" style={{ color: TEXT_DARK }}>
              {title}
            </h3>
            <p className="mt-1 text-smaller" style={{ color: TEXT_MUTED }}>
              Record a partial payment for {originalLabel}.
              {isLast
                ? " This is the final installment — any unpaid balance will be recorded as neglected balance."
                : " The remaining amount will be carried forward to a future installment."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <X className="h-4 w-4" style={{ color: TEXT_DARK }} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Original Installment Amount
            </p>
            <div
              className="rounded-xl px-3 py-2 text-small"
              style={{ backgroundColor: SOFT, color: TEXT_DARK }}
            >
              ${originalAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Amount Paid
            </p>
            <input
              type="number"
              min={0}
              max={originalAmount}
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-white px-3 py-2 text-small"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
            />
          </div>
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              {showNeglected ? "Neglected Balance" : "Remaining Amount"}
            </p>
            <div
              className="rounded-xl px-3 py-2 text-small font-semibold"
              style={{
                backgroundColor: showNeglected ? "#FEF2F2" : SOFT,
                color: showNeglected ? "#991B1B" : TEXT_DARK,
              }}
            >
              ${remaining.toLocaleString()}
            </div>
            {showNeglected && (
              <p className="mt-1 text-smaller" style={{ color: TEXT_MUTED }}>
                This is the final installment. Any unpaid balance will be recorded as neglected balance.
              </p>
            )}
          </div>
          {showCarry && (
            <div>
              <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
                Carry Forward To
              </p>
              <select
                value={carryToId}
                onChange={(e) => setCarryToId(e.target.value)}
                className="w-full rounded-xl bg-white px-3 py-2 text-small"
                style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
              >
                {carryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <p className="mb-1.5 text-smaller font-medium" style={{ color: TEXT_MUTED }}>
              Internal Note
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Student paid partial amount and will pay the balance with next installment…"
              className="w-full resize-none rounded-xl px-3 py-2 text-small"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={amountPaid <= 0 || amountPaid > originalAmount}
            onClick={() =>
              onConfirm({
                amountPaid,
                remaining,
                carryToId: showCarry ? carryToId : null,
                note,
              })
            }
            className="rounded-full px-4 py-2 text-small font-semibold disabled:opacity-50"
            style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
          >
            Save Amount
          </button>
        </div>
      </motion.div>
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

function ConfirmRemoveModal({
  invitation,
  onClose,
  onConfirm,
}: {
  invitation: Invitation;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-6"
        style={{ boxShadow: "0 30px 80px rgba(15,23,42,0.3)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 flex-none place-items-center rounded-full"
            style={{ backgroundColor: "#FEE4E2" }}
          >
            <Trash2 className="h-5 w-5" style={{ color: "#B42318" }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-second-header font-bold" style={{ color: TEXT_DARK }}>
              Remove this entry?
            </h3>
            <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>
              This will permanently remove{" "}
              <span className="font-semibold" style={{ color: TEXT_DARK }}>
                {invitation.studentName ?? invitation.studentEmail}
              </span>{" "}
              and their payment link. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-small font-semibold"
            style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full px-4 py-2 text-small font-semibold text-white"
            style={{ backgroundColor: "#B42318" }}
          >
            Remove
          </button>
        </div>
      </motion.div>
    </div>
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

const INCOMING_PERIODS = {
  Week: { value: "$18,400", title: "This Week Incoming" },
  Month: { value: "$72,400", title: "This Month Incoming" },
  Year: { value: "$684,900", title: "This Year Incoming" },
} as const;
type IncomingPeriod = keyof typeof INCOMING_PERIODS;

function AnalyticsSection() {
  const [period, setPeriod] = useState<IncomingPeriod>("Month");
  const incoming = INCOMING_PERIODS[period];
  return (
    <div className="mb-6">
      <div
        className="grid grid-cols-1 overflow-hidden bg-white lg:grid-cols-[28fr_47fr_25fr]"
        style={{ border: `1px solid #E5E7EB`, borderRadius: 22 }}
      >
        {/* Left summary column */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 lg:border-r"
          style={{ borderColor: "#E5E7EB" }}
        >
          <SummaryTile
            tone="mint"
            label={incoming.title}
            description="Expected payments from active student plans."
            value={incoming.value}
            Icon={TrendingUp}
            headerRight={<PeriodSelector value={period} onChange={setPeriod} />}
            dividerClass="border-b lg:border-b"
          />
          <SummaryTile
            tone="yellow"
            label="Pending Payments"
            description="Payments waiting to be completed or confirmed."
            value="$41,250"
            inlineSubValue="23 Students"
            Icon={Clock}
          />
        </div>

        {/* Incoming Payments chart */}
        <div
          className="flex flex-col gap-4 border-t p-6 lg:border-t-0 lg:border-r"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div>
            <h3 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
              Incoming Payments
            </h3>
            <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>
              Expected revenue by payment method over time.
            </p>
          </div>
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
        </div>

        {/* Payment type split */}
        <div
          className="flex flex-col gap-4 border-t p-6 lg:border-t-0"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div>
            <h3 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
              Payment Type Split
            </h3>
            <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>
              Distribution of active payment plans by method.
            </p>
          </div>
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
                innerRadius={50}
                outerRadius={85}
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
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  tone,
  label,
  description,
  value,
  inlineSubValue,
  headerRight,
  Icon,
  dividerClass,
}: {
  tone: KpiTone;
  label: string;
  description: string;
  value: string;
  inlineSubValue?: string;
  headerRight?: React.ReactNode;
  Icon: React.ComponentType<{ className?: string }>;
  dividerClass?: string;
}) {
  const t = KPI_TONES[tone];
  return (
    <div
      className={`relative flex h-full flex-col gap-3 overflow-hidden p-6 ${dividerClass ?? ""}`}
      style={{
        background: "#FFFFFF",
        borderColor: "#E5E7EB",
      }}
    >
      <div className="relative flex items-start justify-between gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ color: t.icon, border: `1px solid ${BORDER}`, background: "#FFFFFF" }}
        >
          <Icon className="h-5 w-5" />
        </span>
        {headerRight}
      </div>
      <div className="relative">
        <p className="text-small font-semibold" style={{ color: TEXT_DARK }}>
          {label}
        </p>
        <p className="mt-1 text-small leading-snug" style={{ color: TEXT_MUTED }}>
          {description}
        </p>
      </div>
      <div className="relative mt-auto">
        {inlineSubValue ? (
          <div className="flex items-end justify-between gap-3">
            <p className="font-extrabold leading-none" style={{ color: TEXT_DARK, fontSize: 30 }}>
              {value}
            </p>
            <p className="text-small font-medium" style={{ color: TEXT_DARK }}>
              {inlineSubValue}
            </p>
          </div>
        ) : (
          <p className="font-extrabold leading-none" style={{ color: TEXT_DARK, fontSize: 30 }}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: IncomingPeriod;
  onChange: (v: IncomingPeriod) => void;
}) {
  const options: IncomingPeriod[] = ["Week", "Month", "Year"];
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full bg-white/70 p-1 backdrop-blur"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: active ? "#1A1A1A" : "transparent",
              color: active ? "#FFFFFF" : TEXT_MUTED,
            }}
          >
            {opt}
          </button>
        );
      })}
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
  inlineSubValue,
  headerRight,
  Icon,
}: {
  tone: KpiTone;
  label: string;
  description: string;
  value: string;
  subValue?: string;
  inlineSubValue?: string;
  headerRight?: React.ReactNode;
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
      <div className="relative flex items-start justify-between gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-full bg-white/70 backdrop-blur"
          style={{ color: t.icon, border: `1px solid rgba(255,255,255,0.6)` }}
        >
          <Icon className="h-5 w-5" />
        </span>
        {headerRight}
      </div>
      <div className="relative">
        <p className="text-small font-semibold" style={{ color: TEXT_DARK }}>
          {label}
        </p>
        <p className="mt-1 text-small leading-snug" style={{ color: TEXT_MUTED }}>
          {description}
        </p>
      </div>
      <div className="relative mt-auto">
        {inlineSubValue ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-second-header font-bold leading-tight" style={{ color: TEXT_DARK }}>
              {value}
            </p>
            <p className="text-small font-medium" style={{ color: TEXT_DARK }}>
              {inlineSubValue}
            </p>
          </div>
        ) : (
          <>
            <p className="text-second-header font-bold leading-tight" style={{ color: TEXT_DARK }}>
              {value}
            </p>
            {subValue && (
              <p className="mt-0.5 text-small font-medium" style={{ color: TEXT_MUTED }}>
                {subValue}
              </p>
            )}
          </>
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
type StepKey = "student" | "cohort" | "method" | "plan" | "preview";

type UpfrontPlanState = {
  id: "plan-01" | "plan-02";
  name: "Plan 01" | "Plan 02";
  planAmount: number;
  discountPercent: number;
};

const UPFRONT_PLANS: UpfrontPlanState[] = [
  { id: "plan-01", name: "Plan 01", planAmount: 12370, discountPercent: 0 },
  { id: "plan-02", name: "Plan 02", planAmount: 14000, discountPercent: 0 },
];

// ---------- Installment plan presets & shared setup calculator ----------
type InstallmentPlanKey = "plan-01" | "plan-02" | "custom";
const INSTALLMENT_PLAN_PRESETS: Record<
  Exclude<InstallmentPlanKey, "custom">,
  { name: "Plan 01" | "Plan 02"; fullAmount: number; downPayment: number; installments: number }
> = {
  "plan-01": { name: "Plan 01", fullAmount: 14000, downPayment: 2000, installments: 6 },
  "plan-02": { name: "Plan 02", fullAmount: 18000, downPayment: 3000, installments: 8 },
};

type InstallmentSetup = {
  planName: "Plan 01" | "Plan 02" | "Custom Plan";
  fullAmount: number;
  discountPercent: number;
  discountAmount: number;
  discountedFullAmount: number;
  downPayment: number;
  installments: number;
  monthlyPayment: number;
};

function getInstallmentSetup(
  planId: InstallmentPlanKey,
  customValues: {
    fullAmount: number;
    downPayment: number;
    installments: number;
    discountPercent: number;
  },
): InstallmentSetup {
  const isCustom = planId === "custom";
  const base = isCustom
    ? {
        name: "Custom Plan" as const,
        fullAmount: customValues.fullAmount,
        downPayment: customValues.downPayment,
        installments: customValues.installments,
      }
    : INSTALLMENT_PLAN_PRESETS[planId];
  const fullAmount = Math.max(0, base.fullAmount || 0);
  const discountPercent = Math.max(0, Math.min(100, customValues.discountPercent || 0));
  const discountAmount = fullAmount * (discountPercent / 100);
  const discountedFullAmount = Math.max(0, fullAmount - discountAmount);
  const downPayment = Math.max(0, base.downPayment || 0);
  const installments = Math.max(0, base.installments || 0);
  const remaining = Math.max(0, discountedFullAmount - downPayment);
  const monthlyPayment = installments > 0 ? remaining / installments : 0;
  return {
    planName: base.name,
    fullAmount,
    discountPercent,
    discountAmount,
    discountedFullAmount,
    downPayment,
    installments,
    monthlyPayment,
  };
}

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
  const [upfrontAmount, setUpfrontAmount] = useState<Record<"plan-01" | "plan-02", number>>({
    "plan-01": 12370,
    "plan-02": 14000,
  });
  const [upfrontDiscount, setUpfrontDiscount] = useState<Record<"plan-01" | "plan-02", number>>({
    "plan-01": 0,
    "plan-02": 0,
  });

  // Installment state
  const [installmentPlanId, setInstallmentPlanId] = useState<"plan-01" | "plan-02" | "custom">("plan-01");
  // Discount % is editable for all three plans (default 0%).
  const [installmentDiscount, setInstallmentDiscount] = useState<Record<"plan-01" | "plan-02" | "custom", number>>({
    "plan-01": 0,
    "plan-02": 0,
    custom: 0,
  });
  // Custom Plan: full amount / down / installments are user-editable.
  const [customFullAmount, setCustomFullAmount] = useState(14000);
  const [customDownPayment, setCustomDownPayment] = useState(2000);
  const [customInstallments, setCustomInstallments] = useState<number>(6);

  // Loan state
  const [loanProvider, setLoanProvider] = useState("Metana Financing Partner");
  const [loanLink, setLoanLink] = useState("https://metana.io/finance/apply?invite=INV-10294");

  // Metana Prime subscription state
  const [subscriptionAmount, setSubscriptionAmount] = useState(499);
  const [monthlyPayment, setMonthlyPayment] = useState(499);

  const [createdInvitation, setCreatedInvitation] = useState<Invitation | null>(null);

  const emailOk = /.+@.+\..+/.test(email.trim());

  const isMetanaPrime = course?.title === "Metana Prime";
  const stepKeys: StepKey[] = isMetanaPrime
    ? ["student", "plan", "preview"]
    : ["student", "cohort", "method", "plan", "preview"];
  const stepperLabels = isMetanaPrime
    ? ["Student & Course", "Plan Setup", "Preview & Confirm"]
    : ["Student & Course", "Cohort Date", "Payment Method", "Plan Setup", "Preview & Confirm"];
  const currentKey: StepKey = stepKeys[Math.min(step, stepKeys.length) - 1];
  const isLastStep = step >= stepKeys.length;

  const next = () => {
    if (currentKey === "student") {
      if (!emailOk) return toast.error("Enter a valid email.");
      if (!course) return toast.error("Select a course.");
    } else if (currentKey === "cohort") {
      if (!cohort) return toast.error("Select a cohort date.");
    } else if (currentKey === "method") {
      if (!paymentMethod) return toast.error("Select a payment method.");
    } else if (currentKey === "plan") {
      if (isMetanaPrime) {
        if (subscriptionAmount <= 0) return toast.error("Enter a subscription amount.");
        if (monthlyPayment <= 0) return toast.error("Enter a monthly payment.");
      } else if (paymentMethod === "Installment") {
        const setup = getInstallmentSetup(installmentPlanId, {
          fullAmount: customFullAmount,
          downPayment: customDownPayment,
          installments: customInstallments,
          discountPercent: installmentDiscount[installmentPlanId],
        });
        if (!setup.fullAmount || setup.fullAmount <= 0) return toast.error("Full amount is required.");
        if (!setup.installments || setup.installments <= 0) return toast.error("Number of installments must be greater than 0.");
        if (setup.downPayment >= setup.discountedFullAmount) {
          return toast.error("Down payment cannot be greater than the discounted full amount.");
        }
      }
    }
    setStep((s) => Math.min(s + 1, stepKeys.length) as Step);
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const buildPaymentDetails = (): PaymentDetails => {
    if (isMetanaPrime) {
      return {
        paymentType: "Subscription",
        subscriptionAmount,
        monthlyPayment,
        billingCycle: "Monthly",
      };
    }
    if (paymentMethod === "Upfront") {
      const plan = UPFRONT_PLANS.find((p) => p.id === upfrontPlanId)!;
      const planAmount = upfrontAmount[plan.id];
      const dp = upfrontDiscount[plan.id];
      const checkoutAmount = Math.round(planAmount * (1 - dp / 100));
      return {
        paymentType: "Upfront",
        planName: plan.name,
        planAmount,
        discountPercent: dp,
        checkoutAmount,
      };
    }
    if (paymentMethod === "Installment") {
      const setup = getInstallmentSetup(installmentPlanId, {
        fullAmount: customFullAmount,
        downPayment: customDownPayment,
        installments: customInstallments,
        discountPercent: installmentDiscount[installmentPlanId],
      });
      return {
        paymentType: "Installment",
        fullAmount: setup.fullAmount,
        initialDownPayment: setup.downPayment,
        timePeriodMonths: setup.installments,
        monthlyPayment: setup.monthlyPayment,
        totalAmount: setup.discountedFullAmount,
        selectedPlan: setup.planName,
        discountPercent: setup.discountPercent,
        discountedFullAmount: setup.discountedFullAmount,
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
    if (!course) return;
    if (!isMetanaPrime && (!cohort || !paymentMethod)) return;
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
          : details.paymentType === "Subscription"
            ? details.subscriptionAmount
            : 0;
    const discountPercent = details.paymentType === "Upfront" ? details.discountPercent : 0;
    const planLabel: "Plan 01" | "Plan 02" =
      details.paymentType === "Upfront"
        ? (details.planName as "Plan 01" | "Plan 02")
        : "Plan 01";
    const planId: "plan-01" | "plan-02" =
      details.paymentType === "Upfront" ? upfrontPlanId : "plan-01";

    const effectivePaymentMethod = (isMetanaPrime
      ? ("Subscription" as unknown as PaymentMethod)
      : (paymentMethod as PaymentMethod));
    const effectiveAccessType = isMetanaPrime ? "Subscription Access" : "Full Program Access";

    const inv = addInvitation({
      studentName: email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      studentEmail: email.trim(),
      course: course.title,
      courseId: course.id,
      cohortDate: cohort?.date ?? "—",
      plan: planLabel,
      planId,
      paymentType: effectivePaymentMethod,
      planAmount,
      discountPercent,
      checkoutAmount,
      paymentMethod: effectivePaymentMethod,
      paymentDetails: details,
      accessType: effectiveAccessType,
      certificateIncluded: !isMetanaPrime,
      status: "Pending",
    });
    setCreatedInvitation(inv);
    onConfirm(inv);
  };

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
              key={currentKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
            {currentKey === "student" && (
              <Step1
                email={email}
                setEmail={setEmail}
                course={course}
                setCourse={(c) => {
                  const wasPrime = course?.title === "Metana Prime";
                  const becomesPrime = c?.title === "Metana Prime";
                  setCourse(c);
                  setCohort(null);
                  if (wasPrime !== becomesPrime) {
                    setPaymentMethod(null);
                    setStep(1);
                  }
                }}
              />
            )}
            {currentKey === "cohort" && course && (
              <Step2
                course={course}
                cohort={cohort}
                setCohort={setCohort}
                onCreateNew={() => setCreateCohortMode(true)}
              />
            )}
            {currentKey === "method" && (
              <Step3PaymentMethod method={paymentMethod} setMethod={setPaymentMethod} />
            )}
            {currentKey === "plan" && isMetanaPrime && (
              <StepPrimePlanSetup
                subscriptionAmount={subscriptionAmount}
                setSubscriptionAmount={setSubscriptionAmount}
                monthlyPayment={monthlyPayment}
                setMonthlyPayment={setMonthlyPayment}
              />
            )}
            {currentKey === "plan" && !isMetanaPrime && paymentMethod && (
              <Step4PlanSetup
                method={paymentMethod}
                upfrontPlanId={upfrontPlanId}
                setUpfrontPlanId={setUpfrontPlanId}
                upfrontAmount={upfrontAmount}
                setUpfrontAmount={setUpfrontAmount}
                upfrontDiscount={upfrontDiscount}
                setUpfrontDiscount={setUpfrontDiscount}
                installmentPlanId={installmentPlanId}
                setInstallmentPlanId={setInstallmentPlanId}
                installmentDiscount={installmentDiscount}
                setInstallmentDiscount={setInstallmentDiscount}
                customFullAmount={customFullAmount}
                setCustomFullAmount={setCustomFullAmount}
                customDownPayment={customDownPayment}
                setCustomDownPayment={setCustomDownPayment}
                customInstallments={customInstallments}
                setCustomInstallments={setCustomInstallments}
                loanProvider={loanProvider}
                setLoanProvider={setLoanProvider}
                loanLink={loanLink}
                setLoanLink={setLoanLink}
              />
            )}
            {currentKey === "preview" && course && (
              <Step5Preview
                email={email}
                course={course}
                cohort={cohort}
                paymentMethod={isMetanaPrime ? ("Subscription" as unknown as PaymentMethod) : (paymentMethod as PaymentMethod)}
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
          {!isLastStep ? (
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
              Confirm & Generate Payment Link
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
    { id: "Upfront", icon: Wallet, desc: "Student pays the full amount at once." },
    { id: "Installment", icon: CalendarClock, desc: "Student pays a down payment first, then monthly installments." },
    { id: "Loan", icon: Banknote, desc: "Student continues through a loan application link." },
  ];
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Select Payment Method
      </h4>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((o) => {
          const active = method === o.id;
          const Icon = o.icon;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setMethod(o.id)}
              className={`flex h-full flex-col gap-3 rounded-xl bg-white p-4 text-left transition-colors ${active ? "" : "hover:bg-[#F3F4F6]"}`}
              style={{ border: `2px solid ${active ? TEXT_DARK : BORDER}` }}
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: SOFT, color: TEXT_DARK }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {active ? (
                  <span
                    className="grid h-6 w-6 place-items-center rounded-full"
                    style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span
                    className="h-6 w-6 rounded-full"
                    style={{ border: `1.5px solid ${BORDER}` }}
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: TEXT_DARK }}>{o.id}</p>
                <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>{o.desc}</p>
              </div>
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
  upfrontAmount: Record<"plan-01" | "plan-02", number>;
  setUpfrontAmount: (v: Record<"plan-01" | "plan-02", number>) => void;
  upfrontDiscount: Record<"plan-01" | "plan-02", number>;
  setUpfrontDiscount: (v: Record<"plan-01" | "plan-02", number>) => void;
  installmentPlanId: "plan-01" | "plan-02" | "custom";
  setInstallmentPlanId: (v: "plan-01" | "plan-02" | "custom") => void;
  installmentDiscount: Record<"plan-01" | "plan-02" | "custom", number>;
  setInstallmentDiscount: (v: Record<"plan-01" | "plan-02" | "custom", number>) => void;
  customFullAmount: number;
  setCustomFullAmount: (v: number) => void;
  customDownPayment: number;
  setCustomDownPayment: (v: number) => void;
  customInstallments: number;
  setCustomInstallments: (v: number) => void;
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
            const planAmount = props.upfrontAmount[p.id];
            const dp = props.upfrontDiscount[p.id];
            const checkout = Math.round(planAmount * (1 - dp / 100));
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
                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-small" style={{ color: TEXT_MUTED }}>Full Amount</span>
                  <div className="flex items-center rounded-lg bg-white" style={{ border: `1px solid ${BORDER}` }}>
                    <span className="pl-3 text-body" style={{ color: TEXT_MUTED }}>$</span>
                    <input
                      type="number"
                      min={0}
                      value={planAmount}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        props.setUpfrontAmount({
                          ...props.upfrontAmount,
                          [p.id]: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full bg-transparent px-2 py-2 text-body outline-none"
                      style={{ color: TEXT_DARK }}
                    />
                  </div>
                </label>
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
                      placeholder="0"
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
    return (
      <InstallmentPlanSetup
        installmentPlanId={props.installmentPlanId}
        setInstallmentPlanId={props.setInstallmentPlanId}
        installmentDiscount={props.installmentDiscount}
        setInstallmentDiscount={props.setInstallmentDiscount}
        customFullAmount={props.customFullAmount}
        setCustomFullAmount={props.setCustomFullAmount}
        customDownPayment={props.customDownPayment}
        setCustomDownPayment={props.setCustomDownPayment}
        customInstallments={props.customInstallments}
        setCustomInstallments={props.setCustomInstallments}
      />
    );
  }

  // Loan
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Loan Payment Link
      </h4>
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
        The student will be redirected to this loan application link to complete financing.
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

// ---------- Installment Plan Setup (Plan 01 / Plan 02 / Custom) ----------
function InstallmentPlanSetup(props: {
  installmentPlanId: "plan-01" | "plan-02" | "custom";
  setInstallmentPlanId: (v: "plan-01" | "plan-02" | "custom") => void;
  installmentDiscount: Record<"plan-01" | "plan-02" | "custom", number>;
  setInstallmentDiscount: (v: Record<"plan-01" | "plan-02" | "custom", number>) => void;
  customFullAmount: number;
  setCustomFullAmount: (v: number) => void;
  customDownPayment: number;
  setCustomDownPayment: (v: number) => void;
  customInstallments: number;
  setCustomInstallments: (v: number) => void;
}) {
  const plans: { id: "plan-01" | "plan-02" | "custom"; name: string; subtitle: string }[] = [
    {
      id: "plan-01",
      name: "Plan 01",
      subtitle: "$14,000 · 6 installments",
    },
    {
      id: "plan-02",
      name: "Plan 02",
      subtitle: "$18,000 · 8 installments",
    },
    { id: "custom", name: "Custom Plan", subtitle: "Set your own amounts" },
  ];
  const setup = getInstallmentSetup(props.installmentPlanId, {
    fullAmount: props.customFullAmount,
    downPayment: props.customDownPayment,
    installments: props.customInstallments,
    discountPercent: props.installmentDiscount[props.installmentPlanId],
  });
  const setDiscount = (id: "plan-01" | "plan-02" | "custom", v: number) =>
    props.setInstallmentDiscount({
      ...props.installmentDiscount,
      [id]: Math.max(0, Math.min(100, v || 0)),
    });
  const fmtMoney = (n: number) =>
    n % 1 === 0
      ? `$${n.toLocaleString()}`
      : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Setup Installment Plan
      </h4>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((p) => {
          const active = props.installmentPlanId === p.id;
          return (
            <div
              key={p.id}
              onClick={() => props.setInstallmentPlanId(p.id)}
              className={`relative cursor-pointer rounded-2xl bg-white p-4 transition-colors ${active ? "" : "hover:bg-[#F3F4F6]"}`}
              style={{ border: `2px solid ${active ? TEXT_DARK : BORDER}` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold" style={{ color: TEXT_DARK }}>{p.name}</p>
                  <p className="mt-0.5 text-smaller" style={{ color: TEXT_MUTED }}>{p.subtitle}</p>
                </div>
                {active ? (
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full"
                    style={{ backgroundColor: TEXT_DARK, color: "#FFFFFF" }}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="h-5 w-5 rounded-full" style={{ border: `1.5px solid ${BORDER}` }} />
                )}
              </div>
              <p className="mt-1 text-smaller" style={{ color: TEXT_MUTED }}>{p.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Fields panel */}
      <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${BORDER}` }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Amount" required>
            {props.installmentPlanId === "custom" ? (
              <CurrencyInput value={props.customFullAmount} onChange={props.setCustomFullAmount} />
            ) : (
              <ReadOnlyField value={`$${setup.fullAmount.toLocaleString()}`} />
            )}
          </Field>
          <Field label="Initial Down Payment" required>
            {props.installmentPlanId === "custom" ? (
              <CurrencyInput value={props.customDownPayment} onChange={props.setCustomDownPayment} />
            ) : (
              <ReadOnlyField value={`$${setup.downPayment.toLocaleString()}`} />
            )}
          </Field>
          <Field label="Number of Installments" required>
            {props.installmentPlanId === "custom" ? (
              <input
                type="number"
                min={1}
                value={props.customInstallments}
                onChange={(e) =>
                  props.setCustomInstallments(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-full rounded-xl bg-white px-4 py-3 text-body outline-none"
                style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
              />
            ) : (
              <ReadOnlyField value={`${setup.installments}`} />
            )}
          </Field>
          <Field label="Discount Percentage">
            <div
              className="flex items-center rounded-xl bg-white"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <input
                type="number"
                min={0}
                max={100}
                value={props.installmentDiscount[props.installmentPlanId]}
                onChange={(e) =>
                  setDiscount(props.installmentPlanId, Number(e.target.value))
                }
                placeholder="0"
                className="w-full bg-transparent px-3 py-3 text-body outline-none"
                style={{ color: TEXT_DARK }}
              />
              <span className="pr-4 text-small" style={{ color: TEXT_MUTED }}>%</span>
            </div>
          </Field>
        </div>
      </div>

      {/* Installment Preview */}
      <div className="rounded-2xl bg-white p-5" style={{ border: `1px solid ${BORDER}` }}>
        <p className="mb-3 font-semibold" style={{ color: TEXT_DARK }}>Installment Preview</p>
        {(
          [
            ["Plan", setup.planName],
            ["Full Amount", `$${setup.fullAmount.toLocaleString()}`],
            ["Discount", `${setup.discountPercent}%`],
            ["Discounted Full Amount", fmtMoney(setup.discountedFullAmount)],
            ["Initial Down Payment", `$${setup.downPayment.toLocaleString()}`],
            ["Number of Installments", `${setup.installments}`],
            ["Monthly Payment", `${fmtMoney(setup.monthlyPayment)} / month`],
            ["Due Today", `$${setup.downPayment.toLocaleString()}`],
          ] as [string, string][]
        ).map(([k, v], i, arr) => (
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

function ReadOnlyField({ value }: { value: string }) {
  return (
    <div
      className="w-full rounded-xl px-4 py-3 text-body cursor-not-allowed select-none"
      style={{ backgroundColor: "#F3F4F6", color: TEXT_MUTED, border: `1px solid ${BORDER}` }}
      aria-readonly="true"
    >
      {value}
    </div>
  );
}

function StepPrimePlanSetup({
  subscriptionAmount,
  setSubscriptionAmount,
  monthlyPayment,
  setMonthlyPayment,
}: {
  subscriptionAmount: number;
  setSubscriptionAmount: (v: number) => void;
  monthlyPayment: number;
  setMonthlyPayment: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Setup Metana Prime Subscription
      </h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subscription Amount" required>
          <CurrencyInput value={subscriptionAmount} onChange={setSubscriptionAmount} />
        </Field>
        <Field label="Monthly Payment" required>
          <div
            className="flex items-center rounded-xl bg-white"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <span className="pl-4 text-body" style={{ color: TEXT_MUTED }}>$</span>
            <input
              type="number"
              min={0}
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-transparent px-3 py-3 text-body outline-none"
              style={{ color: TEXT_DARK }}
            />
            <span className="pr-4 text-small" style={{ color: TEXT_MUTED }}>/ month</span>
          </div>
        </Field>
      </div>
      <p className="text-small" style={{ color: TEXT_MUTED }}>
        This amount will be used to generate the student's pre-filled Metana Prime payment link.
      </p>
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
  cohort: SalesCourse["cohorts"][number] | null;
  paymentMethod: PaymentMethod;
  details: PaymentDetails;
}) {
  const isPrime = details.paymentType === "Subscription";
  const baseTop: [string, string][] = isPrime
    ? [
        ["Student Email", email],
        ["Course", course.title],
        ["Access Type", "Subscription Access"],
        ["Payment Type", "Subscription"],
      ]
    : [
        ["Student Email", email],
        ["Course", course.title],
        ["Cohort Date", cohort?.date ?? "—"],
        ["Payment Method", paymentMethod],
      ];

  let extra: [string, string][] = [];
  if (details.paymentType === "Upfront") {
    extra = [
      ["Plan", details.planName],
      ["Full Amount", `$${details.planAmount.toLocaleString()}`],
      ["Discount", `${details.discountPercent}%`],
      ["Checkout Amount", `$${details.checkoutAmount.toLocaleString()}`],
    ];
  } else if (details.paymentType === "Installment") {
    const discountedFull = details.discountedFullAmount ?? details.fullAmount;
    const monthly = details.monthlyPayment;
    const fmtMoney = (n: number) =>
      n % 1 === 0
        ? `$${n.toLocaleString()}`
        : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    extra = [
      ["Selected Plan", details.selectedPlan ?? "Installment Plan"],
      ["Full Amount", `$${details.fullAmount.toLocaleString()}`],
      ["Discount", `${details.discountPercent ?? 0}%`],
      ["Discounted Full Amount", fmtMoney(discountedFull)],
      ["Initial Down Payment", `$${details.initialDownPayment.toLocaleString()}`],
      ["Installments", `${details.timePeriodMonths}`],
      ["Monthly Payment", `${fmtMoney(monthly)} / month`],
      ["Due Today", `$${details.initialDownPayment.toLocaleString()}`],
    ];
  } else if (details.paymentType === "Loan") {
    extra = [
      ["Loan Provider", details.loanProviderName],
      ["Loan Application Link", details.loanApplicationLink],
    ];
  } else if (details.paymentType === "Subscription") {
    extra = [
      ["Subscription Amount", `$${details.subscriptionAmount.toLocaleString()}`],
      ["Monthly Payment", `$${details.monthlyPayment.toLocaleString()} / month`],
      ["Billing Cycle", details.billingCycle],
    ];
  }

  const rows = isPrime
    ? [...baseTop, ...extra]
    : [...baseTop, ...extra, ["Certificate", "Included"] as [string, string]];

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        Payment Link Preview
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
        This will generate a pre-filled payment link for the selected student.
      </p>
    </div>
  );
}

function Step6Send({ invitation, onDone }: { invitation: Invitation; onDone: () => void }) {
  const link = useMemo(() => {
    if (typeof window === "undefined") return invitation.checkoutLink;
    const base = `${window.location.origin}/checkout/${invitation.courseId}?invite=${invitation.id}`;
    if (invitation.paymentDetails.paymentType === "Subscription") {
      const d = invitation.paymentDetails;
      const params = new URLSearchParams({
        email: invitation.studentEmail,
        course: "metana-prime",
        paymentMethod: "subscription",
        subscriptionAmount: String(d.subscriptionAmount),
        monthlyPayment: String(d.monthlyPayment),
        billingCycle: "monthly",
      });
      return `${base}&${params.toString()}`;
    }
    if (invitation.paymentDetails.paymentType === "Installment") {
      const d = invitation.paymentDetails;
      const discountedFull = d.discountedFullAmount ?? d.fullAmount;
      const params = new URLSearchParams({
        paymentMethod: "installment",
        selectedPlan: d.selectedPlan ?? "Installment Plan",
        fullAmount: String(d.fullAmount),
        discountPercent: String(d.discountPercent ?? 0),
        discountedFullAmount: String(discountedFull),
        initialDownPayment: String(d.initialDownPayment),
        numberOfInstallments: String(d.timePeriodMonths),
        monthlyPayment: String(d.monthlyPayment),
        purchaseAmount: String(d.initialDownPayment),
      });
      return `${base}&${params.toString()}`;
    }
    return base;
  }, [invitation]);
  const [sent, setSent] = useState(false);

  const sendInvitation = () => {
    updateInvitation(invitation.id, { status: "Invite Sent" });
    setSent(true);
    toast.success(`Payment Link sent to ${invitation.studentEmail}`);
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
        <p className="font-semibold">The payment link has been created successfully.</p>
        <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>Payment Link ID: {invitation.id}</p>
      </div>
      <div>
        <p className="mb-2 text-small font-medium" style={{ color: TEXT_DARK }}>
          Generated payment link
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
          <Send className="h-4 w-4" /> Send Payment Link
        </button>
        <button
          onClick={() => copyLink(link)}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-button-primary font-semibold"
          style={{ backgroundColor: SOFT, color: TEXT_DARK }}
        >
          <Copy className="h-4 w-4" /> Copy Payment Link
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
          Payment Link sent to{" "}
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
    toast.success(`Payment Link sent to ${invitation.studentEmail}`);
  };
  const shareManually = () => {
    const msg = `Hi, your Metana course checkout link is ready. Use this secure link to complete your payment and get access: ${localLink}`;
    navigator.clipboard?.writeText(msg).then(
      () => toast.success("Share message copied"),
      () => toast.error("Could not copy message"),
    );
  };

  return (
    <ModalShell title="Send Payment Link" onClose={onClose} maxWidth={620}>
      <div className="flex flex-col gap-5">
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "rgba(204, 246, 33, 0.2)", color: TEXT_DARK }}
        >
          <p className="font-semibold">The payment link has been created successfully.</p>
          <p className="mt-1 text-small" style={{ color: TEXT_MUTED }}>
            Payment Link ID: {invitation.id}
          </p>
        </div>
        <div>
          <p className="mb-2 text-small font-medium" style={{ color: TEXT_DARK }}>
            Generated payment link
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
            <Send className="h-4 w-4" /> Send Payment Link
          </button>
          <button
            onClick={() => copyLink(localLink)}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-button-primary font-semibold"
            style={{ backgroundColor: SOFT, color: TEXT_DARK }}
          >
            <Copy className="h-4 w-4" /> Copy Payment Link
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
            Payment Link sent to{" "}
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

type ApprovalState = "Pending" | "Approved" | "Rejected";

function deriveApproval(status: InvitationStatus): ApprovalState {
  if (status === "Installment Approved") return "Approved";
  if (status === "Installment Rejected") return "Rejected";
  return "Pending";
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

  const approvedCount = installments.filter(
    (i) => i.status === "Approved" || i.status === "Combined Plan Approved",
  ).length;
  const totalCount = installments.length;
  const progressPct = totalCount ? Math.round((approvedCount / totalCount) * 100) : 0;

  const overallInstallmentStatus = (() => {
    if (!totalCount) return "Awaiting Installments";
    if (approvedCount === totalCount) return "Fully Approved";
    if (installments.some((i) => i.status === "Pending")) return "Pending";
    if (approvedCount > 0) return "Partially Approved";
    return "Awaiting Installments";
  })();

  const nextDue =
    installments.find(
      (i) => i.status !== "Approved" && i.status !== "Combined Plan Approved",
    )?.dueDate ?? "—";

  // Grouped (catch-up) payments — created when student postpones installments
  type GroupedPayment = {
    id: string;
    label: string;
    installmentIds: string[];
    dueDate: string;
    reason: string;
    note: string;
    status: "Pending Payment" | "Pending" | "Approved" | "Rejected";
    proof: ProofFile | null;
  };
  const [groups, setGroups] = useState<GroupedPayment[]>([]);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [changeDueDateId, setChangeDueDateId] = useState<string | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(
    null,
  );

  const approveInstallment = (id: string) => {
    setInstallments((prev) => {
      const next = prev.map((it) =>
        it.id === id ? { ...it, status: "Approved" as InstallmentStatus } : it,
      );
      const allApproved = next.every(
        (i) => i.status === "Approved" || i.status === "Combined Plan Approved",
      );
      if (allApproved) updateInvitation(inv.id, { status: "Installment Approved" });
      else updateInvitation(inv.id, { status: "Installment Pending Approval" });
      return next;
    });
    setApproval("Approved");
    toast.success("Installment approved");
  };

  const rejectInstallment = (id: string) => {
    setInstallments((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: "Rejected" as InstallmentStatus, proof: null }
          : it,
      ),
    );
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
              status: it.status === "Upcoming" ? "Pending" : "Pending",
            }
          : it,
      ),
    );
    toast.success("Proof uploaded");
  };

  const removeInstallmentProof = (id: string) => {
    setInstallments((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, proof: null, status: "Pending" } : it,
      ),
    );
  };

  const changeInstallmentDueDate = (
    id: string,
    payload: { newDueDate: string; reason: string; note: string },
  ) => {
    setInstallments((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              dueDate: payload.newDueDate,
              dueDateChanged: true,
              status: it.status === "Approved" ? it.status : ("Pending" as InstallmentStatus),
            }
          : it,
      ),
    );
    void payload.reason;
    void payload.note;
    toast.success(`Due date updated to ${payload.newDueDate}`);
  };

  const postponeInstallments = (
    ids: string[],
    payload: { dueDate: string; reason: string; note: string },
  ) => {
    if (!ids.length) return;
    const groupId = `grp-${Date.now()}`;
    const groupNumber = groups.length + 1;
    const labels = ids
      .map((id) => installments.find((i) => i.id === id)?.label)
      .filter(Boolean)
      .join(" + ");
    setInstallments((prev) =>
      prev.map((it) =>
        ids.includes(it.id)
          ? { ...it, status: "Combined Plan Pending" as InstallmentStatus }
          : it,
      ),
    );
    setGroups((g) => [
      ...g,
      {
        id: groupId,
        label: `Combined Plan ${String(groupNumber).padStart(2, "0")}`,
        installmentIds: ids,
        dueDate: payload.dueDate,
        reason: payload.reason,
        note: payload.note,
        status: "Pending Payment",
        proof: null,
      },
    ]);
    toast.success(`Postponed ${labels || "installments"}`);
  };

  const uploadGroupProof = (groupId: string, file: File | undefined) => {
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
    setGroups((g) =>
      g.map((it) =>
        it.id === groupId
          ? {
              ...it,
              proof: { name: file.name, uploadedAt: `Uploaded ${today}` },
              status: "Pending",
            }
          : it,
      ),
    );
    toast.success("Group proof uploaded");
  };

  const approveGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    setGroups((g) =>
      g.map((it) => (it.id === groupId ? { ...it, status: "Approved" } : it)),
    );
    setInstallments((prev) =>
      prev.map((it) =>
        group.installmentIds.includes(it.id)
          ? { ...it, status: "Combined Plan Approved" as InstallmentStatus }
          : it,
      ),
    );
    toast.success(`${group.label} approved`);
  };

  const rejectGroup = (groupId: string) => {
    setGroups((g) =>
      g.map((it) => (it.id === groupId ? { ...it, status: "Rejected" } : it)),
    );
    toast.success("Group payment rejected");
  };

  const [detachGroupId, setDetachGroupId] = useState<string | null>(null);
  const detachGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    if (group.status === "Approved") {
      toast.error("Approved combined plans cannot be detached");
      return;
    }
    setInstallments((prev) =>
      prev.map((it) =>
        group.installmentIds.includes(it.id)
          ? { ...it, status: "Pending" as InstallmentStatus }
          : it,
      ),
    );
    setGroups((g) => g.filter((it) => it.id !== groupId));
    if (selectedInstallmentId === groupId) setSelectedInstallmentId(null);
    toast.success("Combined plan detached");
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

  const accessStatus: "Active" | "Suspended" =
    isInstallment &&
    installments.some(
      (i) => i.status === "Payment Failed",
    )
      ? "Suspended"
      : "Active";

  const TABS = [
    { id: "student", label: "Student Details", icon: UserIcon },
    { id: "course", label: "Course Access Details", icon: BookOpen },
    { id: "payment", label: "Payment Details", icon: CreditCard },
    { id: "timeline", label: "Payment Status Timeline", icon: ListChecks },
    ...(inv.paymentMethod === "Installment"
      ? ([{ id: "installments", label: "Installment Payments", icon: Layers }] as const)
      : ([] as const)),
  ] as const;
  type TabId = (typeof TABS)[number]["id"];
  const [activeTab, setActiveTab] = useState<TabId>("student");

  const proofLibrary = installments
    .filter((i) => i.proof)
    .map((i) => ({
      name: i.proof!.name,
      linked: i.label,
      uploadedAt: i.proof!.uploadedAt,
      status: i.status,
    }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-[90vw] grid-cols-[28%_72%] overflow-hidden bg-white"
        style={{
          maxWidth: 1100,
          height: "80vh",
          maxHeight: "80vh",
          borderRadius: 24,
          boxShadow: "0 30px 80px rgba(15,23,42,0.22)",
        }}
      >
        {/* Left tab rail */}
        <aside
          className="flex h-full min-h-0 flex-col overflow-y-auto p-6"
          style={{ borderRight: `1px solid ${BORDER}`, backgroundColor: "#FFFFFF" }}
        >
          <h3 className="text-main-header font-bold" style={{ color: TEXT_DARK }}>
            Payment Overview
          </h3>
          <p className="mt-2 text-small" style={{ color: TEXT_MUTED }}>
            Review student access, payment status, installments, and proof documents.
          </p>

          <nav className="mt-6 flex flex-col gap-1.5">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className="group relative flex items-center gap-3 rounded-full px-3.5 py-2.5 text-left"
                  style={{ color: active ? "#FFFFFF" : TEXT_MUTED }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "#F3F4F6";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="overview-active-tab"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: TEXT_DARK }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon
                      className="h-4 w-4 shrink-0 transition-colors"
                      style={{ color: active ? BRAND : TEXT_MUTED }}
                    />
                    <span className="text-small font-medium">{t.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right content */}
        <div className="relative flex h-full min-h-0 flex-col">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-white hover:bg-[#F3F4F6]"
            aria-label="Close"
            style={{ border: "none", outline: "none" }}
          >
            <X className="h-4 w-4" style={{ color: TEXT_DARK }} />
          </button>

          <div
            className="flex-1 overflow-y-auto px-8 py-7"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, ease: [0.42, 0, 0.58, 1] }}
              >
                {activeTab === "student" && (
                  <PanelSection title="Student Details">
                    <Row label="Student Name" value={inv.studentName ?? "—"} />
                    <Row label="Email" value={inv.studentEmail} />
                    <Row label="Assigned Salesperson" value="John Miller" />
                    <Row label="Status" value={statusPill(inv.status)} />
                    <Row label="Created Date" value={createdDate} />
                    <Row label="Last Activity" value="Jun 15, 2026" last />
                  </PanelSection>
                )}

                {activeTab === "course" && (
                  <PanelSection title="Course Access Details">
                    <Row label="Course" value={inv.course} />
                    <Row label="Access Type" value={inv.accessType} />
                    <Row label="Cohort Date" value={inv.cohortDate} />
                    <Row label="Orientation Date" value="Jun 10, 2026" />
                    <Row label="Course Start Date" value={inv.cohortDate} />
                    <Row label="Duration" value="4 Months" />
                    <Row label="Lessons" value="70 Lessons" />
                    <Row
                      label="Certificate"
                      value={inv.certificateIncluded ? "Included" : "Not included"}
                    />
                    <Row
                      label="Access Status"
                      value={
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-smaller font-semibold"
                          style={{
                            backgroundColor:
                              accessStatus === "Active"
                                ? "rgba(204,246,33,0.35)"
                                : "#FEE2E2",
                            color: accessStatus === "Active" ? "#3F5C00" : "#991B1B",
                          }}
                        >
                          {accessStatus}
                        </span>
                      }
                      last
                    />
                  </PanelSection>
                )}

                {activeTab === "payment" && (
                  <PanelSection title="Payment Details">
                    <PaymentDetailsBlock
                      invitation={inv}
                      installmentSummary={
                        isInstallment
                          ? {
                              approvedCount,
                              totalCount,
                              overall: overallInstallmentStatus,
                              nextDue,
                            }
                          : undefined
                      }
                    />
                  </PanelSection>
                )}

                {activeTab === "timeline" && (
                  <PanelSection title="Payment Status Timeline">
                    <Timeline
                      invitation={inv}
                      approval={approval}
                      installments={installments}
                      groups={groups}
                    />
                  </PanelSection>
                )}

                {activeTab === "installments" && (
                  <InstallmentsPanel
                    invitation={inv}
                    isInstallment={isInstallment}
                    installments={installments}
                    groups={groups}
                    approvedCount={approvedCount}
                    totalCount={totalCount}
                    progressPct={progressPct}
                    accessStatus={accessStatus}
                    showUpcoming={showUpcoming}
                    setShowUpcoming={setShowUpcoming}
                    selectedInstallmentId={selectedInstallmentId}
                    setSelectedInstallmentId={setSelectedInstallmentId}
                    onUploadProof={uploadInstallmentProof}
                    onRemoveProof={removeInstallmentProof}
                    onApprove={approveInstallment}
                    onReject={rejectInstallment}
                    onOpenPostpone={() => setPostponeOpen(true)}
                    onChangeDueDate={(id) => setChangeDueDateId(id)}
                    onUploadGroupProof={uploadGroupProof}
                    onApproveGroup={approveGroup}
                    onRejectGroup={rejectGroup}
                    onDetachGroup={(id) => setDetachGroupId(id)}
                  />
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      {postponeOpen && (
        <PostponeModal
          installments={installments.filter(
            (i) =>
              i.status === "Pending" ||
              i.status === "Upcoming" ||
              i.status === "Payment Failed",
          )}
          onClose={() => setPostponeOpen(false)}
          onConfirm={(ids, payload) => {
            postponeInstallments(ids, payload);
            setPostponeOpen(false);
          }}
        />
      )}
      {detachGroupId && (() => {
        const g = groups.find((x) => x.id === detachGroupId);
        if (!g) return null;
        const includedLabels = g.installmentIds
          .map((id) => installments.find((i) => i.id === id)?.label)
          .filter(Boolean) as string[];
        return (
          <div
            className="fixed inset-0 z-[110] grid place-items-center bg-black/40 p-4"
            onClick={() => setDetachGroupId(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-second-header font-semibold" style={{ color: TEXT_DARK }}>
                Detach Combined Plan
              </p>
              <p className="mt-2 text-small" style={{ color: TEXT_MUTED }}>
                This will separate the combined installment back into individual installment payments. The student will no longer be able to pay these installments as one grouped payment.
              </p>
              <ul className="mt-3 space-y-1 rounded-xl bg-[#F9FAFB] p-3 text-small" style={{ color: TEXT_DARK }}>
                {includedLabels.map((l) => (
                  <li key={l}>• {l}</li>
                ))}
              </ul>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDetachGroupId(null)}
                  className="rounded-full px-4 py-2 text-small font-semibold"
                  style={{ backgroundColor: "#FFFFFF", color: TEXT_DARK, border: `1px solid ${BORDER}` }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    detachGroup(detachGroupId);
                    setDetachGroupId(null);
                  }}
                  className="rounded-full px-4 py-2 text-small font-semibold"
                  style={{ backgroundColor: BRAND, color: TEXT_DARK }}
                >
                  Detach Combined Plan
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {changeDueDateId && (() => {
        const target = installments.find((i) => i.id === changeDueDateId);
        if (!target) return null;
        return (
          <ChangeDueDateModal
            row={target}
            onClose={() => setChangeDueDateId(null)}
            onConfirm={(payload) => {
              changeInstallmentDueDate(target.id, payload);
              setChangeDueDateId(null);
            }}
          />
        );
      })()}
    </div>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-4 text-second-header font-semibold" style={{ color: TEXT_DARK }}>
        {title}
      </h4>
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: "#FAFAFA", border: `1px solid ${BORDER}` }}
      >
        {children}
      </div>
    </section>
  );
}

function ProofRow({
  name,
  linked,
  uploadedAt,
  status,
  onRemove,
}: {
  name: string;
  linked: string;
  uploadedAt: string;
  status: string;
  onRemove?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-lg"
        style={{ backgroundColor: SOFT, color: TEXT_DARK }}
      >
        <FileText className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium" style={{ color: TEXT_DARK }}>
          {name}
        </p>
        <p className="text-smaller" style={{ color: TEXT_MUTED }}>
          {linked} · {uploadedAt} · {status}
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
        onClick={() => toast.success("Download started")}
        className="rounded-full px-3 py-1.5 text-small font-medium hover:bg-[#F3F4F6]"
        style={{ color: TEXT_DARK }}
      >
        Download
      </button>
    </div>
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
    "Pending": { bg: "#F3F4F6", color: "#4B5563" },
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

function PaymentDetailsBlock({
  invitation,
  installmentSummary,
}: {
  invitation: Invitation;
  installmentSummary?: {
    approvedCount: number;
    totalCount: number;
    overall: string;
    nextDue: string;
  };
}) {
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
    const summary = installmentSummary;
    return (
      <>
        <Row label="Payment Method" value="Installment" />
        <Row label="Full Amount" value={`$${d.fullAmount.toLocaleString()}`} />
        <Row
          label="Initial Down Payment"
          value={`$${d.initialDownPayment.toLocaleString()}`}
        />
        <Row
          label="Monthly Payment"
          value={`$${d.monthlyPayment.toLocaleString()} / month`}
        />
        <Row
          label="Payment Status"
          value={
            summary
              ? `${summary.approvedCount} of ${summary.totalCount} Installments Approved`
              : statusPill(invitation.status)
          }
        />
        <Row label="Next Payment Due" value={summary?.nextDue ?? "—"} last />
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
  if (d.paymentType === "Subscription") {
    return (
      <>
        <Row label="Payment Method" value="Subscription" />
        <Row label="Subscription Amount" value={`$${d.subscriptionAmount.toLocaleString()}`} />
        <Row label="Monthly Payment" value={`$${d.monthlyPayment.toLocaleString()} / month`} />
        <Row label="Billing Cycle" value={d.billingCycle} />
        <Row label="Payment Status" value={statusPill(invitation.status)} last />
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
  installments = [],
  groups = [],
}: {
  invitation: Invitation;
  approval: ApprovalState;
  installments?: InstallmentRow[];
  groups?: {
    id: string;
    label: string;
    status: "Pending Payment" | "Pending" | "Approved" | "Rejected";
  }[];
}) {
  const status = invitation.status;
  const isInstallment = invitation.paymentDetails.paymentType === "Installment";

  const items: { label: string; icon: React.ComponentType<{ className?: string }>; state: TimelineState }[] = [
    { label: "Payment plan created", icon: FileText, state: "done" },
    {
      label: "Payment Link sent",
      icon: Mail,
      state:
        status === "Pending"
          ? "current"
          : "done",
    },
  ];

  if (isInstallment) {
    items.push({
      label: "Initial down payment submitted",
      icon: CreditCard,
      state: "done",
    });
    items.push({
      label: "Initial down payment approved",
      icon: ShieldCheck,
      state: "done",
    });
    for (const inst of installments) {
      const state: TimelineState =
        inst.status === "Approved" ||
        inst.status === "Combined Plan Approved"
          ? "done"
          : inst.status === "Pending" ||
              inst.status === "Combined Plan Pending" ||
              inst.status === "Payment Failed" ||
              inst.status === "Overdue" ||
              inst.status === "Needs New Proof"
            ? "current"
            : "pending";
      const suffix =
        inst.status === "Approved" || inst.status === "Combined Plan Approved"
          ? "approved"
          : inst.status === "Payment Failed"
            ? "payment failed"
            : inst.status === "Pending"
              ? inst.dueDateChanged
                ? `Pending · Due date changed to ${inst.dueDate}`
                : "pending"
              : inst.status === "Combined Plan Pending"
                ? "in combined plan"
                : inst.status === "Overdue"
                  ? "overdue"
                  : inst.status === "Needs New Proof"
                    ? "needs new proof"
                    : "upcoming";
      items.push({
        label: `${inst.label} ${suffix}`,
        icon:
          inst.status === "Approved" || inst.status === "Combined Plan Approved"
            ? ShieldCheck
            : CreditCard,
        state,
      });
    }
    for (const g of groups) {
      const state: TimelineState =
        g.status === "Approved"
          ? "done"
          : g.status === "Rejected"
            ? "current"
            : "current";
      items.push({
        label: `${g.label} ${g.status.toLowerCase()}`,
        icon: Layers,
        state,
      });
    }
  } else {
    items.push({
      label: "Student opened link",
      icon: MousePointerClick,
      state:
        status === "Pending"
          ? "pending"
          : status === "Invite Sent"
            ? "current"
            : "done",
    });
    items.push({
      label: "Payment submitted",
      icon: CreditCard,
      state:
        status === "Paid" ||
        status === "Bank Transfer Confirmed" ||
        status === "Loan Approved"
          ? "done"
          : status === "Bank Transfer Pending" || status === "Loan Pending"
            ? "current"
            : "pending",
    });
    items.push({
      label: "Payment approved",
      icon: ShieldCheck,
      state:
        status === "Paid" ||
        status === "Bank Transfer Confirmed" ||
        status === "Loan Approved"
          ? "done"
          : "pending",
    });
  }

  // suppress unused-var warning for approval (kept for API parity)
  void approval;

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

// ============= Installment list =============

type InstallmentStatus =
  | "Approved"
  | "Pending"
  | "Payment Failed"
  | "Overdue"
  | "Needs New Proof"
  | "Upcoming"
  | "Combined Plan Pending"
  | "Combined Plan Approved";

type InstallmentRow = {
  id: string;
  label: string; // "Installment 01"
  number: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  proof: ProofFile | null;
  paymentMethod: "Stripe" | "Offline";
  stripeTxnId?: string;
  dueDateChanged?: boolean;
  // Partial payment / carry-forward bookkeeping
  paidAmount?: number;
  carriedFromLabel?: string;
  carriedFromAmount?: number;
  neglectedBalance?: number;
};

function addMonthsFormatted(start: Date, months: number): string {
  const d = new Date(start.getTime());
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function seedInstallments(
  details: { timePeriodMonths: number; monthlyPayment: number },
  cohortDate: string,
): InstallmentRow[] {
  const start = new Date(cohortDate);
  const validStart = isNaN(start.getTime()) ? new Date() : start;
  const count = Math.max(1, details.timePeriodMonths);
  const rows: InstallmentRow[] = [];
  for (let i = 0; i < count; i++) {
    const number = i + 1;
    let status: InstallmentStatus = "Upcoming";
    let proof: ProofFile | null = null;
    // Alternate methods for demo: 1st Stripe-auto-approved, 2nd offline pending w/ proof,
    // 3rd offline pending awaiting proof, rest upcoming.
    let paymentMethod: "Stripe" | "Offline" = i % 2 === 0 ? "Stripe" : "Offline";
    let stripeTxnId: string | undefined;
    if (i === 0) {
      status = "Approved";
      paymentMethod = "Stripe";
      stripeTxnId = "ch_3Q1xR4...";
      proof = { name: "stripe-receipt-01.pdf", uploadedAt: "Auto-saved" };
    } else if (i === 1) {
      status = "Pending";
      paymentMethod = "Offline";
      proof = { name: "installment-02-proof.pdf", uploadedAt: "Uploaded Jun 15, 2026" };
    } else if (i === 2) {
      status = "Pending";
      paymentMethod = "Offline";
    }
    rows.push({
      id: `inst-${number}`,
      label: `Installment ${String(number).padStart(2, "0")}`,
      number,
      dueDate: addMonthsFormatted(validStart, i),
      amount: details.monthlyPayment,
      status,
      proof,
      paymentMethod,
      stripeTxnId,
    });
  }
  return rows;
}

function InstallmentStatusPill({ status }: { status: InstallmentStatus }) {
  const map: Record<InstallmentStatus, { bg: string; color: string }> = {
    Approved: { bg: "rgba(204,246,33,0.45)", color: "#3F5C00" },
    Pending: { bg: "#FEF3C7", color: "#92400E" },
    "Payment Failed": { bg: "#FEE2E2", color: "#991B1B" },
    Overdue: { bg: "#FEE2E2", color: "#991B1B" },
    "Needs New Proof": { bg: "#FEF3C7", color: "#92400E" },
    Upcoming: { bg: "#F3F4F6", color: "#6B7280" },
    "Combined Plan Pending": { bg: "#FEF9C3", color: "#854D0E" },
    "Combined Plan Approved": { bg: "rgba(204,246,33,0.45)", color: "#3F5C00" },
  };
  const s = map[status];
  const label =
    status === "Combined Plan Pending"
      ? "Pending"
      : status === "Combined Plan Approved"
        ? "Approved"
        : status;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-smaller font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {label}
    </span>
  );
}

function InstallmentCard({
  row,
  onUpload,
  onRemove,
  onApprove,
  onReject,
}: {
  row: InstallmentRow;
  onUpload: (file: File | undefined) => void;
  onRemove: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const inputId = `proof-${row.id}`;
  const isUpcoming = row.status === "Upcoming";
  const isApproved = row.status === "Approved";
  const canApprove = row.status === "Pending";

  return (
    <div
      className="rounded-xl bg-white p-4"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-small font-semibold" style={{ color: TEXT_DARK }}>
            {row.label}
          </p>
          <p className="mt-0.5 text-smaller" style={{ color: TEXT_MUTED }}>
            Due {row.dueDate} · ${row.amount.toLocaleString()}
          </p>
        </div>
        <InstallmentStatusPill status={row.status} />
      </div>

      {/* Proof area */}
      <div className="mt-3">
        {row.proof ? (
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ border: `1px solid ${BORDER}`, backgroundColor: "#FAFAFA" }}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-lg"
              style={{ backgroundColor: SOFT, color: TEXT_DARK }}
            >
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-medium" style={{ color: TEXT_DARK }}>
                {row.proof.name}
              </p>
              <p className="text-smaller" style={{ color: TEXT_MUTED }}>
                {row.proof.uploadedAt}
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
            {!isApproved && (
              <button
                type="button"
                onClick={onRemove}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#FEE2E2]"
                style={{ color: "#B42318" }}
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
              isUpcoming ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[#F9FAFB]"
            }`}
            style={{ border: `1.5px dashed ${BORDER}`, backgroundColor: "#FFFFFF" }}
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" style={{ color: TEXT_MUTED }} />
              <span className="text-small font-medium" style={{ color: TEXT_DARK }}>
                {isUpcoming ? "Not available yet" : "Upload Proof"}
              </span>
            </span>
            <span className="text-smaller" style={{ color: TEXT_MUTED }}>
              PDF, PNG, JPG · 10MB
            </span>
            <input
              id={inputId}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              disabled={isUpcoming}
              onChange={(e) => onUpload(e.target.files?.[0] ?? undefined)}
            />
          </label>
        )}
      </div>

      {/* Actions */}
      {!isUpcoming && !isApproved && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={!canApprove}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BRAND, color: TEXT_DARK }}
          >
            <CheckCircle2 className="h-4 w-4" /> Approve Payment
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={!canApprove}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#B42318",
              border: "1px solid #FECDCA",
            }}
          >
            <AlertCircle className="h-4 w-4" /> Reject Payment
          </button>
        </div>
      )}
    </div>
  );
}