import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, X, ShoppingCart, Star } from "@/components/icons";
import { plans, getCourse, type PlanId } from "@/lib/courses-data";

// Deterministic 4.5–4.9 rating so each course shows a stable value.
function ratingFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return (4.5 + (sum % 5) / 10).toFixed(1);
}

export function PricingDialog({
  open,
  onOpenChange,
  courseId,
  onChoose,
  onBuyCourse,
  plansData,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courseId: string | null;
  onChoose?: (planId: PlanId) => void;
  // When provided, a top card shows the clicked course with a single-course buy button.
  onBuyCourse?: () => void;
  // Override the plans shown (e.g. Metana Prime subscription plans). Defaults to bootcamp plans.
  plansData?: typeof plans;
}) {
  const course = onBuyCourse && courseId ? getCourse(courseId) : null;
  const planList = plansData ?? plans;
  const isSubscription = !!plansData;

  const choose = (planId: PlanId) => {
    if (!courseId) return;
    onOpenChange(false);
    onChoose?.(planId);
  };

  const buyCourse = () => {
    onOpenChange(false);
    onBuyCourse?.();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm
            data-[state=open]:animate-[apple-fade-in_400ms_cubic-bezier(0.32,0.72,0,1)]
            data-[state=closed]:animate-[apple-fade-out_280ms_cubic-bezier(0.32,0.72,0,1)]"
        />
        <DialogPrimitive.Content className="pricing-dialog-content fixed inset-0 z-50 grid place-items-center p-4 outline-none">
          <div
            className="pricing-dialog-panel pointer-events-auto relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-background
              shadow-[0_30px_80px_-20px_oklch(0.381_0.063_259/0.25)] overflow-hidden"
          >
            <DialogPrimitive.Close
              className="absolute right-5 top-5 z-10 h-9 w-9 rounded-full grid place-items-center
                text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>

            <div className="shrink-0 px-8 pt-10 pb-4 text-center">
              <DialogPrimitive.Title className="text-primary-header font-bold tracking-tight">
                {/* Our plans scale with you */}
              </DialogPrimitive.Title>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {course && (
                <div className="px-6 md:px-8 pb-6">
                  <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] md:flex-row">
                    {/* Landscape gradient */}
                    <div
                      className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl md:w-72"
                      style={{ background: course.gradient }}
                    >
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-smaller font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Single course
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-second-header font-bold text-foreground">
                          {course.title}
                        </h3>
                        <span className="inline-flex shrink-0 items-center gap-1 text-small">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-foreground">
                            {ratingFor(course.id)}
                          </span>
                          <span className="text-muted-foreground">/ 5.0</span>
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-small text-muted-foreground">
                        {course.description}
                      </p>

                      {/* Tags from course meta */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {course.meta.split("·").map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-muted px-2.5 py-1 text-smaller font-semibold text-foreground"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Price + buy */}
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight text-foreground">
                            $20
                          </span>
                          {/* <span className="text-small text-muted-foreground line-through">$49</span> */}
                          <span className="text-small text-muted-foreground">one-time</span>
                        </div>
                        <button
                          onClick={buyCourse}
                          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-button-primary font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          <ShoppingCart className="h-4 w-4" /> Buy this course
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Divider between the single-course card and the plans */}
                  {/* <div className="mt-6 border-t border-border" /> */}
                </div>
              )}

              {isSubscription && (
                <div className="text-center pb-4">
                  <h3 className="px-6 pb-2 md:px-8 text-center animate-prime-shine text-primary-header font-bold text-foreground">
                    Subscribe to Metana Prime
                  </h3>
                  <p className="text-small pb-6 text-muted-foreground text-center mx-auto">Plans that empower you to ship without friction. Flexible pricing so efficiency never costs your budget.</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 px-6 md:px-8 pb-8">
                {planList.map((plan) => (
                  <div
                    key={plan.id}
                    className="group relative rounded-2xl p-5 flex flex-col bg-background border border-border transition-shadow duration-300 ease-out hover:shadow-[var(--shadow-soft-hover)]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-second-header font-semibold">{plan.name}</span>
                      {plan.popular && (
                        <span className="text-smaller font-semibold px-2.5 py-1 rounded-full bg-muted text-foreground">
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-primary-header font-bold tracking-tight">
                        ${plan.price.toLocaleString()}
                      </span>
                      {plan.original && (
                        <span className="text-body text-muted-foreground line-through">
                          ${plan.original.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {plan.monthlyEnrollment ? (
                      <>
                        <p className="text-small font-medium mt-1 text-muted-foreground">Upfront</p>

                        <p className="text-small text-muted-foreground mt-3 leading-relaxed">
                          Or pay ${plan.monthlyEnrollment.toLocaleString()} at enrollment &{" "}
                          <span className="font-semibold text-foreground">
                            ${plan.monthly.toLocaleString()}
                          </span>
                          {plan.monthlyOriginal && (
                            <span className="line-through ml-1">${plan.monthlyOriginal}</span>
                          )}{" "}
                          /m for {plan.months} months
                        </p>
                      </>
                    ) : null}

                    <div className="border-t border-dashed border-border my-4" />

                    <ul className="space-y-2 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={f} className="flex items-start gap-3 text-body">
                          <span className="h-5 w-5 rounded-full bg-purple-light flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                          </span>
                          <span className={i === 0 && plan.id === "plan-02" ? "font-semibold" : ""}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => choose(plan.id)}
                      className={`mt-5 w-full py-3 rounded-full text-button-primary font-semibold transition-all duration-300 ease-out ${
                        plan.id === "plan-02"
                          ? "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      Choose Plan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
