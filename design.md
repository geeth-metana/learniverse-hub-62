# Metana LMS — Design System

The single source of truth for visual design across this project. Every new screen, component, or feature should follow the tokens, patterns, and conventions documented here. When in doubt, reach for an existing token or primitive before inventing a new value.

> **Stack:** TanStack Start (React 19) · Tailwind v4 (config-less) · shadcn/ui (new-york) · `lucide-react` icons.
> **Tokens** are defined in `src/styles.css` (`@theme inline` + `:root`/`.dark`). **Never hardcode hex/raw colors** — always use a token.

---

## 1. Brand & Identity

Metana is a learning-management / course-sales platform. The visual language is **clean, soft, and modern** — generous rounding, soft shadows, a single confident lime accent, and an Apple-inspired motion feel (`cubic-bezier(0.32, 0.72, 0, 1)`).

- **Brand accent:** Metana lime — `--brand` (`oklch(0.911 0.214 122)`). This is also `--primary`.
- **Mode:** **Dark by default.** Light mode is fully supported. Theme applied via the `dark` class on `<html>` before hydration (no flash).
- **Tone:** professional but friendly (emoji in greetings, rounded pill UI, warm gradients).

---

## 2. Color Tokens

All colors are **OKLCH** and exposed as CSS variables. Use the Tailwind utility that maps to the token (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-brand`, etc.) — defined in the `@theme inline` block of `src/styles.css`.

### Semantic surface & content

| Token | Utility | Light | Dark | Use |
|---|---|---|---|---|
| `--background` | `bg-background` | white | near-black blue (`0.16 0.02 260`) | Page background |
| `--foreground` | `text-foreground` | desaturated navy (`0.381 0.063 259`) | near-white | Primary text |
| `--card` | `bg-card` | white | `0.2 0.03 260` | Card / panel surface |
| `--card-foreground` | `text-card-foreground` | navy | near-white | Text on cards |
| `--popover` / `--popover-foreground` | `bg-popover` | matches card | matches card | Dropdowns, popovers |
| `--muted` | `bg-muted` | `0.97 0.01 260` | `0.27 0.03 260` | Subtle fills, hover states |
| `--muted-foreground` | `text-muted-foreground` | `0.5 0.045 259` | `0.7 0.02 260` | Secondary / helper text |
| `--secondary` | `bg-secondary` | `0.97 0.01 260` | `0.27 0.03 260` | Secondary buttons/fills |
| `--accent` | `bg-accent` | lime-tinted (`0.96 0.06 122`) | `0.27 0.05 122` | Hover highlight, active nav |
| `--border` | `border-border` | `0.93 0.01 260` | white @ 10% | All borders (applied to `*` by default) |
| `--input` | `border-input` | `0.93 0.01 260` | white @ 15% | Form field borders |
| `--ring` | `ring-ring` | brand lime | brand lime | Focus rings |
| `--placeholder` | — | `0.78 0.01 260` | `0.5 0.02 260` | Placeholder text |

### Brand & accent

| Token | Utility | Value | Use |
|---|---|---|---|
| `--brand` / `--primary` | `bg-brand` / `bg-primary` | `oklch(0.911 0.214 122)` (lime) | Primary CTAs, active accents, highlights |
| `--brand-light` | `bg-brand-light` | `oklch(0.96 0.12 122)` | Soft brand fills, gradients |
| `--brand-foreground` / `--primary-foreground` | `text-brand-foreground` | navy `0.381 0.063 259` | Text/icons **on** brand surfaces |
| `--purple` / `--purple-light` | `bg-purple` | aliased to brand lime | Legacy alias — prefer `brand` |
| `--second` | `text-second` | navy @ 78% | De-emphasized navy text |
| `--toggle-bg` | `bg-toggle-bg` | navy | Toggle backgrounds |

### Status

| Token | Utility | Value | Use |
|---|---|---|---|
| `--warning` | `text-warning` / `bg-warning` | `oklch(0.78 0.18 70)` (amber) | Warnings, attention |
| `--destructive` | `bg-destructive` | `oklch(0.62 0.23 27)` (red) | Destructive actions, errors |
| `--destructive-foreground` | `text-destructive-foreground` | near-white | Text on destructive |

> **Success / positive** reuses the brand lime — there is no separate green token. Use `text-brand` / `bg-brand` for success states.

### Sidebar (dedicated scope)

`--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border` — utilities `bg-sidebar`, `text-sidebar-foreground`, `hover:bg-sidebar-accent`, `border-sidebar-border`. The sidebar has its own surface tokens so it can differ from cards.

---

## 3. Gradients, Shadows & Effects

Defined as raw CSS variables in `:root` — use via inline `style` or `shadow-[var(--…)]`.

| Token | How to use | Definition / use |
|---|---|---|
| `--gradient-brand` | `style={{ background: "var(--gradient-brand)" }}` | `135deg` lime → teal. Hero/brand surfaces. |
| `--gradient-card` | `style={{ background: "var(--gradient-card)" }}` | Soft lime→cyan tint. Welcome/feature cards. |
| `--shadow-soft` | `shadow-[var(--shadow-soft)]` | Default card/elevation shadow. **Most common.** |
| `--shadow-soft-hover` | `shadow-[var(--shadow-soft-hover)]` | Hover glow lift. |
| `--shadow-brand` | `shadow-[var(--shadow-brand)]` | Lime glow for emphasized brand elements. |

**Glass animated border:** `.glass-animated-border` — a conic-gradient spinning brand border (premium/featured surfaces, e.g. pricing). Children must be inside; it sets its own `border-radius: 1.25rem`.

---

## 4. Typography

Font stack: `ui-sans-serif, system-ui, -apple-system, "Inter", sans-serif`. Base body is **14px**.

Use the **named text tokens** (Tailwind `text-*` utilities map to size + line-height pairs). Do **not** use raw `text-xl`/`text-2xl` for content — use these semantic tokens:

| Token utility | Size / line-height | Weight (typical) | Use |
|---|---|---|---|
| `text-primary-header` | 24px / 1.2 | 700 | Page H1 ("Hi, Welcome back…") |
| `text-main-header` | 16px / 1.3 | 600–700 | Section/app titles |
| `text-second-header` | 16px / 1.3 | 600 | Card titles, sub-sections (very common) |
| `text-body` | 14px / 1.5 | 400–500 | Body copy, nav labels |
| `text-small` | 12px / 1.4 | 400 | Helper text, metadata, dates |
| `text-smaller` | 10px / 1.3 | 500 | Section eyebrows (tracking-widest), tiny labels |
| `text-button-large` | 16px / 1.2 | — | Large button labels |
| `text-button-primary` | 14px / 1.2 | — | Primary button labels |
| `text-button` | 12px / 1.2 | — | Standard button labels |
| `text-button-small` | 10px / 1.2 | — | Compact button labels |

Base element styles (from `@layer base`): `h1` = 24px/700, `h2` = 16px/700, `h3` = 16px/600.

**Hierarchy in practice:** primary text `text-foreground`; secondary `text-muted-foreground` or `text-foreground/70`–`/80`; eyebrows use `text-smaller font-medium tracking-widest text-muted-foreground`.

---

## 5. Radius & Shape

Base radius `--radius: 0.75rem` (12px). Scale: `--radius-sm` (8px) · `-md` (10px) · `-lg` (12px) · `-xl` (16px) · `-2xl` (20px) · `-3xl` (24px).

**This is a rounded, pill-forward UI.** Observed usage frequency:

- **`rounded-full`** — *most common.* Nav items, buttons, pills/tags, icon buttons, avatars, badges.
- **`rounded-xl`** — cards (shadcn `Card` default), inputs-in-context, medium panels.
- **`rounded-2xl`** — feature cards, dialogs, larger containers.
- **`rounded-3xl`** — hero / large feature surfaces.
- **`rounded-md`** — shadcn buttons, badges, small inputs (primitive defaults).
- **`rounded-sm`** — tight inner elements.

**Rule of thumb:** interactive pills & nav → `rounded-full`; content cards → `rounded-xl`/`rounded-2xl`; primitives keep their shadcn `rounded-md`.

---

## 6. Spacing & Layout

- **Page shell:** `flex min-h-screen bg-background text-foreground` → `<Sidebar />` + content column (`flex-1 min-w-0 flex flex-col`) with `<Topbar />` and `<main>`.
- **Main padding:** `p-6 lg:p-8`.
- **Content max width:** `max-w-[1400px] mx-auto`.
- **Dashboard grid:** `grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6` (main column + aside).
- **Card padding:** `p-6` (shadcn `CardHeader`/`CardContent`/`CardFooter`); feature cards use `p-6`.
- **Common gaps:** `gap-2`, `gap-3`, `gap-6`. Vertical rhythm via `space-y-1`, `space-y-1.5`, `space-y-3`, `mb-4`/`mb-6`.
- Always pair `flex-1` with `min-w-0` to prevent overflow.

### Sidebar
- Width `260px`, collapses to `0` with `transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]`.
- Sticky full-height: `h-screen sticky top-0`, `bg-sidebar`, `border-r border-sidebar-border`.
- Sections grouped with `text-smaller font-medium tracking-widest text-muted-foreground` eyebrows (PLATFORM / INTERNAL / EXTERNAL).
- Nav items: `flex items-center gap-3 px-3 py-2.5 rounded-full text-body`; active → `bg-muted text-foreground shadow-[var(--shadow-soft)] font-semibold`.

### Topbar
- `h-16 px-8 flex items-center justify-between border-b border-border bg-background`.
- Icon buttons: `h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground`.

---

## 7. Components & Primitives

shadcn/ui primitives live in `src/components/ui/` — **use as-is, do not rewrite.** Feature components are grouped by domain: `src/components/dashboard/`, `courses/`, `products/`.

### Button (`ui/button.tsx`)
Variants: `default` (brand/primary), `destructive`, `outline`, `secondary`, `ghost`, `link`.
Sizes: `default` (h-9 px-4), `sm` (h-8), `lg` (h-10 px-8), `icon` (h-9 w-9).
Base: `rounded-md text-sm font-medium transition-colors`, focus `ring-1 ring-ring`, SVG auto-sized to `size-4`.

> For pill-style CTAs (common in this app) override with `rounded-full` and use `bg-brand text-brand-foreground` — e.g. the sidebar Support button: `rounded-full bg-brand text-brand-foreground font-semibold text-body hover:opacity-90`.

### Card (`ui/card.tsx`)
`rounded-xl border bg-card text-card-foreground shadow`. Slots: `CardHeader` (`p-6 space-y-1.5`), `CardTitle` (`font-semibold leading-none tracking-tight`), `CardDescription` (`text-sm text-muted-foreground`), `CardContent` (`p-6 pt-0`), `CardFooter` (`flex items-center p-6 pt-0`).

### Badge (`ui/badge.tsx`)
`rounded-md border px-2.5 py-0.5 text-xs font-semibold`. Variants: `default` (brand), `secondary`, `destructive`, `outline`.

### Input (`ui/input.tsx`)
`h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base md:text-sm shadow-sm`, focus `ring-1 ring-ring`, `placeholder:text-muted-foreground`.

### Pills / tags (recurring pattern, not a primitive)
`text-small px-3 py-1.5 rounded-full bg-background/70 border border-border text-foreground/70` — used for tag lists (see `WelcomeCard`).

### Toasts
Sonner `<Toaster position="top-right" richColors />` mounted in `__root.tsx`.

### Icons
`lucide-react` only. Sidebar/topbar use `strokeWidth={1.8}`, sizes `h-[18px] w-[18px]` (nav) or `h-4 w-4` / `h-5 w-5`. SVGs inside buttons are auto-`size-4`.

---

## 8. Motion

Animations defined in `src/styles.css`. **Signature easing: `cubic-bezier(0.32, 0.72, 0, 1)`** (Apple-style) for entrances and layout transitions; `cubic-bezier(0.4, 0, 1, 1)` for exits; `cubic-bezier(0.22, 1, 0.36, 1)` for card-stack motion.

| Class / keyframe | Purpose |
|---|---|
| `apple-pop-in` / `apple-pop-out` | Dialog/panel entrance (scale + blur). Used by `.pricing-dialog-panel`. |
| `apple-fade-in` / `apple-fade-out` | Simple opacity transitions. |
| `.digit-roll` (`digit-roll-in`) | Rolling number animation. |
| `.testimonial-left/right-enter/exit` | Rotating testimonial cards. |
| `.slide-content-enter` | Slide-up + scale content reveal. |
| `.progress-fill-bar` (`progress-fill`) | 9s linear scaleX progress fill. |
| `.card-stack-enter` / `.card-stack-leave` | Horizontal card-stack transitions. |
| `.glass-animated-border` | 5s spinning conic brand border (`@property --glass-angle`). |
| `.animate-icon-bounce` / `-float` / `-wiggle` | Looping playful icon motion. |
| `.animate-collapsible-down` / `-up` | Radix collapsible height transitions. |

**Conventions:** transitions use `transition-colors` / `transition-all` / `transition-opacity` with `duration-300`–`duration-500`. Respect `will-change` on transform-heavy animations (already set on the relevant classes).

---

## 9. Theming Rules

- Theme toggled via the `metana:toggle-theme` window event (`THEME_TOGGLE_EVENT`); read state with `useTheme()` from `src/hooks/use-theme`.
- Persisted to `localStorage["metana:theme"]`; inline script in `__root.tsx` applies `dark` class pre-hydration. **Default = dark.**
- **Never** branch styling on JS for color — define both light and dark values as tokens and let the `.dark` class do the work. Use the `dark:` variant only for asset swaps (e.g. light/dark logo images) or one-off cases.

---

## 10. Do / Don't

**Do**
- Use semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`) and named text tokens (`text-body`, `text-second-header`).
- Use `rounded-full` for interactive pills/nav/icon-buttons; `rounded-xl`/`2xl` for cards.
- Use `shadow-[var(--shadow-soft)]` for elevation and the brand lime for primary/positive emphasis.
- Reuse shadcn primitives and the established store/event patterns.
- Use the Apple easing curve for entrances and keep motion subtle.

**Don't**
- Hardcode hex/rgb colors or raw `text-2xl`-style sizes for content.
- Rewrite `src/components/ui/*` primitives.
- Re-add Vite plugins in `vite.config.ts` (the Lovable config already includes them).
- Introduce a new green/success color — reuse `brand`.
- Forget SSR guards (`typeof window === "undefined"`) and `min-w-0` on flex children.
