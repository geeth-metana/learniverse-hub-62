import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import { plans, type PlanId } from "@/lib/courses-data";

export function PricingDialog({
  open,
  onOpenChange,
  courseId,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courseId: string | null;
  onChoose?: (planId: PlanId) => void;
}) {
  const choose = (planId: PlanId) => {
    if (!courseId) return;
    onOpenChange(false);
    onChoose?.(planId);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm
            data-[state=open]:animate-[apple-fade-in_400ms_cubic-bezier(0.32,0.72,0,1)]
            data-[state=closed]:animate-[apple-fade-out_280ms_cubic-bezier(0.32,0.72,0,1)]"
        />
        <DialogPrimitive.Content
          className="pricing-dialog-content fixed inset-0 z-50 grid place-items-center p-4 outline-none"
        >
          <div
            className="pricing-dialog-panel pointer-events-auto relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-background
              shadow-[0_30px_80px_-20px_oklch(0.381_0.063_259/0.25)] overflow-hidden"
          >
            <DialogPrimitive.Close
              className="absolute right-5 top-5 z-10 h-9 w-9 rounded-full grid place-items-center
                text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>

            <div className="px-8 pt-10 pb-4 text-center">
            <DialogPrimitive.Title className="text-primary-header font-bold tracking-tight">
              Our plans scale with you
            </DialogPrimitive.Title>
            <p className="mt-2 text-body text-muted-foreground max-w-xl mx-auto">
              Plans that empower you and your team to ship without friction. Flexible pricing so
              efficiency never costs your budget.
            </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 px-6 md:px-8 pb-8">
            {plans.map((plan) => (
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
