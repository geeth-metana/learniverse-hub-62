# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Metana LMS — a learning-management/course-sales platform UI built with **TanStack Start** (full-stack React framework on Vite), React 19, Tailwind v4, and shadcn/ui (new-york style). Originally scaffolded by Lovable; deployed to **Vercel** via Nitro.

## Commands

The repo has both `bun.lock` and `package-lock.json`; pick one package manager and stay consistent (Bun is the primary lockfile).

```bash
bun dev          # vite dev server (or: npm run dev)
bun run build    # production build (Nitro preset: vercel)
bun run build:dev  # build in development mode
bun run preview  # preview the production build
bun run lint     # eslint . — must pass before committing
bun run format   # prettier --write .
```

There is **no test framework** configured. Do not invent test commands.

## Architecture

### Routing — file-based, TanStack Router
- Routes live in `src/routes/`. Filenames map to URLs with dotted segments and `$param` for dynamic params (e.g. `courses.$courseId.tsx` → `/courses/:courseId`, `products.$productId.tsx`, `checkout.$courseId.tsx`).
- `src/routeTree.gen.ts` is **generated** by the router plugin — never edit it by hand.
- Each route file exports `Route = createFileRoute(path)({ head, component, ... })`. `src/routes/__root.tsx` defines the root layout, the 404 (`notFoundComponent`) and error (`errorComponent`) UIs, theme bootstrap script, and global providers (`QueryClientProvider`, `TooltipProvider`, `Toaster`).
- Router is created in `src/router.tsx` with a per-request `QueryClient` injected as router context.

### Client-side state — localStorage-backed stores (no backend)
This app has **no real API/database**. Domain data is persisted in `localStorage` and shared across components/tabs via a custom event pattern. The canonical stores are in `src/lib/`:
- `enrollment.ts` — course enrollment status (`useEnrollments`)
- `products-store.ts` — products/pricing (`Product`, `ProductPricing`), with slugify + seed data
- `invitations-store.ts` — sales invitations & payment-method types

**The store pattern** (replicate it when adding new persisted state): a module-level `KEY` and custom event name `EVT`; `read()`/`write()` helpers where `write()` calls `localStorage.setItem` then `window.dispatchEvent(new Event(EVT))`; a `useX()` hook that subscribes to both the custom `EVT` and the native `storage` event so all subscribers re-read on change. Always guard for SSR with `typeof window === "undefined"`.

### SSR error handling (intentional, do not simplify)
TanStack Start runs SSR through h3, which swallows in-handler throws into a generic `{"unhandled":true,"message":"HTTPError"}` 500 response that a normal try/catch never sees. The recovery path is deliberate and spans three files:
- `src/lib/error-capture.ts` — records the last real error out-of-band via global `error`/`unhandledrejection` listeners (5s TTL).
- `src/server.ts` — wraps the server entry, detects the h3 swallowed-error body, logs the real captured error, and returns a branded 500 page.
- `src/start.ts` — request middleware that catches throws and renders the branded error page.
- `src/lib/error-page.ts` — the branded HTML for fatal 500s.

When touching SSR/server code, preserve this chain.

### UI conventions
- shadcn/ui primitives live in `src/components/ui/` — generally use as-is rather than rewriting. Feature components are grouped by domain under `src/components/` (`dashboard/`, `courses/`, `products/`).
- Path alias `@/*` → `src/*` (see `tsconfig.json` and `components.json` aliases).
- Theming: dark by default. Theme is toggled via the `metana:toggle-theme` window event and persisted to `localStorage["metana:theme"]`; an inline script in `__root.tsx` applies the `dark` class before hydration to avoid flash. Use `useTheme()` from `src/hooks/`. Icons: `lucide-react`. Styling: Tailwind v4 (config-less, via `@tailwindcss/vite`), tokens in `src/styles.css`.

### Build config — important constraint
`vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which **already includes** tanstackStart, viteReact, tailwindcss, tsConfigPaths, the `@` alias, Cloudflare/Vercel build integration, env injection, and dev-only plugins. **Do not re-add these plugins manually** or the app breaks with duplicates. Pass extra config through `defineConfig({ vite: { ... } })`.

## Conventions
- ESLint forbids importing `server-only`; for server-only modules use `*.server.ts` or `@tanstack/react-start/server-only`.
- Prettier is enforced through ESLint (`eslint-plugin-prettier`); run `bun run format` before committing.
- `@typescript-eslint/no-unused-vars` is off and `noUnusedLocals`/`noUnusedParameters` are false — unused vars won't error, but keep code clean.
