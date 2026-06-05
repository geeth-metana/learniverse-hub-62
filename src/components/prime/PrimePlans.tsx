import { useState } from "react";
import { Check } from "@/components/icons";
import { toast } from "sonner";
import { usePrimeStore } from "@/lib/prime-store";

type Billing = "monthly" | "yearly";

export function PrimePlans() {
  const { plans } = usePrimeStore();
  const [billing, setBilling] = useState<Billing>("monthly");
  const idx = billing === "monthly" ? 0 : 1;

  return (
    <section className="mt-20">
      <div className="text-center">
        <h2 className="text-primary-header font-bold text-foreground">
          Subscribe to access all the courses
        </h2>
      </div>

      {/* Monthly / Yearly toggle */}
      <div className="mt-6 flex justify-center">
        <div className="relative inline-flex items-center rounded-full border border-border bg-muted p-1">
          <span
            aria-hidden
            className="absolute bottom-1 left-1 top-1 rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ width: "calc((100% - 8px) / 2)", transform: `translateX(${idx * 100}%)` }}
          />
          {(["monthly", "yearly"] as Billing[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              className={`relative z-10 flex-1 whitespace-nowrap rounded-full px-6 py-2 text-small font-semibold capitalize transition-colors ${
                billing === b ? "text-neutral-900" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards — two columns inside each card */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const price = billing === "yearly" ? plan.yearly : plan.monthly;
          const suffix = billing === "yearly" ? "/yr" : "/mo";
          const annualFromMonthly = plan.monthly * 12;
          const annualSaving = annualFromMonthly - plan.yearly;
          const pct =
            annualFromMonthly > 0 ? Math.round((annualSaving / annualFromMonthly) * 100) : 0;
          const hasSaving = annualSaving > 0;
          return (
            <div
              key={plan.id}
              className="grid gap-6 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] transition-shadow duration-300 ease-out hover:shadow-[var(--shadow-soft-hover)] md:grid-cols-2 md:gap-8 md:p-10"
            >
              {/* Left — name, description, price, CTA */}
              <div className="flex flex-col">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-second-header font-bold text-foreground">{plan.name}</span>
                  {plan.popular && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-smaller font-semibold text-foreground">
                      Recommended
                    </span>
                  )}
                </div>

                {plan.description && (
                  <p className="mb-4 text-small text-muted-foreground">{plan.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold leading-none tracking-tight text-foreground">
                      ${price.toLocaleString()}
                    </span>
                    <span className="text-body text-muted-foreground">{suffix}</span>
                  </div>
                  {hasSaving && billing === "yearly" && (
                    <span className="inline-flex w-fit items-center rounded-full bg-brand-light px-2.5 py-1 text-smaller font-semibold text-foreground">
                      You save ${annualSaving.toLocaleString()} ({pct}%)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toast.success(`Subscribed to ${plan.name} (${billing})`)}
                  className={`mt-12 w-full rounded-full py-3 text-button-primary font-semibold transition-all duration-300 ease-out md:mt-20 ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>

              {/* Right — features */}
              <div className="md:border-l md:border-dashed md:border-border md:pl-8">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-body text-foreground">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted">
                        <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
