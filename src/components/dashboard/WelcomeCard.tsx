export function WelcomeCard() {
  const tags = [
    "HTML for semantic page structure",
    "CSS for responsive and modern layouts",
    "JavaScript basics for interactivity",
    "Using browser DevTools effectively",
  ];

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden border border-border"
      style={{ background: "var(--gradient-card)" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center">
        <div className="flex justify-center">
          <div className="relative h-32 w-32">
            <div className="absolute inset-0 rounded-2xl rotate-45 bg-gradient-to-br from-brand-light to-brand/40 shadow-[var(--shadow-soft)]" />
            <div className="absolute inset-3 rounded-xl rotate-45 bg-white/60 backdrop-blur" />
          </div>
        </div>
        <div>
          <p className="text-body text-foreground/80 mb-4">
            Begin your full-stack journey by mastering the essentials of how the web works. Learn to
            structure, style, and bring interactivity to your pages.
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="text-small px-3 py-1.5 rounded-full bg-background/70 border border-border text-foreground/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <span className="absolute bottom-3 right-5 text-small italic text-muted-foreground">
        Module 01
      </span>
    </div>
  );
}
