import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  countdown: { days: number; hours: number; minutes: number; seconds: number };
};

const schema = z.object({
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(5, "Required").max(30),
  consent: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
});

function TimeBlock({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-muted px-4 py-3 text-foreground min-w-[78px]">
      <span key={padded} className="digit-roll text-second-header font-bold tabular-nums">
        {padded}
      </span>
      <span className="text-smaller font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function ClaimOfferDialog({ open, onOpenChange, countdown }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      consent: form.get("consent") === "on" ? true : false,
    };
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0] as string] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onOpenChange(false);
    }, 600);
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
          <div className="pricing-dialog-panel pointer-events-auto relative w-full max-w-5xl rounded-3xl bg-background p-2 shadow-[0_30px_80px_-20px_oklch(0.381_0.063_259/0.25)]">
            <div className="relative rounded-[20px] bg-background overflow-hidden">
              <DialogPrimitive.Close
                className="absolute right-5 top-5 z-10 h-9 w-9 rounded-full grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>

              <div className="grid gap-10 p-8 md:p-10 md:grid-cols-2 md:items-stretch">
                {/* Left */}
                <div className="flex h-full flex-col">
                  <div className="flex -space-x-3">
                    {[
                      "https://i.pravatar.cc/96?img=12",
                      "https://i.pravatar.cc/96?img=47",
                      "https://i.pravatar.cc/96?img=33",
                    ].map((src, i) => (
                      <span
                        key={i}
                        className="h-12 w-12 rounded-full border-2 border-brand bg-muted overflow-hidden"
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </span>
                    ))}
                  </div>

                  <DialogPrimitive.Title asChild>
                    <h2 className="mt-6 text-[32px] leading-[1.15] font-bold tracking-tight text-foreground">
                      Start your new career
                      <br />
                      today. Talk to an advisor.
                    </h2>
                  </DialogPrimitive.Title>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <TimeBlock value={countdown.days} label="Days" />
                    <TimeBlock value={countdown.hours} label="Hours" />
                    <TimeBlock value={countdown.minutes} label="Minutes" />
                    <TimeBlock value={countdown.seconds} label="Seconds" />
                  </div>

                  <ul className="mt-7 space-y-3">
                    {[
                      "Guarantee: Job or 100% money back",
                      "Expert-curated curriculum",
                      "On-demand mentor support",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-3 text-body">
                        <span className="h-5 w-5 rounded-full bg-brand grid place-items-center shrink-0">
                          <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                        </span>
                        <span className="text-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right */}
                <form onSubmit={onSubmit} noValidate className="flex h-full flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="First Name"
                      name="firstName"
                      required
                      error={errors.firstName}
                    />
                    <Field
                      label="Last Name"
                      name="lastName"
                      required
                      error={errors.lastName}
                    />
                  </div>
                  <Field label="Email" name="email" type="email" required error={errors.email} />
                  <Field
                    label="Phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="Country Code + Phone Number"
                    error={errors.phone}
                  />

                  <label className="mt-2 flex items-start gap-3 text-small text-muted-foreground leading-relaxed cursor-pointer">
                    <input
                      type="checkbox"
                      name="consent"
                      className="mt-0.5 h-4 w-4 rounded border-border accent-foreground"
                    />
                    <span>
                      I consent to marketing emails, calls, and text messages, including those made
                      with an autodialed or artificial voice messages. Message and data rates may
                      apply. Unsubscribe anytime per our Privacy Policy. Consent is not a condition
                      of purchase.
                    </span>
                  </label>
                  {errors.consent && (
                    <p className="text-smaller text-destructive -mt-2">{errors.consent}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 w-full py-3.5 rounded-full bg-toggle-bg text-background text-button-primary font-semibold hover:bg-toggle-bg/90 transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Continue"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-small font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="h-11 rounded-lg border border-border bg-background px-3 text-body text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
      />
      {error && <p className="text-smaller text-destructive">{error}</p>}
    </div>
  );
}
