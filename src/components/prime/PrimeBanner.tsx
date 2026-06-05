import { usePrimeStore } from "@/lib/prime-store";
import { Button } from "@/components/ui/button";

// Student-facing Metana Prime hero banner.
// Save the uploaded artwork to `public/prime-banner.png` so the image renders.
// `onSubscribe` is optional — omit it for already-subscribed students to hide the CTA.
export function PrimeBanner({ onSubscribe }: { onSubscribe?: () => void }) {
  const { courses } = usePrimeStore();
  const prime = courses.filter((c) => c.inPrime);
  const categories = Array.from(new Set(prime.map((c) => c.category)));
  const totalHours = prime.reduce((sum, c) => sum + c.hours, 0);

  return (
    <div
      className="relative mb-8 h-[220px] overflow-hidden rounded-3xl sm:h-[380px] lg:h-[460px]"
      style={{
        background: "linear-gradient(120deg, oklch(0.93 0.16 122), oklch(0.97 0.06 120))",
      }}
    >
      <img
        src="/public/prime-banner.png"
        alt="Metana Prime"
        className="absolute inset-0 h-full w-full select-none object-cover object-top"
      />

      {/* Right-side overlay — Metana Prime, category tags, stats, subscribe CTA */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[50vw] flex-col justify-center gap-3 p-5 sm:items-end sm:text-right sm:p-8 lg:p-10">
        <h2 className="animate-prime-shine text-3xl font-medium tracking-tight sm:text-4xl lg:text-6xl xl:text-7xl">
          Metana Prime
        </h2>

        {/* Category tags — hidden on mobile to keep the cover compact */}
        {categories.length > 0 && (
          <div className="hidden flex-wrap gap-2 sm:flex sm:justify-end">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-background/80 px-3 py-1 text-smaller font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Highlight card — hidden on mobile; right-aligned: logo, topic, description */}
        <div className="hidden max-w-[600px] flex-col gap-2 rounded-2xl bg-background/80 p-6 backdrop-blur sm:flex sm:items-end sm:text-right">
          {/* <img src="/hero-svg.svg" alt="" className="h-20 w-20" /> */}
          <h3 className="text-2xl font-regular  text-foreground">
            Unlock All Courses with One Subscription
          </h3>
          <p className="text-small text-muted-foreground">
            Get unlimited access to 40+ expert-led courses with a single subscription. Learn at your
            own pace, explore multiple subjects, and access every course in our growing learning
            library.
          </p>
        </div>

        {onSubscribe && (
          <Button
            type="button"
            onClick={onSubscribe}
            className="mt-4 h-auto w-fit rounded-full px-6 py-4 text-button-primary font-semibold shadow-[var(--shadow-soft)]"
          >
            Subscribe Prime
          </Button>
        )}
      </div>
    </div>
  );
}
