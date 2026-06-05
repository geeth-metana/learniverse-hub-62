import { createFileRoute, Outlet, useMatch, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  Plus,
  Package,
  BookOpen,
  Clock,
  Lock,
  Unlock,
  MoreVertical,
  Pencil,
  Settings as SettingsIcon,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useProducts } from "@/lib/products-store";
import { getCourse } from "@/lib/courses-data";

function sumDuration(courseIds: string[]): string {
  let months = 0;
  let weeks = 0;
  for (const id of courseIds) {
    const c = getCourse(id);
    if (!c) continue;
    const m = c.meta.match(/(\d+)\s*Month/i);
    if (m) months += parseInt(m[1], 10);
    const w = c.meta.match(/(\d+)\s*Week(?!s?\s*\/)/i);
    if (w) weeks += parseInt(w[1], 10);
  }
  if (months === 0 && weeks === 0) return "—";
  const parts: string[] = [];
  if (months) parts.push(`${months} mo`);
  if (weeks) parts.push(`${weeks} wk`);
  return parts.join(" ");
}

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Metana Products" },
      {
        name: "description",
        content: "Browse and manage product packages built from your courses.",
      },
    ],
  }),
  component: ProductsLayout,
});

function ProductsLayout() {
  const detailMatch = useMatch({ from: "/products/$productId", shouldThrow: false });
  const newMatch = useMatch({ from: "/products/new", shouldThrow: false });
  if (detailMatch || newMatch) return <Outlet />;
  return <ProductsListPage />;
}

function ProductsListPage() {
  const products = useProducts();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1480px]">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-primary-header font-bold text-foreground">Metana Products</h1>
                <p className="mt-1 text-body text-muted-foreground">
                  Bundles of courses you've packaged together for sale.
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/products/new" })}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-button-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Create Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border py-20 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-body text-muted-foreground">
                  No products yet. Create your first product to bundle courses together.
                </p>
                <button
                  onClick={() => navigate({ to: "/products/new" })}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-button-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> Create Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {products.map((p) => {
                  const courseCount = p.courseIds.length;
                  const duration = sumDuration(p.courseIds);
                  const isLinear = p.accessibility === "linear";
                  return (
                    <article
                      key={p.id}
                      onClick={() =>
                        navigate({ to: "/products/$productId", params: { productId: p.id } })
                      }
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-soft-hover)]"
                    >
                      <div
                        className="relative h-44 w-full overflow-hidden"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.94 0.08 280), oklch(0.9 0.12 320))",
                        }}
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-foreground/70">
                            <Package className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-second-header font-bold leading-snug text-foreground line-clamp-2">
                            {p.title}
                          </h3>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                              {isLinear ? (
                                <Lock className="h-3.5 w-3.5" />
                              ) : (
                                <Unlock className="h-3.5 w-3.5" />
                              )}
                              {isLinear ? "Linear" : "Free-form"}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Product actions"
                                  className="grid h-8 w-8 place-items-center rounded-full text-foreground transition-colors hover:bg-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                onClick={(e) => e.stopPropagation()}
                                className="min-w-[180px]"
                              >
                                <DropdownMenuItem
                                  onSelect={() =>
                                    navigate({
                                      to: "/products/$productId",
                                      params: { productId: p.id },
                                    })
                                  }
                                >
                                  <Pencil className="h-4 w-4" /> Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    navigate({
                                      to: "/products/$productId",
                                      params: { productId: p.id },
                                    })
                                  }
                                >
                                  <SettingsIcon className="h-4 w-4" /> Edit Setting
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {p.description ? (
                          <p className="text-small text-muted-foreground line-clamp-2">
                            {p.description}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-4 text-small text-foreground">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{courseCount}</span>
                            <span className="text-muted-foreground">
                              course{courseCount === 1 ? "" : "s"}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{duration}</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
