import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  X,
  Shield,
  KeyRound,
  Lock,
  UserX,
  ChevronRight,
  Filter,
  CheckCircle2,
  Circle,
  BookOpen,
  Activity,
  CreditCard,
  Settings as SettingsIcon,
  UserCircle2,
  Check,
  ArrowRight,
  ArrowLeft,
  Users as UsersIcon,
  GraduationCap,
  UserSquare2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const BRAND = "#CCF621";
const BRAND_HOVER = "#D0FC03";
const TEXT_DARK = "#1A1A1A";
const TEXT_MUTED = "#6B7280";
const BORDER = "#EAEAEA";
const SOFT = "#F3F4F6";

type Role = "Student" | "Instructor" | "Admin" | "Sales";
type Status = "Active" | "Suspended" | "Disabled" | "Inactive";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: string;
  avatar: string;
  cover?: string;
};

const MOCK_USERS: User[] = [
  { id: "u1", name: "Ava Thompson", email: "ava@metana.io", role: "Student", status: "Active", createdAt: "2025-02-12", avatar: "https://i.pravatar.cc/120?img=47" },
  { id: "u2", name: "Marcus Lee", email: "marcus@metana.io", role: "Instructor", status: "Active", createdAt: "2024-11-03", avatar: "https://i.pravatar.cc/120?img=12" },
  { id: "u3", name: "Priya Shah", email: "priya@metana.io", role: "Admin", status: "Active", createdAt: "2024-08-19", avatar: "https://i.pravatar.cc/120?img=32" },
  { id: "u4", name: "Diego Alvarez", email: "diego@metana.io", role: "Sales", status: "Active", createdAt: "2025-01-22", avatar: "https://i.pravatar.cc/120?img=15" },
  { id: "u5", name: "Sofia Müller", email: "sofia@metana.io", role: "Student", status: "Suspended", createdAt: "2025-03-08", avatar: "https://i.pravatar.cc/120?img=49" },
  { id: "u6", name: "Kenji Watanabe", email: "kenji@metana.io", role: "Instructor", status: "Inactive", createdAt: "2024-09-30", avatar: "https://i.pravatar.cc/120?img=68" },
  { id: "u7", name: "Olivia Brown", email: "olivia@metana.io", role: "Student", status: "Active", createdAt: "2025-04-01", avatar: "https://i.pravatar.cc/120?img=45" },
  { id: "u8", name: "Noah Patel", email: "noah@metana.io", role: "Student", status: "Disabled", createdAt: "2025-02-25", avatar: "https://i.pravatar.cc/120?img=13" },
  { id: "u9", name: "Mia Rossi", email: "mia@metana.io", role: "Sales", status: "Active", createdAt: "2025-03-18", avatar: "https://i.pravatar.cc/120?img=44" },
  { id: "u10", name: "Liam O'Connor", email: "liam@metana.io", role: "Student", status: "Active", createdAt: "2025-05-12", avatar: "https://i.pravatar.cc/120?img=11" },
];

const TOPICS: { key: Role | "All"; label: string; icon: any }[] = [
  { key: "All", label: "All Users", icon: UsersIcon },
  { key: "Student", label: "Students", icon: GraduationCap },
  { key: "Instructor", label: "Instructors", icon: UserSquare2 },
  { key: "Admin", label: "Admins", icon: ShieldCheck },
  { key: "Sales", label: "Sales", icon: TrendingUp },
];

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User Management — Metana" },
      { name: "description", content: "Manage users, roles, permissions, and progress." },
    ],
  }),
  component: UsersPage,
});

function statusStyle(s: Status) {
  switch (s) {
    case "Active":
      return { bg: "rgba(204, 246, 33, 0.35)", color: "#3F5C00" };
    case "Suspended":
      return { bg: "#FEF9C3", color: "#854D0E" };
    case "Disabled":
      return { bg: "#E5E7EB", color: "#374151" };
    case "Inactive":
      return { bg: "#F3F4F6", color: "#6B7280" };
  }
}

function StatusBadge({ status }: { status: Status }) {
  const s = statusStyle(status);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function RolePill({ role }: { role: Role }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border"
      style={{ borderColor: BORDER, color: TEXT_DARK, backgroundColor: "#fff" }}
    >
      {role}
    </span>
  );
}

function IconAction({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-8 w-8 grid place-items-center rounded-full transition-colors"
      style={{ color: "#6B7280" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = SOFT;
        (e.currentTarget as HTMLButtonElement).style.color = danger ? "#B42318" : TEXT_DARK;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
      }}
    >
      {children}
    </button>
  );
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [topic, setTopic] = useState<Role | "All">("All");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [dateFilter, setDateFilter] = useState<"All" | "30d" | "90d">("All");
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const now = Date.now();
    return users.filter((u) => {
      if (topic !== "All" && u.role !== topic) return false;
      if (statusFilter !== "All" && u.status !== statusFilter) return false;
      if (dateFilter !== "All") {
        const days = dateFilter === "30d" ? 30 : 90;
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        if (new Date(u.createdAt).getTime() < cutoff) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q) &&
          !u.role.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [users, topic, query, statusFilter, dateFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: users.length };
    for (const t of TOPICS.slice(1)) c[t.key] = users.filter((u) => u.role === t.key).length;
    return c;
  }, [users]);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#FAFAFA", color: TEXT_DARK }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
            <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>
              Manage your team and platform users — roles, permissions, progress and payments.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left topic panel */}
            <aside className="col-span-12 lg:col-span-3">
              <div
                className="rounded-2xl bg-white border sticky top-6"
                style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
                    Topics
                  </p>
                </div>
                <nav className="p-2">
                  {TOPICS.map((t) => {
                    const active = topic === t.key;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTopic(t.key)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                        style={{
                          backgroundColor: active ? TEXT_DARK : "transparent",
                          color: active ? "#fff" : TEXT_DARK,
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{t.label}</span>
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: active ? "rgba(255,255,255,0.15)" : SOFT,
                            color: active ? "#fff" : TEXT_MUTED,
                          }}
                        >
                          {counts[t.key] ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Right content */}
            <section className="col-span-12 lg:col-span-9 space-y-4">
              <div
                className="rounded-2xl bg-white border p-4 flex flex-col md:flex-row md:items-center gap-3"
                style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
              >
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: TEXT_MUTED }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, or role"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border bg-white text-sm focus:outline-none"
                    style={{ borderColor: BORDER }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="h-10 px-3 rounded-xl border bg-white text-sm"
                    style={{ borderColor: BORDER }}
                  >
                    <option value="All">All status</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="h-10 px-3 rounded-xl border bg-white text-sm"
                    style={{ borderColor: BORDER }}
                  >
                    <option value="All">Any date</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                  <button
                    onClick={() => setAddOpen(true)}
                    className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: BRAND_HOVER, color: TEXT_DARK }}
                  >
                    <Plus className="h-4 w-4" />
                    Add User
                  </button>
                </div>
              </div>

              {/* Table */}
              <div
                className="rounded-2xl bg-white border overflow-hidden"
                style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
              >
                <div className="max-h-[640px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead
                      className="sticky top-0 z-10"
                      style={{ backgroundColor: "#FAFAFA", borderBottom: `1px solid ${BORDER}` }}
                    >
                      <tr className="text-left" style={{ color: TEXT_MUTED }}>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: TEXT_MUTED }}>
                            No users match your filters.
                          </td>
                        </tr>
                      )}
                      {filtered.map((u) => (
                        <tr
                          key={u.id}
                          className="border-t transition-colors hover:bg-[color:var(--row-hover)]"
                          style={{ borderColor: BORDER, ["--row-hover" as any]: SOFT }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={u.avatar} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
                              <span className="font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ color: TEXT_MUTED }}>{u.email}</td>
                          <td className="px-4 py-3"><RolePill role={u.role} /></td>
                          <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{u.name.split(" ")[0]}</span>
                              <span className="text-xs" style={{ color: TEXT_MUTED }}>
                                {new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <IconAction label="View" onClick={() => setViewUser(u)}>
                                <Eye className="h-4 w-4" />
                              </IconAction>
                              <IconAction label="Delete" danger onClick={() => setConfirmDelete(u)}>
                                <Trash2 className="h-4 w-4" />
                              </IconAction>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {viewUser && (
          <UserProfileModal user={viewUser} onClose={() => setViewUser(null)} onUpdate={(u) => {
            setUsers((arr) => arr.map((x) => (x.id === u.id ? u : x)));
            setViewUser(u);
          }} />
        )}
        {confirmDelete && (
          <ConfirmDeleteModal
            user={confirmDelete}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => {
              setUsers((arr) => arr.filter((x) => x.id !== confirmDelete.id));
              toast.success(`${confirmDelete.name} deleted`);
              setConfirmDelete(null);
            }}
          />
        )}
        {addOpen && (
          <AddUserModal
            onClose={() => setAddOpen(false)}
            onAdd={(u) => {
              setUsers((arr) => [u, ...arr]);
              toast.success(`${u.name} added`);
              setAddOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============ Modals ============ */

function ModalShell({ children, onClose, width = "max-w-5xl" }: { children: React.ReactNode; onClose: () => void; width?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${width} bg-white rounded-2xl overflow-hidden`}
        style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.25)" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const PROFILE_SECTIONS = [
  { key: "profile", label: "Profile Information", icon: UserCircle2 },
  { key: "settings", label: "User Settings", icon: SettingsIcon },
  { key: "permissions", label: "Manage Permissions", icon: Shield },
  { key: "progress", label: "Course Progress", icon: BookOpen },
  { key: "log", label: "Active Log", icon: Activity },
  { key: "payments", label: "Payment Details", icon: CreditCard },
] as const;

type SectionKey = (typeof PROFILE_SECTIONS)[number]["key"];

function UserProfileModal({
  user,
  onClose,
  onUpdate,
}: {
  user: User;
  onClose: () => void;
  onUpdate: (u: User) => void;
}) {
  const [section, setSection] = useState<SectionKey>("profile");

  return (
    <ModalShell onClose={onClose}>
      <div className="flex h-[680px]">
        {/* Left selector */}
        <aside className="w-[260px] shrink-0 border-r flex flex-col" style={{ borderColor: BORDER, backgroundColor: "#FAFAFA" }}>
          <div className="p-4 border-b" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-xs truncate" style={{ color: TEXT_MUTED }}>{user.email}</p>
              </div>
            </div>
          </div>
          <nav className="p-2 flex-1 overflow-auto">
            {PROFILE_SECTIONS.map((s) => {
              const active = section === s.key;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    backgroundColor: active ? "#fff" : "transparent",
                    color: TEXT_DARK,
                    border: active ? `1px solid ${BORDER}` : "1px solid transparent",
                    boxShadow: active ? "0 1px 2px rgba(15,23,42,0.05)" : "none",
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{s.label}</span>
                  </span>
                  {active && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: BORDER }}>
            <h3 className="font-semibold">{PROFILE_SECTIONS.find((s) => s.key === section)?.label}</h3>
            <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full hover:bg-[color:var(--s)]" style={{ ["--s" as any]: SOFT }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {section === "profile" && <ProfileInfo user={user} onUpdate={onUpdate} />}
            {section === "settings" && <UserSettings user={user} onUpdate={onUpdate} />}
            {section === "permissions" && <PermissionsManager />}
            {section === "progress" && <CourseProgress />}
            {section === "log" && <ActivityLog />}
            {section === "payments" && <PaymentDetailsView />}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function ProfileInfo({ user, onUpdate }: { user: User; onUpdate: (u: User) => void }) {
  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
      >
        <div className="h-32" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #E8FF80 100%)` }} />
        <div className="px-5 pb-5 -mt-10">
          <img src={user.avatar} alt={user.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-white" />
          <div className="mt-3">
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm" style={{ color: TEXT_MUTED }}>{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <RolePill role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name" value={user.name} />
        <Field label="Email" value={user.email} />
        <Field label="Role" value={user.role} />
        <Field label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Manage User Type</p>
        <select
          value={user.role}
          onChange={(e) => onUpdate({ ...user, role: e.target.value as Role })}
          className="h-10 px-3 rounded-xl border bg-white text-sm w-full max-w-xs"
          style={{ borderColor: BORDER }}
        >
          <option value="Student">Student</option>
          <option value="Instructor">Instructor</option>
          <option value="Admin">Admin</option>
          <option value="Sales">Sales</option>
        </select>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: BORDER, backgroundColor: "#FAFAFA" }}>
      <p className="text-xs" style={{ color: TEXT_MUTED }}>{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function UserSettings({ user, onUpdate }: { user: User; onUpdate: (u: User) => void }) {
  const [twoFa, setTwoFa] = useState(false);
  return (
    <div className="space-y-4">
      <SettingsRow
        icon={KeyRound}
        title="Reset Password"
        desc="Send a password reset link to the user's email."
        action={
          <button
            onClick={() => toast.success("Reset link sent")}
            className="h-9 px-3 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: TEXT_DARK, color: "#fff" }}
          >
            Send reset link
          </button>
        }
      />
      <SettingsRow
        icon={Lock}
        title="Two-Factor Authentication"
        desc="Require a verification code at every login."
        action={
          <button
            onClick={() => {
              setTwoFa((v) => !v);
              toast.success(`2FA ${!twoFa ? "enabled" : "disabled"}`);
            }}
            className="h-9 px-3 rounded-lg text-sm font-semibold border"
            style={{
              borderColor: BORDER,
              backgroundColor: twoFa ? BRAND : "#fff",
              color: TEXT_DARK,
            }}
          >
            {twoFa ? "Enabled" : "Enable 2FA"}
          </button>
        }
      />
      <SettingsRow
        icon={UserX}
        title="Disable Account"
        desc="Account holder will lose access until re-enabled."
        action={
          <button
            onClick={() => {
              const next: Status = user.status === "Disabled" ? "Active" : "Disabled";
              onUpdate({ ...user, status: next });
              toast.success(`Account ${next.toLowerCase()}`);
            }}
            className="h-9 px-3 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
          >
            {user.status === "Disabled" ? "Re-enable" : "Disable"}
          </button>
        }
      />
    </div>
  );
}

function SettingsRow({ icon: Icon, title, desc, action }: { icon: any; title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
      <div className="h-10 w-10 rounded-full grid place-items-center shrink-0" style={{ backgroundColor: SOFT }}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>{desc}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

/* Permissions: simple drag & drop between two columns */
const ALL_PERMS = [
  "View courses",
  "Edit courses",
  "Manage users",
  "Issue certificates",
  "Process payments",
  "View reports",
  "Manage announcements",
  "Approve installments",
];

function PermissionsManager() {
  const [available, setAvailable] = useState<string[]>(ALL_PERMS.slice(3));
  const [assigned, setAssigned] = useState<string[]>(ALL_PERMS.slice(0, 3));
  const [drag, setDrag] = useState<{ perm: string; from: "a" | "b" } | null>(null);

  const move = (perm: string, target: "a" | "b") => {
    if (target === "b") {
      if (!assigned.includes(perm)) setAssigned((p) => [...p, perm]);
      setAvailable((p) => p.filter((x) => x !== perm));
    } else {
      if (!available.includes(perm)) setAvailable((p) => [...p, perm]);
      setAssigned((p) => p.filter((x) => x !== perm));
    }
  };

  const Column = ({ title, items, side }: { title: string; items: string[]; side: "a" | "b" }) => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        if (drag) move(drag.perm, side);
        setDrag(null);
      }}
      className="rounded-2xl border p-3 flex flex-col gap-2 min-h-[320px]"
      style={{ borderColor: BORDER, backgroundColor: "#FAFAFA" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: TEXT_MUTED }}>
        {title}
      </p>
      {items.length === 0 && (
        <p className="text-xs px-2 py-6 text-center" style={{ color: TEXT_MUTED }}>
          Drag permissions here
        </p>
      )}
      {items.map((perm) => (
        <div
          key={perm}
          draggable
          onDragStart={() => setDrag({ perm, from: side })}
          className="bg-white rounded-xl border px-3 py-2 text-sm flex items-center justify-between cursor-grab active:cursor-grabbing"
          style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
        >
          <span>{perm}</span>
          <button
            onClick={() => move(perm, side === "a" ? "b" : "a")}
            className="h-6 w-6 grid place-items-center rounded-full hover:bg-[color:var(--s)]"
            style={{ ["--s" as any]: SOFT }}
            aria-label="Toggle"
          >
            {side === "a" ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <Column title="Available" items={available} side="a" />
      <Column title="Assigned" items={assigned} side="b" />
    </div>
  );
}

/* Course progress */
const MOCK_COURSES = [
  { id: "c1", title: "Full-Stack Web Development", modules: [
    { name: "HTML & CSS", lessons: 8, done: 8 },
    { name: "JavaScript Foundations", lessons: 10, done: 7 },
    { name: "React Basics", lessons: 12, done: 3 },
  ]},
  { id: "c2", title: "Rust for Web3", modules: [
    { name: "Rust Basics", lessons: 8, done: 5 },
    { name: "Smart Contracts", lessons: 6, done: 0 },
  ]},
];

function CourseProgress() {
  const [open, setOpen] = useState<string | null>(MOCK_COURSES[0].id);
  return (
    <div className="space-y-3">
      {MOCK_COURSES.map((c) => {
        const total = c.modules.reduce((s, m) => s + m.lessons, 0);
        const done = c.modules.reduce((s, m) => s + m.done, 0);
        const pct = Math.round((done / total) * 100);
        const isOpen = open === c.id;
        return (
          <div key={c.id} className="rounded-2xl border bg-white" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <button onClick={() => setOpen(isOpen ? null : c.id)} className="w-full px-4 py-3 flex items-center gap-4 text-left">
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.title}</p>
                <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>{done}/{total} lessons completed</p>
              </div>
              <div className="w-40">
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: SOFT }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BRAND }} />
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums w-10 text-right">{pct}%</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-2">
                {c.modules.map((m) => (
                  <div key={m.name} className="rounded-xl border p-3 flex items-center gap-3" style={{ borderColor: BORDER }}>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs" style={{ color: TEXT_MUTED }}>{m.done}/{m.lessons} lessons</p>
                    </div>
                    <button
                      onClick={() => toast.success("Marked complete")}
                      className="h-8 px-3 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5"
                      style={{ borderColor: BORDER, backgroundColor: "#fff" }}
                    >
                      <Check className="h-3.5 w-3.5" /> Mark complete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActivityLog() {
  const days = [
    { date: "May 28, 2026", events: [
      { time: "10:14", text: "Lesson completed — React Basics · Components" },
      { time: "09:02", text: "Module started — React Basics" },
    ]},
    { date: "May 27, 2026", events: [
      { time: "16:40", text: "Lesson completed — JS Foundations · Promises" },
      { time: "11:21", text: "Signed in" },
    ]},
    { date: "May 25, 2026", events: [
      { time: "13:08", text: "Payment received — Installment #2" },
    ]},
  ];
  return (
    <div className="space-y-5">
      {days.map((d) => (
        <div key={d.date}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_MUTED }}>{d.date}</p>
          <div className="rounded-2xl border bg-white divide-y" style={{ borderColor: BORDER }}>
            {d.events.map((e, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3 text-sm">
                <span className="tabular-nums text-xs w-12" style={{ color: TEXT_MUTED }}>{e.time}</span>
                <Circle className="h-2 w-2 fill-current" style={{ color: BRAND_HOVER }} />
                <span>{e.text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentDetailsView() {
  const rows = [
    { course: "Full-Stack Web Development", amount: "$2,400", status: "Paid" as const, date: "Apr 10, 2026" },
    { course: "Rust for Web3", amount: "$800", status: "Pending" as const, date: "May 20, 2026" },
    { course: "Add-on: Career Coaching", amount: "$300", status: "Needs Approval" as const, date: "May 26, 2026" },
  ];
  const stylesMap = {
    Paid: { bg: "rgba(204, 246, 33, 0.35)", color: "#3F5C00" },
    Pending: { bg: "#F3F4F6", color: "#4B5563" },
    "Needs Approval": { bg: "#FEF9C3", color: "#854D0E" },
  };
  return (
    <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: "#FAFAFA" }}>
          <tr className="text-left" style={{ color: TEXT_MUTED }}>
            <th className="px-4 py-3 font-medium">Course</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const s = stylesMap[r.status];
            return (
              <tr key={i} className="border-t" style={{ borderColor: BORDER }}>
                <td className="px-4 py-3 font-medium">{r.course}</td>
                <td className="px-4 py-3">{r.amount}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: TEXT_MUTED }}>{r.date}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toast.info("Open payment overview")}
                    className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: TEXT_DARK }}
                  >
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmDeleteModal({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: () => void }) {
  return (
    <ModalShell onClose={onClose} width="max-w-md">
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full grid place-items-center shrink-0" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Delete user</h3>
            <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>
              Are you sure you want to delete <span className="font-semibold" style={{ color: TEXT_DARK }}>{user.name}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-semibold border" style={{ borderColor: BORDER }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="h-9 px-4 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#B42318", color: "#fff" }}>
            Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: User) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Student");

  return (
    <ModalShell onClose={onClose} width="max-w-md">
      <div className="p-6">
        <h3 className="text-lg font-semibold">Add User</h3>
        <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>Create a new platform user account.</p>
        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-medium" style={{ color: TEXT_MUTED }}>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-xl border bg-white text-sm" style={{ borderColor: BORDER }} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: TEXT_MUTED }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full h-10 px-3 rounded-xl border bg-white text-sm" style={{ borderColor: BORDER }} placeholder="jane@metana.io" />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: TEXT_MUTED }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 w-full h-10 px-3 rounded-xl border bg-white text-sm" style={{ borderColor: BORDER }}>
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
              <option value="Admin">Admin</option>
              <option value="Sales">Sales</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-semibold border" style={{ borderColor: BORDER }}>Cancel</button>
          <button
            onClick={() => {
              if (!name.trim() || !email.trim()) { toast.error("Name and email are required"); return; }
              onAdd({
                id: `u${Date.now()}`,
                name: name.trim(),
                email: email.trim(),
                role,
                status: "Active",
                createdAt: new Date().toISOString().slice(0, 10),
                avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(email)}`,
              });
            }}
            className="h-9 px-4 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: BRAND_HOVER, color: TEXT_DARK }}
          >
            Add user
          </button>
        </div>
      </div>
    </ModalShell>
  );
}