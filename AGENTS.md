<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — current state

Navbar-only personal portfolio for **Sam**. The header is inspired by the restrained
hairline style of chanhdai.com, but the implementation, mark, and assets are original.
No hero, profile, or other sections have been built yet.

## Stack

- Next.js `16.4.2`, App Router, TypeScript, `src/` directory, Turbopack builds.
- React `19.3.0`; package manager pnpm `10.33.0`.
- Tailwind CSS v4 via `@tailwindcss/turbopack`, CSS-variable theme tokens.
- shadcn/ui (`components.json`, `radix-nova` style) with Radix primitives.
- `motion` (Motion for React), `next-themes`, `lucide-react`, `cn`,
  `class-variance-authority`.
- Fonts through `next/font/google`: Inter (UI), Geist Mono (kbd chips),
  Instrument Serif (brand wordmark).
- ESLint 9 + `eslint-config-next`; Playwright is installed for the header check.

## Commands

```bash
pnpm dev                         # local development
pnpm typecheck                   # tsc --noEmit
pnpm lint                        # eslint
pnpm build                       # production build
pnpm start                       # serve the production build
pnpm check:header                # Playwright check; requires the server on :3000
```

The header check expects `http://localhost:3000` and asserts header height, max-width
container centering, no 390px overflow, one visible primary nav, and theme switching.

## File map

| Path | Responsibility |
| --- | --- |
| `src/app/layout.tsx` | Fonts, metadata, `next-themes` provider, skip link, `<html>`/`<body>` |
| `src/app/page.tsx` | Throwaway 200vh `<main>` for sticky/blur testing; `#main-content` skip target |
| `src/app/globals.css` | Tailwind/shadcn imports, light/dark tokens, base styles, reduced-motion guard |
| `src/components/site-header.tsx` | Sticky header, desktop nav, More dropdown, search, GitHub, active dot |
| `src/components/mobile-menu.tsx` | `<768px` Sheet menu, flattened links, stagger, route-close, Esc/outside-close |
| `src/components/theme-toggle.tsx` | 32px `Contrast` icon button with dynamic accessible label |
| `src/components/theme-provider.tsx` | `next-themes` wrapper |
| `src/config/site.ts` | Brand, nav, More items, GitHub URL/star count, flattened nav |
| `src/lib/client.ts` | Hydration-safe `useIsClient` / `useIsMac` using `useSyncExternalStore` |
| `src/lib/utils.ts` | shadcn `cn` re-export |
| `src/components/ui/*` | Generated shadcn: dropdown-menu, sheet, button |
| `scripts/check-header.mjs` | Responsive/theme Playwright verification |
| `components.json` | shadcn configuration (`radix-nova`, neutral, lucide) |

## Layout contract

- `--container-max: 1000px`.
- `<header>` is `sticky top-0 z-50 h-16`, full viewport width, `bg-background/80`,
  `backdrop-blur-md`. Its bottom hairline spans the full viewport.
- The header's inner container and the page `<main>` are both:
  `mx-auto w-full max-w-[var(--container-max)] border-x border-hairline`.
  This makes the vertical edge lines pass through the header.
- Header inner padding is `px-5` (20px).
- At `md` (768px) and above: brand left; nav, 1×20px dividers, search, GitHub,
  theme toggle right.
- Below 768px: brand left; theme toggle and menu button right. Nav/search/GitHub hidden.
- Main is intentionally `min-h-[200vh]`; replace it when the real portfolio content starts.

## Design tokens

Defined in `src/app/globals.css`; use semantic classes rather than color literals.

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `--background` | `#0a0a0a` | `#ffffff` | Page/header background |
| `--foreground` | `#fafafa` | `#18181b` | Primary text, active links, dot |
| `--muted-foreground` | `#9ca3af` | `#52525b` | Inactive links, icons, secondary copy |
| `--hairline` | `rgb(255 255 255 / 10%)` | `rgb(0 0 0 / 10%)` | Structural 1px lines |
| `--chip` | `#171717` | `#f4f4f5` | kbd chips, control hover/active surfaces |
| `--ring` | `#a1a1aa` | `#52525b` | Focus rings |
| `--popover` | `#141414` | `#ffffff` | Dropdown/sheet surfaces |
| `--container-max` | `1000px` | `1000px` | Shell max width |

- Theme is class-based through `next-themes`: `defaultTheme="dark"`,
  `enableSystem={false}`, no flash, `disableTransitionOnChange` enabled.
- Font variables: `--font-inter`, `--font-geist-mono`, `--font-instrument-serif`.
  Tailwind aliases: `font-sans`, `font-mono`, `font-brand`.
- Contrast is AA at current values. Do not substitute arbitrary grays.
- CSS transitions are 150ms; route/dropdown content is 200ms or less. The active dot
  uses a spring. `prefers-reduced-motion` is handled by `useReducedMotion` in Motion
  code and a global CSS animation/transition guard.

## Decisions already made

- Theme toggle uses the `Contrast` icon and switches only light/dark (no system option).
- Active desktop link shows a dot animated with Motion `layoutId="primary-nav-dot"`.
- macOS key labels (`⌘ K`) are detected after mount via `useSyncExternalStore`, avoiding
  hydration mismatches.
- Search is a stub (`onSearchOpen`) with a TODO; it currently does nothing except
  accept click and `Ctrl/Cmd+K` (with `preventDefault`).
- Nav links use `prefetch={false}` because destination pages do not exist yet. Remove
  those props only after adding the routes.
- Mobile Sheet slides from the top, is auto-height with `max-h-dvh` and scrollable in
  short viewports. Radix supplies focus trap, body scroll lock, Esc, and outside-click.
- Mobile menu closes on route change through a `usePathname` effect. The effect has a
  narrow `react-hooks/set-state-in-effect` suppression because closing UI on navigation
  is external synchronization.
- Header icons: GitHub is an inline currentColor SVG because lucide-react v1.61 does
  not export brand icons. Other icons are lucide stroke `1.75`.
- shadcn generated files are kept as generated unless a real design need requires edits.

## Known placeholders / gaps

- Brand is `Sam`; nav is Home, Projects, Experience; More is Blog, Skills, Contact.
- All internal destinations except `/` are unbuilt and return 404.
- GitHub is `https://github.com/samworks`; star count is `2400` (renders `2.4K`).
  Replace both with real values.
- `src/app/page.tsx` is a test surface, not portfolio content.
- The search command palette is not implemented.

## Next task

Build the first real portfolio section below `SiteHeader` (hero/profile/about), keeping
the existing shell, token system, and header contract. Replace the throwaway main
content while preserving `#main-content` and `scroll-padding-top`. Do not redesign the
navbar as part of that task. Add real routes or route placeholders only when the nav
destinations are meant to work.

## Verification status

Last verified 2026-10-22: `pnpm typecheck`, `pnpm lint`, `pnpm build`, and
`pnpm check:header` all pass. A temporary axe-core audit was clean in both themes and
at mobile; axe was removed afterward, so only the Playwright check remains in-repo.
