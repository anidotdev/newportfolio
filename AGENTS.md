<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — current state

Homepage header and hero/profile for **Samiran De**. The 1000px hairline shell is shared
by both; the only content below the hero is the dashed next-sections spacer.

## Stack

- Next.js `16.4.2` App Router, React `19.3.0`, TypeScript, Tailwind v4, pnpm.
- `motion` (hero title, nav dot), `next-themes`, `lucide-react`, shadcn/ui, `cn`.
- Fonts: Inter, Geist Mono, Instrument Serif, Caveat (`--font-hand`).
- Playwright + `@axe-core/playwright` (`check:hero`).

## Commands

`pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm start`.
`pnpm check:header` and `pnpm check:hero` need a server on `http://localhost:3000`.

## File map

| Path | Responsibility |
| --- | --- |
| `src/app/{layout,page}.tsx` | Fonts/Caveat, provider, hero, spacer, blur sentinel |
| `src/app/globals.css` | Tailwind/shadcn, tokens, `.hero-grid`, reduced-motion guard |
| `src/components/{site-header,mobile-menu}.tsx` | Sticky header, mobile Sheet |
| `src/components/hero.tsx` | Banner, avatar, identity, title, socials, info/time |
| `src/components/{bottom-blur,brand-icons}.tsx` | Progressive blur, brand glyphs |
| `src/config/site.ts` | Brand/nav plus all `hero` content and placeholders |
| `scripts/check-hero.mjs` | 1440/1024/768/390 metrics, blur, title, axe |

## Layout

- `--container-max: 1000px`; header inner and `.hero-grid` container track align.
- Full-bleed rows use `.hero-grid` named lines (`full` / `container`), never `100vw`.
- Banner: 260px desktop / 160px mobile, 10px side inset, 6px below header.
- Avatar: 160px / 96px, 10px left, 4px background ring; bottom = identity bottom.
- Hero rows: identity 92px/56px, hatch 40px, socials 78px, info 20px padding.
- Info: two columns at `sm` (640px), dashed divider; one column below.
- `follow me`: Caveat, social-row height, 16px outside container, only at 1320px+.

## Tokens

- Existing: `--background`, `--foreground`, `--muted-foreground`, `--hairline`,
  `--chip`, `--ring`, `--popover`, `--container-max`.
- New: `--surface-subtle` / `--surface-strong` / `--surface-hover` (4/5/8% of
  foreground), `--hatch` (60% hairline), `--blur-veil` (60% background),
  `--font-hand` (Caveat). Use semantic classes, not color literals.
- Theme is class-based, dark default, system disabled; AA contrast is verified.

## Hero media and data

- Add `public/images/banner.jpg` (1960×520) and `public/images/avatar.jpg`, then set
  `siteConfig.hero.banner = "/images/banner.jpg"` and `avatar = "/images/avatar.jpg"`.
  Null renders the banner caption and `SD` avatar placeholder.
- All copy, socials, info rows, timezone and placeholders live in `src/config/site.ts`.
- Set `hero.nameAudio` to show the pronunciation button; unset hides it.
- Local time uses `Intl` for `Asia/Kolkata`, updates every 30s, compares the visitor's
  timezone, and renders a fixed-width placeholder before mount.
- Social URLs, email, phone and GitHub stars are placeholders; replace them.

## Next: About section

Build the About section below the hero inside the same 1000px shell. Keep `#main-content`,
the hero contract and `.hero-grid`; replace only the dashed spacer. Do not redesign the
header or hero. Add real routes only when nav destinations should work.

## Verification

Last verified 2026-10-22: `pnpm typecheck`, `pnpm lint`, `pnpm build`,
`pnpm check:header` and `pnpm check:hero` pass. `check:hero` covers 1440/1024/768/390
without horizontal overflow and axe is clean in light/dark at desktop and mobile.
